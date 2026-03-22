import SwiftUI

struct StatusIndicator: View {
    let state: ConnectionState

    private var color: Color {
        switch state {
        case .connected: return .green
        case .disconnected: return .red
        case .connecting: return .yellow
        }
    }

    var body: some View {
        Circle()
            .fill(color)
            .frame(width: 8, height: 8)
            .overlay(
                Circle()
                    .stroke(color.opacity(0.4), lineWidth: 2)
            )
    }
}

struct DriftIndicator: View {
    let status: DriftStatus

    var body: some View {
        switch status {
        case .clean:
            Image(systemName: "checkmark.circle.fill")
                .foregroundStyle(.green)
                .font(.caption2)
        case .drifted:
            Image(systemName: "exclamationmark.triangle.fill")
                .foregroundStyle(.orange)
                .font(.caption2)
        case .unknown:
            Image(systemName: "questionmark.circle")
                .foregroundStyle(.secondary)
                .font(.caption2)
        }
    }
}
