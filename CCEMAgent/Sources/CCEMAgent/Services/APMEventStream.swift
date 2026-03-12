import Foundation
import Combine

/// SSE event stream from CCEM APM AG-UI endpoint.
/// Uses URLSession bytes streaming with exponential backoff reconnection.
actor APMEventStream {
    private var task: Task<Void, Never>?
    private nonisolated let subject = PassthroughSubject<SSEEvent, Never>()
    private var reconnectDelay: TimeInterval = 2.0
    private let maxReconnectDelay: TimeInterval = 16.0
    private var isRunning = false

    /// Published event stream (subscribe from any context)
    nonisolated var events: AnyPublisher<SSEEvent, Never> {
        subject.eraseToAnyPublisher()
    }

    /// Start streaming SSE events from the given port
    func connect(port: Int = APMClient.defaultPort) {
        disconnect()
        isRunning = true
        reconnectDelay = 2.0

        task = Task { [weak self] in
            while let self = self, await self.isRunning {
                do {
                    try await self.stream(port: port)
                } catch {
                    guard await self.isRunning else { break }
                    let delay = await self.reconnectDelay
                    try? await Task.sleep(nanoseconds: UInt64(delay * 1_000_000_000))
                    await self.incrementBackoff()
                }
            }
        }
    }

    /// Stop streaming and cancel reconnection
    func disconnect() {
        isRunning = false
        task?.cancel()
        task = nil
        reconnectDelay = 2.0
    }

    /// Reconnect with a new port (no restart needed)
    func reconnect(port: Int) {
        disconnect()
        connect(port: port)
    }

    // MARK: - Private

    private func stream(port: Int) async throws {
        let url = URL(string: "http://localhost:\(port)/api/v2/ag-ui/events")!
        var request = URLRequest(url: url)
        request.setValue("text/event-stream", forHTTPHeaderField: "Accept")
        request.timeoutInterval = 300 // 5 min timeout for SSE

        let (bytes, response) = try await URLSession.shared.bytes(for: request)
        guard let http = response as? HTTPURLResponse, http.statusCode == 200 else {
            throw APMClientError.badResponse
        }

        // Reset backoff on successful connection
        reconnectDelay = 2.0
        subject.send(SSEEvent(type: "connected", data: "{}"))

        var eventType = ""
        var eventData = ""

        for try await line in bytes.lines {
            guard isRunning else { break }

            if line.hasPrefix("event:") {
                eventType = String(line.dropFirst(6)).trimmingCharacters(in: .whitespaces)
            } else if line.hasPrefix("data:") {
                eventData = String(line.dropFirst(5)).trimmingCharacters(in: .whitespaces)
            } else if line.isEmpty && !eventData.isEmpty {
                // End of event
                let type = eventType.isEmpty ? "message" : eventType
                subject.send(SSEEvent(type: type, data: eventData))
                eventType = ""
                eventData = ""
            }
            // Ignore comment lines (starting with :) — used as keepalives
        }
    }

    private func incrementBackoff() {
        reconnectDelay = min(reconnectDelay * 2, maxReconnectDelay)
    }
}

/// A single SSE event received from the AG-UI stream
struct SSEEvent: Identifiable {
    let id = UUID()
    let type: String
    let data: String
    let timestamp = Date()

    /// Parse the data field as JSON
    var json: [String: Any]? {
        guard let d = data.data(using: .utf8),
              let obj = try? JSONSerialization.jsonObject(with: d) as? [String: Any]
        else { return nil }
        return obj
    }

    /// Extract agent_id from the event data
    var agentId: String? {
        json?["agent_id"] as? String
    }

    /// Extract content from TEXT_MESSAGE_CONTENT events
    var content: String? {
        json?["content"] as? String
    }
}
