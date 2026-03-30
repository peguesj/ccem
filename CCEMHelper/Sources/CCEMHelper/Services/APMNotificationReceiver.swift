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
    /// Handles AgentLock approve/deny actions; all other taps open the /authorization tab.
    nonisolated func userNotificationCenter(
        _ center: UNUserNotificationCenter,
        didReceive response: UNNotificationResponse,
        withCompletionHandler completionHandler: @escaping () -> Void
    ) {
        let actionId = response.actionIdentifier
        let userInfo = response.notification.request.content.userInfo

        let approveId = "io.pegues.agent-j.labs.ccem.helper.agentlock.approve"
        let denyId = "io.pegues.agent-j.labs.ccem.helper.agentlock.deny"
        let restartId = "io.pegues.agent-j.labs.ccem.helper.restart.now"

        // Accept both "pending_id" (US-001 AGENTLOCK_APPROVAL category) and legacy "request_id"
        let resolvedRequestId = (userInfo["pending_id"] as? String) ?? (userInfo["request_id"] as? String)

        if (actionId == approveId || actionId == denyId),
           let requestId = resolvedRequestId {
            let decision = actionId == approveId ? "approve" : "deny"
            Task {
                let apmClient = APMClient()
                try? await apmClient.submitDecision(requestId: requestId, decision: decision)
                await MainActor.run {
                    APMWindowManager.shared.openDashboard(path: "/authorization")
                }
            }
        } else if actionId == restartId {
            // User tapped "Restart APM" on a version-update or restart-request notification
            NotificationCenter.default.post(name: .apmRestartRequested, object: nil)
        } else {
            // Default tap (no action button) — open authorization tab directly.
            Task { @MainActor in
                APMWindowManager.shared.openDashboard(path: "/authorization")
            }
        }
        completionHandler()
    }
}
