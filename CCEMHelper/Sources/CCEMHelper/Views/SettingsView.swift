import SwiftUI
import UserNotifications

struct SettingsView: View {
    // Notification toggles — keys must match EnvironmentMonitor guard checks
    @AppStorage("io.pegues.ccem.notifyAgentLifecycle") private var notifyAgentLifecycle = true
    @AppStorage("io.pegues.ccem.notifyAgentLock")      private var notifyAgentLock = true
    @AppStorage("io.pegues.ccem.notifyFormation")      private var notifyFormation = true
    @AppStorage("io.pegues.ccem.notifySystem")         private var notifySystem = true

    @AppStorage("io.pegues.ccem.apmPort")  private var apmPort = "3032"
    @AppStorage("io.pegues.ccem.apmHost")  private var apmHost = "localhost"

    @State private var connectionStatus: String = ""
    @State private var isTesting = false
    @State private var isTestingNotif = false
    @State private var notifTestStatus: String = ""
    @State private var showPermissionAlert = false

    var body: some View {
        Form {
            Section("APM Connection") {
                LabeledContent("Host") {
                    TextField("localhost", text: $apmHost)
                        .textFieldStyle(.roundedBorder)
                        .frame(width: 160)
                }
                LabeledContent("Port") {
                    TextField("3032", text: $apmPort)
                        .textFieldStyle(.roundedBorder)
                        .frame(width: 80)
                }
                HStack {
                    Button(isTesting ? "Testing…" : "Test Connection") {
                        Task { await testConnection() }
                    }
                    .disabled(isTesting)
                    if !connectionStatus.isEmpty {
                        Text(connectionStatus)
                            .foregroundStyle(connectionStatus.hasPrefix("✓") ? .green : .red)
                            .font(.caption)
                    }
                }
            }

            Section("Notifications") {
                Toggle("Agent lifecycle events", isOn: $notifyAgentLifecycle)
                Toggle("AgentLock authorization events", isOn: $notifyAgentLock)
                Toggle("Formation state changes", isOn: $notifyFormation)
                Toggle("System events (connect/disconnect)", isOn: $notifySystem)

                HStack {
                    // US-002: Direct local test notification — bypasses APM round-trip.
                    // Proves the permission/delegate chain works end-to-end.
                    Button(isTestingNotif ? "Sending…" : "Test Notification") {
                        Task { await sendTestNotification() }
                    }
                    .disabled(isTestingNotif)
                    if !notifTestStatus.isEmpty {
                        Text(notifTestStatus)
                            .foregroundStyle(notifTestStatus.hasPrefix("✓") ? .green : .red)
                            .font(.caption)
                    }
                }
            }
        }
        .formStyle(.grouped)
        .frame(width: 400)
        .padding()
        .alert("Notifications Disabled", isPresented: $showPermissionAlert) {
            Button("Open System Settings") {
                if let url = URL(string: "x-apple.systempreferences:com.apple.preference.notifications") {
                    NSWorkspace.shared.open(url)
                }
            }
            Button("Cancel", role: .cancel) {}
        } message: {
            Text("CCEMHelper notifications are disabled. Enable them in System Settings > Notifications > CCEMHelper.")
        }
    }

    private func testConnection() async {
        isTesting = true
        connectionStatus = ""
        defer { isTesting = false }

        guard let url = URL(string: "http://\(apmHost):\(apmPort)/api/status") else {
            connectionStatus = "✗ Invalid URL"
            return
        }
        do {
            let (_, response) = try await URLSession.shared.data(from: url)
            let code = (response as? HTTPURLResponse)?.statusCode ?? 0
            connectionStatus = code == 200 ? "✓ Connected" : "✗ HTTP \(code)"
        } catch {
            connectionStatus = "✗ Unreachable"
        }
    }

    /// US-002: Fires a direct macOS notification without going through APM.
    /// This validates the UNUserNotificationCenter permission + delegate chain.
    private func sendTestNotification() async {
        isTestingNotif = true
        notifTestStatus = ""
        defer { isTestingNotif = false }

        let center = UNUserNotificationCenter.current()
        let settings = await center.notificationSettings()

        guard settings.authorizationStatus == .authorized else {
            showPermissionAlert = true
            notifTestStatus = "✗ Permission denied"
            return
        }

        let content = UNMutableNotificationContent()
        content.title = "CCEMHelper Test"
        content.body = "Notifications are working"
        content.sound = .default
        content.categoryIdentifier = EnvironmentMonitor.agentLifecycleCategory

        let request = UNNotificationRequest(
            identifier: "ccem-test-\(UUID().uuidString)",
            content: content,
            trigger: nil
        )

        do {
            try await center.add(request)
            notifTestStatus = "✓ Sent"
        } catch {
            notifTestStatus = "✗ \(error.localizedDescription)"
        }
    }
}
