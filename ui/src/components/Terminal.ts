/**
 * CCEM-UI Terminal Component
 * Display terminal output with syntax highlighting and log levels
 */

/**
 * Log level type
 */
export type LogLevel =
  | 'AGENT'
  | 'SCAN'
  | 'FIX'
  | 'ERROR'
  | 'WARN'
  | 'INFO'
  | 'SUCCESS'
  | 'log'
  | 'debug'
  | 'info'
  | 'error'
  | 'warn'
  | 'dir'
  | 'dirxml'
  | 'table'
  | 'trace'
  | 'clear'
  | 'startGroup'
  | 'startGroupCollapsed'
  | 'endGroup'
  | 'assert'
  | 'profile'
  | 'profileEnd'
  | 'count'
  | 'timeEnd'
  | 'verbose'
  | 'issue';

/**
 * Log entry interface
 */
export interface LogEntry {
  timestamp: string;
  message: string;
  level: LogLevel;
  id: string;
}

/**
 * Terminal component for displaying log output
 */
export class Terminal {
  private title: string;
  private logs: LogEntry[] = [];
  private element: HTMLElement | null = null;
  private autoscroll = true;
  private maxLogs: number;

  /**
   * Creates a new Terminal instance
   * @param title - Terminal title (default: 'output.log')
   * @param maxLogs - Maximum number of logs to keep (default: 1000)
   */
  constructor(title = 'output.log', maxLogs = 1000) {
    this.title = title;
    this.maxLogs = maxLogs;

    console.log('[COMPONENT] Terminal initialized:', title);
  }

  /**
   * Mount the terminal
   * @param containerId - Container element ID
   */
  mount(containerId: string): void {
    const container = document.getElementById(containerId);
    if (!container) {
      console.error('[TERMINAL] Container not found:', containerId);
      return;
    }

    this.element = this.render();
    container.appendChild(this.element);

    console.log('[TERMINAL] Mounted to:', containerId);
  }

  /**
   * Render the terminal
   * @returns Terminal element
   */
  private render(): HTMLElement {
    const terminal = document.createElement('div');
    terminal.className = 'terminal-container';
    terminal.style.cssText = `
      background: var(--color-bg-tertiary);
      border: 1px solid var(--color-border-primary);
      border-radius: var(--radius-lg);
      overflow: hidden;
      height: 100%;
      display: flex;
      flex-direction: column;
    `;

    terminal.innerHTML = `
      <div class="terminal-header" style="
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 12px 16px;
        background: var(--color-bg-secondary);
        border-bottom: 1px solid var(--color-border-primary);
      ">
        <span style="width: 12px; height: 12px; background: #ef4444; border-radius: 50%;"></span>
        <span style="width: 12px; height: 12px; background: #f59e0b; border-radius: 50%;"></span>
        <span style="width: 12px; height: 12px; background: #22c55e; border-radius: 50%;"></span>
        <span class="terminal-title" style="margin-left: auto; font-size: 12px; color: var(--color-text-tertiary); font-family: var(--font-family-mono);">
          ${this.escapeHtml(this.title)}
        </span>
      </div>

      <div class="terminal-content" id="terminalContent" style="
        flex: 1;
        padding: 16px;
        overflow-y: auto;
        font-family: var(--font-family-mono);
        font-size: 13px;
        line-height: 1.6;
        color: var(--color-text-secondary);
      ">
        <div class="terminal-cursor" style="
          width: 8px;
          height: 16px;
          background: var(--color-primary);
          display: inline-block;
          animation: blink 1s infinite;
        "></div>
      </div>

      <style>
        @keyframes blink {
          0%, 50% { opacity: 1; }
          51%, 100% { opacity: 0; }
        }

        .log-entry {
          margin-bottom: 4px;
          white-space: pre-wrap;
          word-break: break-all;
        }

        .log-entry.AGENT { color: #6366f1; }
        .log-entry.SCAN { color: #3b82f6; }
        .log-entry.FIX { color: #22c55e; }
        .log-entry.ERROR, .log-entry.error { color: #ef4444; }
        .log-entry.WARN, .log-entry.warn { color: #f59e0b; }
        .log-entry.INFO, .log-entry.info { color: #a1a1aa; }
        .log-entry.SUCCESS { color: #22c55e; }
        .log-entry.log { color: #a1a1aa; }
        .log-entry.debug { color: #8b5cf6; }
      </style>
    `;

    this.element = terminal;
    return terminal;
  }

  /**
   * Add log entry
   * @param message - Log message
   * @param level - Log level
   */
  log(message: string, level: LogLevel = 'INFO'): void {
    const timestamp = new Date().toLocaleTimeString();
    const logEntry: LogEntry = {
      timestamp,
      message,
      level,
      id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    };

    this.logs.push(logEntry);

    // Limit log history
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }

    this.renderLog(logEntry);

    console.log(`[TERMINAL] ${level}:`, message);
  }

  /**
   * Render a single log entry
   * @param logEntry - Log entry object
   */
  private renderLog(logEntry: LogEntry): void {
    if (!this.element) return;

    const content = this.element.querySelector('#terminalContent');
    if (!content) return;

    // Remove cursor
    const cursor = content.querySelector('.terminal-cursor');
    if (cursor) cursor.remove();

    // Add log entry
    const logEl = document.createElement('div');
    logEl.className = `log-entry ${logEntry.level}`;
    logEl.textContent = `[${logEntry.timestamp}] [${logEntry.level}] ${logEntry.message}`;
    content.appendChild(logEl);

    // Re-add cursor
    const newCursor = document.createElement('div');
    newCursor.className = 'terminal-cursor';
    newCursor.style.cssText = `
      width: 8px;
      height: 16px;
      background: var(--color-primary);
      display: inline-block;
      animation: blink 1s infinite;
    `;
    content.appendChild(newCursor);

    // Auto-scroll
    if (this.autoscroll) {
      content.scrollTop = content.scrollHeight;
    }
  }

  /**
   * Clear terminal
   */
  clear(): void {
    this.logs = [];

    if (this.element) {
      const content = this.element.querySelector('#terminalContent');
      if (content) {
        content.innerHTML = `
          <div class="terminal-cursor" style="
            width: 8px;
            height: 16px;
            background: var(--color-primary);
            display: inline-block;
            animation: blink 1s infinite;
          "></div>
        `;
      }
    }

    console.log('[TERMINAL] Cleared');
  }

  /**
   * Set autoscroll
   * @param enabled - Enable/disable autoscroll
   */
  setAutoscroll(enabled: boolean): void {
    this.autoscroll = enabled;
    console.log('[TERMINAL] Autoscroll:', enabled);
  }

  /**
   * Get all logs
   * @returns All log entries
   */
  getLogs(): LogEntry[] {
    return [...this.logs];
  }

  /**
   * Export logs as text
   * @returns Logs as plain text
   */
  exportLogs(): string {
    return this.logs
      .map((log) => `[${log.timestamp}] [${log.level}] ${log.message}`)
      .join('\n');
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
   * Unmount the component
   */
  unmount(): void {
    if (this.element && this.element.parentNode) {
      this.element.parentNode.removeChild(this.element);
      console.log('[TERMINAL] Unmounted');
    }
  }
}

export default Terminal;
