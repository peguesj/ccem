import Foundation

struct HealthStatus: Codable {
    let status: String?
    let uptime: Double?
    let version: String?

    var isHealthy: Bool {
        status?.lowercased() == "ok" || status?.lowercased() == "healthy"
    }
}

enum ConnectionState: Equatable {
    case connected
    case disconnected
    case connecting

    var label: String {
        switch self {
        case .connected: return "Connected"
        case .disconnected: return "Disconnected"
        case .connecting: return "Connecting..."
        }
    }
}
