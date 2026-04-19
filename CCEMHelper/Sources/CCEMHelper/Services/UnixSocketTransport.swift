//
//  UnixSocketTransport.swift
//  CCEMHelper
//
//  Native IPC transport over a Unix Domain Socket. Connects to
//  /tmp/ccem-apm.sock, exchanges length-prefixed ETF-encoded frames,
//  and exposes incoming frames as an AsyncStream for structured
//  concurrency consumers.
//
//  Counterpart: ApmV5.NativeTransport.UnixSocket (Elixir).
//

import Foundation
import Network
import os.log

/// An opaque wire frame. The payload is the raw ETF bytes; the Elixir
/// server encodes with `:erlang.term_to_binary/2` (compressed). Swift
/// consumers decode via the `ETFDecoder` helper below (minimal, read-only).
public struct TransportFrame: Sendable {
    public let payload: Data
    public let receivedAt: Date

    public init(payload: Data, receivedAt: Date = Date()) {
        self.payload = payload
        self.receivedAt = receivedAt
    }
}

public enum TransportError: Error, Sendable {
    case notConnected
    case connectionFailed(String)
    case sendFailed(String)
    case frameTooLarge(Int)
    case unexpectedEOF
}

/// Actor-isolated NWConnection wrapper. All socket mutation goes
/// through this actor; the only concurrent surface is the AsyncStream
/// continuation and the public async API.
public actor UnixSocketTransport {
    public static let defaultSocketPath = "/tmp/ccem-apm.sock"
    private static let maxFrameBytes = 16 * 1024 * 1024  // 16MB hard cap

    private let socketPath: String
    private let logger = Logger(subsystem: "io.pegues.ccem.helper", category: "UnixSocketTransport")
    private var connection: NWConnection?
    private var frameContinuation: AsyncStream<TransportFrame>.Continuation?
    public nonisolated let frames: AsyncStream<TransportFrame>
    private let framesSetter: AsyncStream<TransportFrame>.Continuation

    public init(socketPath: String = UnixSocketTransport.defaultSocketPath) {
        self.socketPath = socketPath
        var cont: AsyncStream<TransportFrame>.Continuation!
        self.frames = AsyncStream { cont = $0 }
        self.framesSetter = cont
    }

    /// Establish the UDS connection. Throws on failure.
    public func connect() async throws {
        if connection != nil { return }

        let endpoint = NWEndpoint.unix(path: socketPath)
        let params = NWParameters.tcp
        params.defaultProtocolStack.transportProtocol = NWProtocolTCP.Options()
        let conn = NWConnection(to: endpoint, using: params)
        self.connection = conn

        try await withCheckedThrowingContinuation { (continuation: CheckedContinuation<Void, Error>) in
            conn.stateUpdateHandler = { [weak self] state in
                switch state {
                case .ready:
                    continuation.resume()
                    Task { await self?.startReadLoop() }
                case .failed(let err):
                    continuation.resume(throwing: TransportError.connectionFailed("\(err)"))
                case .cancelled:
                    self?.framesSetterFinish()
                default:
                    break
                }
            }
            conn.start(queue: .global(qos: .userInitiated))
        }

        self.frameContinuation = framesSetter
        logger.info("UDS connected at \(self.socketPath, privacy: .public)")
    }

    /// Frame and send an ETF-encoded payload. Caller is responsible for
    /// producing valid ETF bytes (use `ETFEncoder.minimal` helpers).
    public func send(_ payload: Data) async throws {
        guard let conn = connection else { throw TransportError.notConnected }
        guard payload.count <= Self.maxFrameBytes else {
            throw TransportError.frameTooLarge(payload.count)
        }

        var header = Data(count: 4)
        let size = UInt32(payload.count).bigEndian
        header.withUnsafeMutableBytes { buf in
            buf.storeBytes(of: size, as: UInt32.self)
        }
        let frame = header + payload

        try await withCheckedThrowingContinuation { (continuation: CheckedContinuation<Void, Error>) in
            conn.send(content: frame, completion: .contentProcessed { err in
                if let err = err {
                    continuation.resume(throwing: TransportError.sendFailed("\(err)"))
                } else {
                    continuation.resume()
                }
            })
        }
    }

    /// Disconnect and finish the frames stream.
    public func disconnect() {
        connection?.cancel()
        connection = nil
        framesSetterFinish()
    }

    // MARK: - Private

    private func startReadLoop() {
        guard let conn = connection else { return }
        readHeader(conn)
    }

    private nonisolated func framesSetterFinish() {
        framesSetter.finish()
    }

    private func readHeader(_ conn: NWConnection) {
        conn.receive(minimumIncompleteLength: 4, maximumLength: 4) { [weak self] data, _, isComplete, error in
            guard let self = self else { return }
            if let error = error {
                Task { await self.logReadError(error) }
                return
            }
            guard let data = data, data.count == 4 else {
                if isComplete {
                    Task { await self.handleEOF() }
                }
                return
            }
            let size = data.withUnsafeBytes { $0.load(as: UInt32.self) }.bigEndian
            if size > UInt32(Self.maxFrameBytes) {
                Task { await self.logBadSize(Int(size)) }
                return
            }
            Task { await self.readPayload(conn, size: Int(size)) }
        }
    }

    private func readPayload(_ conn: NWConnection, size: Int) {
        conn.receive(minimumIncompleteLength: size, maximumLength: size) { [weak self] data, _, _, error in
            guard let self = self else { return }
            if let error = error {
                Task { await self.logReadError(error) }
                return
            }
            guard let data = data, data.count == size else {
                Task { await self.handleEOF() }
                return
            }
            Task { await self.yieldFrame(TransportFrame(payload: data)); await self.readHeader(conn) }
        }
    }

    private func yieldFrame(_ frame: TransportFrame) {
        framesSetter.yield(frame)
    }

    private func logReadError(_ error: Error) {
        logger.error("UDS read error: \(String(describing: error), privacy: .public)")
        framesSetterFinish()
    }

    private func logBadSize(_ size: Int) {
        logger.error("UDS frame exceeds max: \(size)")
        framesSetterFinish()
    }

    private func handleEOF() {
        logger.info("UDS EOF")
        framesSetterFinish()
    }
}

// MARK: - Minimal ETF encoding helpers

/// Minimal External Term Format encoder for the small set of shapes
/// CCEMHelper needs to send (atoms, tuples, maps with string keys, ints).
/// This is intentionally narrow: most payloads flow server -> client.
public enum ETFEncoder {
    /// ETF version header
    public static let versionByte: UInt8 = 131

    public static func ping(ref: String) -> Data {
        // {:ping, "<ref>"} as a 2-tuple of small_atom + binary
        var out = Data([versionByte])
        out.append(104)  // SMALL_TUPLE_EXT
        out.append(2)    // arity
        out.append(encodeAtom("ping"))
        out.append(encodeBinary(ref))
        return out
    }

    public static func hello(version: String) -> Data {
        // {:hello, %{version: "X"}}
        var out = Data([versionByte])
        out.append(104)
        out.append(2)
        out.append(encodeAtom("hello"))
        // MAP_EXT: tag 116, 4-byte arity
        out.append(116)
        var arity = UInt32(1).bigEndian
        out.append(Data(bytes: &arity, count: 4))
        out.append(encodeAtom("version"))
        out.append(encodeBinary(version))
        return out
    }

    private static func encodeAtom(_ s: String) -> Data {
        // SMALL_ATOM_UTF8_EXT tag 119
        let bytes = Array(s.utf8)
        var out = Data([119, UInt8(bytes.count)])
        out.append(contentsOf: bytes)
        return out
    }

    private static func encodeBinary(_ s: String) -> Data {
        // BINARY_EXT tag 109, 4-byte length
        let bytes = Array(s.utf8)
        var out = Data([109])
        var len = UInt32(bytes.count).bigEndian
        out.append(Data(bytes: &len, count: 4))
        out.append(contentsOf: bytes)
        return out
    }
}
