import Foundation

/// Aggregated Claude usage summary returned by GET /api/usage/summary.
struct UsageSummary: Codable {
    let totalInputTokens: Int
    let totalOutputTokens: Int
    let totalCacheTokens: Int
    let totalToolCalls: Int
    let totalSessions: Int
    let topModel: String?
    let effortLevel: String?

    enum CodingKeys: String, CodingKey {
        case totalInputTokens = "total_input_tokens"
        case totalOutputTokens = "total_output_tokens"
        case totalCacheTokens = "total_cache_tokens"
        case totalToolCalls = "total_tool_calls"
        case totalSessions = "total_sessions"
        case topModel = "top_model"
        case effortLevel = "effort_level"
    }

    /// Human-readable total tokens (input + output).
    var totalTokensFormatted: String {
        let total = totalInputTokens + totalOutputTokens
        if total >= 1_000_000 {
            return String(format: "%.1fM", Double(total) / 1_000_000)
        } else if total >= 1_000 {
            return String(format: "%.1fk", Double(total) / 1_000)
        }
        return "\(total)"
    }

    /// Color name for the effort badge.
    var effortColor: String {
        switch effortLevel {
        case "intensive": return "red"
        case "high": return "orange"
        case "medium": return "yellow"
        default: return "green"
        }
    }
}

/// Wrapper for GET /api/usage/summary response envelope.
struct UsageSummaryResponse: Codable {
    let ok: Bool
    let summary: UsageSummary
}
