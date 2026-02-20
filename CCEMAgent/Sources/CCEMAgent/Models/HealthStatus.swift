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

struct UPMStatus: Codable {
    let active: Bool
    let session: UPMSession?
    let events: [UPMEvent]?
}

struct UPMSession: Codable {
    let id: String
    let status: String
    let currentWave: Int
    let totalWaves: Int
    let stories: [UPMStory]?

    enum CodingKeys: String, CodingKey {
        case id, status, stories
        case currentWave = "current_wave"
        case totalWaves = "total_waves"
    }
}

struct UPMStory: Codable, Identifiable {
    let id: String
    let title: String?
    let status: String
    let agentId: String?

    enum CodingKeys: String, CodingKey {
        case id, title, status
        case agentId = "agent_id"
    }
}

struct UPMEvent: Codable, Identifiable {
    let id: Int
    let eventType: String
    let timestamp: String?

    enum CodingKeys: String, CodingKey {
        case id, timestamp
        case eventType = "event_type"
    }
}

// MARK: - APM Notifications

struct APMNotification: Codable, Identifiable {
    let id: String
    let type: String          // info, success, warning, error
    let title: String
    let message: String
    let category: String?     // agent, formation, upm, skill
    let projectName: String?
    let namespace: String?
    let formationId: String?
    let agentId: String?
    let timestamp: String

    enum CodingKeys: String, CodingKey {
        case id, type, title, message, category, namespace, timestamp
        case projectName = "project_name"
        case formationId = "formation_id"
        case agentId = "agent_id"
    }
}

struct NotificationsResponse: Codable {
    let notifications: [APMNotification]
    let count: Int
    let limit: Int
}

// MARK: - Connection State

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
