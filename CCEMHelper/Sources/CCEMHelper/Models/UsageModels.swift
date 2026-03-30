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

/// Model capabilities for a single Claude model variant.
struct ModelCapabilities: Codable {
    let contextWindow: Int?
    let maxOutputTokens: Int?
    let vision: Bool?
    let toolUse: Bool?
    let computerUse: Bool?
    let extendedThinking: Bool?
    let tier: String?

    enum CodingKeys: String, CodingKey {
        case contextWindow = "context_window"
        case maxOutputTokens = "max_output_tokens"
        case vision
        case toolUse = "tool_use"
        case computerUse = "computer_use"
        case extendedThinking = "extended_thinking"
        case tier
    }
}

/// Single model limit entry from GET /api/usage/limits.
struct ModelLimit: Codable {
    let model: String
    let capabilities: ModelCapabilities?
    let utilizationPct: Double?

    enum CodingKeys: String, CodingKey {
        case model
        case capabilities
        case utilizationPct = "utilization_pct"
    }

    /// Human-readable context window.
    var contextFormatted: String {
        guard let ctx = capabilities?.contextWindow else { return "N/A" }
        if ctx >= 1_000_000 { return String(format: "%.0fM", Double(ctx) / 1_000_000) }
        if ctx >= 1_000 { return String(format: "%.0fK", Double(ctx) / 1_000) }
        return "\(ctx)"
    }
}

/// Wrapper for GET /api/usage/limits response envelope.
struct UsageLimitsResponse: Codable {
    let ok: Bool
    let limits: [ModelLimit]
    let modelCount: Int

    enum CodingKeys: String, CodingKey {
        case ok
        case limits
        case modelCount = "model_count"
    }
}
