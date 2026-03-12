import Foundation
import Observation

/// Represents a configured APM server endpoint (US-008)
struct APMServer: Identifiable, Codable, Equatable {
    let id: UUID
    var label: String
    var port: Int
    var isDefault: Bool

    init(id: UUID = UUID(), label: String = "Local APM", port: Int = APMClient.defaultPort, isDefault: Bool = true) {
        self.id = id
        self.label = label
        self.port = port
        self.isDefault = isDefault
    }

    var url: String { "http://localhost:\(port)" }
}

/// Manages multiple APM server connections with health status tracking (US-008)
@MainActor
@Observable
final class MultiServerManager {
    var servers: [APMServer] = []
    var serverHealth: [UUID: ServerHealthState] = [:]

    private static let storageKey = "apmServers"

    enum ServerHealthState: Equatable {
        case unknown
        case healthy
        case unhealthy(String)

        var label: String {
            switch self {
            case .unknown: return "Unknown"
            case .healthy: return "Healthy"
            case .unhealthy(let reason): return reason
            }
        }

        var isHealthy: Bool {
            if case .healthy = self { return true }
            return false
        }
    }

    init() {
        loadServers()
    }

    func addServer(label: String, port: Int) {
        let server = APMServer(id: UUID(), label: label, port: port, isDefault: false)
        servers.append(server)
        saveServers()
    }

    func removeServer(_ server: APMServer) {
        guard !server.isDefault else { return }
        servers.removeAll { $0.id == server.id }
        serverHealth.removeValue(forKey: server.id)
        saveServers()
    }

    func updatePort(for serverId: UUID, port: Int) {
        guard let idx = servers.firstIndex(where: { $0.id == serverId }) else { return }
        servers[idx].port = port
        if servers[idx].isDefault {
            UserDefaults.standard.set(port, forKey: APMClient.portKey)
        }
        saveServers()
    }

    func checkHealth() async {
        for server in servers {
            let client = APMClient(port: server.port)
            do {
                let health = try await client.checkHealth()
                serverHealth[server.id] = health.isHealthy ? .healthy : .unhealthy("Unhealthy")
            } catch {
                serverHealth[server.id] = .unhealthy("Unreachable")
            }
        }
    }

    private func loadServers() {
        if let data = UserDefaults.standard.data(forKey: Self.storageKey),
           let saved = try? JSONDecoder().decode([APMServer].self, from: data),
           !saved.isEmpty {
            servers = saved
        } else {
            // Default server
            let defaultPort = UserDefaults.standard.integer(forKey: APMClient.portKey)
            let port = defaultPort > 0 ? defaultPort : APMClient.defaultPort
            servers = [APMServer(port: port, isDefault: true)]
        }
    }

    private func saveServers() {
        if let data = try? JSONEncoder().encode(servers) {
            UserDefaults.standard.set(data, forKey: Self.storageKey)
        }
    }
}
