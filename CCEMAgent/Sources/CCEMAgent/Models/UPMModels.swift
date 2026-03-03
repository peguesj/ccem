import Foundation

// MARK: - UPM Project

struct UPMProject: Codable, Identifiable {
    let id: String
    let name: String
    let path: String
    let stack: [String]
    let planeProjectId: String?
    let linearProjectId: String?
    let vcsUrl: String?
    let branchStrategy: String?
    let activePrdBranch: String?
    let lastSeenAt: String?
    let tags: [String]

    enum CodingKeys: String, CodingKey {
        case id, name, path, stack, tags
        case planeProjectId = "plane_project_id"
        case linearProjectId = "linear_project_id"
        case vcsUrl = "vcs_url"
        case branchStrategy = "branch_strategy"
        case activePrdBranch = "active_prd_branch"
        case lastSeenAt = "last_seen_at"
    }
}

struct UPMProjectsResponse: Codable {
    let data: [UPMProject]
}

// MARK: - PM Integration

struct UPMPMIntegration: Codable, Identifiable {
    let id: String
    let projectId: String
    let platform: String
    let baseUrl: String?
    let workspace: String?
    let projectKey: String?
    let syncEnabled: Bool
    let lastSyncAt: String?

    enum CodingKeys: String, CodingKey {
        case id, platform, workspace
        case projectId = "project_id"
        case baseUrl = "base_url"
        case projectKey = "project_key"
        case syncEnabled = "sync_enabled"
        case lastSyncAt = "last_sync_at"
    }
}

// MARK: - VCS Integration

struct UPMVCSIntegration: Codable, Identifiable {
    let id: String
    let projectId: String
    let provider: String
    let repoUrl: String?
    let defaultBranch: String?
    let syncType: String?
    let lastSyncAt: String?

    enum CodingKeys: String, CodingKey {
        case id, provider
        case projectId = "project_id"
        case repoUrl = "repo_url"
        case defaultBranch = "default_branch"
        case syncType = "sync_type"
        case lastSyncAt = "last_sync_at"
    }
}

// MARK: - Work Item

struct UPMWorkItem: Codable, Identifiable {
    let id: String
    let projectId: String
    let title: String
    let status: String
    let priority: String?
    let platformKey: String?
    let platformUrl: String?
    let passes: Bool?
    let syncStatus: String?
    let branchName: String?
    let prUrl: String?

    enum CodingKeys: String, CodingKey {
        case id, title, status, priority, passes
        case projectId = "project_id"
        case platformKey = "platform_key"
        case platformUrl = "platform_url"
        case syncStatus = "sync_status"
        case branchName = "branch_name"
        case prUrl = "pr_url"
    }
}

// MARK: - Sync

struct UPMSyncResult: Codable {
    let projectId: String
    let syncedCount: Int
    let driftedCount: Int
    let errors: [String]
    let startedAt: String?
    let completedAt: String?

    enum CodingKeys: String, CodingKey {
        case errors
        case projectId = "project_id"
        case syncedCount = "synced_count"
        case driftedCount = "drifted_count"
        case startedAt = "started_at"
        case completedAt = "completed_at"
    }
}

struct UPMSyncStatusResponse: Codable {
    let data: UPMSyncStatusData
}

struct UPMSyncStatusData: Codable {
    let lastSyncs: [UPMSyncResult]
    let totalSyncs: Int

    enum CodingKeys: String, CodingKey {
        case lastSyncs = "last_syncs"
        case totalSyncs = "total_syncs"
    }
}

// MARK: - Drift

struct UPMDriftSummary: Codable {
    let synced: Int
    let drifted: Int
    let errors: Int
    let details: [UPMDriftDetail]
}

struct UPMDriftDetail: Codable, Identifiable {
    let itemId: String
    let projectId: String
    let title: String
    let drift: [String: String]

    var id: String { itemId }

    enum CodingKeys: String, CodingKey {
        case title, drift
        case itemId = "item_id"
        case projectId = "project_id"
    }
}
