import SwiftUI
import Charts

struct MenuBarView: View {
    @Bindable var monitor: EnvironmentMonitor
    @Bindable var launchManager: LaunchManager
    @Bindable var serverManager: APMServerManager
    @Bindable var formationMonitor: FormationMonitor
    @Bindable var upmMonitor: UPMMonitor

    var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            headerSection
            Divider()
            contentSection
            if !formationMonitor.activeFormations.isEmpty {
                Divider()
                formationSection
            }
            let runningTasks = monitor.backgroundTasks.filter { $0.status == "running" }
            if !runningTasks.isEmpty {
                Divider()
                backgroundTasksSection(runningTasks)
            }
            if upmMonitor.projectCount > 0 || upmMonitor.driftedCount > 0 {
                Divider()
                upmSection
            }
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
                if let version = monitor.healthStatus?.serverVersion {
                    Text("v\(version)")
                        .font(.caption2)
                        .foregroundStyle(.tertiary)
                }
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
                Label("Agent Activity", systemImage: "chart.line.uptrend.xyaxis")
                    .font(.caption2)
                    .fontWeight(.medium)
                    .foregroundStyle(.secondary)
                Spacer()
                Text("last 24h")
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

    // MARK: - Formation Monitor Section

    private var formationSection: some View {
        VStack(alignment: .leading, spacing: 4) {
            HStack {
                Label("Formations", systemImage: "square.grid.3x3")
                    .font(.caption2)
                    .fontWeight(.medium)
                    .foregroundStyle(.secondary)
                Spacer()
                if formationMonitor.pendingRestart {
                    Label("Restarting APM…", systemImage: "arrow.clockwise")
                        .font(.caption2)
                        .foregroundStyle(.orange)
                } else if formationMonitor.pendingRebuild {
                    Label("Rebuilding Agent…", systemImage: "hammer")
                        .font(.caption2)
                        .foregroundStyle(.orange)
                }
            }
            .padding(.horizontal, 12)
            .padding(.top, 6)

            ForEach(formationMonitor.activeFormations) { formation in
                HStack(spacing: 6) {
                    formationStatusDot(formation.status)
                    Text(formation.id)
                        .font(.caption2)
                        .fontWeight(.medium)
                        .lineLimit(1)
                    Spacer()
                    Text(formation.status)
                        .font(.caption2)
                        .foregroundStyle(formationStatusColor(formation.status))
                }
                .padding(.horizontal, 12)
                .padding(.vertical, 2)
            }

            if let action = formationMonitor.lastLifecycleAction {
                Text(action)
                    .font(.caption2)
                    .foregroundStyle(.secondary)
                    .padding(.horizontal, 12)
                    .padding(.bottom, 4)
                    .lineLimit(1)
            }
        }
        .padding(.bottom, 4)
    }

    @ViewBuilder
    private func formationStatusDot(_ status: String) -> some View {
        Circle()
            .fill(formationStatusColor(status))
            .frame(width: 6, height: 6)
    }

    private func formationStatusColor(_ status: String) -> Color {
        switch status {
        case "complete", "done", "shipped": return .green
        case "active", "running", "registered": return .blue
        case "failed", "error": return .red
        case "pending", "queued": return .secondary
        default: return .secondary
        }
    }

    // MARK: - UPM Section

    private var upmSection: some View {
        VStack(alignment: .leading, spacing: 4) {
            HStack {
                Label("UPM", systemImage: "cylinder.split.1x2")
                    .font(.caption2)
                    .fontWeight(.medium)
                    .foregroundStyle(.secondary)
                Spacer()
                if let lastPoll = upmMonitor.lastPollAt {
                    HStack(spacing: 2) {
                        Text("Last sync:")
                            .foregroundStyle(.tertiary)
                        Text(lastPoll, style: .relative)
                            .foregroundStyle(.tertiary)
                    }
                    .font(.caption2)
                }
            }
            .padding(.horizontal, 12)
            .padding(.top, 6)

            HStack(spacing: 12) {
                HStack(spacing: 4) {
                    Image(systemName: "folder")
                        .foregroundStyle(.secondary)
                    Text("\(upmMonitor.projectCount) projects")
                }
                HStack(spacing: 4) {
                    Image(systemName: "checkmark.circle")
                        .foregroundStyle(.green)
                    Text("\(upmMonitor.syncedCount) synced")
                }
                if upmMonitor.driftedCount > 0 {
                    HStack(spacing: 4) {
                        Image(systemName: "exclamationmark.triangle")
                            .foregroundStyle(.orange)
                        Text("\(upmMonitor.driftedCount) drifted")
                    }
                    .foregroundStyle(.orange)
                }
                Spacer()
            }
            .font(.caption2)
            .foregroundStyle(.secondary)
            .padding(.horizontal, 12)

            // Recent syncs (last 3)
            ForEach(Array(upmMonitor.recentSyncs.prefix(3)), id: \.projectId) { result in
                HStack(spacing: 6) {
                    Circle()
                        .fill(result.errors.isEmpty ? Color.green : Color.orange)
                        .frame(width: 5, height: 5)
                    Text(result.projectId)
                        .font(.caption2)
                        .lineLimit(1)
                        .truncationMode(.middle)
                    Spacer()
                    Text("\(result.syncedCount) items")
                        .font(.caption2)
                        .foregroundStyle(.secondary)
                }
                .padding(.horizontal, 12)
                .padding(.vertical, 1)
            }

            if let error = upmMonitor.error {
                Text(error)
                    .font(.caption2)
                    .foregroundStyle(.red)
                    .lineLimit(1)
                    .padding(.horizontal, 12)
            }
        }
        .padding(.bottom, 6)
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

            Button(action: { APMWindowManager.shared.openDashboard(path: "/upm") }) {
                Label("Open UPM", systemImage: "cylinder.split.1x2")
                    .frame(maxWidth: .infinity, alignment: .leading)
            }
            .buttonStyle(.plain)
            .padding(.horizontal, 12)
            .padding(.vertical, 6)

            Button {
                Task {
                    try? await APMClient().triggerUPMSync()
                    await upmMonitor.refresh()
                }
            } label: {
                Label("Sync All Projects", systemImage: "arrow.triangle.2.circlepath")
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

            // Docker Socket Repair
            dockerSocketItem

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

    // MARK: - Docker Socket

    @State private var dockerStatus: DockerSocketStatus = .ok
    @State private var isRepairingDocker = false

    private var dockerSocketItem: some View {
        Group {
            if dockerStatus == .ok {
                Label("Docker: OK", systemImage: "checkmark.circle")
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .foregroundStyle(.secondary)
                    .padding(.horizontal, 12)
                    .padding(.vertical, 6)
            } else {
                Button {
                    isRepairingDocker = true
                    Task {
                        let success = await DockerSocketRepair.repair()
                        dockerStatus = success ? .ok : DockerSocketRepair.status()
                        isRepairingDocker = false
                    }
                } label: {
                    if isRepairingDocker {
                        Label("Repairing Docker…", systemImage: "wrench.and.screwdriver")
                            .frame(maxWidth: .infinity, alignment: .leading)
                    } else {
                        Label("Repair Docker Socket", systemImage: "wrench.and.screwdriver")
                            .frame(maxWidth: .infinity, alignment: .leading)
                    }
                }
                .buttonStyle(.plain)
                .foregroundStyle(.orange)
                .disabled(isRepairingDocker)
                .padding(.horizontal, 12)
                .padding(.vertical, 6)
            }
        }
        .onAppear { dockerStatus = DockerSocketRepair.status() }
    }

    // MARK: - Background Tasks Section

    @ViewBuilder
    private func backgroundTasksSection(_ tasks: [BackgroundTask]) -> some View {
        VStack(alignment: .leading, spacing: 4) {
            HStack {
                Label("Background Tasks", systemImage: "gearshape.2")
                    .font(.caption2)
                    .fontWeight(.medium)
                    .foregroundStyle(.secondary)
                Spacer()
                Text("\(tasks.count) running")
                    .font(.caption2)
                    .foregroundStyle(.orange)
            }
            .padding(.horizontal, 12)
            .padding(.top, 6)

            ForEach(tasks.prefix(5)) { task in
                HStack(spacing: 6) {
                    Circle()
                        .fill(Color.blue)
                        .frame(width: 5, height: 5)
                    VStack(alignment: .leading, spacing: 1) {
                        Text(task.agentName ?? task.label)
                            .font(.caption2)
                            .fontWeight(.medium)
                            .lineLimit(1)
                        if let definition = task.agentDefinition {
                            Text(definition)
                                .font(.caption2)
                                .foregroundStyle(.secondary)
                                .lineLimit(1)
                        }
                    }
                    Spacer()
                    if let ms = task.runtimeMs {
                        Text(formatRuntime(ms))
                            .font(.caption2)
                            .foregroundStyle(.secondary)
                            .monospacedDigit()
                    }
                }
                .padding(.horizontal, 12)
                .padding(.vertical, 2)
            }
        }
        .padding(.bottom, 4)
    }

    // MARK: - Helpers

    private func formatRuntime(_ ms: Int) -> String {
        if ms < 1000 { return "\(ms)ms" }
        let seconds = ms / 1000
        if seconds < 60 { return "\(seconds)s" }
        let minutes = seconds / 60
        let remaining = seconds % 60
        return remaining == 0 ? "\(minutes)m" : "\(minutes)m \(remaining)s"
    }

    private func upmStatusColor(_ status: String) -> Color {
        switch status {
        case "running": return .blue
        case "verifying": return .orange
        case "verified", "shipped": return .green
        default: return .secondary
        }
    }
}
