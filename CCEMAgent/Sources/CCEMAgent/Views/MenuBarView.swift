import SwiftUI
import Charts

struct MenuBarView: View {
    @Bindable var monitor: EnvironmentMonitor
    @Bindable var launchManager: LaunchManager
    @Bindable var serverManager: APMServerManager

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

    // MARK: - Header

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
                    if let telemetry = monitor.agentTelemetry, telemetry.summary.activeNow > 0 {
                        Label("\(telemetry.summary.activeNow) agents", systemImage: "cpu")
                            .foregroundStyle(.orange)
                    }
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

    // MARK: - Content

    @ViewBuilder
    private var contentSection: some View {
        if monitor.connectionState == .connected {
            // Agent activity telemetry chart
            if let telemetry = monitor.agentTelemetry, !telemetry.dataPoints.isEmpty {
                telemetrySection(telemetry)
                Divider()
            }

            // Environment filter + list
            Picker("Filter", selection: $monitor.filter) {
                ForEach(EnvironmentFilter.allCases, id: \.self) { f in
                    Text(f == .active ? "\(f.rawValue) (\(monitor.activeCount))" : f.rawValue)
                        .tag(f)
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
                .frame(maxHeight: 240)
            }
        } else {
            disconnectedView
        }
    }

    // MARK: - Telemetry Chart

    @ViewBuilder
    private func telemetrySection(_ telemetry: TelemetryResponse) -> some View {
        VStack(alignment: .leading, spacing: 4) {
            HStack {
                Text("Agent Activity")
                    .font(.caption2)
                    .fontWeight(.medium)
                    .foregroundStyle(.secondary)
                Spacer()
                Text("last hour")
                    .font(.caption2)
                    .foregroundStyle(.tertiary)
            }
            .padding(.horizontal, 12)
            .padding(.top, 6)

            Chart(telemetry.dataPoints) { point in
                AreaMark(
                    x: .value("Time", point.date),
                    y: .value("Started", point.started)
                )
                .foregroundStyle(Color.blue.opacity(0.12))
                .interpolationMethod(.catmullRom)

                LineMark(
                    x: .value("Time", point.date),
                    y: .value("Started", point.started)
                )
                .foregroundStyle(Color.blue.opacity(0.8))
                .interpolationMethod(.catmullRom)
                .lineStyle(StrokeStyle(lineWidth: 1.5))

                LineMark(
                    x: .value("Time", point.date),
                    y: .value("Completed", point.completed)
                )
                .foregroundStyle(Color.green.opacity(0.9))
                .interpolationMethod(.catmullRom)
                .lineStyle(StrokeStyle(lineWidth: 1.5))
            }
            .chartXAxis(.hidden)
            .chartYAxis(.hidden)
            .chartLegend(.hidden)
            .frame(height: 48)
            .padding(.horizontal, 12)

            HStack(spacing: 10) {
                HStack(spacing: 3) {
                    Circle().fill(Color.blue).frame(width: 6, height: 6)
                    Text("\(telemetry.summary.totalStarted) started")
                }
                HStack(spacing: 3) {
                    Circle().fill(Color.green).frame(width: 6, height: 6)
                    Text("\(telemetry.summary.totalCompleted) completed")
                }
                if telemetry.summary.totalFailed > 0 {
                    HStack(spacing: 3) {
                        Circle().fill(Color.red).frame(width: 6, height: 6)
                        Text("\(telemetry.summary.totalFailed) failed")
                    }
                    .foregroundStyle(.red)
                }
                Spacer()
                if telemetry.summary.activeNow > 0 {
                    Text("●  \(telemetry.summary.activeNow) running")
                        .foregroundStyle(.orange)
                }
            }
            .font(.caption2)
            .foregroundStyle(.secondary)
            .padding(.horizontal, 12)
            .padding(.bottom, 6)
        }
    }

    // MARK: - Disconnected

    private var disconnectedView: some View {
        VStack(spacing: 8) {
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
                    .multilineTextAlignment(.center)
            }

            Button {
                Task { await serverManager.startAPM() }
            } label: {
                if serverManager.isStarting {
                    Label("Starting APM…", systemImage: "arrow.clockwise")
                } else {
                    Label("Start APM Server", systemImage: "play.circle.fill")
                }
            }
            .buttonStyle(.borderedProminent)
            .controlSize(.small)
            .disabled(serverManager.isStarting)

            if let err = serverManager.lastError {
                Text(err)
                    .font(.caption2)
                    .foregroundStyle(.orange)
                    .lineLimit(2)
                    .multilineTextAlignment(.center)
            }
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 16)
        .padding(.horizontal, 12)
    }

    // MARK: - Refresh Label

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

    // MARK: - Actions

    private var actionsSection: some View {
        VStack(spacing: 0) {
            Button(action: { APMWindowManager.shared.openDashboard() }) {
                Label("Open Dashboard", systemImage: "globe")
                    .frame(maxWidth: .infinity, alignment: .leading)
            }
            .buttonStyle(.plain)
            .padding(.horizontal, 12)
            .padding(.vertical, 6)

            Button(action: { APMWindowManager.shared.openDocs() }) {
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

            Divider()

            // APM Server start/stop
            if serverManager.isRunning || monitor.connectionState == .connected {
                Button {
                    Task { await serverManager.stopAPM() }
                } label: {
                    if serverManager.isStopping {
                        Label("Stopping APM…", systemImage: "stop.circle")
                            .frame(maxWidth: .infinity, alignment: .leading)
                    } else {
                        Label("Stop APM Server", systemImage: "stop.circle")
                            .frame(maxWidth: .infinity, alignment: .leading)
                    }
                }
                .buttonStyle(.plain)
                .foregroundStyle(.red)
                .disabled(serverManager.isStopping)
                .padding(.horizontal, 12)
                .padding(.vertical, 6)
            } else {
                Button {
                    Task { await serverManager.startAPM() }
                } label: {
                    if serverManager.isStarting {
                        Label("Starting APM…", systemImage: "play.circle")
                            .frame(maxWidth: .infinity, alignment: .leading)
                    } else {
                        Label("Start APM Server", systemImage: "play.circle.fill")
                            .frame(maxWidth: .infinity, alignment: .leading)
                    }
                }
                .buttonStyle(.plain)
                .foregroundStyle(.green)
                .disabled(serverManager.isStarting)
                .padding(.horizontal, 12)
                .padding(.vertical, 6)
            }

            Divider()

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

    // MARK: - Helpers

    private func upmStatusColor(_ status: String) -> Color {
        switch status {
        case "running": return .blue
        case "verifying": return .orange
        case "verified", "shipped": return .green
        default: return .secondary
        }
    }
}
