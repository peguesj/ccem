import SwiftUI
import UserNotifications

struct NotificationPermissionView: View {
    @State private var authStatus: UNAuthorizationStatus = .notDetermined
    @State private var alertSetting: UNNotificationSetting = .notSupported
    @State private var isRequesting = false
    @State private var isSendingTest = false
    @State private var testResult: String = ""

    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            Text("Notification Setup")
                .font(.headline)

            Text("CCEMHelper uses macOS notifications for AgentLock approvals, agent lifecycle events, and system alerts. Follow these steps to enable them.")
                .font(.caption)
                .foregroundStyle(.secondary)
                .fixedSize(horizontal: false, vertical: true)

            // Status badge
            HStack(spacing: 8) {
                Image(systemName: statusIcon)
                    .foregroundStyle(statusColor)
                Text("Status: \(statusLabel)")
                    .font(.caption)
                    .fontWeight(.medium)
                    .foregroundStyle(statusColor)
                Spacer()
                Button("Refresh") {
                    Task { await refreshStatus() }
                }
                .buttonStyle(.bordered)
                .controlSize(.small)
            }
            .padding(8)
            .background(statusColor.opacity(0.08))
            .clipShape(RoundedRectangle(cornerRadius: 6))

            Divider()

            // Step 1
            stepRow(number: 1, title: "Request Permission", description: "Click below to trigger the macOS notification permission prompt. If you already granted or denied permission, this will have no visible effect.") {
                Button(isRequesting ? "Requesting..." : "Request Permission") {
                    Task { await requestPermission() }
                }
                .buttonStyle(.borderedProminent)
                .controlSize(.small)
                .disabled(isRequesting || authStatus == .authorized)
            }

            // Step 2
            stepRow(number: 2, title: "Open System Settings", description: "If no prompt appeared, or if you denied permission, open System Settings > Notifications and find CCEMHelper. Enable \"Allow Notifications\" and set the style to \"Banners\".") {
                Button("Open Notification Settings") {
                    openNotificationSettings()
                }
                .buttonStyle(.bordered)
                .controlSize(.small)
            }

            // Step 3
            stepRow(number: 3, title: "Enable Banners & Notification Center", description: "In the CCEMHelper notification settings, make sure these are enabled: Allow Notifications, Banners (not \"None\"), Notification Center.") {
                EmptyView()
            }

            // Step 4
            stepRow(number: 4, title: "Verify Delivery", description: "Click below to send a test notification. You should see a macOS banner appear.") {
                HStack(spacing: 8) {
                    Button(isSendingTest ? "Sending..." : "Send Test Notification") {
                        Task { await sendTestNotification() }
                    }
                    .buttonStyle(.bordered)
                    .controlSize(.small)
                    .disabled(isSendingTest || authStatus != .authorized)

                    if !testResult.isEmpty {
                        Text(testResult)
                            .font(.caption2)
                            .foregroundStyle(testResult.hasPrefix("Sent") ? .green : .red)
                    }
                }
            }

            Spacer()
        }
        .padding()
        .frame(width: 380, height: 480)
        .task {
            await refreshStatus()
        }
    }

    // MARK: - Step Row

    @ViewBuilder
    private func stepRow(
        number: Int,
        title: String,
        description: String,
        @ViewBuilder action: () -> some View
    ) -> some View {
        VStack(alignment: .leading, spacing: 6) {
            HStack(alignment: .top, spacing: 8) {
                Text("\(number)")
                    .font(.system(size: 11, weight: .bold, design: .rounded))
                    .foregroundStyle(.white)
                    .frame(width: 20, height: 20)
                    .background(Circle().fill(Color.accentColor))

                VStack(alignment: .leading, spacing: 4) {
                    Text(title)
                        .font(.caption)
                        .fontWeight(.semibold)
                    Text(description)
                        .font(.caption2)
                        .foregroundStyle(.secondary)
                        .fixedSize(horizontal: false, vertical: true)
                    action()
                }
            }
        }
    }

    // MARK: - Status Helpers

    private var statusIcon: String {
        switch authStatus {
        case .authorized: return "checkmark.circle.fill"
        case .denied: return "xmark.circle.fill"
        case .provisional: return "questionmark.circle.fill"
        case .notDetermined: return "circle.dashed"
        case .ephemeral: return "clock.circle"
        @unknown default: return "questionmark.circle"
        }
    }

    private var statusColor: Color {
        switch authStatus {
        case .authorized: return .green
        case .denied: return .red
        case .provisional: return .orange
        case .notDetermined: return .secondary
        case .ephemeral: return .yellow
        @unknown default: return .secondary
        }
    }

    private var statusLabel: String {
        switch authStatus {
        case .authorized: return "Authorized"
        case .denied: return "Denied -- open System Settings to enable"
        case .provisional: return "Provisional"
        case .notDetermined: return "Not yet requested"
        case .ephemeral: return "Ephemeral"
        @unknown default: return "Unknown"
        }
    }

    // MARK: - Actions

    private func refreshStatus() async {
        let settings = await UNUserNotificationCenter.current().notificationSettings()
        authStatus = settings.authorizationStatus
        alertSetting = settings.alertSetting
    }

    private func requestPermission() async {
        isRequesting = true
        defer { isRequesting = false }

        let center = UNUserNotificationCenter.current()
        do {
            let granted = try await center.requestAuthorization(options: [.alert, .sound, .badge])
            print("[NotificationPermission] Granted: \(granted)")
        } catch {
            print("[NotificationPermission] Error: \(error.localizedDescription)")
        }
        await refreshStatus()
    }

    private func openNotificationSettings() {
        // Primary URL scheme for Notifications pane
        if let url = URL(string: "x-apple.systempreferences:com.apple.Notifications-Settings.extension") {
            NSWorkspace.shared.open(url)
        }
    }

    private func sendTestNotification() async {
        isSendingTest = true
        testResult = ""
        defer { isSendingTest = false }

        let center = UNUserNotificationCenter.current()
        let settings = await center.notificationSettings()

        guard settings.authorizationStatus == .authorized else {
            testResult = "Permission not granted"
            return
        }

        let content = UNMutableNotificationContent()
        content.title = "CCEMHelper Test"
        content.body = "Notifications are working correctly."
        content.sound = .default
        content.categoryIdentifier = EnvironmentMonitor.agentLifecycleCategory

        let request = UNNotificationRequest(
            identifier: "ccem-notif-setup-test-\(UUID().uuidString)",
            content: content,
            trigger: nil
        )

        do {
            try await center.add(request)
            testResult = "Sent -- check your banner"
        } catch {
            testResult = "Failed: \(error.localizedDescription)"
        }
    }
}
