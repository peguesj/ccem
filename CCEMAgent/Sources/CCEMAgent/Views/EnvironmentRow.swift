import SwiftUI

struct EnvironmentRow: View {
    let environment: APMEnvironment

    var body: some View {
        HStack(spacing: 8) {
            Circle()
                .fill(environment.isActive ? .green : .gray.opacity(0.4))
                .frame(width: 6, height: 6)

            VStack(alignment: .leading, spacing: 2) {
                HStack(spacing: 4) {
                    Text(environment.name)
                        .font(.system(.body, design: .monospaced, weight: .medium))
                    DriftIndicator(status: environment.driftStatus)
                }

                HStack(spacing: 8) {
                    Label("\(environment.sessionCount) sessions", systemImage: "terminal")
                    Label("\(environment.agentCount) agents", systemImage: "cpu")
                }
                .font(.caption)
                .foregroundStyle(.secondary)
            }

            Spacer()

            if case .drifted(let reason) = environment.driftStatus {
                Text(reason)
                    .font(.caption2)
                    .foregroundStyle(.orange)
                    .lineLimit(1)
            }
        }
        .padding(.vertical, 2)
    }
}
