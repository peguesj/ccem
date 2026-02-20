import SwiftUI
import WebKit

// MARK: - APMWebView

struct APMWebView: NSViewRepresentable {
    let url: URL
    @Binding var currentURL: URL?
    @Binding var canGoBack: Bool
    @Binding var canGoForward: Bool
    @Binding var isLoading: Bool

    func makeCoordinator() -> Coordinator {
        Coordinator(self)
    }

    func makeNSView(context: Context) -> WKWebView {
        let config = WKWebViewConfiguration()
        // Allow all media types without user gesture requirement (for LiveView audio/video)
        config.mediaTypesRequiringUserActionForPlayback = []
        // Enable developer extras for debugging
        config.preferences.setValue(true, forKey: "developerExtrasEnabled")

        let webView = WKWebView(frame: .zero, configuration: config)
        webView.navigationDelegate = context.coordinator
        webView.allowsMagnification = true
        // Allow back/forward swipe gestures
        webView.allowsBackForwardNavigationGestures = true

        webView.load(URLRequest(url: url))
        return webView
    }

    func updateNSView(_ webView: WKWebView, context: Context) {
        // Only load if the requested URL has changed from what's currently loaded
        let loadedURL = webView.url ?? url
        if loadedURL.absoluteString != url.absoluteString,
           context.coordinator.lastRequestedURL?.absoluteString != url.absoluteString {
            context.coordinator.lastRequestedURL = url
            webView.load(URLRequest(url: url))
        }
    }

    // MARK: - Navigation helpers (called from toolbar)

    static func goBack(_ webView: WKWebView) { webView.goBack() }
    static func goForward(_ webView: WKWebView) { webView.goForward() }
    static func reload(_ webView: WKWebView) { webView.reload() }

    // MARK: - Coordinator

    final class Coordinator: NSObject, WKNavigationDelegate {
        var parent: APMWebView
        var lastRequestedURL: URL?
        weak var webView: WKWebView?

        init(_ parent: APMWebView) {
            self.parent = parent
        }

        func webView(_ webView: WKWebView, didStartProvisionalNavigation navigation: WKNavigation!) {
            self.webView = webView
            parent.isLoading = true
        }

        func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
            parent.isLoading = false
            parent.currentURL = webView.url
            parent.canGoBack = webView.canGoBack
            parent.canGoForward = webView.canGoForward
        }

        func webView(_ webView: WKWebView, didFail navigation: WKNavigation!, withError error: Error) {
            parent.isLoading = false
        }

        func webView(
            _ webView: WKWebView,
            didFailProvisionalNavigation navigation: WKNavigation!,
            withError error: Error
        ) {
            parent.isLoading = false
        }

        // Allow all navigation types including WebSocket upgrades used by Phoenix LiveView
        func webView(
            _ webView: WKWebView,
            decidePolicyFor navigationAction: WKNavigationAction,
            decisionHandler: @escaping (WKNavigationActionPolicy) -> Void
        ) {
            decisionHandler(.allow)
        }

        func webView(
            _ webView: WKWebView,
            decidePolicyFor navigationResponse: WKNavigationResponse,
            decisionHandler: @escaping (WKNavigationResponsePolicy) -> Void
        ) {
            decisionHandler(.allow)
        }
    }
}

// MARK: - APMBrowserView

/// Full browser chrome wrapping APMWebView with back/forward/reload toolbar and URL bar.
struct APMBrowserView: View {
    let initialURL: URL
    @State private var currentURL: URL?
    @State private var canGoBack = false
    @State private var canGoForward = false
    @State private var isLoading = false
    @State private var webViewRef: WKWebView?

    // We use a separate NSViewRepresentable shim to get a reference to the underlying WKWebView
    // so the toolbar buttons can call goBack/goForward/reload on it.
    @State private var coordinator = WebViewHolder()

    var body: some View {
        VStack(spacing: 0) {
            toolbar
            Divider()
            WebViewContainer(
                url: initialURL,
                currentURL: $currentURL,
                canGoBack: $canGoBack,
                canGoForward: $canGoForward,
                isLoading: $isLoading,
                holder: coordinator
            )
        }
    }

    private var toolbar: some View {
        HStack(spacing: 8) {
            Button {
                coordinator.webView?.goBack()
            } label: {
                Image(systemName: "chevron.left")
            }
            .disabled(!canGoBack)
            .buttonStyle(.borderless)

            Button {
                coordinator.webView?.goForward()
            } label: {
                Image(systemName: "chevron.right")
            }
            .disabled(!canGoForward)
            .buttonStyle(.borderless)

            Button {
                if isLoading {
                    coordinator.webView?.stopLoading()
                } else {
                    coordinator.webView?.reload()
                }
            } label: {
                Image(systemName: isLoading ? "xmark" : "arrow.clockwise")
            }
            .buttonStyle(.borderless)

            // URL bar
            Text(urlDisplayString)
                .font(.system(.caption, design: .monospaced))
                .foregroundStyle(.secondary)
                .lineLimit(1)
                .truncationMode(.middle)
                .frame(maxWidth: .infinity, alignment: .leading)
                .padding(.horizontal, 6)
                .padding(.vertical, 3)
                .background(.quaternary, in: RoundedRectangle(cornerRadius: 4))

            if isLoading {
                ProgressView()
                    .scaleEffect(0.6)
                    .frame(width: 16, height: 16)
            }
        }
        .padding(.horizontal, 12)
        .padding(.vertical, 8)
    }

    private var urlDisplayString: String {
        let url = currentURL ?? initialURL
        // Show path + query, omitting scheme+host for readability
        var display = url.path
        if let query = url.query { display += "?\(query)" }
        return display.isEmpty ? "/" : display
    }
}

// MARK: - WebViewHolder (reference bridge)

/// Observable class that holds a weak reference to the underlying WKWebView,
/// allowing SwiftUI toolbar buttons to invoke imperative navigation methods.
@Observable
final class WebViewHolder {
    weak var webView: WKWebView?
}

// MARK: - WebViewContainer (NSViewRepresentable with holder)

private struct WebViewContainer: NSViewRepresentable {
    let url: URL
    @Binding var currentURL: URL?
    @Binding var canGoBack: Bool
    @Binding var canGoForward: Bool
    @Binding var isLoading: Bool
    let holder: WebViewHolder

    func makeCoordinator() -> Coordinator {
        Coordinator(self)
    }

    func makeNSView(context: Context) -> WKWebView {
        let config = WKWebViewConfiguration()
        config.mediaTypesRequiringUserActionForPlayback = []
        config.preferences.setValue(true, forKey: "developerExtrasEnabled")

        let webView = WKWebView(frame: .zero, configuration: config)
        webView.navigationDelegate = context.coordinator
        webView.allowsMagnification = true
        webView.allowsBackForwardNavigationGestures = true

        holder.webView = webView
        webView.load(URLRequest(url: url))
        return webView
    }

    func updateNSView(_ webView: WKWebView, context: Context) {
        holder.webView = webView
    }

    final class Coordinator: NSObject, WKNavigationDelegate {
        var parent: WebViewContainer

        init(_ parent: WebViewContainer) {
            self.parent = parent
        }

        func webView(_ webView: WKWebView, didStartProvisionalNavigation navigation: WKNavigation!) {
            parent.isLoading = true
        }

        func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
            parent.isLoading = false
            parent.currentURL = webView.url
            parent.canGoBack = webView.canGoBack
            parent.canGoForward = webView.canGoForward
        }

        func webView(_ webView: WKWebView, didFail navigation: WKNavigation!, withError error: Error) {
            parent.isLoading = false
        }

        func webView(
            _ webView: WKWebView,
            didFailProvisionalNavigation navigation: WKNavigation!,
            withError error: Error
        ) {
            parent.isLoading = false
        }

        func webView(
            _ webView: WKWebView,
            decidePolicyFor navigationAction: WKNavigationAction,
            decisionHandler: @escaping (WKNavigationActionPolicy) -> Void
        ) {
            decisionHandler(.allow)
        }

        func webView(
            _ webView: WKWebView,
            decidePolicyFor navigationResponse: WKNavigationResponse,
            decisionHandler: @escaping (WKNavigationResponsePolicy) -> Void
        ) {
            decisionHandler(.allow)
        }
    }
}
