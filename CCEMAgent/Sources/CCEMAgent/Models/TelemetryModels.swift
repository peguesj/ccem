import Foundation

struct TelemetryDataPoint: Codable, Identifiable {
    let bucket: String
    let started: Int
    let completed: Int
    let failed: Int
    let active: Int

    var id: String { bucket }

    var date: Date {
        let formatter = ISO8601DateFormatter()
        formatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        if let d = formatter.date(from: bucket) { return d }
        formatter.formatOptions = [.withInternetDateTime]
        return formatter.date(from: bucket) ?? Date()
    }
}

struct AgentTelemetrySummary: Codable {
    let totalStarted: Int
    let totalCompleted: Int
    let totalFailed: Int
    let activeNow: Int

    enum CodingKeys: String, CodingKey {
        case totalStarted = "total_started"
        case totalCompleted = "total_completed"
        case totalFailed = "total_failed"
        case activeNow = "active_now"
    }
}

struct TelemetryResponse: Codable {
    let dataPoints: [TelemetryDataPoint]
    let summary: AgentTelemetrySummary

    enum CodingKeys: String, CodingKey {
        case dataPoints = "data_points"
        case summary
    }
}
