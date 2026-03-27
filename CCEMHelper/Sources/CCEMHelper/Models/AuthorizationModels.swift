import Foundation

// MARK: - AgentLock Authorization Models (v7.0.0)

/// Active authorization session with trust tracking
struct AuthSession: Codable, Identifiable {
    let id: String
    let userId: String
    let role: String
    let dataBoundary: String
    let trustCeiling: String
    let toolCallCount: Int
    let deniedCount: Int
    let createdAt: String?
    let expiresAt: String?

    enum CodingKeys: String, CodingKey {
        case id
        case userId = "user_id"
        case role
        case dataBoundary = "data_boundary"
        case trustCeiling = "trust_ceiling"
        case toolCallCount = "tool_call_count"
        case deniedCount = "denied_count"
        case createdAt = "created_at"
        case expiresAt = "expires_at"
    }

    var trustColor: String {
        switch trustCeiling {
        case "authoritative": return "green"
        case "derived": return "yellow"
        case "untrusted": return "red"
        default: return "gray"
        }
    }
}

/// Registered tool with risk level
struct AuthTool: Codable, Identifiable {
    var id: String { name }
    let name: String
    let riskLevel: String
    let requiresAuth: Bool
    let allowedRoles: [String]
    let dataBoundary: String
    let maxRecords: Int
    let registeredAt: String?

    enum CodingKeys: String, CodingKey {
        case name
        case riskLevel = "risk_level"
        case requiresAuth = "requires_auth"
        case allowedRoles = "allowed_roles"
        case dataBoundary = "data_boundary"
        case maxRecords = "max_records"
        case registeredAt = "registered_at"
    }

    var riskColor: String {
        switch riskLevel {
        case "none": return "green"
        case "low": return "blue"
        case "medium": return "yellow"
        case "high": return "orange"
        case "critical": return "red"
        default: return "gray"
        }
    }
}

/// Token status counts
struct TokenStats: Codable {
    let active: Int
    let used: Int
    let expired: Int
    let revoked: Int

    init(active: Int = 0, used: Int = 0, expired: Int = 0, revoked: Int = 0) {
        self.active = active
        self.used = used
        self.expired = expired
        self.revoked = revoked
    }
}

/// Risk distribution by level
struct RiskDistribution: Codable {
    let none: Int
    let low: Int
    let medium: Int
    let high: Int
    let critical: Int

    init(none: Int = 0, low: Int = 0, medium: Int = 0, high: Int = 0, critical: Int = 0) {
        self.none = none
        self.low = low
        self.medium = medium
        self.high = high
        self.critical = critical
    }
}

/// Authorization summary from GET /api/v2/auth/summary
struct AuthorizationSummary: Codable {
    let registeredTools: Int
    let activeSessions: Int
    let tokens: TokenStats
    let totalAuthorized: Int
    let totalDenied: Int
    let totalEscalated: Int
    let riskDistribution: [String: Int]

    enum CodingKeys: String, CodingKey {
        case registeredTools = "registered_tools"
        case activeSessions = "active_sessions"
        case tokens
        case totalAuthorized = "total_authorized"
        case totalDenied = "total_denied"
        case totalEscalated = "total_escalated"
        case riskDistribution = "risk_distribution"
    }

    var trustLabel: String {
        if totalDenied == 0 && totalEscalated == 0 {
            return "Clean"
        } else if totalDenied > 0 {
            return "Has Denials"
        } else {
            return "Escalations"
        }
    }

    var trustColor: String {
        if totalDenied == 0 && totalEscalated == 0 {
            return "green"
        } else if totalDenied > 0 {
            return "red"
        } else {
            return "yellow"
        }
    }
}

/// Response wrapper for summary endpoint
struct AuthorizationSummaryResponse: Codable {
    let ok: Bool
    let summary: AuthorizationSummary
}

/// Single auth audit log entry from GET /api/v2/auth/audit
struct AuthAuditEntry: Codable, Identifiable {
    let id: String
    let eventType: String
    let resource: String?
    let timestamp: String?
    let details: [String: AnyCodable]?

    enum CodingKeys: String, CodingKey {
        case id
        case eventType = "event_type"
        case resource
        case timestamp
        case details
    }

    init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        // Fall back to a deterministic composite key if server omits the id field.
        let eventType = try container.decode(String.self, forKey: .eventType)
        let resource = try container.decodeIfPresent(String.self, forKey: .resource)
        let timestamp = try container.decodeIfPresent(String.self, forKey: .timestamp)
        let details = try container.decodeIfPresent([String: AnyCodable].self, forKey: .details)
        self.id = (try? container.decodeIfPresent(String.self, forKey: .id)) ?? "\(eventType)-\(timestamp ?? "")-\(resource ?? "")"
        self.eventType = eventType
        self.resource = resource
        self.timestamp = timestamp
        self.details = details
    }

    var isDenial: Bool {
        eventType == "auth:authorization_denied" || eventType == "auth:rate_limited"
    }

    var isEscalation: Bool {
        eventType == "auth:authorization_escalated"
    }

    var toolName: String {
        resource ?? details?["tool_name"]?.stringValue ?? "unknown"
    }

    var riskLevel: String {
        details?["risk_level"]?.stringValue ?? "unknown"
    }
}

/// Flexible value container for audit entry details
struct AnyCodable: Codable {
    let value: Any

    init(_ value: Any) { self.value = value }

    init(from decoder: Decoder) throws {
        let container = try decoder.singleValueContainer()
        if let s = try? container.decode(String.self) { value = s; return }
        if let i = try? container.decode(Int.self) { value = i; return }
        if let d = try? container.decode(Double.self) { value = d; return }
        if let b = try? container.decode(Bool.self) { value = b; return }
        value = ""
    }

    func encode(to encoder: Encoder) throws {
        var container = encoder.singleValueContainer()
        switch value {
        case let s as String: try container.encode(s)
        case let i as Int: try container.encode(i)
        case let d as Double: try container.encode(d)
        case let b as Bool: try container.encode(b)
        default: try container.encode("")
        }
    }

    var stringValue: String? { value as? String }
}

/// Response wrapper for audit log endpoint
struct AuthAuditResponse: Codable {
    let ok: Bool
    let entries: [AuthAuditEntry]
    let count: Int
}

// MARK: - AgentLock Pending Decisions (v7.0.0 W6)

/// Pending authorization decision awaiting human approval from GET /api/v2/auth/pending
struct PendingDecision: Codable, Identifiable {
    let requestId: String
    let toolName: String
    let sessionId: String
    let agentId: String
    let riskLevel: String
    let params: [String: AnyCodable]?
    let status: String
    let decision: String?
    let decidedAt: String?
    let insertedAt: String
    let expiresAt: String

    var id: String { requestId }

    enum CodingKeys: String, CodingKey {
        case requestId = "request_id"
        case toolName = "tool_name"
        case sessionId = "session_id"
        case agentId = "agent_id"
        case riskLevel = "risk_level"
        case params
        case status
        case decision
        case decidedAt = "decided_at"
        case insertedAt = "inserted_at"
        case expiresAt = "expires_at"
    }

    var isPending: Bool { status == "pending" }

    var notificationTitle: String { "[AgentLock] Approval Required" }

    var notificationBody: String {
        "\(toolName) — risk: \(riskLevel) | Agent: \(agentId)"
    }
}

/// Response wrapper for GET /api/v2/auth/pending
struct PendingDecisionsResponse: Codable {
    let ok: Bool
    let pending: [PendingDecision]
    let count: Int
}

// MARK: - AgentLock Decision (notification surface)

/// Real-time authorization decision from AgentLock, sourced from APM notification polling
struct AgentLockDecision: Codable {
    let tool: String
    let status: String   // "granted" | "denied" | "rate_limited" | "escalated"
    let riskLevel: String
    let sessionId: String
    let timestamp: String

    enum CodingKeys: String, CodingKey {
        case tool, status, timestamp
        case riskLevel = "risk_level"
        case sessionId = "session_id"
    }

    /// True when this decision warrants a macOS system notification
    var requiresSystemNotification: Bool {
        status == "denied" || status == "rate_limited"
    }

    var notificationTitle: String {
        switch status {
        case "denied":       return "AgentLock: Access Denied"
        case "rate_limited": return "AgentLock: Rate Limited"
        case "escalated":    return "AgentLock: Approval Required"
        default:             return "AgentLock: \(tool) authorized"
        }
    }

    var notificationBody: String {
        "\(tool) — risk level: \(riskLevel)"
    }
}
