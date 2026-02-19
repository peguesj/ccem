import Foundation

actor APMClient {
    private let baseURL = URL(string: "http://localhost:3031")!
    private let session: URLSession
    private let decoder: JSONDecoder

    init() {
        let config = URLSessionConfiguration.default
        config.timeoutIntervalForRequest = 5
        config.timeoutIntervalForResource = 10
        self.session = URLSession(configuration: config)
        self.decoder = JSONDecoder()
    }

    func checkHealth() async throws -> HealthStatus {
        let url = baseURL.appendingPathComponent("health")
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

    func fetchData() async throws -> APMDataResponse {
        let url = baseURL.appendingPathComponent("api/data")
        let (data, response) = try await session.data(from: url)
        guard let http = response as? HTTPURLResponse, http.statusCode == 200 else {
            throw APMClientError.badResponse
        }
        return try decoder.decode(APMDataResponse.self, from: data)
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
