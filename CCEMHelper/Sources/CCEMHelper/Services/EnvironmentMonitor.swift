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
    var agentTelemetry: TelemetryResponse?
    var backgroundTasks: [BackgroundTask] = []
    var agUiEvents: [AgUiEvent] = []
    var usageSummary: UsageSummary?
    var authorizationSummary: AuthorizationSummary?
    var pendingDecisions: [PendingDecision] = []

    private var lastNotificationTimestamp: String?
    private var seenNotificationIds: Set<String> = []
    private var notificationPollTask: Task<Void, Never>?
    private let notificationPollInterval: TimeInterval = 5

    // AgentLock audit polling state
    private var seenAuditEntryIds: Set<String> = []
    private var authAuditPollTask: Task<Void, Never>?

    // AgentLock pending decisions polling state
    private var seenPendingIds: Set<String> = []
    private var pendingPollTask: Task<Void, Never>?

    static let agentLifecycleCategory = "io.pegues.agent-j.labs.ccem.helper.lifecycle"
    static let formationLifecycleCategory = "io.pegues.agent-j.labs.ccem.formation.lifecycle"
    static let agentlockCategory = "io.pegues.agent-j.labs.ccem.helper.agentlock"
    /// Dedicated category for pending AgentLock approval decisions.
    /// Approve/Deny actions are registered in CCEMHelperApp.init().
    /// userInfo["pending_id"] carries the request_id for decision submission.
    static let agentlockApprovalCategory = "AGENTLOCK_APPROVAL"
    static let approveActionIdentifier = "io.pegues.agent-j.labs.ccem.helper.agentlock.approve"
    static let denyActionIdentifier = "io.pegues.agent-j.labs.ccem.helper.agentlock.deny"

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

        // Start AgentLock audit polling (every 10 seconds)
        authAuditPollTask?.cancel()
        authAuditPollTask = Task {
            try? await Task.sleep(for: .seconds(3))
            while !Task.isCancelled {
                await self.pollAuthAudit()
                try? await Task.sleep(for: .seconds(10))
            }
        }

        // Start AgentLock pending decisions polling (every 3 seconds)
        pendingPollTask?.cancel()
        pendingPollTask = Task {
            try? await Task.sleep(for: .seconds(4))
            while !Task.isCancelled {
                await self.pollPendingDecisions()
                try? await Task.sleep(for: .seconds(3))
            }
        }
    }

    func stop() {
        pollTask?.cancel()
        pollTask = nil
        notificationPollTask?.cancel()
        notificationPollTask = nil
        authAuditPollTask?.cancel()
        authAuditPollTask = nil
        pendingPollTask?.cancel()
        pendingPollTask = nil
    }

    func requestNotificationPermission() {
        // Categories are already registered in CCEMHelperApp.init() — do not re-register here
        // as it can race with the initial setup and clobber the agentlock category's actions.
        // This method is retained for the requestAuthorization call only.
        UNUserNotificationCenter.current().requestAuthorization(options: [.alert, .sound, .badge]) { granted, error in
            if let error {
                print("[CCEMHelper] Notification permission error: \(error.localizedDescription)")
            }
        }
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

        // Fetch agent telemetry (non-blocking, best-effort)
        do {
            agentTelemetry = try await client.fetchTelemetry()
        } catch {
            agentTelemetry = nil
        }

        // Fetch background tasks (non-blocking, best-effort)
        do {
            backgroundTasks = try await client.fetchBackgroundTasks()
        } catch {
            backgroundTasks = []
        }

        // Fetch AG-UI events (non-blocking, best-effort)
        do {
            agUiEvents = try await client.fetchAgUiEvents()
        } catch {
            agUiEvents = []
        }

        // Fetch Claude usage summary (non-blocking, best-effort)
        do {
            usageSummary = try await client.fetchUsageSummary()
        } catch {
            usageSummary = nil
        }

        // Fetch authorization summary (non-blocking, best-effort)
        do {
            authorizationSummary = try await client.fetchAuthorizationSummary()
        } catch {
            authorizationSummary = nil
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
            // Cap to prevent unbounded Set growth over long-running sessions
            if seenNotificationIds.count > 2000 {
                seenNotificationIds = Set(seenNotificationIds.prefix(1000))
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
                // Respect per-category notification toggles from Settings
                if category == "formation" {
                    guard UserDefaults.standard.bool(forKey: "io.pegues.ccem.notifyFormation") else { continue }
                } else {
                    guard UserDefaults.standard.bool(forKey: "io.pegues.ccem.notifyAgentLifecycle") else { continue }
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
            print("[CCEMHelper] Failed to post notification: \(error.localizedDescription)")
        }
    }

    // MARK: - AgentLock Audit Polling

    private func pollAuthAudit() async {
        guard connectionState == .connected else { return }

        do {
            let entries = try await client.fetchAuthAuditEntries(limit: 20)
            let newEntries = entries.filter { !seenAuditEntryIds.contains($0.id) }
            guard !newEntries.isEmpty else { return }

            for entry in newEntries {
                seenAuditEntryIds.insert(entry.id)
            }
            // Cap set growth
            if seenAuditEntryIds.count > 500 {
                seenAuditEntryIds = Set(seenAuditEntryIds.prefix(250))
            }

            // Post macOS notifications only for denial and escalation events
            // and only if the AgentLock notification toggle is enabled.
            guard UserDefaults.standard.bool(forKey: "io.pegues.ccem.notifyAgentLock") else { return }
            for entry in newEntries where entry.isDenial || entry.isEscalation {
                await postAgentLockNotification(entry)
            }
        } catch {
            // Non-critical: silently skip auth audit poll failures
        }
    }

    private func postAgentLockNotification(_ entry: AuthAuditEntry) async {
        let content = UNMutableNotificationContent()

        switch entry.eventType {
        case "auth:authorization_denied":
            content.title = "[AgentLock] Tool DENIED"
            content.body = "\(entry.toolName) — risk: \(entry.riskLevel)"
            content.sound = UNNotificationSound.defaultCritical
        case "auth:rate_limited":
            content.title = "[AgentLock] Rate limit hit"
            content.body = "\(entry.toolName) — rate limited"
            content.sound = UNNotificationSound.default
        case "auth:authorization_escalated":
            content.title = "[AgentLock] Approval required"
            content.body = "\(entry.toolName) — escalated for approval"
            content.sound = UNNotificationSound.default
        default:
            return
        }

        content.categoryIdentifier = Self.agentlockCategory
        content.threadIdentifier = "ccem-agentlock"

        // Embed request_id if present so approve/deny actions can submit the decision
        if let requestId = entry.details?["request_id"]?.stringValue {
            content.userInfo = ["request_id": requestId, "type": "agentlock_audit"]
        }

        let request = UNNotificationRequest(
            identifier: entry.id,
            content: content,
            trigger: nil
        )

        do {
            try await UNUserNotificationCenter.current().add(request)
        } catch {
            print("[CCEMHelper] Failed to post AgentLock notification: \(error.localizedDescription)")
        }
    }

    // MARK: - AgentLock Pending Decisions Polling

    private func pollPendingDecisions() async {
        guard connectionState == .connected else { return }

        do {
            let decisions = try await client.fetchPendingDecisions()

            // Update observable list (only pending items)
            pendingDecisions = decisions.filter { $0.isPending }

            // Notify for newly seen pending decisions
            let newDecisions = decisions.filter { $0.isPending && !seenPendingIds.contains($0.requestId) }
            guard !newDecisions.isEmpty else { return }

            for decision in newDecisions {
                seenPendingIds.insert(decision.requestId)
            }
            if seenPendingIds.count > 500 {
                seenPendingIds = Set(seenPendingIds.prefix(250))
            }

            guard UserDefaults.standard.bool(forKey: "io.pegues.ccem.notifyAgentLock") else { return }
            for decision in newDecisions {
                await postPendingDecisionNotification(decision)
            }
        } catch {
            // Non-critical: silently skip pending poll failures
        }
    }

    private func postPendingDecisionNotification(_ decision: PendingDecision) async {
        let content = UNMutableNotificationContent()

        // Title: "AgentLock: [displayName]" using human-readable label when available.
        let displayName = decision.displayName ?? String(decision.agentId.suffix(8))
        content.title = "AgentLock: \(displayName)"

        // Body: "[tool] requires approval" with risk context.
        content.body = "\(decision.toolName) requires approval · \(decision.riskLevel) risk"

        // Use the dedicated AGENTLOCK_APPROVAL category so Approve/Deny actions appear.
        content.categoryIdentifier = Self.agentlockApprovalCategory
        content.threadIdentifier = "ccem-agentlock-pending"
        content.sound = UNNotificationSound.defaultCritical

        // Embed pending_id (per US-001 spec) AND request_id (legacy compat) so the
        // action handler in APMNotificationReceiver can submit the decision to APM.
        content.userInfo = [
            "pending_id": decision.requestId,
            "request_id": decision.requestId,
            "type": "agentlock_pending"
        ]

        let request = UNNotificationRequest(
            identifier: "pending-\(decision.requestId)",
            content: content,
            trigger: nil
        )

        do {
            try await UNUserNotificationCenter.current().add(request)
        } catch {
            print("[CCEMHelper] Failed to post pending decision notification: \(error.localizedDescription)")
        }
    }

    func openDashboard() {
        guard let url = URL(string: "http://localhost:3032") else { return }
        NSWorkspace.shared.open(url)
    }
}
