/**
 * CCEM-UI Sessions Page
 * Session monitoring and management
 */

/**
 * Session interface
 */
export interface Session {
  id: string;
  name: string;
  status: 'active' | 'idle' | 'completed';
  startTime: Date | string;
  agentCount?: number;
  messageCount?: number;
  progress?: number;
}

/**
 * Sessions page component
 */
export class SessionsPage {
  private element: HTMLElement | null = null;
  private sessions: Session[] = [];

  /**
   * Creates a new SessionsPage instance
   */
  constructor() {
    console.log('[SCREEN] SessionsPage initialized');
  }

  /**
   * Render the sessions screen
   * @returns Screen element
   */
  render(): HTMLElement {
    const screen = document.createElement('div');
    screen.className = 'screen sessions-screen';
    screen.style.cssText = `
      height: 100%;
      display: flex;
      flex-direction: column;
    `;

    screen.innerHTML = `
      <div style="padding: 24px; border-bottom: 1px solid var(--color-border-primary);">
        <div class="flex items-center justify-between mb-4">
          <h2>Session Monitoring</h2>
          <button class="btn btn-primary btn-sm" id="newSessionBtn">
            <span>+</span>
            <span>New Session</span>
          </button>
        </div>

        <div class="flex items-center gap-3">
          <input type="text"
                 class="input"
                 id="sessionSearch"
                 placeholder="Search sessions..."
                 style="flex: 1;">

          <select class="input" id="sessionFilter" style="width: 200px;">
            <option value="all">All Sessions</option>
            <option value="active">Active</option>
            <option value="idle">Idle</option>
            <option value="completed">Completed</option>
          </select>
        </div>
      </div>

      <div style="flex: 1; overflow-y: auto; padding: 24px;" id="sessionsContainer">
        <div class="grid" style="grid-template-columns: repeat(auto-fill, minmax(350px, 1fr)); gap: 16px;" id="sessionsList">
          <!-- Sessions will be rendered here -->
        </div>

        <div id="emptyState" style="text-align: center; padding: 60px; color: var(--color-text-tertiary);">
          <div style="font-size: 48px; margin-bottom: 16px;">📊</div>
          <p>No sessions yet</p>
          <p style="font-size: 14px; margin-top: 8px;">Click "New Session" to create your first session</p>
        </div>
      </div>
    `;

    // Attach event listeners
    const newSessionBtn = screen.querySelector('#newSessionBtn');
    newSessionBtn?.addEventListener('click', () => this.createSession());

    const searchInput = screen.querySelector('#sessionSearch') as HTMLInputElement;
    searchInput?.addEventListener('input', (e: Event) => {
      const target = e.target as HTMLInputElement;
      this.handleSearch(target.value);
    });

    const filterSelect = screen.querySelector('#sessionFilter') as HTMLSelectElement;
    filterSelect?.addEventListener('change', (e: Event) => {
      const target = e.target as HTMLSelectElement;
      this.handleFilter(target.value);
    });

    this.element = screen;
    this.renderSessions();
    return screen;
  }

  /**
   * Create a new session
   */
  private createSession(): void {
    console.log('[SESSIONS-SCREEN] Creating new session');

    const event = new CustomEvent('sessions:create', {
      detail: { name: `Session ${this.sessions.length + 1}` },
    });
    window.dispatchEvent(event);
  }

  /**
   * Add a session
   * @param session - Session object
   */
  addSession(session: Session): void {
    this.sessions.push(session);
    this.renderSessions();
  }

  /**
   * Render all sessions
   */
  private renderSessions(): void {
    if (!this.element) return;

    const container = this.element.querySelector('#sessionsList');
    const emptyState = this.element.querySelector('#emptyState') as HTMLElement;

    if (!container) return;

    if (this.sessions.length === 0) {
      container.innerHTML = '';
      if (emptyState) emptyState.style.display = 'block';
      return;
    }

    if (emptyState) emptyState.style.display = 'none';

    container.innerHTML = this.sessions
      .map(
        (session) => `
      <div class="card card-hover" data-session-id="${session.id}">
        <div class="flex items-center justify-between mb-3">
          <div class="flex items-center gap-2">
            <span class="status-indicator ${session.status}"></span>
            <span class="font-medium">${this.escapeHtml(session.name)}</span>
          </div>
          <span class="badge badge-${session.status === 'active' ? 'success' : 'info'}">
            ${session.status.toUpperCase()}
          </span>
        </div>

        <div class="text-sm text-secondary mb-3">
          Started: ${this.formatDate(session.startTime)}
        </div>

        <div class="grid" style="grid-template-columns: 1fr 1fr; gap: 12px; font-size: 13px;">
          <div>
            <div class="text-tertiary">Agents</div>
            <div class="font-medium">${session.agentCount || 0}</div>
          </div>
          <div>
            <div class="text-tertiary">Messages</div>
            <div class="font-medium">${session.messageCount || 0}</div>
          </div>
        </div>

        ${
          session.status === 'active'
            ? `
          <div class="progress mt-3">
            <div class="progress-bar" style="width: ${session.progress || 0}%"></div>
          </div>
        `
            : ''
        }
      </div>
    `
      )
      .join('');

    // Add click handlers
    container.querySelectorAll('[data-session-id]').forEach((card) => {
      card.addEventListener('click', () => {
        const sessionId = card.getAttribute('data-session-id');
        if (sessionId) this.selectSession(sessionId);
      });
    });
  }

  /**
   * Select a session
   * @param sessionId - Session ID
   */
  private selectSession(sessionId: string): void {
    console.log('[SESSIONS-SCREEN] Session selected:', sessionId);

    const event = new CustomEvent('sessions:select', { detail: { sessionId } });
    window.dispatchEvent(event);
  }

  /**
   * Handle search
   * @param query - Search query
   */
  private handleSearch(query: string): void {
    console.log('[SESSIONS-SCREEN] Search:', query);
    // TODO: Implement search filtering
  }

  /**
   * Handle filter
   * @param filter - Filter value
   */
  private handleFilter(filter: string): void {
    console.log('[SESSIONS-SCREEN] Filter:', filter);
    // TODO: Implement filter logic
  }

  /**
   * Format date
   * @param date - Date to format
   * @returns Formatted date string
   */
  private formatDate(date: Date | string): string {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleString();
  }

  /**
   * Escape HTML to prevent XSS
   * @param text - Text to escape
   * @returns Escaped text
   */
  private escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * Mount the screen
   * @param containerId - Container element ID
   */
  mount(containerId: string): void {
    const container = document.getElementById(containerId);
    if (!container) {
      console.error('[SESSIONS-SCREEN] Container not found:', containerId);
      return;
    }

    container.innerHTML = '';
    container.appendChild(this.render());

    console.log('[SESSIONS-SCREEN] Mounted');
  }

  /**
   * Unmount the screen
   */
  unmount(): void {
    if (this.element && this.element.parentNode) {
      this.element.parentNode.removeChild(this.element);
      console.log('[SESSIONS-SCREEN] Unmounted');
    }
  }
}

export default SessionsPage;
