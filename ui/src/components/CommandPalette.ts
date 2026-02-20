/**
 * CCEM-UI CommandPalette Component
 * Quick command access via keyboard shortcut (⌘K)
 */

/**
 * Command item interface
 */
export interface CommandItem {
  title: string;
  desc: string;
  icon?: string;
  action: string;
  path?: string;
  shortcut?: string;
}

/**
 * Command category interface
 */
export interface CommandCategory {
  category: string;
  items: CommandItem[];
}

/**
 * Command execute handler type
 */
export type CommandExecuteHandler = (command: CommandItem) => void;

/**
 * CommandPalette component for quick command access
 */
export class CommandPalette {
  private isOpen = false;
  private commands: CommandCategory[];
  private element: HTMLElement | null = null;
  private onExecute: CommandExecuteHandler | null = null;

  /**
   * Creates a new CommandPalette instance
   */
  constructor() {
    this.commands = this.getDefaultCommands();

    console.log('[COMPONENT] CommandPalette initialized');

    // Setup keyboard listener
    this.setupKeyboardShortcuts();
  }

  /**
   * Get default commands
   * @returns Command categories
   */
  private getDefaultCommands(): CommandCategory[] {
    return [
      {
        category: 'NAVIGATION',
        items: [
          {
            title: 'Go to Home',
            desc: 'Navigate to home screen',
            icon: '🏠',
            action: 'nav-home',
            path: '/',
          },
          {
            title: 'Go to Sessions',
            desc: 'View session monitoring',
            icon: '📊',
            action: 'nav-sessions',
            path: '/sessions',
          },
          {
            title: 'Go to Agents',
            desc: 'Manage agents',
            icon: '🤖',
            action: 'nav-agents',
            path: '/agents',
          },
          {
            title: 'Go to Chats',
            desc: 'View chat interface',
            icon: '💬',
            action: 'nav-chats',
            path: '/chats',
          },
          {
            title: 'Go to Settings',
            desc: 'Configure settings',
            icon: '⚙️',
            action: 'nav-settings',
            path: '/settings',
          },
        ],
      },
      {
        category: 'AGENT TEMPLATES',
        items: [
          {
            title: 'Deploy TDD Squadron',
            desc: 'Spawn test-driven development agent team',
            icon: '🤖',
            action: 'deploy-tdd',
          },
          {
            title: 'Quality Monitor',
            desc: 'Monitor build, test, and lint processes',
            icon: '🔍',
            action: 'quality-monitor',
          },
          {
            title: 'Deployment Agent',
            desc: 'Monitor Vercel deployment status',
            icon: '🚀',
            action: 'deploy-agent',
          },
          {
            title: 'Fix Build Agent',
            desc: 'Fix TypeScript and build errors',
            icon: '🔧',
            action: 'fix-build',
          },
        ],
      },
      {
        category: 'QUICK ACTIONS',
        items: [
          {
            title: 'New Chat',
            desc: 'Start a new chat session',
            icon: '➕',
            action: 'new-chat',
          },
          {
            title: 'New Agent',
            desc: 'Create a new agent',
            icon: '🤖',
            action: 'new-agent',
          },
          {
            title: 'Browse Files',
            desc: 'Open file browser',
            icon: '📁',
            action: 'browse-files',
          },
          {
            title: 'View Status',
            desc: 'Show system status',
            icon: '📈',
            action: 'view-status',
          },
        ],
      },
    ];
  }

  /**
   * Setup keyboard shortcuts
   */
  private setupKeyboardShortcuts(): void {
    document.addEventListener('keydown', (e: KeyboardEvent) => {
      // ⌘K or Ctrl+K to toggle
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        this.toggle();
      }

      // ESC to close
      if (e.key === 'Escape' && this.isOpen) {
        this.close();
      }

      // Arrow keys to navigate
      if (this.isOpen) {
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          this.selectNext();
        } else if (e.key === 'ArrowUp') {
          e.preventDefault();
          this.selectPrevious();
        } else if (e.key === 'Enter') {
          e.preventDefault();
          this.executeSelected();
        }
      }
    });
  }

  /**
   * Mount the command palette
   * @param containerId - Container element ID (defaults to 'body')
   */
  mount(containerId = 'body'): void {
    const container =
      containerId === 'body' ? document.body : document.getElementById(containerId);

    if (!container) {
      console.error('[COMMAND-PALETTE] Container not found:', containerId);
      return;
    }

    this.element = this.render();
    container.appendChild(this.element);

    console.log('[COMMAND-PALETTE] Mounted to:', containerId);
  }

  /**
   * Render the command palette
   * @returns Command palette element
   */
  private render(): HTMLElement {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.id = 'commandPaletteOverlay';

    overlay.innerHTML = `
      <div class="modal" style="max-width: 600px;">
        <div class="modal-header">
          <div class="flex items-center gap-2">
            <span>🔍</span>
            <input type="text"
                   class="input"
                   id="commandSearch"
                   placeholder="Type a command or search..."
                   style="border: none; background: transparent; flex: 1;">
          </div>
          <span class="text-xs text-tertiary">ESC</span>
        </div>

        <div class="modal-body" id="commandPaletteContent" style="padding: 0; max-height: 400px;">
          <!-- Commands will be rendered here -->
        </div>

        <div class="modal-footer" style="justify-content: space-between;">
          <div class="flex items-center gap-4 text-xs text-tertiary">
            <span><kbd>↑↓</kbd> Navigate</span>
            <span><kbd>↵</kbd> Select</span>
            <span><kbd>ESC</kbd> Close</span>
          </div>
          <span class="text-xs text-tertiary"><kbd>⌘K</kbd> Toggle</span>
        </div>
      </div>
    `;

    // Attach event listeners
    overlay.addEventListener('click', (e: MouseEvent) => {
      if (e.target === overlay) {
        this.close();
      }
    });

    const searchInput = overlay.querySelector('#commandSearch') as HTMLInputElement;
    if (searchInput) {
      searchInput.addEventListener('input', (e: Event) => {
        const target = e.target as HTMLInputElement;
        this.search(target.value);
      });
    }

    this.element = overlay;
    return overlay;
  }

  /**
   * Render commands
   * @param commands - Commands to render (defaults to all commands)
   */
  private renderCommands(commands: CommandCategory[] = this.commands): void {
    if (!this.element) return;

    const content = this.element.querySelector('#commandPaletteContent');
    if (!content) return;

    content.innerHTML = '';

    commands.forEach((category, catIndex) => {
      const section = document.createElement('div');
      section.style.cssText = 'padding: 12px 0;';

      const title = document.createElement('div');
      title.className = 'text-xs text-tertiary font-medium px-6 mb-2';
      title.textContent = category.category;
      section.appendChild(title);

      category.items.forEach((item, itemIndex) => {
        const commandItem = document.createElement('div');
        commandItem.className = 'flex items-center gap-3 px-6 py-3 cursor-pointer transition-fast';
        commandItem.style.cssText = 'hover:background-color: var(--color-bg-tertiary);';

        commandItem.innerHTML = `
          ${item.icon ? `<span style="font-size: 20px;">${item.icon}</span>` : ''}
          <div class="flex-1">
            <div class="text-sm font-medium text-primary">${this.escapeHtml(item.title)}</div>
            <div class="text-xs text-tertiary">${this.escapeHtml(item.desc)}</div>
          </div>
          ${item.shortcut ? `<span class="text-xs text-tertiary">${this.escapeHtml(item.shortcut)}</span>` : ''}
        `;

        commandItem.addEventListener('click', () => this.execute(item));

        // Highlight first item
        if (catIndex === 0 && itemIndex === 0) {
          commandItem.style.backgroundColor = 'var(--color-bg-tertiary)';
        }

        section.appendChild(commandItem);
      });

      content.appendChild(section);
    });
  }

  /**
   * Toggle command palette
   */
  toggle(): void {
    if (this.isOpen) {
      this.close();
    } else {
      this.open();
    }
  }

  /**
   * Open command palette
   */
  open(): void {
    if (!this.element) return;

    this.isOpen = true;
    this.element.classList.add('active');

    const searchInput = this.element.querySelector('#commandSearch') as HTMLInputElement;
    if (searchInput) {
      searchInput.value = '';
      searchInput.focus();
    }

    this.renderCommands();

    console.log('[COMMAND-PALETTE] Opened');
  }

  /**
   * Close command palette
   */
  close(): void {
    if (!this.element) return;

    this.isOpen = false;
    this.element.classList.remove('active');

    console.log('[COMMAND-PALETTE] Closed');
  }

  /**
   * Search commands
   * @param query - Search query
   */
  private search(query: string): void {
    const lowerQuery = query.toLowerCase();

    const filtered = this.commands
      .map((category) => ({
        ...category,
        items: category.items.filter(
          (item) =>
            item.title.toLowerCase().includes(lowerQuery) ||
            item.desc.toLowerCase().includes(lowerQuery)
        ),
      }))
      .filter((category) => category.items.length > 0);

    console.log('[COMMAND-PALETTE] Search:', query, 'Results:', filtered.length);

    this.renderCommands(filtered);
  }

  /**
   * Execute command
   * @param command - Command to execute
   */
  private execute(command: CommandItem): void {
    console.log('[COMMAND-PALETTE] Executing:', command.action);

    // Emit event
    this.emit('execute', command);

    // Call handler if set
    if (this.onExecute) {
      this.onExecute(command);
    }

    this.close();
  }

  /**
   * Select next command (keyboard navigation)
   */
  private selectNext(): void {
    // TODO: Implement keyboard navigation
    console.log('[COMMAND-PALETTE] Select next');
  }

  /**
   * Select previous command (keyboard navigation)
   */
  private selectPrevious(): void {
    // TODO: Implement keyboard navigation
    console.log('[COMMAND-PALETTE] Select previous');
  }

  /**
   * Execute selected command (keyboard selection)
   */
  private executeSelected(): void {
    // TODO: Implement keyboard selection
    console.log('[COMMAND-PALETTE] Execute selected');
  }

  /**
   * Set execute handler
   * @param handler - Execute handler function
   */
  setExecuteHandler(handler: CommandExecuteHandler): void {
    this.onExecute = handler;
  }

  /**
   * Emit component events
   * @param event - Event name
   * @param data - Event data
   */
  private emit(event: string, data: CommandItem): void {
    const customEvent = new CustomEvent(`command-palette:${event}`, { detail: data });
    window.dispatchEvent(customEvent);
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
      console.log('[COMMAND-PALETTE] Unmounted');
    }
  }
}

export default CommandPalette;
