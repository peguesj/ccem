import Foundation
import Observation
import AppKit

@MainActor
@Observable
final class EnvironmentMonitor {
    var connectionState: ConnectionState = .disconnected
    var environments: [APMEnvironment] = []
    var healthStatus: HealthStatus?
    var lastError: String?
    var lastRefresh: Date?

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

        // Check health
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

        // Fetch environments/projects
        do {
            var projects: [APMProject] = []

            // Try environments endpoint first, fall back to projects
            if let envs = try? await client.fetchEnvironments(), !envs.isEmpty {
                projects = envs
            } else {
                projects = try await client.fetchProjects()
            }

            var updatedEnvironments: [APMEnvironment] = []
            for project in projects {
                let drift = await driftDetector.detectDrift(for: project)
                updatedEnvironments.append(APMEnvironment(
                    id: project.id,
                    project: project,
                    driftStatus: drift
                ))
            }

            environments = updatedEnvironments
            lastRefresh = Date()
            lastError = nil
        } catch {
            lastError = error.localizedDescription
        }
    }

    func openDashboard() {
        guard let url = URL(string: "http://localhost:3031") else { return }
        #if canImport(AppKit)
        NSWorkspace.shared.open(url)
        #endif
    }
}
