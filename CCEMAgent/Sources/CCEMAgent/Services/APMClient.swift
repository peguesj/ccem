import Foundation

actor APMClient {
    private var baseURL: URL
    private let session: URLSession
    private let decoder: JSONDecoder

    static let portKey = "apmPort"
    static let defaultPort = 3032

    var currentPort: Int {
        Int(baseURL.port ?? Self.defaultPort)
    }

    init(port: Int? = nil) {
        let resolvedPort = port ?? UserDefaults.standard.integer(forKey: Self.portKey)
        let effectivePort = resolvedPort > 0 ? resolvedPort : Self.defaultPort
        self.baseURL = URL(string: "http://localhost:\(effectivePort)")!
        let config = URLSessionConfiguration.default
        config.timeoutIntervalForRequest = 5
        config.timeoutIntervalForResource = 10
        self.session = URLSession(configuration: config)
        self.decoder = JSONDecoder()
    }

    /// Update the port without restarting the client
    func updatePort(_ port: Int) {
        UserDefaults.standard.set(port, forKey: Self.portKey)
        self.baseURL = URL(string: "http://localhost:\(port)")!
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
