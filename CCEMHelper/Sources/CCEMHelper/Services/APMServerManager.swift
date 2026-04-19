/// APMServerManager — manages the CCEM APM v4 Phoenix server lifecycle.
///
/// Supports two start/stop mechanisms:
/// 1. launchd service (`io.pegues.agent-j.labs.ccem.apm-server`) — preferred
/// 2. PID file fallback for manually-started instances via `mix phx.server`
///
/// Health check polls `GET /api/status` on port 3032.

import Foundation
import Observation
import Darwin

@MainActor
@Observable
final class APMServerManager {
    var isRunning: Bool = false
    var isStarting: Bool = false
    var isStopping: Bool = false
    var lastError: String?

    private let apmDir: String
    private let pidFile: String
    private let logFile: String
    private let launchLabel = "io.pegues.agent-j.labs.ccem.apm-server"
    private let plistPath: String

    init() {
        let home = FileManager.default.homeDirectoryForCurrentUser.path
        self.apmDir    = "\(home)/Developer/ccem/apm-v4"
        self.pidFile   = "\(home)/Developer/ccem/apm-v4/.apm.pid"
        self.logFile   = "\(home)/Developer/ccem/apm/hooks/apm_server.log"
        self.plistPath = "\(home)/Library/LaunchAgents/io.pegues.agent-j.labs.ccem.apm-server.plist"
    }

    // MARK: - Status

    /// Check whether the APM server is running.
    /// Dispatches synchronous shell/kill calls to a background thread to avoid
    /// blocking the main actor (which causes visible UI stalls in the menubar).
    func checkRunning() async {
        let pidFile = self.pidFile
        let launchLabel = self.launchLabel
        let running = await Task.detached(priority: .utility) { [pidFile, launchLabel] () -> Bool in
            // 1. Fast path: is launchd service active?
            let p = Process()
            p.executableURL = URL(fileURLWithPath: "/bin/bash")
            p.arguments = ["-c", "launchctl list \(launchLabel)"]
            p.standardOutput = Pipe()
            p.standardError = Pipe()
            try? p.run()
            p.waitUntilExit()
            if p.terminationStatus == 0 {
                // Check PID column is non-dash (service is actually running)
                let out = String(data: (p.standardOutput as! Pipe).fileHandleForReading.readDataToEndOfFile(), encoding: .utf8) ?? ""
                if let first = out.split(separator: "\n").first {
                    let cols = first.split(separator: "\t")
                    if let pid = cols.first, pid != "-", Int(pid) != nil { return true }
                }
            }
            // 2. Fallback: pid file check
            guard let pidStr = try? String(contentsOfFile: pidFile, encoding: .utf8)
                .trimmingCharacters(in: .whitespacesAndNewlines),
                  let pid = Int32(pidStr), pid > 0
            else { return false }
            return kill(pid, 0) == 0
        }.value
        isRunning = running
    }

    // MARK: - Start

    func startAPM() async {
        guard !isStarting, !isRunning else { return }
        isStarting = true
        lastError = nil
        defer { isStarting = false }

        // If the launchd service is already loaded, just kickstart it
        if launchctlServiceLoaded() {
            await launchctlKickstart()
        } else {
            // Bootstrap plist then kickstart
            await launchctlBootstrap()
            try? await Task.sleep(for: .seconds(1))
            await launchctlKickstart()
        }

        // Wait for server to answer
        for _ in 0..<12 {
            try? await Task.sleep(for: .milliseconds(500))
            if await httpHealthCheck() {
                isRunning = true
                return
            }
        }

        await checkRunning()
        if !isRunning {
            lastError = "APM server did not respond within 6 s — check \(logFile)"
        }
    }

    // MARK: - Stop

    func stopAPM() async {
        guard !isStopping else { return }
        isStopping = true
        lastError = nil
        defer { isStopping = false }

        if launchctlServiceLoaded() {
            // SIGTERM via launchctl stop — launchd will NOT restart because
            // KeepAlive.SuccessfulExit = false (clean stop = exit(0))
            await launchctlStop()
        } else {
            // Fallback: signal via pidfile
            if let pidString = try? String(contentsOfFile: pidFile, encoding: .utf8)
                .trimmingCharacters(in: .whitespacesAndNewlines),
               let pid = Int32(pidString), pid > 0 {
                _ = kill(pid, SIGTERM)
                try? await Task.sleep(for: .seconds(2))
                if kill(pid, 0) == 0 { _ = kill(pid, SIGKILL) }
            }
        }

        try? await Task.sleep(for: .seconds(1))
        try? FileManager.default.removeItem(atPath: pidFile)
        isRunning = false
    }

    // MARK: - Restart

    func restartAPM() async {
        await stopAPM()
        try? await Task.sleep(for: .seconds(2))
        await startAPM()
    }

    // MARK: - launchctl helpers

    private func launchctlServiceLoaded() -> Bool {
        let (_, code) = shell("launchctl list \(launchLabel)")
        return code == 0
    }

    private func launchctlServiceRunning() -> Bool {
        // `launchctl list` prints PID in first column when running (non-zero PID)
        let (output, code) = shell("launchctl list \(launchLabel)")
        guard code == 0 else { return false }
        // Output: "PID  Status  Label" — PID is "-" when not running
        if let line = output.split(separator: "\n").first {
            let cols = line.split(separator: "\t")
            if let pid = cols.first, pid != "-", Int(pid) != nil { return true }
        }
        return false
    }

    private func launchctlBootstrap() async {
        let guid = "gui/\(getuid())"
        let (_, code) = shell("launchctl bootstrap \(guid) '\(plistPath)'")
        if code != 0 {
            lastError = "launchctl bootstrap returned \(code)"
        }
    }

    private func launchctlKickstart() async {
        let target = "gui/\(getuid())/\(launchLabel)"
        let (_, code) = shell("launchctl kickstart -k \(target)")
        if code != 0 {
            // Fall back to start
            _ = shell("launchctl start \(launchLabel)")
        }
    }

    private func launchctlStop() async {
        _ = shell("launchctl stop \(launchLabel)")
    }

    // MARK: - HTTP health check

    func httpHealthCheck() async -> Bool {
        guard let url = URL(string: "http://localhost:3032/api/status") else { return false }
        var req = URLRequest(url: url)
        req.timeoutInterval = 3
        do {
            let (_, resp) = try await URLSession.shared.data(for: req)
            return (resp as? HTTPURLResponse)?.statusCode == 200
        } catch {
            return false
        }
    }

    // MARK: - Utility

    @discardableResult
    private func shell(_ cmd: String) -> (String, Int32) {
        let p = Process()
        p.executableURL = URL(fileURLWithPath: "/bin/bash")
        p.arguments = ["-c", cmd]
        var env = ProcessInfo.processInfo.environment
        env["PATH"] = "/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:\(env["PATH"] ?? "")"
        p.environment = env
        let pipe = Pipe()
        p.standardOutput = pipe
        p.standardError  = pipe
        try? p.run()
        p.waitUntilExit()
        let output = String(data: pipe.fileHandleForReading.readDataToEndOfFile(), encoding: .utf8) ?? ""
        return (output.trimmingCharacters(in: .whitespacesAndNewlines), p.terminationStatus)
    }
}
