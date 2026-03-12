import Foundation

struct AgUiEvent: Codable, Identifiable {
    let id: String
    let type: String
    let agentId: String?
    let timestamp: String
    let data: [String: String]?

    enum CodingKeys: String, CodingKey {
        case id, type, timestamp, data
        case agentId = "agent_id"
    }

    var date: Date {
        let formatter = ISO8601DateFormatter()
        formatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        if let d = formatter.date(from: timestamp) { return d }
        formatter.formatOptions = [.withInternetDateTime]
        return formatter.date(from: timestamp) ?? Date()
    }

    var isPendingApproval: Bool {
        type == "TOOL_CALL_START" || type == "PENDING_APPROVAL"
    }
}

struct AgUiEventsResponse: Codable {
    let events: [AgUiEvent]
    let count: Int
}
