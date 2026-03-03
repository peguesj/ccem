import Foundation
import Observation
import UserNotifications
import AppKit

/// FormationMonitor polls the APM server for active UPM/formation status and
/// automatically triggers APM server restarts or CCEMAgent rebuilds when
/// relevant formations complete.
@MainActor
@Observable
final class FormationMonitor {

    // MARK: - Public State

    var activeFormations: [TrackedFormation] = []
    var lastPollAt: Date?
    var isMonitoring: Bool = false
    var pendingRestart: Bool = false
    var pendingRebuild: Bool = false
    var lastLifecycleAction: String?

    // MARK: - Private

    private let client = APMClient()
    private var pollTask: Task<Void, Never>?
    private let pollInterval: TimeInterval = 30

    /// Tracks state per formation so we can detect completions.
    private var knownFormationStates: [String: String] = [:]

    /// Formation IDs that affect APM server code (LiveViews, routes, GenServers).
    /// When these complete → restart APM Phoenix server.
    private var apmAffectingFormations: Set<String> = ["fmt-20260302-f1"]

    /// Formation IDs that affect CCEMAgent code (Swift sources).
    /// When these complete → rebuild + reopen CCEMAgent.
    private var agentAffectingFormations: Set<String> = []

    // MARK: - Lifecycle

    func start() {
        guard !isMonitoring else { return }
        isMonitoring = true
        schedulePoll()
    }

    func stop() {
        pollTask?.cancel()
        pollTask = nil
        isMonitoring = false
    }

    // MARK: - Registration

    /// Register a formation ID as one that, when complete, should trigger an APM restart.
    func trackAPMAffecting(formationId: String) {
        apmAffectingFormations.insert(formationId)
    }

    /// Register a formation ID as one that, when complete, should trigger a CCEMAgent rebuild.
    func trackAgentAffecting(formationId: String) {
        agentAffectingFormations.insert(formationId)
    }

    // MARK: - Polling

    private func schedulePoll() {
        pollTask?.cancel()
        pollTask = Task { [weak self] in
            while !Task.isCancelled {
                await self?.poll()
                try? await Task.sleep(for: .seconds(self?.pollInterval ?? 30))
            }
        }
    }

    private func poll() async {
        guard let status = try? await client.fetchUPMStatus() else { return }
        lastPollAt = Date()

        // Also check formation-specific notifications to track formation IDs and statuses
        let notifications = (try? await client.fetchNotifications(category: "formation", limit: 50)) ?? []

        var updated: [TrackedFormation] = []

        // Build formation state map from notifications
        var formationStateFromNotifications: [String: String] = [:]
        for n in notifications {
            guard let fid = n.formationId else { continue }
            // Map notification titles to states
            let titleLower = n.title.lowercased()
            if titleLower.contains("complete") || titleLower.contains("done") || titleLower.contains("finished") {
                formationStateFromNotifications[fid] = "complete"
            } else if titleLower.contains("fail") || titleLower.contains("error") {
                formationStateFromNotifications[fid] = "failed"
            } else if titleLower.contains("start") || titleLower.contains("active") || titleLower.contains("running") {
                if formationStateFromNotifications[fid] == nil {
                    formationStateFromNotifications[fid] = "active"
                }
            }
        }

        // Also check UPM session — treat as a formation
        if let session = status.session {
            let fid = session.id
            let state = session.status
            let tf = TrackedFormation(
                id: fid,
                status: state,
                source: .upm,
                lastUpdated: Date()
            )
            updated.append(tf)
            await checkForStateTransition(formationId: fid, newStatus: state)
        }

        // Merge notification-derived formations
        for (fid, state) in formationStateFromNotifications {
            if !updated.contains(where: { $0.id == fid }) {
                let tf = TrackedFormation(
                    id: fid,
                    status: state,
                    source: .notification,
                    lastUpdated: Date()
                )
                updated.append(tf)
            }
            await checkForStateTransition(formationId: fid, newStatus: state)
        }

        // Always track our known APM/agent affecting formations even if not yet in state map
        for fid in apmAffectingFormations.union(agentAffectingFormations) {
            if !updated.contains(where: { $0.id == fid }) {
                let state = knownFormationStates[fid] ?? "pending"
                updated.append(TrackedFormation(
                    id: fid,
                    status: state,
                    source: .registered,
                    lastUpdated: Date()
                ))
            }
        }

        activeFormations = updated.sorted { $0.id < $1.id }
    }

    private func checkForStateTransition(formationId: String, newStatus: String) async {
        let previousStatus = knownFormationStates[formationId]
        knownFormationStates[formationId] = newStatus

        // Only trigger on fresh completion — not if we already knew it was complete
        guard previousStatus != newStatus,
              newStatus == "complete" || newStatus == "shipped" || newStatus == "done"
        else { return }

        print("[FormationMonitor] Formation \(formationId) transitioned to \(newStatus)")

        if apmAffectingFormations.contains(formationId) {
            await handleAPMRestart(reason: "Formation \(formationId) completed")
        }

        if agentAffectingFormations.contains(formationId) {
            await handleAgentRebuild(reason: "Formation \(formationId) completed")
        }
    }

    // MARK: - APM Restart

    /// Calls the shared APMServerManager to stop + restart the Phoenix server.
    /// Uses a short delay to allow filesystem changes to settle.
    private func handleAPMRestart(reason: String) async {
        guard !pendingRestart else { return }
        pendingRestart = true
        lastLifecycleAction = "Restarting APM: \(reason)"
        print("[FormationMonitor] \(lastLifecycleAction!)")

        await postSystemNotification(
            title: "CCEM APM Restarting",
            body: reason,
            type: "info"
        )

        // Give 5 seconds for any final writes to complete
        try? await Task.sleep(for: .seconds(5))

        let manager = APMServerManager()
        await manager.stopAPM()
        try? await Task.sleep(for: .seconds(2))
        await manager.startAPM()

        lastLifecycleAction = "APM restarted: \(reason)"
        pendingRestart = false

        await postSystemNotification(
            title: "CCEM APM Restarted",
            body: "Server restarted after \(reason)",
            type: "success"
        )
    }

    // MARK: - CCEMAgent Rebuild

    /// Runs `swift build -c release` in the CCEMAgent directory, then relaunches.
    private func handleAgentRebuild(reason: String) async {
        guard !pendingRebuild else { return }
        pendingRebuild = true
        lastLifecycleAction = "Rebuilding CCEMAgent: \(reason)"
        print("[FormationMonitor] \(lastLifecycleAction!)")

        await postSystemNotification(
            title: "CCEMAgent Rebuilding",
            body: reason,
            type: "info"
        )

        let home = FileManager.default.homeDirectoryForCurrentUser.path
        let agentDir = "\(home)/Developer/ccem/CCEMAgent"

        // Build
        let buildResult = await runShell("cd '\(agentDir)' && swift build -c release 2>&1")
        if buildResult.exitCode != 0 {
            lastLifecycleAction = "CCEMAgent build failed"
            pendingRebuild = false
            await postSystemNotification(
                title: "CCEMAgent Build Failed",
                body: buildResult.output.suffix(200).description,
                type: "error"
            )
            return
        }

        lastLifecycleAction = "CCEMAgent built — relaunching"
        pendingRebuild = false

        await postSystemNotification(
            title: "CCEMAgent Rebuilt",
            body: "Relaunching new version",
            type: "success"
        )

        // Brief delay then relaunch (this process will be killed by the relaunch)
        try? await Task.sleep(for: .seconds(1))
        _ = await runShell("open -a CCEMAgent")
    }

    // MARK: - Shell Helper

    private func runShell(_ command: String) async -> ShellResult {
        await withCheckedContinuation { continuation in
            let process = Process()
            process.executableURL = URL(fileURLWithPath: "/bin/bash")
            process.arguments = ["-c", command]

            let outPipe = Pipe()
            let errPipe = Pipe()
            process.standardOutput = outPipe
            process.standardError = errPipe

            var env = ProcessInfo.processInfo.environment
            env["PATH"] = "/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:\(env["PATH"] ?? "")"
            process.environment = env

            do {
                try process.run()
                process.waitUntilExit()
                let out = String(data: outPipe.fileHandleForReading.readDataToEndOfFile(), encoding: .utf8) ?? ""
                let err = String(data: errPipe.fileHandleForReading.readDataToEndOfFile(), encoding: .utf8) ?? ""
                continuation.resume(returning: ShellResult(
                    exitCode: process.terminationStatus,
                    output: out + err
                ))
            } catch {
                continuation.resume(returning: ShellResult(exitCode: 1, output: error.localizedDescription))
            }
        }
    }

    // MARK: - Notifications

    private func postSystemNotification(title: String, body: String, type notifType: String) async {
        let content = UNMutableNotificationContent()
        content.title = title
        content.body = body
        content.sound = notifType == "error" ? .defaultCritical : .default
        content.categoryIdentifier = EnvironmentMonitor.formationLifecycleCategory
        content.threadIdentifier = "ccem-formation-monitor"

        let request = UNNotificationRequest(
            identifier: UUID().uuidString,
            content: content,
            trigger: nil
        )

        try? await UNUserNotificationCenter.current().add(request)
    }
}

// MARK: - Supporting Types

struct TrackedFormation: Identifiable {
    let id: String
    let status: String
    let source: TrackedFormationSource
    let lastUpdated: Date
}

enum TrackedFormationSource {
    case upm
    case notification
    case registered
}

private struct ShellResult {
    let exitCode: Int32
    let output: String
}
