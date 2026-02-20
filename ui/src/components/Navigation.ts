/**
 * CCEM-UI Navigation Component
 * Unified navigation bar with routing support
 */

import { Router, RouteChangeDetail } from './Router';

/**
 * Navigation event detail interface
 */
export interface NavigationEventDetail {
  [key: string]: unknown;
}

/**
 * Route title map interface
 */
interface RouteTitleMap {
  [path: string]: string;
}

/**
 * Navigation component for top-level navigation bar
 */
export class Navigation {
  private router: Router;
  private element: HTMLElement | null = null;

  /**
   * Creates a new Navigation instance
   * @param router - Router instance for navigation
   */
  constructor(router: Router) {
    this.router = router;

    console.log('[COMPONENT] Navigation initialized');

    // Listen to route changes
    this.router.on('routechange', (data) => {
      this.handleRouteChange(data as RouteChangeDetail);
    });
  }

  /**
   * Mount the navigation component
   * @param containerId - Container element ID
   */
  mount(containerId: string): void {
    const container = document.getElementById(containerId);
    if (!container) {
      console.error('[NAVIGATION] Container not found:', containerId);
      return;
    }

    this.element = this.render();
    container.appendChild(this.element);

    // Attach event listeners
    this.attachEventListeners();

    console.log('[NAVIGATION] Mounted to:', containerId);
  }

  /**
   * Render the navigation component
   * @returns Navigation element
   */
  private render(): HTMLElement {
    const nav = document.createElement('nav');
    nav.className = 'top-nav';
    nav.innerHTML = `
      <div class="nav-left">
        <button class="btn btn-icon btn-ghost" id="backBtn" title="Back">
          <span>←</span>
        </button>
        <button class="btn btn-icon btn-ghost" id="forwardBtn" title="Forward">
          <span>→</span>
        </button>
        <button class="btn btn-icon btn-ghost" id="refreshBtn" title="Refresh">
          <span>↻</span>
        </button>
        <button class="btn btn-icon btn-ghost" id="toggleSidebarBtn" title="Toggle Sidebar">
          <span>≡</span>
        </button>
      </div>

      <div class="nav-center">
        <h1 class="nav-title" id="navTitle">CCEM-UI</h1>
      </div>

      <div class="nav-right">
        <button class="btn btn-secondary btn-sm" id="previewBtn">Preview</button>
        <button class="btn btn-secondary btn-sm" id="changesBtn">Changes</button>
        <button class="btn btn-icon btn-ghost" id="commandPaletteBtn" title="Command Palette (⌘K)">
          <span>⌘</span>
        </button>
      </div>
    `;

    return nav;
  }

  /**
   * Attach event listeners to navigation buttons
   */
  private attachEventListeners(): void {
    if (!this.element) return;

    // Back button
    const backBtn = this.element.querySelector('#backBtn');
    backBtn?.addEventListener('click', () => {
      console.log('[NAVIGATION] Back button clicked');
      this.router.back();
    });

    // Forward button
    const forwardBtn = this.element.querySelector('#forwardBtn');
    forwardBtn?.addEventListener('click', () => {
      console.log('[NAVIGATION] Forward button clicked');
      this.router.forward();
    });

    // Refresh button
    const refreshBtn = this.element.querySelector('#refreshBtn');
    refreshBtn?.addEventListener('click', () => {
      console.log('[NAVIGATION] Refresh button clicked');
      window.location.reload();
    });

    // Toggle sidebar button
    const toggleBtn = this.element.querySelector('#toggleSidebarBtn');
    toggleBtn?.addEventListener('click', () => {
      console.log('[NAVIGATION] Toggle sidebar clicked');
      this.emit('toggle-sidebar');
    });

    // Command palette button
    const cmdBtn = this.element.querySelector('#commandPaletteBtn');
    cmdBtn?.addEventListener('click', () => {
      console.log('[NAVIGATION] Command palette button clicked');
      this.emit('open-command-palette');
    });

    // Preview button
    const previewBtn = this.element.querySelector('#previewBtn');
    previewBtn?.addEventListener('click', () => {
      console.log('[NAVIGATION] Preview button clicked');
      this.emit('preview');
    });

    // Changes button
    const changesBtn = this.element.querySelector('#changesBtn');
    changesBtn?.addEventListener('click', () => {
      console.log('[NAVIGATION] Changes button clicked');
      this.emit('changes');
    });
  }

  /**
   * Handle route change
   * @param data - Route change data
   */
  private handleRouteChange(data: RouteChangeDetail): void {
    this.updateTitle(data.path);

    console.log('[NAVIGATION] Route changed:', data);
  }

  /**
   * Update navigation title based on route
   * @param path - Current route path
   */
  private updateTitle(path: string): void {
    if (!this.element) return;

    const titleEl = this.element.querySelector('#navTitle');
    if (!titleEl) return;

    const titles: RouteTitleMap = {
      '/': 'CCEM-UI - Home',
      '/sessions': 'Session Monitoring',
      '/agents': 'Agent Management',
      '/chats': 'Chat Interface',
      '/settings': 'Settings',
    };

    titleEl.textContent = titles[path] || 'CCEM-UI';
  }

  /**
   * Set custom title
   * @param title - Custom title text
   */
  setTitle(title: string): void {
    if (!this.element) return;

    const titleEl = this.element.querySelector('#navTitle');
    if (titleEl) {
      titleEl.textContent = title;
    }
  }

  /**
   * Emit component events
   * @param event - Event name
   * @param data - Event data
   */
  private emit(event: string, data: NavigationEventDetail = {}): void {
    const customEvent = new CustomEvent(`navigation:${event}`, { detail: data });
    window.dispatchEvent(customEvent);
  }

  /**
   * Listen to navigation events
   * @param event - Event name
   * @param callback - Callback function
   */
  on(event: string, callback: (data: NavigationEventDetail) => void): void {
    window.addEventListener(`navigation:${event}`, (e: Event) => {
      const customEvent = e as CustomEvent<NavigationEventDetail>;
      callback(customEvent.detail);
    });
  }

  /**
   * Unmount the component
   */
  unmount(): void {
    if (this.element && this.element.parentNode) {
      this.element.parentNode.removeChild(this.element);
      console.log('[NAVIGATION] Unmounted');
    }
  }
}

export default Navigation;
