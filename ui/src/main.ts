/**
 * CCEM-UI Main Entry Point
 * Initializes the application and sets up routing
 */

import './styles/index.css';
import { Router } from './components/Router';
import { Navigation } from './components/Navigation';
import { CommandPalette, CommandItem } from './components/CommandPalette';
import {
  HomePage,
  SessionsPage,
  AgentsPage,
  ChatsPage,
  SettingsPage,
} from './pages';

/**
 * Application class
 * Handles initialization and coordination of all components
 */
class App {
  private router: Router;
  private navigation: Navigation;
  private commandPalette: CommandPalette;
  private currentPage: { unmount?: () => void } | null = null;

  constructor() {
    console.log('[APP] Initializing CCEM-UI...');

    // Initialize router
    this.router = new Router();

    // Initialize navigation
    this.navigation = new Navigation(this.router);

    // Initialize command palette
    this.commandPalette = new CommandPalette();

    // Setup error handling
    this.setupErrorHandling();

    // Register routes
    this.registerRoutes();

    // Setup event listeners
    this.setupEventListeners();

    console.log('[APP] Initialization complete');
  }

  /**
   * Setup global error handling
   */
  private setupErrorHandling(): void {
    // Catch unhandled errors
    window.addEventListener('error', (event: ErrorEvent) => {
      console.error('[APP] Unhandled error:', event.error);
      this.showError('An unexpected error occurred', event.error);
    });

    // Catch unhandled promise rejections
    window.addEventListener('unhandledrejection', (event: PromiseRejectionEvent) => {
      console.error('[APP] Unhandled promise rejection:', event.reason);
      this.showError('An unexpected error occurred', event.reason);
    });

    // Listen for 404 errors
    this.router.on('404', (data) => {
      console.warn('[APP] 404 Not Found:', data);
      this.show404(data.path);
    });
  }

  /**
   * Register all application routes
   */
  private registerRoutes(): void {
    console.log('[APP] Registering routes...');

    // Home route
    this.router.register('/', () => {
      console.log('[APP] Loading Home page');
      this.unmountCurrentPage();
      const homePage = new HomePage();
      homePage.mount('content');
      this.currentPage = homePage;
    });

    // Sessions route
    this.router.register('/sessions', () => {
      console.log('[APP] Loading Sessions page');
      this.unmountCurrentPage();
      const sessionsPage = new SessionsPage();
      sessionsPage.mount('content');
      this.currentPage = sessionsPage;
    });

    // Agents route
    this.router.register('/agents', () => {
      console.log('[APP] Loading Agents page');
      this.unmountCurrentPage();
      const agentsPage = new AgentsPage();
      agentsPage.mount('content');
      this.currentPage = agentsPage;
    });

    // Chats route
    this.router.register('/chats', () => {
      console.log('[APP] Loading Chats page');
      this.unmountCurrentPage();
      const chatsPage = new ChatsPage();
      chatsPage.mount('content');
      this.currentPage = chatsPage;
    });

    // Settings route
    this.router.register('/settings', () => {
      console.log('[APP] Loading Settings page');
      this.unmountCurrentPage();
      const settingsPage = new SettingsPage();
      settingsPage.mount('content');
      this.currentPage = settingsPage;
    });

    console.log('[APP] Routes registered');
  }

  /**
   * Setup event listeners
   */
  private setupEventListeners(): void {
    // Listen for navigation events
    this.navigation.on('open-command-palette', () => {
      console.log('[APP] Opening command palette');
      this.commandPalette.open();
    });

    this.navigation.on('toggle-sidebar', () => {
      console.log('[APP] Toggle sidebar');
      this.toggleSidebar();
    });

    this.navigation.on('preview', () => {
      console.log('[APP] Preview action');
      // TODO: Implement preview functionality
    });

    this.navigation.on('changes', () => {
      console.log('[APP] Changes action');
      // TODO: Implement changes functionality
    });

    // Listen for command palette executions
    this.commandPalette.setExecuteHandler((command: CommandItem) => {
      this.handleCommand(command);
    });
  }

  /**
   * Handle command palette command execution
   */
  private handleCommand(command: CommandItem): void {
    console.log('[APP] Executing command:', command.action);

    // Handle navigation commands
    if (command.action.startsWith('nav-') && command.path) {
      this.router.navigate(command.path);
      return;
    }

    // Handle other commands
    switch (command.action) {
      case 'new-chat':
        this.router.navigate('/chats');
        // TODO: Trigger new chat creation
        break;

      case 'new-agent':
        this.router.navigate('/agents');
        // TODO: Trigger new agent creation
        break;

      case 'browse-files':
        // TODO: Open file browser
        console.log('[APP] Browse files not implemented');
        break;

      case 'view-status':
        // TODO: Show status modal
        console.log('[APP] View status not implemented');
        break;

      case 'deploy-tdd':
      case 'quality-monitor':
      case 'deploy-agent':
      case 'fix-build':
        // TODO: Implement agent deployment
        console.log('[APP] Agent deployment not implemented:', command.action);
        break;

      default:
        console.warn('[APP] Unknown command:', command.action);
    }
  }

  /**
   * Unmount current page
   */
  private unmountCurrentPage(): void {
    if (this.currentPage && this.currentPage.unmount) {
      this.currentPage.unmount();
      this.currentPage = null;
    }
  }

  /**
   * Toggle sidebar visibility
   */
  private toggleSidebar(): void {
    const sidebar = document.getElementById('sidebar');
    if (sidebar) {
      sidebar.classList.toggle('hidden');
    }
  }

  /**
   * Show error message
   */
  private showError(message: string, error?: Error | unknown): void {
    console.error('[APP] Error:', message, error);

    // Create error notification
    const notification = document.createElement('div');
    notification.className = 'notification error';
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: var(--color-danger);
      color: white;
      padding: 16px 24px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      z-index: 10000;
      animation: slideInRight 0.3s ease-out;
    `;
    notification.textContent = message;

    document.body.appendChild(notification);

    // Auto-remove after 5 seconds
    setTimeout(() => {
      notification.remove();
    }, 5000);
  }

  /**
   * Show 404 page
   */
  private show404(path: string): void {
    this.unmountCurrentPage();

    const content = document.getElementById('content');
    if (!content) return;

    content.innerHTML = `
      <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; text-align: center; padding: 48px;">
        <h1 style="font-size: 72px; margin: 0;">404</h1>
        <p style="font-size: 24px; margin: 16px 0; color: var(--color-text-secondary);">Page Not Found</p>
        <p style="color: var(--color-text-tertiary); margin-bottom: 32px;">The page <code>${path}</code> does not exist.</p>
        <button class="btn btn-primary" onclick="window.location.href='/'">Go Home</button>
      </div>
    `;
  }

  /**
   * Mount the application
   */
  mount(): void {
    console.log('[APP] Mounting application...');

    // Mount navigation
    this.navigation.mount('nav-container');

    // Mount command palette
    this.commandPalette.mount('body');

    console.log('[APP] Application mounted');
  }
}

/**
 * Initialize the application when DOM is ready
 */
document.addEventListener('DOMContentLoaded', () => {
  console.log('[APP] DOM Content Loaded');

  // Create and mount app
  const app = new App();
  app.mount();

  console.log('[APP] CCEM-UI is ready');
});

/**
 * Log application info
 */
console.log(`
╔═══════════════════════════════════════════════════════════════╗
║                                                               ║
║   CCEM-UI - Claude Code Environment Manager                  ║
║   Version: 1.0.0                                              ║
║   Environment: development                                    ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝
`);
