import AppKit
import SwiftUI

// MARK: - APMWindowManager

/// Singleton that manages the CCEM APM in-app dashboard window.
/// Opens a resizable NSWindow hosting an APMBrowserView (WKWebView-based).
@MainActor
final class APMWindowManager: NSObject {

    static let shared = APMWindowManager()

    private static let baseURL = "http://localhost:3031"
    private static let windowTitle = "CCEM APM"
    private static let initialSize = CGSize(width: 1200, height: 800)
    private static let minSize = CGSize(width: 800, height: 600)

    private var windowController: NSWindowController?

    private override init() {
        super.init()
    }

    // MARK: - Public API

    /// Opens the dashboard at the given path, or focuses the existing window if already open.
    func openDashboard(path: String = "/") {
        let url = makeURL(path: path)
        openOrFocus(url: url)
    }

    /// Opens the window navigated to the /docs path.
    func openDocs() {
        openDashboard(path: "/docs")
    }

    // MARK: - Private

    private func makeURL(path: String) -> URL {
        let rawPath = path.hasPrefix("/") ? path : "/\(path)"
        return URL(string: "\(Self.baseURL)\(rawPath)") ?? URL(string: Self.baseURL)!
    }

    private func openOrFocus(url: URL) {
        if let existing = windowController {
            // Window already exists — bring it to front.
            existing.window?.makeKeyAndOrderFront(nil)
            NSApp.activate(ignoringOtherApps: true)
            return
        }

        let window = buildWindow(url: url)
        let controller = NSWindowController(window: window)
        windowController = controller

        controller.showWindow(nil)
        NSApp.activate(ignoringOtherApps: true)
    }

    private func buildWindow(url: URL) -> NSWindow {
        let browserView = APMBrowserView(initialURL: url)
        let hostingView = NSHostingView(rootView: browserView)

        let window = NSWindow(
            contentRect: NSRect(origin: .zero, size: Self.initialSize),
            styleMask: [.titled, .closable, .miniaturizable, .resizable, .fullSizeContentView],
            backing: .buffered,
            defer: false
        )
        window.title = Self.windowTitle
        window.contentView = hostingView
        window.minSize = Self.minSize
        window.center()
        window.isReleasedWhenClosed = false
        window.delegate = self

        return window
    }
}

// MARK: - NSWindowDelegate

extension APMWindowManager: NSWindowDelegate {
    nonisolated func windowWillClose(_ notification: Notification) {
        Task { @MainActor in
            self.windowController = nil
        }
    }
}
