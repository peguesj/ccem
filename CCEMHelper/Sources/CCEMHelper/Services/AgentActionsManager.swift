import Foundation
import Observation

/// Agent info extracted from APM health data for control actions (US-006)
struct AgentInfo: Identifiable {
    let id: String
    let name: String
    let status: String
    let project: String?

    var displayName: String {
        if name.count > 20 {
            return String(name.prefix(20)) + "..."
        }
        return name
    }
}

/// Mini chat message for the menu bar chat view (US-007)
struct MiniChatMessage: Identifiable {
    let id = UUID()
    let role: String      // "agent" or "user"
    let content: String
    let timestamp: Date

    var relativeTime: String {
        let interval = Date().timeIntervalSince(timestamp)
        if interval < 60 { return "now" }
        if interval < 3600 { return "\(Int(interval / 60))m" }
        return "\(Int(interval / 3600))h"
    }
}

/// Manages agent control actions via REST API (US-006)
@MainActor
@Observable
final class AgentActionsManager {
    var agents: [AgentInfo] = []
    var lastError: String?

    var hasAgents: Bool { !agents.isEmpty }

    private let client = APMClient()

    func refresh(from monitor: EnvironmentMonitor) async {
        var infos: [AgentInfo] = []
        for env in monitor.environments {
            if env.agentCount > 0 {
                // Create agent placeholders from environment data
                infos.append(AgentInfo(
                    id: env.id,
                    name: env.name,
                    status: env.isActive ? "active" : "idle",
                    project: env.name
                ))
            }
        }
        agents = infos
    }

    func controlAgent(_ agentId: String, action: String) async {
        lastError = nil
        do {
            try await client.controlAgent(id: agentId, action: action)
        } catch {
            lastError = "Control failed: \(error.localizedDescription)"
        }
    }

    func controlFormation(_ formationId: String, action: String) async {
        lastError = nil
        do {
            try await client.controlFormation(id: formationId, action: action)
        } catch {
            lastError = "Formation control failed: \(error.localizedDescription)"
        }
    }
}
