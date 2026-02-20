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
        UNUserNotificationCenter.current().delegate = self
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
    nonisolated func userNotificationCenter(
        _ center: UNUserNotificationCenter,
        willPresent notification: UNNotification,
        withCompletionHandler completionHandler: @escaping (UNNotificationPresentationOptions) -> Void
    ) {
        completionHandler([.banner, .sound])
    }

    /// Called when the user clicks a delivered notification.
    /// Opens the APM dashboard in the in-app window.
    nonisolated func userNotificationCenter(
        _ center: UNUserNotificationCenter,
        didReceive response: UNNotificationResponse,
        withCompletionHandler completionHandler: @escaping () -> Void
    ) {
        Task { @MainActor in
            APMWindowManager.shared.openDashboard()
        }
        completionHandler()
    }
}
