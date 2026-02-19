import SwiftUI

struct EnvironmentRow: View {
    let environment: APMEnvironment

    private static let relativeFormatter: RelativeDateTimeFormatter = {
        let formatter = RelativeDateTimeFormatter()
        formatter.unitsStyle = .abbreviated
        return formatter
    }()

    var body: some View {
        HStack(spacing: 8) {
            VStack(alignment: .leading, spacing: 2) {
                HStack(spacing: 4) {
                    Text(environment.name)
                        .font(.system(.body, design: .monospaced, weight: .medium))
                    DriftIndicator(status: environment.driftStatus)
                }

                HStack(spacing: 8) {
                    Label("\(environment.sessionCount)", systemImage: "terminal")
                    if let date = environment.lastActivity {
                        Text(Self.relativeFormatter.localizedString(for: date, relativeTo: .now))
                            .foregroundStyle(.secondary)
                    } else {
                        Text("No activity")
                            .foregroundStyle(.secondary)
                    }
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
