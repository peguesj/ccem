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

    /// Build a base URL safely from a (possibly corrupt) host string and port.
    /// Sanitizes whitespace, rejects empty hosts, and falls back to the
    /// hardcoded `localhost:3032` literal on any parse failure. This is the
    /// single point of URL construction for the client — previously, a bad
    /// UserDefault (e.g. `"resume "` with trailing space) made `URL(string:)`
    /// return nil under macOS 15's strict RFC 3986 parser and crashed init.
    private static func buildBaseURL(host: String, port: Int) -> URL {
        var components = URLComponents()
        components.scheme = "http"
        let cleanHost = host.trimmingCharacters(in: .whitespacesAndNewlines)
        components.host = cleanHost.isEmpty ? Self.defaultHost : cleanHost
        components.port = port
        if let url = components.url {
            return url
        }
        // Last-resort literal fallback — guaranteed valid at compile time.
        return URL(string: "http://\(Self.defaultHost):\(Self.defaultPort)")!
    }

    init(port: Int? = nil) {
        let resolvedPort = port ?? UserDefaults.standard.integer(forKey: Self.portKey)
        let effectivePort = resolvedPort > 0 ? resolvedPort : Self.defaultPort
        let host = UserDefaults.standard.string(forKey: Self.hostKey) ?? Self.defaultHost
        self.baseURL = Self.buildBaseURL(host: host, port: effectivePort)
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
        self.baseURL = Self.buildBaseURL(host: host, port: port)
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

    // MARK: - Approvals (v9.2.0)

    /// Fetch pending approvals from GET /api/v2/approvals?status=pending
    func fetchPendingDecisions() async throws -> [PendingDecision] {
        var components = URLComponents(string: "\(baseURL.absoluteString)/api/v2/approvals")!
        components.queryItems = [URLQueryItem(name: "status", value: "pending")]
        let (data, response) = try await session.data(from: components.url!)
        guard let http = response as? HTTPURLResponse, http.statusCode == 200 else {
            throw APMClientError.badResponse
        }
        let wrapper = try decoder.decode(PendingDecisionsResponse.self, from: data)
        return wrapper.approvals.filter { $0.isPending }
    }

    /// Approve a pending gate via POST /api/v2/approvals/{gate_id}/approve
    func approveDecision(gateId: String) async throws {
        let url = baseURL.appendingPathComponent("api/v2/approvals/\(gateId)/approve")
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.httpBody = "{}".data(using: .utf8)
        let (_, httpResponse) = try await session.data(for: request)
        guard let http = httpResponse as? HTTPURLResponse, (200...299).contains(http.statusCode) else {
            if let http = httpResponse as? HTTPURLResponse, http.statusCode == 404 {
                throw APMClientError.decisionExpired
            }
            throw APMClientError.badResponse
        }
    }

    /// Reject a pending gate via POST /api/v2/approvals/{gate_id}/reject
    func rejectDecision(gateId: String, reason: String? = nil) async throws {
        let url = baseURL.appendingPathComponent("api/v2/approvals/\(gateId)/reject")
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        var body: [String: Any] = [:]
        if let reason { body["reason"] = reason }
        request.httpBody = try JSONSerialization.data(withJSONObject: body)
        let (_, httpResponse) = try await session.data(for: request)
        guard let http = httpResponse as? HTTPURLResponse, (200...299).contains(http.statusCode) else {
            if let http = httpResponse as? HTTPURLResponse, http.statusCode == 404 {
                throw APMClientError.decisionExpired
            }
            throw APMClientError.badResponse
        }
    }

    /// Legacy shim — routes approve/deny by decision string to v9.2.0 endpoints.
    /// Call sites that previously used submitDecision(requestId:decision:) can migrate gradually.
    func submitDecision(requestId: String, decision: String) async throws {
        if decision == "approve" {
            try await approveDecision(gateId: requestId)
        } else {
            try await rejectDecision(gateId: requestId)
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
    /// The approval gate was not found — expired or already decided.
    case decisionExpired

    var errorDescription: String? {
        switch self {
        case .badResponse: return "Bad response from APM server"
        case .decodingFailed: return "Failed to decode APM response"
        case .decisionExpired: return "Approval decision expired or already decided"
        }
    }
}
