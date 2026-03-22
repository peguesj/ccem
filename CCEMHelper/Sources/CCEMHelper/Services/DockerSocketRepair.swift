/// DockerSocketRepair — native macOS Docker socket repair service.
///
/// Docker Desktop's `desktop-linux` context expects `~/.docker/run/docker.sock` to symlink
/// to `~/Library/Containers/com.docker.docker/Data/docker.raw.sock`. After crashes, this
/// symlink disappears while the raw socket remains valid. This service automates detection
/// and repair of the broken symlink, including full Docker Desktop restart when needed.
///
/// Invoked from the CCEMHelper menu bar ("Repair Docker Socket" item) and from the
/// `/docksock` Claude Code skill.

import AppKit
import Foundation

enum DockerSocketStatus: String {
    case ok = "ok"
    case missingSymlink = "missing_symlink"
    case missingRawSocket = "missing_raw_socket"
    case dockerNotRunning = "docker_not_running"
}

struct DockerSocketRepair {
    static let symlinkPath = FileManager.default.homeDirectoryForCurrentUser
        .appendingPathComponent(".docker/run/docker.sock").path
    static let rawSocketPath = FileManager.default.homeDirectoryForCurrentUser
        .appendingPathComponent("Library/Containers/com.docker.docker/Data/docker.raw.sock").path

    // MARK: - Status

    static func status() -> DockerSocketStatus {
        // Check if Docker Desktop is running
        let dockerRunning = isProcessRunning("Docker Desktop")

        // Check raw socket
        guard FileManager.default.fileExists(atPath: rawSocketPath) else {
            return dockerRunning ? .missingRawSocket : .dockerNotRunning
        }

        // Check symlink socket
        guard FileManager.default.fileExists(atPath: symlinkPath) else {
            return .missingSymlink
        }

        // Verify docker info works
        let (exitCode, _) = shell("/usr/local/bin/docker", ["info"])
        if exitCode == 0 { return .ok }

        // Try with homebrew path
        let (exitCode2, _) = shell("/opt/homebrew/bin/docker", ["info"])
        return exitCode2 == 0 ? .ok : .missingSymlink
    }

    // MARK: - Repair

    static func repair() async -> Bool {
        let currentStatus = status()

        switch currentStatus {
        case .ok:
            return true

        case .missingSymlink:
            return createSymlink()

        case .missingRawSocket:
            // Restart Docker and wait for raw socket
            return await restartAndRepair()

        case .dockerNotRunning:
            return await restartAndRepair()
        }
    }

    // MARK: - Restart

    static func restart() async -> Bool {
        // Kill Docker processes
        shell("/usr/bin/pkill", ["-f", "Docker Desktop"])
        shell("/usr/bin/pkill", ["-f", "com.docker"])
        try? await Task.sleep(for: .seconds(3))

        // Remove stale symlink
        try? FileManager.default.removeItem(atPath: symlinkPath)

        return await restartAndRepair()
    }

    // MARK: - Private

    private static func createSymlink() -> Bool {
        let symlinkDir = (symlinkPath as NSString).deletingLastPathComponent
        try? FileManager.default.createDirectory(
            atPath: symlinkDir,
            withIntermediateDirectories: true
        )

        // Remove stale symlink if exists
        try? FileManager.default.removeItem(atPath: symlinkPath)

        do {
            try FileManager.default.createSymbolicLink(
                atPath: symlinkPath,
                withDestinationPath: rawSocketPath
            )
            return true
        } catch {
            print("[DockerSocketRepair] Failed to create symlink: \(error)")
            return false
        }
    }

    private static func restartAndRepair() async -> Bool {
        // Launch Docker Desktop
        let workspace = NSWorkspace.shared
        let dockerURL = workspace.urlForApplication(withBundleIdentifier: "com.docker.docker")
        if let url = dockerURL {
            let config = NSWorkspace.OpenConfiguration()
            _ = try? await workspace.openApplication(at: url, configuration: config)
        } else {
            shell("/usr/bin/open", ["-a", "Docker"])
        }

        // Poll for raw socket (max 60s)
        for _ in 0..<30 {
            try? await Task.sleep(for: .seconds(2))
            if FileManager.default.fileExists(atPath: rawSocketPath) {
                return createSymlink()
            }
        }

        return false
    }

    private static func isProcessRunning(_ name: String) -> Bool {
        let (exitCode, output) = shell("/usr/bin/pgrep", ["-f", name])
        return exitCode == 0 && !(output?.isEmpty ?? true)
    }

    @discardableResult
    private static func shell(_ command: String, _ args: [String]) -> (Int32, String?) {
        let process = Process()
        let pipe = Pipe()
        process.executableURL = URL(fileURLWithPath: command)
        process.arguments = args
        process.standardOutput = pipe
        process.standardError = pipe
        do {
            try process.run()
            process.waitUntilExit()
            let data = pipe.fileHandleForReading.readDataToEndOfFile()
            return (process.terminationStatus, String(data: data, encoding: .utf8))
        } catch {
            return (-1, nil)
        }
    }
}
