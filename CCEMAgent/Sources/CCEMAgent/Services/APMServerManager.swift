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

    init() {
        let home = FileManager.default.homeDirectoryForCurrentUser.path
        self.apmDir = "\(home)/Developer/ccem/apm-v4"
        self.pidFile = "\(home)/Developer/ccem/apm-v4/.apm.pid"
        self.logFile = "\(home)/Developer/ccem/apm/hooks/apm_server.log"
    }

    func checkRunning() {
        guard
            let pidString = try? String(contentsOfFile: pidFile, encoding: .utf8)
                .trimmingCharacters(in: .whitespacesAndNewlines),
            let pid = Int32(pidString), pid > 0
        else {
            isRunning = false
            return
        }
        isRunning = kill(pid, 0) == 0
    }

    func startAPM() async {
        guard !isStarting, !isRunning else { return }
        isStarting = true
        lastError = nil
        defer { isStarting = false }

        let script = """
        cd '\(apmDir)' && \
        nohup /opt/homebrew/bin/mix phx.server >> '\(logFile)' 2>&1 & \
        echo $! > '\(pidFile)'
        """

        let process = Process()
        process.executableURL = URL(fileURLWithPath: "/bin/bash")
        process.arguments = ["-c", script]
        var env = ProcessInfo.processInfo.environment
        env["MIX_ENV"] = env["MIX_ENV"] ?? "prod"
        env["PATH"] = "/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:\(env["PATH"] ?? "")"
        process.environment = env

        do {
            try process.run()
            process.waitUntilExit()
            // Give the server a few seconds to initialize
            try await Task.sleep(for: .seconds(3))
            checkRunning()
            if !isRunning {
                lastError = "Server may still be starting — check logs"
            }
        } catch {
            lastError = error.localizedDescription
        }
    }

    func stopAPM() async {
        guard !isStopping else { return }
        isStopping = true
        lastError = nil
        defer { isStopping = false }

        guard
            let pidString = try? String(contentsOfFile: pidFile, encoding: .utf8)
                .trimmingCharacters(in: .whitespacesAndNewlines),
            let pid = Int32(pidString), pid > 0
        else {
            isRunning = false
            return
        }

        _ = kill(pid, SIGTERM)
        try? await Task.sleep(for: .seconds(2))

        if kill(pid, 0) == 0 {
            _ = kill(pid, SIGKILL)
        }

        isRunning = false
        try? FileManager.default.removeItem(atPath: pidFile)
    }
}
