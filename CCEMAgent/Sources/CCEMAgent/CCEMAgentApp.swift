import SwiftUI
import AppKit
import UserNotifications

@main
struct CCEMAgentApp: App {
    @State private var monitor = EnvironmentMonitor()
    @State private var launchManager = LaunchManager()
    @State private var notificationReceiver = APMNotificationReceiver()

    init() {
        // Request notification permission early
        UNUserNotificationCenter.current().requestAuthorization(options: [.alert, .sound, .badge]) { _, _ in }
    }

    var body: some Scene {
        MenuBarExtra {
            MenuBarView(monitor: monitor, launchManager: launchManager)
                .task {
                    notificationReceiver.start()
                    monitor.requestNotificationPermission()
                    monitor.start()
                }
                .onChange(of: monitor.connectionState) { oldValue, newValue in
                    if oldValue == .connected && newValue == .disconnected {
                        postSystemNotification(title: "CCEM APM", body: "APM server disconnected", type: "warning")
                    } else if oldValue == .disconnected && newValue == .connected {
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
                print("[CCEMAgent] System notification error: \(error.localizedDescription)")
            }
        }
    }
}
