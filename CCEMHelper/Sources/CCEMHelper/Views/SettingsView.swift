import SwiftUI

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
            }
        }
        .formStyle(.grouped)
        .frame(width: 400)
        .padding()
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
}
