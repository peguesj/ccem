import Foundation
import Observation
import AppKit
import UserNotifications

enum EnvironmentFilter: String, CaseIterable {
    case all = "All"
    case active = "Active"
}

@MainActor
@Observable
final class EnvironmentMonitor {
    var connectionState: ConnectionState = .disconnected
    var environments: [APMEnvironment] = []
    var healthStatus: HealthStatus?
    var lastError: String?
    var lastRefresh: Date?
    var filter: EnvironmentFilter = .all
    var upmStatus: UPMStatus?
    var recentNotifications: [APMNotification] = []

    private var lastNotificationTimestamp: String?
    private var seenNotificationIds: Set<String> = []
    private var notificationPollTask: Task<Void, Never>?
    private let notificationPollInterval: TimeInterval = 5

    static let agentLifecycleCategory = "com.ccem.agent.lifecycle"
    static let formationLifecycleCategory = "com.ccem.formation.lifecycle"

    var filteredEnvironments: [APMEnvironment] {
        switch filter {
        case .all: return environments
        case .active: return environments.filter { $0.sessionCount > 0 }
        }
    }

    var activeCount: Int {
        environments.filter { $0.sessionCount > 0 }.count
    }

    private let client = APMClient()
    private let driftDetector = DriftDetector()
    private var pollTask: Task<Void, Never>?
    private let pollInterval: TimeInterval = 10

    func start() {
        guard pollTask == nil else { return }
        pollTask = Task {
            while !Task.isCancelled {
                await self.refresh()
                try? await Task.sleep(for: .seconds(self.pollInterval))
            }
        }
        // Start notification polling (every 5 seconds, separate from main poll)
        notificationPollTask?.cancel()
        notificationPollTask = Task {
            try? await Task.sleep(for: .seconds(2)) // Initial delay for connection
            while !Task.isCancelled {
                await self.pollNotifications()
                try? await Task.sleep(for: .seconds(self.notificationPollInterval))
            }
        }
    }

    func stop() {
        pollTask?.cancel()
        pollTask = nil
        notificationPollTask?.cancel()
        notificationPollTask = nil
    }

    func requestNotificationPermission() {
        let center = UNUserNotificationCenter.current()
        center.requestAuthorization(options: [.alert, .sound, .badge]) { granted, error in
            if let error {
                print("[CCEMAgent] Notification permission error: \(error.localizedDescription)")
            }
        }
        let agentCategory = UNNotificationCategory(
            identifier: Self.agentLifecycleCategory, actions: [], intentIdentifiers: [], options: []
        )
        let formationCategory = UNNotificationCategory(
            identifier: Self.formationLifecycleCategory, actions: [], intentIdentifiers: [], options: []
        )
        center.setNotificationCategories([agentCategory, formationCategory])
    }

    func refresh() async {
        connectionState = .connecting

        do {
            let health = try await client.checkHealth()
            healthStatus = health
            connectionState = health.isHealthy ? .connected : .disconnected
        } catch {
            connectionState = .disconnected
            lastError = error.localizedDescription
            environments = []
            return
        }

        // Build environments from health projects (most reliable source)
        do {
            let healthProjects = healthStatus?.projects ?? []
            var updatedEnvironments: [APMEnvironment] = []

            for hp in healthProjects {
                let project = APMProject(
                    id: hp.name,
                    name: hp.name,
                    projectRoot: nil,
                    sessionCount: hp.sessionCount,
                    lastActivity: nil,
                    status: hp.status
                )
                let drift = await driftDetector.detectDrift(for: project)
                updatedEnvironments.append(APMEnvironment(
                    id: hp.name,
                    project: project,
                    driftStatus: drift,
                    agentCount: hp.agentCount
                ))
            }

            environments = updatedEnvironments.sorted { ($0.sessionCount, $0.name) > ($1.sessionCount, $1.name) }
            lastRefresh = Date()
            lastError = nil
        }

        // Fetch UPM status (non-blocking, best-effort)
        do {
            upmStatus = try await client.fetchUPMStatus()
        } catch {
            upmStatus = nil
        }
    }

    // MARK: - Notification Polling

    private func pollNotifications() async {
        guard connectionState == .connected else { return }

        do {
            let notifications = try await client.fetchNotifications(
                since: lastNotificationTimestamp,
                limit: 20
            )

            let newNotifications = notifications.filter { !seenNotificationIds.contains($0.id) }
            guard !newNotifications.isEmpty else { return }

            for notification in newNotifications {
                seenNotificationIds.insert(notification.id)
            }

            if let latest = newNotifications.max(by: { $0.timestamp < $1.timestamp }) {
                lastNotificationTimestamp = latest.timestamp
            }

            recentNotifications = (newNotifications + recentNotifications)
                .prefix(50)
                .map { $0 }

            // Post macOS notifications for agent and formation lifecycle events only
            for notification in newNotifications {
                guard let category = notification.category,
                      category == "agent" || category == "formation" else {
                    continue
                }
                await postLifecycleNotification(notification)
            }
        } catch {
            // Non-critical: silently skip notification poll failures
        }
    }

    private func postLifecycleNotification(_ notification: APMNotification) async {
        let content = UNMutableNotificationContent()

        // Title format: '[project] title' (e.g., '[ccem] explorer completed')
        let projectPrefix = notification.projectName.map { "[\($0)]" } ?? "[ccem]"
        content.title = "\(projectPrefix) \(notification.title)"

        // Body: message, namespace, agent ID
        var bodyParts: [String] = [notification.message]
        if let namespace = notification.namespace {
            bodyParts.append("Namespace: \(namespace)")
        }
        if let agentId = notification.agentId {
            bodyParts.append("Agent: \(agentId)")
        }
        content.body = bodyParts.joined(separator: " | ")

        // Category identifier for grouping
        if notification.category == "formation" {
            content.categoryIdentifier = Self.formationLifecycleCategory
        } else {
            content.categoryIdentifier = Self.agentLifecycleCategory
        }

        // Group by project in Notification Center
        content.threadIdentifier = notification.projectName ?? "ccem"

        content.sound = notification.type == "error"
            ? UNNotificationSound.defaultCritical
            : UNNotificationSound.default

        let request = UNNotificationRequest(
            identifier: notification.id,
            content: content,
            trigger: nil
        )

        do {
            try await UNUserNotificationCenter.current().add(request)
        } catch {
            print("[CCEMAgent] Failed to post notification: \(error.localizedDescription)")
        }
    }

    func openDashboard() {
        guard let url = URL(string: "http://localhost:3031") else { return }
        NSWorkspace.shared.open(url)
    }
}
