import Foundation
import UserNotifications
import AppKit
import Observation

// MARK: - APMNotificationReceiver

/// Handles UNUserNotificationCenter delegation so that clicking a macOS
/// notification from CCEM APM opens the in-app dashboard window.
///
/// Notification polling and posting is handled by EnvironmentMonitor.
/// This service registers as the UNUserNotificationCenter delegate and
/// routes notification responses (tap/click) to APMWindowManager.
@MainActor
@Observable
final class APMNotificationReceiver: NSObject {

    // MARK: - Observable state

    /// Whether the user has granted notification permission.
    var permissionGranted = false

    // MARK: - Lifecycle

    func start() {
        // Delegate is already set in CCEMHelperApp.init() — setting it again here is a no-op
        // but kept as a safety guard in case start() is ever called in isolation.
        // The delegate assignment in init() is what matters for early banner delivery.
        Task { await requestPermission() }
    }

    // MARK: - Permission

    func requestPermission() async {
        do {
            let granted = try await UNUserNotificationCenter.current()
                .requestAuthorization(options: [.alert, .sound, .badge])
            permissionGranted = granted
        } catch {
            print("[APMNotificationReceiver] Permission request failed: \(error.localizedDescription)")
        }
    }
}

// MARK: - UNUserNotificationCenterDelegate

extension APMNotificationReceiver: UNUserNotificationCenterDelegate {

    /// Allow notifications to appear even when the app is in the foreground (menubar is active).
    /// For MenuBarExtra apps on macOS, we return both .banner (for toast) and .list (for Notification Center).
    nonisolated func userNotificationCenter(
        _ center: UNUserNotificationCenter,
        willPresent notification: UNNotification,
        withCompletionHandler completionHandler: @escaping (UNNotificationPresentationOptions) -> Void
    ) {
        // .banner = macOS toast notification
        // .list = appears in Notification Center (top-right corner on macOS)
        // .sound = audio alert
        completionHandler([.banner, .list, .sound])
    }

    /// Called when the user interacts with a delivered notification.
    /// Handles approval approve/reject actions mapped to v9.2.0 endpoints.
    /// All other taps open the /govern/approvals tab.
    nonisolated func userNotificationCenter(
        _ center: UNUserNotificationCenter,
        didReceive response: UNNotificationResponse,
        withCompletionHandler completionHandler: @escaping () -> Void
    ) {
        let actionId = response.actionIdentifier
        let userInfo = response.notification.request.content.userInfo

        let prefix = "io.pegues.agent-j.labs.ccem.helper.agentlock."
        let restartId = "io.pegues.agent-j.labs.ccem.helper.restart.now"
        let notificationType = userInfo["type"] as? String

        // Handle grouped approve-all / deny-all actions (v9.2.0: gate_id based)
        if notificationType == "agentlock_grouped_pending",
           let pendingIds = userInfo["pending_ids"] as? [String],
           actionId.hasPrefix(prefix) {
            let action = String(actionId.dropFirst(prefix.count))
            let isApprove = !(action == "deny_all" || action == "deny")
            Task {
                let apmClient = APMClient()
                for gateId in pendingIds {
                    do {
                        if isApprove {
                            try await apmClient.approveDecision(gateId: gateId)
                        } else {
                            try await apmClient.rejectDecision(gateId: gateId)
                        }
                    } catch APMClientError.decisionExpired {
                        // Already decided or timed out — safe to skip
                        print("[CCEMHelper] Gate \(gateId) already decided or expired")
                    } catch {
                        print("[CCEMHelper] Gate decision error: \(error.localizedDescription)")
                    }
                }
                await MainActor.run {
                    APMWindowManager.shared.openDashboard(path: "/govern/approvals")
                }
            }
            completionHandler()
            return
        }

        // Accept "gate_id" (v9.2.0), "pending_id" (legacy alias), and "request_id" (older builds)
        let resolvedGateId = (userInfo["gate_id"] as? String)
            ?? (userInfo["pending_id"] as? String)
            ?? (userInfo["request_id"] as? String)

        if actionId.hasPrefix(prefix), let gateId = resolvedGateId {
            let action = String(actionId.dropFirst(prefix.count))
            Task {
                let apmClient = APMClient()

                do {
                    switch action {
                    case "approve", "allow5min", "allow30min", "always_allow":
                        // v9.2.0: approve endpoint; time-limited policies no longer exist —
                        // approve is a single-shot decision. Open dashboard for further management.
                        try await apmClient.approveDecision(gateId: gateId)

                    case "deny", "always_deny":
                        try await apmClient.rejectDecision(gateId: gateId)

                    default:
                        try await apmClient.approveDecision(gateId: gateId)
                    }
                } catch APMClientError.decisionExpired {
                    // Post a brief "expired" info notification so the user knows the action was a no-op
                    let expiredContent = UNMutableNotificationContent()
                    expiredContent.title = "Decision Expired"
                    expiredContent.body = "This approval gate was already decided or timed out."
                    expiredContent.sound = .default
                    // Use the literal string to avoid crossing isolation boundaries from nonisolated context
                    expiredContent.categoryIdentifier = "io.pegues.agent-j.labs.ccem.helper.lifecycle"
                    let req = UNNotificationRequest(
                        identifier: "expired-\(gateId)",
                        content: expiredContent,
                        trigger: nil
                    )
                    try? await UNUserNotificationCenter.current().add(req)
                } catch {
                    print("[CCEMHelper] Decision submit error: \(error.localizedDescription)")
                }

                await MainActor.run {
                    APMWindowManager.shared.openDashboard(path: "/govern/approvals")
                }
            }
        } else if actionId == restartId {
            // User tapped "Restart APM" on a version-update or restart-request notification
            NotificationCenter.default.post(name: .apmRestartRequested, object: nil)
        } else {
            // Default tap (no action button) — open approvals tab directly.
            Task { @MainActor in
                APMWindowManager.shared.openDashboard(path: "/govern/approvals")
            }
        }
        completionHandler()
    }
}
