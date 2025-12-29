/**
 * CCEM-UI AgentCard Component
 * Display and manage individual agent cards
 */

/**
 * Agent status type
 */
export type AgentStatus = 'idle' | 'running' | 'complete' | 'error';

/**
 * Agent data interface
 */
export interface Agent {
  id: string;
  name: string;
  status: AgentStatus;
  branch?: string;
  currentTask?: string;
  tasksCompleted?: number;
  progress?: number;
  updatedAt: Date | string;
}

/**
 * Agent click handler type
 */
export type AgentClickHandler = (agent: Agent) => void;

/**
 * AgentCard component for displaying individual agents
 */
export class AgentCard {
  private agent: Agent;
  private element: HTMLElement | null = null;
  private onClick: AgentClickHandler | null = null;

  /**
   * Creates a new AgentCard instance
   * @param agent - Agent data
   */
  constructor(agent: Agent) {
    this.agent = agent;

    console.log('[COMPONENT] AgentCard created:', agent.id);
  }

  /**
   * Render the agent card
   * @returns Card element
   */
  render(): HTMLElement {
    const card = document.createElement('div');
    card.id = this.agent.id;
    card.className = `card card-hover agent-card ${this.agent.status}`;

    const timeSince = this.getTimeSince(this.agent.updatedAt);
    const statusClass = this.agent.status || 'idle';
    const badgeClass = this.getBadgeClass(statusClass);

    card.innerHTML = `
      <div class="flex items-center justify-between mb-3">
        <div class="flex items-center gap-2">
          <span class="status-indicator ${statusClass}"></span>
          <span class="font-medium text-primary">${this.escapeHtml(this.agent.name)}</span>
        </div>
        <span class="badge badge-${badgeClass}">
          ${statusClass.toUpperCase()}
        </span>
      </div>

      <div class="flex items-center justify-between text-sm text-secondary mb-2">
        <span>Branch: ${this.escapeHtml(this.agent.branch || 'main')}</span>
        <span>${timeSince}</span>
      </div>

      <div class="text-sm text-tertiary mb-3">
        ${this.escapeHtml(this.getCurrentTaskText())}
      </div>

      <div class="progress mb-1">
        <div class="progress-bar ${this.getProgressBarClass(statusClass)}"
             style="width: ${this.agent.progress || 0}%"></div>
      </div>
      <div class="text-xs text-tertiary text-right">${this.agent.progress || 0}%</div>
    `;

    // Attach click handler
    if (this.onClick) {
      card.addEventListener('click', () => {
        console.log('[AGENT-CARD] Card clicked:', this.agent.id);
        if (this.onClick) {
          this.onClick(this.agent);
        }
      });
    }

    this.element = card;
    return card;
  }

  /**
   * Update agent data and re-render
   * @param updates - Updated agent properties
   */
  update(updates: Partial<Agent>): void {
    this.agent = { ...this.agent, ...updates };

    if (this.element && this.element.parentNode) {
      const newElement = this.render();
      this.element.parentNode.replaceChild(newElement, this.element);
      console.log('[AGENT-CARD] Updated:', this.agent.id);
    }
  }

  /**
   * Set active state
   * @param active - Active state
   */
  setActive(active: boolean): void {
    if (this.element) {
      if (active) {
        this.element.classList.add('active');
      } else {
        this.element.classList.remove('active');
      }
    }
  }

  /**
   * Set click handler
   * @param handler - Click handler function
   */
  setClickHandler(handler: AgentClickHandler): void {
    this.onClick = handler;
  }

  /**
   * Get time since date
   * @param date - Date to calculate from
   * @returns Formatted time string
   */
  private getTimeSince(date: Date | string): string {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    const seconds = Math.floor((new Date().getTime() - dateObj.getTime()) / 1000);

    if (seconds < 60) return 'now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  }

  /**
   * Get current task text
   * @returns Current task or default text
   */
  private getCurrentTaskText(): string {
    if (this.agent.currentTask) {
      return this.agent.currentTask;
    }
    if (this.agent.status === 'idle') {
      return 'Waiting for tasks...';
    }
    return `Tasks: ${this.agent.tasksCompleted || 0} ✓`;
  }

  /**
   * Get badge class based on status
   * @param status - Agent status
   * @returns Badge CSS class
   */
  private getBadgeClass(status: AgentStatus): string {
    switch (status) {
      case 'complete':
        return 'success';
      case 'error':
        return 'error';
      case 'running':
        return 'info';
      default:
        return 'primary';
    }
  }

  /**
   * Get progress bar class based on status
   * @param status - Agent status
   * @returns Progress bar CSS class
   */
  private getProgressBarClass(status: AgentStatus): string {
    if (status === 'complete') return 'success';
    if (status === 'error') return 'error';
    return '';
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
   * Destroy the component
   */
  destroy(): void {
    if (this.element && this.element.parentNode) {
      this.element.parentNode.removeChild(this.element);
      console.log('[AGENT-CARD] Destroyed:', this.agent.id);
    }
  }
}

export default AgentCard;
