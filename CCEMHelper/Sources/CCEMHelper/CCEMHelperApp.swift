import SwiftUI
import AppKit
import UserNotifications

@main
struct CCEMHelperApp: App {
    @State private var monitor = EnvironmentMonitor()
    @State private var launchManager = LaunchManager()
    @State private var notificationReceiver: APMNotificationReceiver
    @State private var serverManager = APMServerManager()
    @State private var formationMonitor = FormationMonitor()
    @State private var upmMonitor = UPMMonitor()

    init() {
        // Register default values so AppStorage reads return correct defaults
        // before the user has ever opened Settings.
        UserDefaults.standard.register(defaults: [
            "io.pegues.ccem.notifyAgentLifecycle": true,
            "io.pegues.ccem.notifyAgentLock": true,
            "io.pegues.ccem.notifyFormation": true,
            "io.pegues.ccem.notifySystem": true,
            "io.pegues.ccem.apmPort": 3032,
            "io.pegues.ccem.apmHost": "localhost"
        ])

        // CRITICAL: Delegate MUST be set before requestAuthorization.
        // For MenuBarExtra apps the process is always "in foreground", so
        // willPresent must be registered early or banners are silently suppressed.
        // Apple: "Set the delegate as early as possible in the launch sequence."
        let receiver = MainActor.assumeIsolated { APMNotificationReceiver() }
        _notificationReceiver = State(wrappedValue: receiver)

        let center = UNUserNotificationCenter.current()
        center.delegate = receiver

        // Register categories on every launch — the OS does not persist them.
        let approveAction = UNNotificationAction(
            identifier: "io.pegues.agent-j.labs.ccem.helper.agentlock.approve",
            title: "Approve",
            options: [.foreground]
        )
        let denyAction = UNNotificationAction(
            identifier: "io.pegues.agent-j.labs.ccem.helper.agentlock.deny",
            title: "Deny",
            options: [.destructive]
        )
        let agentlockCat = UNNotificationCategory(
            identifier: EnvironmentMonitor.agentlockCategory,
            actions: [approveAction, denyAction],
            intentIdentifiers: [],
            options: []
        )
        // Dedicated category for pending AgentLock decisions (US-001).
        // Uses the same Approve/Deny actions; userInfo["pending_id"] carries request_id.
        let agentlockApprovalCat = UNNotificationCategory(
            identifier: EnvironmentMonitor.agentlockApprovalCategory,
            actions: [approveAction, denyAction],
            intentIdentifiers: [],
            options: []
        )
        let lifecycleCat = UNNotificationCategory(
            identifier: EnvironmentMonitor.agentLifecycleCategory,
            actions: [],
            intentIdentifiers: [],
            options: []
        )
        let formationCat = UNNotificationCategory(
            identifier: EnvironmentMonitor.formationLifecycleCategory,
            actions: [],
            intentIdentifiers: [],
            options: []
        )
        center.setNotificationCategories([agentlockCat, agentlockApprovalCat, lifecycleCat, formationCat])

        // Request authorization after delegate and categories are configured.
        // Log result so permission issues are diagnosable without rebuilding.
        center.requestAuthorization(options: [.alert, .sound, .badge]) { granted, error in
            if let error {
                print("[CCEMHelper] Notification auth error: \(error.localizedDescription)")
            }
            print("[CCEMHelper] Notification permission granted: \(granted)")
            center.getNotificationSettings { settings in
                print("[CCEMHelper] Auth status=\(settings.authorizationStatus.rawValue) alertSetting=\(settings.alertSetting.rawValue) ncSetting=\(settings.notificationCenterSetting.rawValue)")
            }
        }
    }

    var body: some Scene {
        MenuBarExtra {
            MenuBarView(
                monitor: monitor,
                launchManager: launchManager,
                serverManager: serverManager,
                formationMonitor: formationMonitor,
                upmMonitor: upmMonitor
            )
                .task {
                    // Delegate already registered in init(); start() is idempotent.
                    notificationReceiver.start()
                    monitor.requestNotificationPermission()
                    await serverManager.checkRunning()
                    monitor.start()
                    formationMonitor.start()
                    upmMonitor.start()
                }
                .onChange(of: monitor.connectionState) { oldValue, newValue in
                    if oldValue == .connected && newValue == .disconnected {
                        Task { await serverManager.checkRunning() }
                        postSystemNotification(title: "CCEM APM", body: "APM server disconnected", type: "warning")
                    } else if oldValue == .disconnected && newValue == .connected {
                        Task { await serverManager.checkRunning() }
                        postSystemNotification(title: "CCEM APM", body: "APM server connected", type: "success")
                    }
                }
        } label: {
            Image(systemName: "server.rack")
                .symbolRenderingMode(.palette)
                .foregroundStyle(
                    monitor.connectionState == .connected ? .green : .red,
                    .primary
                )
        }
        .menuBarExtraStyle(.window)

        Settings {
            SettingsView()
                .frame(width: 400)
        }
    }

    private func postSystemNotification(title: String, body: String, type: String) {
        let content = UNMutableNotificationContent()
        content.title = title
        content.body = body
        content.sound = type == "error" ? .defaultCritical : .default
        content.categoryIdentifier = EnvironmentMonitor.agentLifecycleCategory
        content.threadIdentifier = "ccem-system"

        let request = UNNotificationRequest(
            identifier: UUID().uuidString,
            content: content,
            trigger: nil
        )

        UNUserNotificationCenter.current().add(request) { error in
            if let error {
                print("[CCEMHelper] System notification error: \(error.localizedDescription)")
            }
        }
    }
}
