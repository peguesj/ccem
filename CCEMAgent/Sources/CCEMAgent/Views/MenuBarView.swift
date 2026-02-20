import SwiftUI

struct MenuBarView: View {
    @Bindable var monitor: EnvironmentMonitor
    @Bindable var launchManager: LaunchManager

    var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            headerSection
            Divider()
            contentSection
            Divider()
            refreshLabel
            actionsSection
        }
        .frame(width: 340)
    }

    // MARK: - Extracted Subviews

    private var headerSection: some View {
        VStack(spacing: 6) {
            HStack {
                Text("CCEM APM")
                    .font(.system(.headline, design: .monospaced))
                Spacer()
                StatusIndicator(state: monitor.connectionState)
                Text(monitor.connectionState.label)
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }

            if monitor.connectionState == .connected {
                HStack(spacing: 12) {
                    Label("\(monitor.environments.count) projects", systemImage: "folder")
                    Label("\(monitor.activeCount) active", systemImage: "bolt.fill")
                        .foregroundStyle(.green)
                    Spacer()
                }
                .font(.caption2)
                .foregroundStyle(.secondary)

                if let upm = monitor.upmStatus, upm.active, let session = upm.session {
                    HStack(spacing: 6) {
                        Image(systemName: "waveform.path")
                            .foregroundStyle(.blue)
                        Text("UPM Wave \(session.currentWave)/\(session.totalWaves)")
                            .fontWeight(.medium)
                        Spacer()
                        Text(session.status)
                            .foregroundStyle(upmStatusColor(session.status))
                    }
                    .font(.caption2)

                    if let stories = session.stories, !stories.isEmpty {
                        let passed = stories.filter { $0.status == "passed" }.count
                        ProgressView(value: Double(passed), total: Double(stories.count))
                            .tint(.green)
                        Text("\(passed)/\(stories.count) stories passed")
                            .font(.caption2)
                            .foregroundStyle(.secondary)
                    }
                }
            }
        }
        .padding(.horizontal, 12)
        .padding(.vertical, 8)
    }

    @ViewBuilder
    private var contentSection: some View {
        if monitor.connectionState == .connected {
            // Filter picker
            Picker("Filter", selection: $monitor.filter) {
                ForEach(EnvironmentFilter.allCases, id: \.self) { filter in
                    Text(filter == .active ? "\(filter.rawValue) (\(monitor.activeCount))" : filter.rawValue)
                        .tag(filter)
                }
            }
            .pickerStyle(.segmented)
            .padding(.horizontal, 12)
            .padding(.vertical, 6)

            if monitor.filteredEnvironments.isEmpty {
                Text(monitor.filter == .active ? "No active sessions" : "No environments")
                    .font(.caption)
                    .foregroundStyle(.secondary)
                    .padding(.horizontal, 12)
                    .padding(.vertical, 8)
            } else {
                ScrollView {
                    LazyVStack(alignment: .leading, spacing: 0) {
                        ForEach(monitor.filteredEnvironments) { env in
                            EnvironmentRow(environment: env)
                                .padding(.horizontal, 12)
                                .padding(.vertical, 4)
                            Divider().padding(.leading, 12)
                        }
                    }
                }
                .frame(maxHeight: 300)
            }
        } else {
            disconnectedView
        }
    }

    private var disconnectedView: some View {
        VStack(spacing: 4) {
            Image(systemName: "network.slash")
                .font(.title2)
                .foregroundStyle(.secondary)
            Text("APM server not reachable")
                .font(.caption)
                .foregroundStyle(.secondary)
            if let error = monitor.lastError {
                Text(error)
                    .font(.caption2)
                    .foregroundStyle(.red)
                    .lineLimit(2)
            }
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 12)
    }

    @ViewBuilder
    private var refreshLabel: some View {
        if let lastRefresh = monitor.lastRefresh {
            Text("Updated \(lastRefresh, style: .relative) ago")
                .font(.caption2)
                .foregroundStyle(.tertiary)
                .padding(.horizontal, 12)
                .padding(.top, 4)
        }
    }

    private func upmStatusColor(_ status: String) -> Color {
        switch status {
        case "running": return .blue
        case "verifying": return .orange
        case "verified", "shipped": return .green
        default: return .secondary
        }
    }

    private var actionsSection: some View {
        VStack(spacing: 0) {
            Button(action: monitor.openDashboard) {
                Label("Open Dashboard", systemImage: "globe")
                    .frame(maxWidth: .infinity, alignment: .leading)
            }
            .buttonStyle(.plain)
            .padding(.horizontal, 12)
            .padding(.vertical, 6)

            Button(action: {
                NSWorkspace.shared.open(URL(string: "http://localhost:3031/docs")!)
            }) {
                Label("Help & Docs", systemImage: "book")
                    .frame(maxWidth: .infinity, alignment: .leading)
            }
            .buttonStyle(.plain)
            .padding(.horizontal, 12)
            .padding(.vertical, 6)

            Button {
                Task { await monitor.refresh() }
            } label: {
                Label("Refresh", systemImage: "arrow.clockwise")
                    .frame(maxWidth: .infinity, alignment: .leading)
            }
            .buttonStyle(.plain)
            .padding(.horizontal, 12)
            .padding(.vertical, 6)

            Toggle("Launch at Login", isOn: $launchManager.isLoginItemEnabled)
                .toggleStyle(.switch)
                .controlSize(.mini)
                .padding(.horizontal, 12)
                .padding(.vertical, 6)
                .onChange(of: launchManager.isLoginItemEnabled) {
                    launchManager.toggleLoginItem()
                }

            Divider()

            Button(role: .destructive) {
                NSApplication.shared.terminate(nil)
            } label: {
                Label("Quit CCEM Agent", systemImage: "xmark.circle")
                    .frame(maxWidth: .infinity, alignment: .leading)
            }
            .buttonStyle(.plain)
            .padding(.horizontal, 12)
            .padding(.vertical, 6)
        }
    }
}
