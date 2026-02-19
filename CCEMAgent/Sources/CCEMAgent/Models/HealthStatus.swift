import Foundation

struct HealthStatus: Codable {
    let status: String?
    let uptime: Double?
    let serverVersion: String?
    let totalProjects: Int?
    let activeProject: String?
    let projects: [HealthProject]?

    enum CodingKeys: String, CodingKey {
        case status, uptime, projects
        case serverVersion = "server_version"
        case totalProjects = "total_projects"
        case activeProject = "active_project"
    }

    var isHealthy: Bool {
        status?.lowercased() == "ok" || status?.lowercased() == "healthy"
    }
}

struct HealthProject: Codable, Identifiable {
    let name: String
    let status: String
    let sessionCount: Int
    let agentCount: Int

    var id: String { name }
    var isActive: Bool { sessionCount > 0 }

    enum CodingKeys: String, CodingKey {
        case name, status
        case sessionCount = "session_count"
        case agentCount = "agent_count"
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
