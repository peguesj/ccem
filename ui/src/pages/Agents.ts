/**
 * CCEM-UI Agents Page
 * Agent management and monitoring
 */

import { Agent, AgentCard } from '../components/AgentCard';
import { Terminal } from '../components/Terminal';

/**
 * Agents page component
 */
export class AgentsPage {
  private element: HTMLElement | null = null;
  private agents: Agent[] = [];

  /**
   * Creates a new AgentsPage instance
   */
  constructor() {
    console.log('[SCREEN] AgentsPage initialized');
  }

  /**
   * Render the agents screen
   * @returns Screen element
   */
  render(): HTMLElement {
    const screen = document.createElement('div');
    screen.className = 'screen agents-screen flex';
    screen.style.cssText = 'height: 100%;';

    screen.innerHTML = `
      <!-- Agent Sidebar -->
      <aside style="
        width: 320px;
        border-right: 1px solid var(--color-border-primary);
        display: flex;
        flex-direction: column;
        background: var(--color-bg-secondary);
      ">
        <div style="padding: 24px; border-bottom: 1px solid var(--color-border-primary);">
          <div class="flex items-center justify-between mb-4">
            <h3>Agents</h3>
            <span class="badge badge-info" id="agentCount">0</span>
          </div>

          <button class="btn btn-primary w-full mb-3" id="newAgentBtn">
            <span>+</span>
            <span>New Agent</span>
          </button>

          <input type="text"
                 class="input"
                 id="agentSearch"
                 placeholder="Search agents...">
        </div>

        <div style="flex: 1; overflow-y: auto; padding: 16px;" id="agentList">
          <!-- Agent cards will be rendered here -->
        </div>
      </aside>

      <!-- Agent Detail View -->
      <main style="flex: 1; display: flex; flex-direction: column; overflow: hidden;">
        <div id="agentDetailView">
          <!-- Empty state -->
          <div id="emptyState" style="
            display: flex;
            align-items: center;
            justify-content: center;
            height: 100%;
            text-align: center;
            color: var(--color-text-tertiary);
          ">
            <div>
              <div style="font-size: 64px; margin-bottom: 16px;">🤖</div>
              <p style="font-size: 18px; margin-bottom: 8px;">No agent selected</p>
              <p style="font-size: 14px;">Select an agent from the sidebar or create a new one</p>
            </div>
          </div>
        </div>
      </main>
    `;

    // Attach event listeners
    const newAgentBtn = screen.querySelector('#newAgentBtn');
    newAgentBtn?.addEventListener('click', () => this.createAgent());

    const searchInput = screen.querySelector('#agentSearch') as HTMLInputElement;
    searchInput?.addEventListener('input', (e: Event) => {
      const target = e.target as HTMLInputElement;
      this.handleSearch(target.value);
    });

    this.element = screen;
    return screen;
  }

  /**
   * Create a new agent
   */
  private createAgent(): void {
    console.log('[AGENTS-SCREEN] Creating new agent');

    const event = new CustomEvent('agents:create', {
      detail: {
        name: `Agent ${this.agents.length + 1}`,
        type: 'general',
      },
    });
    window.dispatchEvent(event);
  }

  /**
   * Add an agent
   * @param agent - Agent object
   */
  addAgent(agent: Agent): void {
    this.agents.push(agent);
    this.renderAgentList();
    this.updateAgentCount();
  }

  /**
   * Render agent list
   */
  private renderAgentList(): void {
    if (!this.element) return;

    const container = this.element.querySelector('#agentList');
    if (!container) return;

    if (this.agents.length === 0) {
      container.innerHTML = `
        <div style="text-align: center; padding: 40px; color: var(--color-text-tertiary);">
          <p>No agents yet</p>
        </div>
      `;
      return;
    }

    container.innerHTML = '';

    this.agents.forEach((agent) => {
      const card = new AgentCard(agent);
      card.setClickHandler((agent) => this.selectAgent(agent));
      container.appendChild(card.render());
    });
  }

  /**
   * Select an agent
   * @param agent - Agent to select
   */
  private selectAgent(agent: Agent): void {
    this.renderAgentDetail(agent);

    console.log('[AGENTS-SCREEN] Agent selected:', agent.id);

    const event = new CustomEvent('agents:select', { detail: { agent } });
    window.dispatchEvent(event);
  }

  /**
   * Render agent detail view
   * @param agent - Agent to display
   */
  private renderAgentDetail(agent: Agent): void {
    if (!this.element) return;

    const detailView = this.element.querySelector('#agentDetailView');
    const emptyState = this.element.querySelector('#emptyState') as HTMLElement;

    if (!detailView) return;

    if (emptyState) emptyState.style.display = 'none';

    const statusClass = agent.status === 'running' ? 'info' : agent.status === 'complete' ? 'success' : 'primary';

    detailView.innerHTML = `
      <div style="padding: 24px; border-bottom: 1px solid var(--color-border-primary);">
        <div class="flex items-center justify-between mb-3">
          <div>
            <h2 class="mb-2">${this.escapeHtml(agent.name)}</h2>
            <div class="flex items-center gap-3 text-sm text-secondary">
              <span>Branch: ${this.escapeHtml(agent.branch || 'main')}</span>
              <span>•</span>
              <span class="badge badge-${statusClass}">
                ${agent.status.toUpperCase()}
              </span>
            </div>
          </div>

          <div class="flex gap-2">
            <button class="btn btn-secondary btn-sm" id="pauseAgentBtn">⏸ Pause</button>
            <button class="btn btn-danger btn-sm" id="stopAgentBtn">■ Stop</button>
          </div>
        </div>

        <div class="progress mb-1">
          <div class="progress-bar ${agent.status === 'complete' ? 'success' : ''}"
               style="width: ${agent.progress || 0}%"></div>
        </div>
        <div class="text-xs text-tertiary text-right">${agent.progress || 0}%</div>
      </div>

      <div style="
        flex: 1;
        overflow-y: auto;
        padding: 24px;
        display: grid;
        grid-template-columns: 2fr 1fr;
        gap: 24px;
        height: calc(100vh - 240px);
      ">
        <!-- Terminal Output -->
        <div style="height: 100%;">
          <h3 class="mb-3">Terminal Output</h3>
          <div id="agentTerminal" style="height: calc(100% - 40px);"></div>
        </div>

        <!-- File Changes -->
        <div>
          <h3 class="mb-3">File Changes (0)</h3>
          <div class="card">
            <div class="card-body" style="text-align: center; padding: 40px; color: var(--color-text-tertiary);">
              No file changes yet
            </div>
          </div>
        </div>
      </div>
    `;

    // Create terminal
    const terminal = new Terminal(`${agent.name}.log`);
    terminal.mount('agentTerminal');
    terminal.log(`Starting ${agent.name}...`, 'AGENT');
    terminal.log('Analyzing files...', 'SCAN');

    if (agent.currentTask) {
      terminal.log(agent.currentTask, 'INFO');
    }
  }

  /**
   * Update agent count badge
   */
  private updateAgentCount(): void {
    if (!this.element) return;

    const countEl = this.element.querySelector('#agentCount');
    if (countEl) {
      const activeCount = this.agents.filter((a) => a.status === 'running').length;
      countEl.textContent = String(activeCount);
    }
  }

  /**
   * Handle search
   * @param query - Search query
   */
  private handleSearch(query: string): void {
    console.log('[AGENTS-SCREEN] Search:', query);
    // TODO: Implement search filtering
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
      console.error('[AGENTS-SCREEN] Container not found:', containerId);
      return;
    }

    container.innerHTML = '';
    container.appendChild(this.render());

    console.log('[AGENTS-SCREEN] Mounted');
  }

  /**
   * Unmount the screen
   */
  unmount(): void {
    if (this.element && this.element.parentNode) {
      this.element.parentNode.removeChild(this.element);
      console.log('[AGENTS-SCREEN] Unmounted');
    }
  }
}

export default AgentsPage;
