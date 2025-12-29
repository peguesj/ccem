/**
 * CCEM-UI Home Page
 * Landing/Dashboard screen
 */

/**
 * Quick action type
 */
export type QuickAction = 'new-agent' | 'new-chat' | 'view-sessions' | 'settings';

/**
 * Home action event detail
 */
export interface HomeActionDetail {
  action: QuickAction;
}

/**
 * Statistics interface
 */
export interface HomeStats {
  activeAgents?: number;
  openChats?: number;
}

/**
 * Home page component
 */
export class HomePage {
  private element: HTMLElement | null = null;

  /**
   * Creates a new HomePage instance
   */
  constructor() {
    console.log('[SCREEN] HomePage initialized');
  }

  /**
   * Render the home screen
   * @returns Screen element
   */
  render(): HTMLElement {
    const screen = document.createElement('div');
    screen.className = 'screen home-screen';
    screen.style.cssText = `
      padding: 60px 40px;
      max-width: 1200px;
      margin: 0 auto;
    `;

    screen.innerHTML = `
      <div style="text-align: center; margin-bottom: 60px;">
        <h1 style="font-size: 48px; margin-bottom: 16px; background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">
          Welcome to CCEM-UI
        </h1>
        <p style="font-size: 18px; color: var(--color-text-secondary);">
          Claude Code Environment Manager - Unified Interface
        </p>
      </div>

      <div class="grid" style="grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 24px; margin-bottom: 60px;">
        <!-- Quick Action Cards -->
        <div class="card card-hover" style="padding: 32px; text-align: center; cursor: pointer;" data-action="new-agent">
          <div style="font-size: 48px; margin-bottom: 16px;">🤖</div>
          <h3 style="margin-bottom: 8px;">New Agent</h3>
          <p style="color: var(--color-text-tertiary); font-size: 14px;">Deploy a specialized agent</p>
        </div>

        <div class="card card-hover" style="padding: 32px; text-align: center; cursor: pointer;" data-action="new-chat">
          <div style="font-size: 48px; margin-bottom: 16px;">💬</div>
          <h3 style="margin-bottom: 8px;">New Chat</h3>
          <p style="color: var(--color-text-tertiary); font-size: 14px;">Start a conversation</p>
        </div>

        <div class="card card-hover" style="padding: 32px; text-align: center; cursor: pointer;" data-action="view-sessions">
          <div style="font-size: 48px; margin-bottom: 16px;">📊</div>
          <h3 style="margin-bottom: 8px;">Sessions</h3>
          <p style="color: var(--color-text-tertiary); font-size: 14px;">Monitor active sessions</p>
        </div>

        <div class="card card-hover" style="padding: 32px; text-align: center; cursor: pointer;" data-action="settings">
          <div style="font-size: 48px; margin-bottom: 16px;">⚙️</div>
          <h3 style="margin-bottom: 8px;">Settings</h3>
          <p style="color: var(--color-text-tertiary); font-size: 14px;">Configure preferences</p>
        </div>
      </div>

      <div class="grid" style="grid-template-columns: 1fr 1fr; gap: 24px;">
        <!-- Recent Activity -->
        <div class="card">
          <div class="card-header">
            <h3>Recent Activity</h3>
          </div>
          <div class="card-body" id="recentActivity">
            <div style="text-align: center; padding: 40px; color: var(--color-text-tertiary);">
              No recent activity
            </div>
          </div>
        </div>

        <!-- System Status -->
        <div class="card">
          <div class="card-header">
            <h3>System Status</h3>
          </div>
          <div class="card-body">
            <div class="flex items-center justify-between mb-4">
              <span class="text-secondary">Active Agents</span>
              <span class="badge badge-info" id="activeAgentsCount">0</span>
            </div>
            <div class="flex items-center justify-between mb-4">
              <span class="text-secondary">Open Chats</span>
              <span class="badge badge-primary" id="openChatsCount">0</span>
            </div>
            <div class="flex items-center justify-between mb-4">
              <span class="text-secondary">System Status</span>
              <span class="badge badge-success">Healthy</span>
            </div>
          </div>
        </div>
      </div>

      <div style="margin-top: 60px; text-align: center;">
        <p style="color: var(--color-text-tertiary); font-size: 14px;">
          Press <kbd style="background: var(--color-bg-tertiary); padding: 4px 8px; border-radius: 4px;">⌘K</kbd> to open command palette
        </p>
      </div>
    `;

    // Attach event listeners to quick action cards
    screen.querySelectorAll('[data-action]').forEach((card) => {
      card.addEventListener('click', () => {
        const action = card.getAttribute('data-action') as QuickAction;
        this.handleQuickAction(action);
      });
    });

    this.element = screen;
    return screen;
  }

  /**
   * Handle quick action clicks
   * @param action - Action to perform
   */
  private handleQuickAction(action: QuickAction): void {
    console.log('[HOME-SCREEN] Quick action:', action);

    const event = new CustomEvent<HomeActionDetail>('home:action', {
      detail: { action },
    });
    window.dispatchEvent(event);
  }

  /**
   * Update statistics
   * @param stats - Statistics object
   */
  updateStats(stats: HomeStats): void {
    if (!this.element) return;

    const activeAgentsEl = this.element.querySelector('#activeAgentsCount');
    const openChatsEl = this.element.querySelector('#openChatsCount');

    if (activeAgentsEl) activeAgentsEl.textContent = String(stats.activeAgents || 0);
    if (openChatsEl) openChatsEl.textContent = String(stats.openChats || 0);

    console.log('[HOME-SCREEN] Stats updated:', stats);
  }

  /**
   * Mount the screen
   * @param containerId - Container element ID
   */
  mount(containerId: string): void {
    const container = document.getElementById(containerId);
    if (!container) {
      console.error('[HOME-SCREEN] Container not found:', containerId);
      return;
    }

    container.innerHTML = '';
    container.appendChild(this.render());

    console.log('[HOME-SCREEN] Mounted');
  }

  /**
   * Unmount the screen
   */
  unmount(): void {
    if (this.element && this.element.parentNode) {
      this.element.parentNode.removeChild(this.element);
      console.log('[HOME-SCREEN] Unmounted');
    }
  }
}

export default HomePage;
