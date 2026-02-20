import Foundation
import ServiceManagement

@MainActor
@Observable
final class LaunchManager {
    var isLoginItemEnabled: Bool = false

    private let launchAgentLabel = "com.ccem.agent"
    private var launchAgentURL: URL {
        FileManager.default.homeDirectoryForCurrentUser
            .appendingPathComponent("Library/LaunchAgents/\(launchAgentLabel).plist")
    }

    init() {
        isLoginItemEnabled = checkLoginItemStatus()
    }

    func toggleLoginItem() {
        if isLoginItemEnabled {
            enableLoginItem()
        } else {
            disableLoginItem()
        }
        isLoginItemEnabled = checkLoginItemStatus()
    }

    private func enableLoginItem() {
        // Use SMAppService for macOS 13+
        if #available(macOS 13.0, *) {
            let service = SMAppService.mainApp
            do {
                try service.register()
                return
            } catch {
                // Fall through to LaunchAgent approach
            }
        }
        writeLaunchAgentPlist()
    }

    private func disableLoginItem() {
        if #available(macOS 13.0, *) {
            let service = SMAppService.mainApp
            do {
                try service.unregister()
                return
            } catch {
                // Fall through
            }
        }
        removeLaunchAgentPlist()
    }

    private func checkLoginItemStatus() -> Bool {
        if #available(macOS 13.0, *) {
            return SMAppService.mainApp.status == .enabled
        }
        return FileManager.default.fileExists(atPath: launchAgentURL.path)
    }

    private func writeLaunchAgentPlist() {
        guard let executablePath = Bundle.main.executablePath else { return }

        let plist: [String: Any] = [
            "Label": launchAgentLabel,
            "ProgramArguments": [executablePath],
            "RunAtLoad": true,
            "KeepAlive": false,
            "ProcessType": "Interactive"
        ]

        let dir = launchAgentURL.deletingLastPathComponent()
        try? FileManager.default.createDirectory(at: dir, withIntermediateDirectories: true)

        let data = try? PropertyListSerialization.data(
            fromPropertyList: plist,
            format: .xml,
            options: 0
        )
        try? data?.write(to: launchAgentURL)
    }

    private func removeLaunchAgentPlist() {
        try? FileManager.default.removeItem(at: launchAgentURL)
    }
}
