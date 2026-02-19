import Foundation
import Observation
import AppKit

enum EnvironmentFilter: String, CaseIterable {
    case all = "All"
    case active = "Active"
}

@MainActor
@Observable
final class EnvironmentMonitor {
    var connectionState: ConnectionState = .disconnected
    var environments: [APMEnvironment] = []
    var healthStatus: HealthStatus?
    var lastError: String?
    var lastRefresh: Date?
    var filter: EnvironmentFilter = .all

    var filteredEnvironments: [APMEnvironment] {
        switch filter {
        case .all: return environments
        case .active: return environments.filter { $0.sessionCount > 0 }
        }
    }

    var activeCount: Int {
        environments.filter { $0.sessionCount > 0 }.count
    }

    private let client = APMClient()
    private let driftDetector = DriftDetector()
    private var pollTask: Task<Void, Never>?
    private let pollInterval: TimeInterval = 10

    func start() {
        guard pollTask == nil else { return }
        pollTask = Task {
            while !Task.isCancelled {
                await self.refresh()
                try? await Task.sleep(for: .seconds(self.pollInterval))
            }
        }
    }

    func stop() {
        pollTask?.cancel()
        pollTask = nil
    }

    func refresh() async {
        connectionState = .connecting

        do {
            let health = try await client.checkHealth()
            healthStatus = health
            connectionState = health.isHealthy ? .connected : .disconnected
        } catch {
            connectionState = .disconnected
            lastError = error.localizedDescription
            environments = []
            return
        }

        // Build environments from health projects (most reliable source)
        do {
            let healthProjects = healthStatus?.projects ?? []
            var updatedEnvironments: [APMEnvironment] = []

            for hp in healthProjects {
                let project = APMProject(
                    id: hp.name,
                    name: hp.name,
                    projectRoot: nil,
                    sessionCount: hp.sessionCount,
                    lastActivity: nil,
                    status: hp.status
                )
                let drift = await driftDetector.detectDrift(for: project)
                updatedEnvironments.append(APMEnvironment(
                    id: hp.name,
                    project: project,
                    driftStatus: drift,
                    agentCount: hp.agentCount
                ))
            }

            environments = updatedEnvironments.sorted { ($0.sessionCount, $0.name) > ($1.sessionCount, $1.name) }
            lastRefresh = Date()
            lastError = nil
        }
    }

    func openDashboard() {
        guard let url = URL(string: "http://localhost:3031") else { return }
        NSWorkspace.shared.open(url)
    }
}
