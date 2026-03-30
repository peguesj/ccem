import Foundation

actor APMClient {
    private var baseURL: URL
    private let session: URLSession
    private let decoder: JSONDecoder

    static let portKey = "io.pegues.ccem.apmPort"
    static let hostKey = "io.pegues.ccem.apmHost"
    static let defaultPort = 3032
    static let defaultHost = "localhost"

    var currentPort: Int {
        Int(baseURL.port ?? Self.defaultPort)
    }

    init(port: Int? = nil) {
        let resolvedPort = port ?? UserDefaults.standard.integer(forKey: Self.portKey)
        let effectivePort = resolvedPort > 0 ? resolvedPort : Self.defaultPort
        let host = UserDefaults.standard.string(forKey: Self.hostKey) ?? Self.defaultHost
        self.baseURL = URL(string: "http://\(host):\(effectivePort)")!
        // Use ephemeral to prevent URL cache accumulation over long-running sessions.
        // Default config caches responses to disk+memory indefinitely, causing GB of growth.
        let config = URLSessionConfiguration.ephemeral
        config.timeoutIntervalForRequest = 5
        config.timeoutIntervalForResource = 10
        self.session = URLSession(configuration: config)
        self.decoder = JSONDecoder()
    }

    /// Update the port without restarting the client
    func updatePort(_ port: Int) {
        UserDefaults.standard.set(port, forKey: Self.portKey)
        let host = UserDefaults.standard.string(forKey: Self.hostKey) ?? Self.defaultHost
        self.baseURL = URL(string: "http://\(host):\(port)")!
    }

    func checkHealth() async throws -> HealthStatus {
        let url = baseURL.appendingPathComponent("api/status")
        let (data, response) = try await session.data(from: url)
        guard let http = response as? HTTPURLResponse, http.statusCode == 200 else {
            throw APMClientError.badResponse
        }
        return try decoder.decode(HealthStatus.self, from: data)
    }

    func fetchProjects() async throws -> [APMProject] {
        let url = baseURL.appendingPathComponent("api/projects")
        let (data, response) = try await session.data(from: url)
        guard let http = response as? HTTPURLResponse, http.statusCode == 200 else {
            throw APMClientError.badResponse
        }
        // Try multiple response shapes
        if let wrapper = try? decoder.decode(ProjectListResponse.self, from: data) {
            return wrapper.projects
        }
        if let list = try? decoder.decode([APMProject].self, from: data) {
            return list
        }
        return []
    }

    func fetchEnvironments() async throws -> [APMProject] {
        let url = baseURL.appendingPathComponent("api/environments")
        let (data, response) = try await session.data(from: url)
        guard let http = response as? HTTPURLResponse, http.statusCode == 200 else {
            throw APMClientError.badResponse
        }
        if let wrapper = try? decoder.decode(EnvironmentListResponse.self, from: data) {
            return wrapper.environments
        }
        if let list = try? decoder.decode([APMProject].self, from: data) {
            return list
        }
        return []
    }

    func fetchUPMStatus() async throws -> UPMStatus {
        let url = baseURL.appendingPathComponent("api/upm/status")
        let (data, response) = try await session.data(from: url)
        guard let http = response as? HTTPURLResponse, http.statusCode == 200 else {
            throw APMClientError.badResponse
        }
        return try decoder.decode(UPMStatus.self, from: data)
    }

    func fetchNotifications(
        since: String? = nil,
        category: String? = nil,
        project: String? = nil,
        limit: Int = 20
    ) async throws -> [APMNotification] {
        var components = URLComponents(string: "\(baseURL.absoluteString)/api/notifications")!
        var queryItems: [URLQueryItem] = [
            URLQueryItem(name: "limit", value: String(limit))
        ]
        if let since { queryItems.append(URLQueryItem(name: "since", value: since)) }
        if let category { queryItems.append(URLQueryItem(name: "category", value: category)) }
        if let project { queryItems.append(URLQueryItem(name: "project", value: project)) }
        components.queryItems = queryItems

        let (data, response) = try await session.data(from: components.url!)
        guard let http = response as? HTTPURLResponse, http.statusCode == 200 else {
            throw APMClientError.badResponse
        }
        let result = try decoder.decode(NotificationsResponse.self, from: data)
        return result.notifications
    }

    func fetchData() async throws -> APMDataResponse {
        let url = baseURL.appendingPathComponent("api/data")
        let (data, response) = try await session.data(from: url)
        guard let http = response as? HTTPURLResponse, http.statusCode == 200 else {
            throw APMClientError.badResponse
        }
        return try decoder.decode(APMDataResponse.self, from: data)
    }

    func fetchTelemetry() async throws -> TelemetryResponse {
        let url = baseURL.appendingPathComponent("api/telemetry")
        let (data, response) = try await session.data(from: url)
        guard let http = response as? HTTPURLResponse, http.statusCode == 200 else {
            throw APMClientError.badResponse
        }
        return try decoder.decode(TelemetryResponse.self, from: data)
    }

    func fetchBackgroundTasks() async throws -> [BackgroundTask] {
        let url = baseURL.appendingPathComponent("api/bg-tasks")
        let (data, response) = try await session.data(from: url)
        guard let http = response as? HTTPURLResponse, http.statusCode == 200 else {
            throw APMClientError.badResponse
        }
        if let wrapper = try? decoder.decode(BackgroundTasksResponse.self, from: data) {
            return wrapper.tasks
        }
        return (try? decoder.decode([BackgroundTask].self, from: data)) ?? []
    }

    // MARK: - UPM Module

    func fetchUPMProjects() async throws -> [UPMProject] {
        let url = baseURL.appendingPathComponent("api/upm/projects")
        let (data, response) = try await session.data(from: url)
        guard let http = response as? HTTPURLResponse, http.statusCode == 200 else {
            throw APMClientError.badResponse
        }
        let wrapper = try decoder.decode(UPMProjectsResponse.self, from: data)
        return wrapper.data
    }

    func fetchUPMSyncStatus() async throws -> UPMSyncStatusData {
        let url = baseURL.appendingPathComponent("api/upm/sync/status")
        let (data, response) = try await session.data(from: url)
        guard let http = response as? HTTPURLResponse, http.statusCode == 200 else {
            throw APMClientError.badResponse
        }
        let wrapper = try decoder.decode(UPMSyncStatusResponse.self, from: data)
        return wrapper.data
    }

    func fetchUPMDrift() async throws -> UPMDriftSummary {
        let url = baseURL.appendingPathComponent("api/upm/work_items/drift")
        let (data, response) = try await session.data(from: url)
        guard let http = response as? HTTPURLResponse, http.statusCode == 200 else {
            throw APMClientError.badResponse
        }
        struct DriftWrapper: Codable { let data: UPMDriftSummary }
        let wrapper = try decoder.decode(DriftWrapper.self, from: data)
        return wrapper.data
    }

    func triggerUPMSync() async throws {
        var request = URLRequest(url: baseURL.appendingPathComponent("api/upm/sync"))
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.httpBody = "{}".data(using: .utf8)
        let (_, response) = try await session.data(for: request)
        guard let http = response as? HTTPURLResponse, http.statusCode == 200 else {
            throw APMClientError.badResponse
        }
    }

    // MARK: - Agent Control (US-006)

    func controlAgent(id: String, action: String) async throws {
        var request = URLRequest(url: baseURL.appendingPathComponent("api/v2/agents/\(id)/control"))
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        let body = try JSONSerialization.data(withJSONObject: ["action": action])
        request.httpBody = body
        let (_, response) = try await session.data(for: request)
        guard let http = response as? HTTPURLResponse, (200...299).contains(http.statusCode) else {
            throw APMClientError.badResponse
        }
    }

    func controlFormation(id: String, action: String) async throws {
        var request = URLRequest(url: baseURL.appendingPathComponent("api/v2/formations/\(id)/control"))
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        let body = try JSONSerialization.data(withJSONObject: ["action": action])
        request.httpBody = body
        let (_, response) = try await session.data(for: request)
        guard let http = response as? HTTPURLResponse, (200...299).contains(http.statusCode) else {
            throw APMClientError.badResponse
        }
    }

    // MARK: - Chat (US-007)

    func fetchChatMessages(scope: String) async -> [MiniChatMessage] {
        let url = baseURL.appendingPathComponent("api/v2/chat/\(scope)")
        do {
            let (data, response) = try await session.data(from: url)
            guard let http = response as? HTTPURLResponse, http.statusCode == 200 else { return [] }
            let wrapper = try decoder.decode(ChatMessagesResponse.self, from: data)
            return wrapper.messages.suffix(5).map { msg in
                MiniChatMessage(
                    role: msg.role,
                    content: msg.content,
                    timestamp: ISO8601DateFormatter().date(from: msg.timestamp) ?? Date()
                )
            }
        } catch {
            return []
        }
    }

    func sendChatMessage(scope: String, content: String) async {
        var request = URLRequest(url: baseURL.appendingPathComponent("api/v2/chat/\(scope)/send"))
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        let body: [String: Any] = ["content": content, "role": "user"]
        request.httpBody = try? JSONSerialization.data(withJSONObject: body)
        _ = try? await session.data(for: request)
    }

    // MARK: - AG-UI Events (US-042)

    func fetchAgUiEvents() async throws -> [AgUiEvent] {
        let url = baseURL.appendingPathComponent("api/v2/ag-ui/events")
        let (data, response) = try await session.data(from: url)
        guard let http = response as? HTTPURLResponse, http.statusCode == 200 else {
            throw APMClientError.badResponse
        }
        if let wrapper = try? decoder.decode(AgUiEventsResponse.self, from: data) {
            return wrapper.events
        }
        return (try? decoder.decode([AgUiEvent].self, from: data)) ?? []
    }

    // MARK: - UPM Scan

    func triggerUPMScan() async throws {
        var request = URLRequest(url: baseURL.appendingPathComponent("api/upm/projects/scan"))
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.httpBody = "{}".data(using: .utf8)
        let (_, response) = try await session.data(for: request)
        guard let http = response as? HTTPURLResponse, http.statusCode == 200 else {
            throw APMClientError.badResponse
        }
    }
    // MARK: - Claude Usage

    func fetchUsageSummary() async throws -> UsageSummary {
        let url = baseURL.appendingPathComponent("api/usage/summary")
        let (data, response) = try await session.data(from: url)
        guard let http = response as? HTTPURLResponse, http.statusCode == 200 else {
            throw APMClientError.badResponse
        }
        let wrapper = try decoder.decode(UsageSummaryResponse.self, from: data)
        return wrapper.summary
    }

    // MARK: - AgentLock Authorization (v7.0.0)

    func fetchAuthAuditEntries(limit: Int = 20) async throws -> [AuthAuditEntry] {
        var components = URLComponents(string: "\(baseURL.absoluteString)/api/v2/auth/audit")!
        components.queryItems = [URLQueryItem(name: "limit", value: String(limit))]
        let (data, response) = try await session.data(from: components.url!)
        guard let http = response as? HTTPURLResponse, http.statusCode == 200 else {
            throw APMClientError.badResponse
        }
        let wrapper = try decoder.decode(AuthAuditResponse.self, from: data)
        return wrapper.entries
    }

    func fetchAuthorizationSummary() async throws -> AuthorizationSummary {
        let url = baseURL.appendingPathComponent("api/v2/auth/summary")
        let (data, response) = try await session.data(from: url)
        guard let http = response as? HTTPURLResponse, http.statusCode == 200 else {
            throw APMClientError.badResponse
        }
        let wrapper = try decoder.decode(AuthorizationSummaryResponse.self, from: data)
        return wrapper.summary
    }

    // MARK: - AgentLock Pending Decisions (v7.0.0 W6)

    func fetchPendingDecisions() async throws -> [PendingDecision] {
        let url = baseURL.appendingPathComponent("api/v2/auth/pending")
        let (data, response) = try await session.data(from: url)
        guard let http = response as? HTTPURLResponse, http.statusCode == 200 else {
            throw APMClientError.badResponse
        }
        let wrapper = try decoder.decode(PendingDecisionsResponse.self, from: data)
        return wrapper.pending
    }

    func submitDecision(requestId: String, decision: String) async throws {
        var request = URLRequest(url: baseURL.appendingPathComponent("api/v2/auth/decide"))
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        let body: [String: String] = ["request_id": requestId, "decision": decision]
        request.httpBody = try JSONSerialization.data(withJSONObject: body)
        let (_, httpResponse) = try await session.data(for: request)
        guard let http = httpResponse as? HTTPURLResponse, (200...299).contains(http.statusCode) else {
            throw APMClientError.badResponse
        }
    }

    /// Create a time-limited auto-approval policy for a tool
    func createAutoApprovalPolicy(toolName: String, minutes: Int) async throws {
        var request = URLRequest(url: baseURL.appendingPathComponent("api/v2/auth/auto-approval-policies"))
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        let body: [String: Any] = [
            "allowed_tools": [toolName],
            "allowed_risk_levels": "all",
            "ttl_minutes": minutes,
            "created_by": "ccemhelper",
            "reason": "Allowed \(toolName) for \(minutes)min via macOS notification"
        ]
        request.httpBody = try JSONSerialization.data(withJSONObject: body)
        let (_, httpResponse) = try await session.data(for: request)
        guard let http = httpResponse as? HTTPURLResponse, (200...299).contains(http.statusCode) else {
            throw APMClientError.badResponse
        }
    }

    /// Create a permanent policy rule (always_allow or always_deny)
    func createPolicyRule(toolName: String, rule: String) async throws {
        var request = URLRequest(url: baseURL.appendingPathComponent("api/v2/auth/policy-rules"))
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        let body: [String: String] = ["tool_name": toolName, "rule": rule]
        request.httpBody = try JSONSerialization.data(withJSONObject: body)
        let (_, httpResponse) = try await session.data(for: request)
        guard let http = httpResponse as? HTTPURLResponse, (200...299).contains(http.statusCode) else {
            throw APMClientError.badResponse
        }
    }

    /// Fetch model capability limits from GET /api/usage/limits
    func fetchUsageLimits(project: String? = nil) async throws -> UsageLimitsResponse {
        var url = baseURL.appendingPathComponent("api/usage/limits")
        if let project = project {
            var components = URLComponents(url: url, resolvingAgainstBaseURL: false)!
            components.queryItems = [URLQueryItem(name: "project", value: project)]
            url = components.url!
        }
        let (data, response) = try await session.data(from: url)
        guard let http = response as? HTTPURLResponse, http.statusCode == 200 else {
            throw APMClientError.badResponse
        }
        return try decoder.decode(UsageLimitsResponse.self, from: data)
    }
}

enum APMClientError: Error, LocalizedError {
    case badResponse
    case decodingFailed

    var errorDescription: String? {
        switch self {
        case .badResponse: return "Bad response from APM server"
        case .decodingFailed: return "Failed to decode APM response"
        }
    }
}
