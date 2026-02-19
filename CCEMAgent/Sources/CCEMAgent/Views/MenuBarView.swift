import SwiftUI

struct MenuBarView: View {
    let monitor: EnvironmentMonitor
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
        .frame(width: 320)
    }

    // MARK: - Extracted Subviews

    private var headerSection: some View {
        HStack {
            Text("CCEM APM")
                .font(.system(.headline, design: .monospaced))
            Spacer()
            StatusIndicator(state: monitor.connectionState)
            Text(monitor.connectionState.label)
                .font(.caption)
                .foregroundStyle(.secondary)
        }
        .padding(.horizontal, 12)
        .padding(.vertical, 8)
    }

    @ViewBuilder
    private var contentSection: some View {
        if monitor.connectionState == .connected {
            if monitor.environments.isEmpty {
                Text("No active environments")
                    .font(.caption)
                    .foregroundStyle(.secondary)
                    .padding(.horizontal, 12)
                    .padding(.vertical, 8)
            } else {
                ScrollView {
                    LazyVStack(alignment: .leading, spacing: 0) {
                        ForEach(monitor.environments) { env in
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

    private var actionsSection: some View {
        VStack(spacing: 0) {
            Button(action: monitor.openDashboard) {
                Label("Open Dashboard", systemImage: "globe")
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
