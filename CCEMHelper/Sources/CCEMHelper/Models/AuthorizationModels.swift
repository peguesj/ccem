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
