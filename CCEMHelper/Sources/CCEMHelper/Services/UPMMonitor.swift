import Foundation
import Observation

/// UPMMonitor polls the APM UPM module endpoints every 60 seconds,
/// tracking projects, sync status, and drift across PM/VCS integrations.
@MainActor
@Observable
final class UPMMonitor {

    // MARK: - Public State

    var projects: [UPMProject] = []
    var syncStatus: UPMSyncStatusData?
    var driftSummary: UPMDriftSummary?
    var isMonitoring: Bool = false
    var lastPollAt: Date?
    var error: String?

    var projectCount: Int { projects.count }
    var syncedCount: Int { driftSummary?.synced ?? 0 }
    var driftedCount: Int { driftSummary?.drifted ?? 0 }
    var recentSyncs: [UPMSyncResult] { syncStatus?.lastSyncs ?? [] }

    // MARK: - Private

    private let client = APMClient()
    private var pollTask: Task<Void, Never>?
    private let pollInterval: TimeInterval = 60

    // MARK: - Lifecycle

    func start() {
        guard !isMonitoring else { return }
        isMonitoring = true
        Task { await poll() }
        schedulePoll()
    }

    func stop() {
        pollTask?.cancel()
        pollTask = nil
        isMonitoring = false
    }

    func refresh() async {
        await poll()
    }

    // MARK: - Polling

    private func schedulePoll() {
        pollTask?.cancel()
        pollTask = Task { [weak self] in
            while !Task.isCancelled {
                try? await Task.sleep(for: .seconds(self?.pollInterval ?? 60))
                guard !Task.isCancelled else { break }
                await self?.poll()
            }
        }
    }

    private func poll() async {
        do {
            async let projectsResult = client.fetchUPMProjects()
            async let syncResult = client.fetchUPMSyncStatus()
            async let driftResult = client.fetchUPMDrift()

            let (fetchedProjects, fetchedSync, fetchedDrift) = try await (projectsResult, syncResult, driftResult)

            projects = fetchedProjects
            syncStatus = fetchedSync
            driftSummary = fetchedDrift
            lastPollAt = Date()
            error = nil
        } catch {
            self.error = error.localizedDescription
        }
    }
}
