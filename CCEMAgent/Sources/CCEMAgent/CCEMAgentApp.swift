import SwiftUI
import AppKit

@main
struct CCEMAgentApp: App {
    @State private var monitor = EnvironmentMonitor()
    @State private var launchManager = LaunchManager()

    var body: some Scene {
        MenuBarExtra {
            MenuBarView(monitor: monitor, launchManager: launchManager)
                .task {
                    monitor.start()
                }
                .onChange(of: monitor.connectionState) { oldValue, newValue in
                    if oldValue == .connected && newValue == .disconnected {
                        postDesktopNotification(title: "CCEM APM", body: "APM server disconnected")
                    } else if oldValue == .disconnected && newValue == .connected {
                        postDesktopNotification(title: "CCEM APM", body: "APM server connected")
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

    private func postDesktopNotification(title: String, body: String) {
        // Use osascript for notifications from non-bundled SPM executables
        let script = """
        display notification "\(body)" with title "\(title)"
        """
        let process = Process()
        process.executableURL = URL(fileURLWithPath: "/usr/bin/osascript")
        process.arguments = ["-e", script]
        try? process.run()
    }
}
