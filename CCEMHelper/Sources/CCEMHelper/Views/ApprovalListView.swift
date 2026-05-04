import SwiftUI

/// Renders pending AgentLock approval decisions as a grouped list.
/// When 5+ items are pending, shows a tabbed interface.
/// Supports keyboard shortcuts: Return to approve selected, Escape/D to deny.
struct ApprovalListView: View {
    let decisions: [PendingDecision]
    var onApprove: (String) -> Void = { _ in }
    var onDeny: (String) -> Void = { _ in }
    var onApproveAll: () -> Void = {}
    var onDenyAll: () -> Void = {}
    var onClose: () -> Void = {}

    @State private var selectedId: String?
    @State private var selectedTab: Int = 0

    private let pageSize = 5

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            // Header with count and bulk actions
            HStack {
                Text("\(decisions.count) Pending Approval\(decisions.count == 1 ? "" : "s")")
                    .font(.headline)
                Spacer()
                if decisions.count > 1 {
                    Button("Approve All") { onApproveAll() }
                        .buttonStyle(.borderedProminent)
                        .tint(.green)
                    Button("Deny All") { onDenyAll() }
                        .buttonStyle(.bordered)
                        .tint(.red)
                }
                Button(action: onClose) {
                    Image(systemName: "xmark.circle.fill")
                        .foregroundStyle(.secondary)
                }
                .buttonStyle(.plain)
            }
            .padding(.horizontal, 12)
            .padding(.top, 8)

            Divider()

            if decisions.count >= pageSize {
                // Tabbed view for 5+ items
                tabbedContent
            } else {
                // Simple list for < 5 items
                listContent(decisions)
            }
        }
        .frame(minWidth: 360, maxWidth: 420)
        .background(KeyboardResponder(
            onReturn: { approveSelected() },
            onEscape: { denySelected() },
            onD: { denySelected() }
        ))
    }

    // MARK: - Tabbed Content

    @ViewBuilder
    private var tabbedContent: some View {
        let pages = stride(from: 0, to: decisions.count, by: pageSize).map { start in
            Array(decisions[start..<min(start + pageSize, decisions.count)])
        }

        VStack(spacing: 4) {
            // Tab bar
            HStack(spacing: 4) {
                ForEach(0..<pages.count, id: \.self) { idx in
                    Button {
                        selectedTab = idx
                    } label: {
                        Text("Page \(idx + 1)")
                            .font(.caption)
                            .padding(.horizontal, 8)
                            .padding(.vertical, 4)
                            .background(selectedTab == idx ? Color.accentColor.opacity(0.2) : Color.clear)
                            .cornerRadius(4)
                    }
                    .buttonStyle(.plain)
                }
            }
            .padding(.horizontal, 12)

            if selectedTab < pages.count {
                listContent(pages[selectedTab])
            }
        }
    }

    // MARK: - List Content

    @ViewBuilder
    private func listContent(_ items: [PendingDecision]) -> some View {
        ScrollView {
            LazyVStack(spacing: 6) {
                ForEach(items) { decision in
                    ApprovalRow(
                        decision: decision,
                        isSelected: selectedId == decision.requestId,
                        onApprove: { onApprove(decision.requestId) },
                        onDeny: { onDeny(decision.requestId) }
                    )
                    .onTapGesture { selectedId = decision.requestId }
                }
            }
            .padding(.horizontal, 12)
            .padding(.bottom, 8)
        }
    }

    // MARK: - Keyboard Actions

    private func approveSelected() {
        if let id = selectedId {
            onApprove(id)
        } else if let first = decisions.first {
            onApprove(first.requestId)
        }
    }

    private func denySelected() {
        if let id = selectedId {
            onDeny(id)
        } else if let first = decisions.first {
            onDeny(first.requestId)
        }
    }
}

// MARK: - Approval Row

private struct ApprovalRow: View {
    let decision: PendingDecision
    let isSelected: Bool
    var onApprove: () -> Void
    var onDeny: () -> Void

    var body: some View {
        HStack(spacing: 8) {
            // Risk indicator
            Circle()
                .fill(riskColor)
                .frame(width: 8, height: 8)

            VStack(alignment: .leading, spacing: 2) {
                Text(decision.toolName)
                    .font(.system(.body, design: .monospaced))
                    .fontWeight(.medium)
                let agentLabel = decision.displayName ?? String(decision.agentId.suffix(8))
                Text("\(agentLabel) - \(decision.riskLevel) risk")
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }

            Spacer()

            Button(action: onApprove) {
                Image(systemName: "checkmark.circle.fill")
                    .foregroundStyle(.green)
            }
            .buttonStyle(.plain)
            .help("Approve (Return)")

            Button(action: onDeny) {
                Image(systemName: "xmark.circle.fill")
                    .foregroundStyle(.red)
            }
            .buttonStyle(.plain)
            .help("Deny (Esc or D)")
        }
        .padding(8)
        .background(isSelected ? Color.accentColor.opacity(0.1) : Color.clear)
        .cornerRadius(6)
        .overlay(
            RoundedRectangle(cornerRadius: 6)
                .stroke(isSelected ? Color.accentColor.opacity(0.3) : Color.clear, lineWidth: 1)
        )
    }

    private var riskColor: Color {
        switch decision.riskLevel {
        case "critical": return .red
        case "high": return .orange
        case "medium": return .yellow
        case "low": return .blue
        default: return .green
        }
    }
}

// MARK: - Keyboard Responder

/// NSViewRepresentable that captures key events for Return, Escape, and D keys.
struct KeyboardResponder: NSViewRepresentable {
    var onReturn: () -> Void
    var onEscape: () -> Void
    var onD: () -> Void

    func makeNSView(context: Context) -> KeyCaptureView {
        let view = KeyCaptureView()
        view.onReturn = onReturn
        view.onEscape = onEscape
        view.onD = onD
        return view
    }

    func updateNSView(_ nsView: KeyCaptureView, context: Context) {
        nsView.onReturn = onReturn
        nsView.onEscape = onEscape
        nsView.onD = onD
    }

    class KeyCaptureView: NSView {
        var onReturn: () -> Void = {}
        var onEscape: () -> Void = {}
        var onD: () -> Void = {}

        override var acceptsFirstResponder: Bool { true }

        override func keyDown(with event: NSEvent) {
            switch event.keyCode {
            case 36: // Return
                onReturn()
            case 53: // Escape
                onEscape()
            case 2 where event.modifierFlags.intersection(.deviceIndependentFlagsMask).isEmpty: // D key, no modifiers
                onD()
            default:
                super.keyDown(with: event)
            }
        }
    }
}
