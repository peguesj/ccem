import Foundation

struct APMProject: Codable, Identifiable, Hashable {
    let id: String
    let name: String
    let projectRoot: String?
    let sessionCount: Int?
    let lastActivity: Date?
    let status: String?

    enum CodingKeys: String, CodingKey {
        case id, name, status
        case projectRoot = "project_root"
        case sessionCount = "session_count"
        case lastActivity = "last_activity"
    }

    init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        self.id = try container.decodeIfPresent(String.self, forKey: .id) ?? UUID().uuidString
        self.name = try container.decode(String.self, forKey: .name)
        self.projectRoot = try container.decodeIfPresent(String.self, forKey: .projectRoot)
        self.sessionCount = try container.decodeIfPresent(Int.self, forKey: .sessionCount)
        self.status = try container.decodeIfPresent(String.self, forKey: .status)

        if let timestamp = try container.decodeIfPresent(String.self, forKey: .lastActivity) {
            let formatter = ISO8601DateFormatter()
            formatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
            self.lastActivity = formatter.date(from: timestamp)
                ?? ISO8601DateFormatter().date(from: timestamp)
        } else {
            self.lastActivity = nil
        }
    }

    init(id: String, name: String, projectRoot: String?, sessionCount: Int?, lastActivity: Date?, status: String?) {
        self.id = id
        self.name = name
        self.projectRoot = projectRoot
        self.sessionCount = sessionCount
        self.lastActivity = lastActivity
        self.status = status
    }
}

struct APMEnvironment: Identifiable, Hashable {
    let id: String
    let project: APMProject
    var driftStatus: DriftStatus

    var name: String { project.name }
    var sessionCount: Int { project.sessionCount ?? 0 }
    var lastActivity: Date? { project.lastActivity }
}

enum DriftStatus: Hashable {
    case clean
    case drifted(String)
    case unknown

    var label: String {
        switch self {
        case .clean: return "Clean"
        case .drifted(let reason): return "Drift: \(reason)"
        case .unknown: return "Unknown"
        }
    }

    var isClean: Bool {
        if case .clean = self { return true }
        return false
    }
}

struct APMDataResponse: Codable {
    let projects: [APMProject]?
    let sessions: [APMSession]?
}

struct APMSession: Codable, Identifiable {
    let id: String
    let projectName: String?
    let startedAt: String?
    let status: String?

    enum CodingKeys: String, CodingKey {
        case id
        case projectName = "project_name"
        case startedAt = "started_at"
        case status
    }
}

struct ProjectListResponse: Codable {
    let projects: [APMProject]
}

struct EnvironmentListResponse: Codable {
    let environments: [APMProject]
}
