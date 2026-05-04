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

    /// Check Docker socket health with a hard timeout on `docker info`.
    ///
    /// IMPORTANT: `docker info` can hang indefinitely when the Docker daemon is
    /// unresponsive (stuck VM, crashed backend, etc). The old synchronous
    /// `status()` called `process.waitUntilExit()` with no deadline, which would
    /// wedge the caller's thread forever. When called from SwiftUI's main actor
    /// (e.g. `.onAppear`), this froze the entire app — including
    /// `EnvironmentMonitor`'s poll tasks, since @MainActor tasks are cooperatively
    /// scheduled and a blocked main thread starves all of them.
    ///
    /// This async variant:
    /// 1. Uses `shellWithTimeout` to kill `docker info` after `timeoutSeconds`
    /// 2. Yields the actor between polls via `Task.sleep` so other work runs
    /// 3. Is the ONLY approved way to probe Docker status from UI code paths
    static func asyncStatus(timeoutSeconds: TimeInterval = 2.0) async -> DockerSocketStatus {
        // Check if Docker Desktop is running (pgrep is bounded fast)
        let dockerRunning = isProcessRunning("Docker Desktop")

        // Check raw socket
        guard FileManager.default.fileExists(atPath: rawSocketPath) else {
            return dockerRunning ? .missingRawSocket : .dockerNotRunning
        }

        // Check symlink socket
        guard FileManager.default.fileExists(atPath: symlinkPath) else {
            return .missingSymlink
        }

        // Verify docker info works — WITH HARD TIMEOUT
        let (exitCode, _) = await shellWithTimeout(
            "/usr/local/bin/docker",
            ["info"],
            timeoutSeconds: timeoutSeconds
        )
        if exitCode == 0 { return .ok }

        // Try with homebrew path
        let (exitCode2, _) = await shellWithTimeout(
            "/opt/homebrew/bin/docker",
            ["info"],
            timeoutSeconds: timeoutSeconds
        )
        return exitCode2 == 0 ? .ok : .missingSymlink
    }

    // MARK: - Repair

    static func repair() async -> Bool {
        let currentStatus = await asyncStatus()

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

    /// Run a subprocess with a HARD deadline. If the process does not exit within
    /// `timeoutSeconds`, it is terminated (SIGTERM, then SIGKILL) and `(-1, nil)` is
    /// returned. This is the ONLY safe way to invoke commands that may hang (e.g.
    /// `docker info` when the Docker daemon is wedged).
    ///
    /// The async poll loop yields the actor via `Task.sleep` between checks, so
    /// callers on `@MainActor` do not block the main thread.
    private static func shellWithTimeout(
        _ command: String,
        _ args: [String],
        timeoutSeconds: TimeInterval
    ) async -> (Int32, String?) {
        let process = Process()
        let pipe = Pipe()
        process.executableURL = URL(fileURLWithPath: command)
        process.arguments = args
        process.standardOutput = pipe
        process.standardError = pipe

        do {
            try process.run()
        } catch {
            return (-1, nil)
        }

        let deadline = Date().addingTimeInterval(timeoutSeconds)
        while process.isRunning && Date() < deadline {
            try? await Task.sleep(for: .milliseconds(50))
        }

        if process.isRunning {
            // Graceful SIGTERM, then short wait, then SIGKILL if still alive.
            process.terminate()
            try? await Task.sleep(for: .milliseconds(300))
            if process.isRunning {
                kill(process.processIdentifier, SIGKILL)
                // waitUntilExit() is bounded after SIGKILL (kernel reaps quickly).
                process.waitUntilExit()
            }
            return (-1, nil)
        }

        let data = pipe.fileHandleForReading.readDataToEndOfFile()
        return (process.terminationStatus, String(data: data, encoding: .utf8))
    }
}
