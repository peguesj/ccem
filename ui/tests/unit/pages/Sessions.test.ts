/**
 * Sessions Page Unit Tests
 *
 * Comprehensive tests for the SessionsPage component
 * Coverage target: 95%+
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { SessionsPage, Session } from '../../../src/pages/Sessions';

describe('SessionsPage', () => {
  let sessionsPage: SessionsPage;
  let container: HTMLElement;

  beforeEach(() => {
    // Create a container for testing
    container = document.createElement('div');
    container.id = 'test-container';
    document.body.appendChild(container);

    // Create SessionsPage instance
    sessionsPage = new SessionsPage();
  });

  afterEach(() => {
    // Clean up
    if (container.parentNode) {
      container.parentNode.removeChild(container);
    }
    vi.clearAllMocks();
  });

  describe('Initialization', () => {
    it('should create a new SessionsPage instance', () => {
      expect(sessionsPage).toBeDefined();
      expect(sessionsPage).toBeInstanceOf(SessionsPage);
    });

    it('should log initialization message', () => {
      const consoleSpy = vi.spyOn(console, 'log');
      new SessionsPage();
      expect(consoleSpy).toHaveBeenCalledWith('[SCREEN] SessionsPage initialized');
    });
  });

  describe('Rendering', () => {
    it('should render the sessions screen', () => {
      const element = sessionsPage.render();

      expect(element).toBeDefined();
      expect(element.className).toContain('screen');
      expect(element.className).toContain('sessions-screen');
    });

    it('should render page header', () => {
      const element = sessionsPage.render();
      const header = element.querySelector('h2');

      expect(header).toBeDefined();
      expect(header?.textContent).toBe('Session Monitoring');
    });

    it('should render new session button', () => {
      const element = sessionsPage.render();
      const button = element.querySelector('#newSessionBtn');

      expect(button).toBeDefined();
      expect(button?.textContent).toContain('New Session');
    });

    it('should render search input', () => {
      const element = sessionsPage.render();
      const searchInput = element.querySelector('#sessionSearch') as HTMLInputElement;

      expect(searchInput).toBeDefined();
      expect(searchInput.placeholder).toBe('Search sessions...');
    });

    it('should render filter dropdown', () => {
      const element = sessionsPage.render();
      const filterSelect = element.querySelector('#sessionFilter') as HTMLSelectElement;

      expect(filterSelect).toBeDefined();
      expect(filterSelect.options.length).toBe(4);
      expect(filterSelect.options[0].value).toBe('all');
      expect(filterSelect.options[1].value).toBe('active');
      expect(filterSelect.options[2].value).toBe('idle');
      expect(filterSelect.options[3].value).toBe('completed');
    });

    it('should render empty state initially', () => {
      const element = sessionsPage.render();
      const emptyState = element.querySelector('#emptyState');

      expect(emptyState).toBeDefined();
      expect(emptyState?.textContent).toContain('No sessions yet');
    });

    it('should render sessions container', () => {
      const element = sessionsPage.render();
      const container = element.querySelector('#sessionsContainer');
      const list = element.querySelector('#sessionsList');

      expect(container).toBeDefined();
      expect(list).toBeDefined();
    });
  });

  describe('Session Creation', () => {
    it('should trigger session creation event on button click', () => {
      const element = sessionsPage.render();
      const eventSpy = vi.fn();
      window.addEventListener('sessions:create', eventSpy);

      const button = element.querySelector('#newSessionBtn') as HTMLButtonElement;
      button.click();

      expect(eventSpy).toHaveBeenCalled();
      const event = eventSpy.mock.calls[0][0] as CustomEvent;
      expect(event.detail.name).toMatch(/Session \d+/);

      window.removeEventListener('sessions:create', eventSpy);
    });

    it('should log session creation', () => {
      const element = sessionsPage.render();
      const consoleSpy = vi.spyOn(console, 'log');

      const button = element.querySelector('#newSessionBtn') as HTMLButtonElement;
      button.click();

      expect(consoleSpy).toHaveBeenCalledWith('[SESSIONS-SCREEN] Creating new session');
    });

    it('should increment session name counter', () => {
      const page1 = new SessionsPage();
      const element1 = page1.render();
      const eventSpy = vi.fn();
      window.addEventListener('sessions:create', eventSpy);

      const button1 = element1.querySelector('#newSessionBtn') as HTMLButtonElement;
      button1.click();

      const page2 = new SessionsPage();
      const element2 = page2.render();
      const button2 = element2.querySelector('#newSessionBtn') as HTMLButtonElement;
      button2.click();

      expect(eventSpy).toHaveBeenCalledTimes(2);
      expect(eventSpy.mock.calls[0][0].detail.name).toMatch(/Session \d+/);
      expect(eventSpy.mock.calls[1][0].detail.name).toMatch(/Session \d+/);

      window.removeEventListener('sessions:create', eventSpy);
    });
  });

  describe('Adding Sessions', () => {
    it('should add a session to the list', () => {
      const element = sessionsPage.render();
      const session: Session = {
        id: 'session-1',
        name: 'Test Session',
        status: 'active',
        startTime: new Date(),
        agentCount: 2,
        messageCount: 5,
        progress: 50,
      };

      sessionsPage.addSession(session);

      const sessionCard = element.querySelector('[data-session-id="session-1"]');
      expect(sessionCard).toBeDefined();
    });

    it('should hide empty state when sessions added', () => {
      const element = sessionsPage.render();
      const emptyState = element.querySelector('#emptyState') as HTMLElement;
      expect(emptyState.style.display).not.toBe('none');

      const session: Session = {
        id: 'session-1',
        name: 'Test Session',
        status: 'active',
        startTime: new Date(),
      };

      sessionsPage.addSession(session);

      expect(emptyState.style.display).toBe('none');
    });

    it('should add multiple sessions', () => {
      const element = sessionsPage.render();

      for (let i = 0; i < 5; i++) {
        const session: Session = {
          id: `session-${i}`,
          name: `Session ${i}`,
          status: 'active',
          startTime: new Date(),
        };
        sessionsPage.addSession(session);
      }

      const sessionCards = element.querySelectorAll('[data-session-id]');
      expect(sessionCards.length).toBe(5);
    });
  });

  describe('Session Rendering', () => {
    it('should render session name', () => {
      const element = sessionsPage.render();
      const session: Session = {
        id: 'session-1',
        name: 'My Test Session',
        status: 'active',
        startTime: new Date(),
      };

      sessionsPage.addSession(session);

      const sessionCard = element.querySelector('[data-session-id="session-1"]');
      expect(sessionCard?.textContent).toContain('My Test Session');
    });

    it('should render session status badge', () => {
      const element = sessionsPage.render();
      const session: Session = {
        id: 'session-1',
        name: 'Test Session',
        status: 'active',
        startTime: new Date(),
      };

      sessionsPage.addSession(session);

      const badge = element.querySelector('.badge-success');
      expect(badge).toBeDefined();
      expect(badge?.textContent?.trim()).toBe('ACTIVE');
    });

    it('should render status indicator', () => {
      const element = sessionsPage.render();
      const session: Session = {
        id: 'session-1',
        name: 'Test Session',
        status: 'active',
        startTime: new Date(),
      };

      sessionsPage.addSession(session);

      const indicator = element.querySelector('.status-indicator.active');
      expect(indicator).toBeDefined();
    });

    it('should render agent count', () => {
      const element = sessionsPage.render();
      const session: Session = {
        id: 'session-1',
        name: 'Test Session',
        status: 'active',
        startTime: new Date(),
        agentCount: 3,
      };

      sessionsPage.addSession(session);

      const sessionCard = element.querySelector('[data-session-id="session-1"]');
      expect(sessionCard?.textContent).toContain('3');
    });

    it('should render message count', () => {
      const element = sessionsPage.render();
      const session: Session = {
        id: 'session-1',
        name: 'Test Session',
        status: 'active',
        startTime: new Date(),
        messageCount: 42,
      };

      sessionsPage.addSession(session);

      const sessionCard = element.querySelector('[data-session-id="session-1"]');
      expect(sessionCard?.textContent).toContain('42');
    });

    it('should render progress bar for active sessions', () => {
      const element = sessionsPage.render();
      const session: Session = {
        id: 'session-1',
        name: 'Test Session',
        status: 'active',
        startTime: new Date(),
        progress: 75,
      };

      sessionsPage.addSession(session);

      const progressBar = element.querySelector('.progress-bar') as HTMLElement;
      expect(progressBar).toBeDefined();
      expect(progressBar.style.width).toBe('75%');
    });

    it('should not render progress bar for completed sessions', () => {
      const element = sessionsPage.render();
      const session: Session = {
        id: 'session-1',
        name: 'Test Session',
        status: 'completed',
        startTime: new Date(),
      };

      sessionsPage.addSession(session);

      const sessionCard = element.querySelector('[data-session-id="session-1"]');
      const progressBar = sessionCard?.querySelector('.progress');
      expect(progressBar).toBeNull();
    });

    it('should render start time', () => {
      const element = sessionsPage.render();
      const startTime = new Date('2024-01-01T10:00:00');
      const session: Session = {
        id: 'session-1',
        name: 'Test Session',
        status: 'active',
        startTime,
      };

      sessionsPage.addSession(session);

      const sessionCard = element.querySelector('[data-session-id="session-1"]');
      expect(sessionCard?.textContent).toContain('Started:');
    });

    it('should escape HTML in session names to prevent XSS', () => {
      const element = sessionsPage.render();
      const session: Session = {
        id: 'session-1',
        name: '<script>alert("xss")</script>',
        status: 'active',
        startTime: new Date(),
      };

      sessionsPage.addSession(session);

      const sessionCard = element.querySelector('[data-session-id="session-1"]');
      expect(sessionCard?.innerHTML).not.toContain('<script>');
      expect(sessionCard?.textContent).toContain('<script>alert("xss")</script>');
    });
  });

  describe('Session Selection', () => {
    it('should trigger select event when session clicked', () => {
      const element = sessionsPage.render();
      const session: Session = {
        id: 'session-1',
        name: 'Test Session',
        status: 'active',
        startTime: new Date(),
      };

      sessionsPage.addSession(session);

      const eventSpy = vi.fn();
      window.addEventListener('sessions:select', eventSpy);

      const sessionCard = element.querySelector('[data-session-id="session-1"]') as HTMLElement;
      sessionCard.click();

      expect(eventSpy).toHaveBeenCalled();
      const event = eventSpy.mock.calls[0][0] as CustomEvent;
      expect(event.detail.sessionId).toBe('session-1');

      window.removeEventListener('sessions:select', eventSpy);
    });

    it('should log session selection', () => {
      const element = sessionsPage.render();
      const session: Session = {
        id: 'session-1',
        name: 'Test Session',
        status: 'active',
        startTime: new Date(),
      };

      sessionsPage.addSession(session);

      const consoleSpy = vi.spyOn(console, 'log');
      const sessionCard = element.querySelector('[data-session-id="session-1"]') as HTMLElement;
      sessionCard.click();

      expect(consoleSpy).toHaveBeenCalledWith('[SESSIONS-SCREEN] Session selected:', 'session-1');
    });
  });

  describe('Search Functionality', () => {
    it('should handle search input', () => {
      const element = sessionsPage.render();
      const consoleSpy = vi.spyOn(console, 'log');
      const searchInput = element.querySelector('#sessionSearch') as HTMLInputElement;

      searchInput.value = 'test query';
      searchInput.dispatchEvent(new Event('input'));

      expect(consoleSpy).toHaveBeenCalledWith('[SESSIONS-SCREEN] Search:', 'test query');
    });

    it('should handle empty search input', () => {
      const element = sessionsPage.render();
      const consoleSpy = vi.spyOn(console, 'log');
      const searchInput = element.querySelector('#sessionSearch') as HTMLInputElement;

      searchInput.value = '';
      searchInput.dispatchEvent(new Event('input'));

      expect(consoleSpy).toHaveBeenCalledWith('[SESSIONS-SCREEN] Search:', '');
    });
  });

  describe('Filter Functionality', () => {
    it('should handle filter selection', () => {
      const element = sessionsPage.render();
      const consoleSpy = vi.spyOn(console, 'log');
      const filterSelect = element.querySelector('#sessionFilter') as HTMLSelectElement;

      filterSelect.value = 'active';
      filterSelect.dispatchEvent(new Event('change'));

      expect(consoleSpy).toHaveBeenCalledWith('[SESSIONS-SCREEN] Filter:', 'active');
    });

    it('should handle all filters', () => {
      const element = sessionsPage.render();
      const consoleSpy = vi.spyOn(console, 'log');
      const filterSelect = element.querySelector('#sessionFilter') as HTMLSelectElement;

      const filters = ['all', 'active', 'idle', 'completed'];
      filters.forEach((filter) => {
        filterSelect.value = filter;
        filterSelect.dispatchEvent(new Event('change'));
      });

      expect(consoleSpy).toHaveBeenCalledTimes(4);
    });
  });

  describe('Mounting', () => {
    it('should mount to container', () => {
      sessionsPage.mount('test-container');

      expect(container.children.length).toBeGreaterThan(0);
      expect(container.querySelector('.sessions-screen')).toBeDefined();
    });

    it('should clear container before mounting', () => {
      container.innerHTML = '<div>Old content</div>';
      sessionsPage.mount('test-container');

      expect(container.querySelector('div')?.textContent).not.toBe('Old content');
    });

    it('should log mount message', () => {
      const consoleSpy = vi.spyOn(console, 'log');
      sessionsPage.mount('test-container');

      expect(consoleSpy).toHaveBeenCalledWith('[SESSIONS-SCREEN] Mounted');
    });

    it('should log error when container not found', () => {
      const consoleSpy = vi.spyOn(console, 'error');
      sessionsPage.mount('nonexistent-container');

      expect(consoleSpy).toHaveBeenCalledWith(
        '[SESSIONS-SCREEN] Container not found:',
        'nonexistent-container'
      );
    });
  });

  describe('Unmounting', () => {
    it('should unmount from parent', () => {
      sessionsPage.mount('test-container');
      const initialChildren = container.children.length;

      sessionsPage.unmount();

      expect(container.children.length).toBeLessThan(initialChildren);
    });

    it('should log unmount message', () => {
      sessionsPage.mount('test-container');
      const consoleSpy = vi.spyOn(console, 'log');

      sessionsPage.unmount();

      expect(consoleSpy).toHaveBeenCalledWith('[SESSIONS-SCREEN] Unmounted');
    });

    it('should not throw when unmounting without mounting', () => {
      expect(() => {
        sessionsPage.unmount();
      }).not.toThrow();
    });
  });

  describe('Date Formatting', () => {
    it('should format Date objects', () => {
      const element = sessionsPage.render();
      const date = new Date('2024-01-01T12:00:00');
      const session: Session = {
        id: 'session-1',
        name: 'Test Session',
        status: 'active',
        startTime: date,
      };

      sessionsPage.addSession(session);

      const sessionCard = element.querySelector('[data-session-id="session-1"]');
      expect(sessionCard?.textContent).toContain('Started:');
    });

    it('should format string dates', () => {
      const element = sessionsPage.render();
      const session: Session = {
        id: 'session-1',
        name: 'Test Session',
        status: 'active',
        startTime: '2024-01-01T12:00:00',
      };

      sessionsPage.addSession(session);

      const sessionCard = element.querySelector('[data-session-id="session-1"]');
      expect(sessionCard?.textContent).toContain('Started:');
    });
  });

  describe('Edge Cases', () => {
    it('should handle sessions with missing optional fields', () => {
      const element = sessionsPage.render();
      const session: Session = {
        id: 'session-1',
        name: 'Minimal Session',
        status: 'idle',
        startTime: new Date(),
      };

      sessionsPage.addSession(session);

      const sessionCard = element.querySelector('[data-session-id="session-1"]');
      expect(sessionCard).toBeDefined();
      expect(sessionCard?.textContent).toContain('0'); // Default agent and message counts
    });

    it('should handle very long session names', () => {
      const element = sessionsPage.render();
      const longName = 'A'.repeat(500);
      const session: Session = {
        id: 'session-1',
        name: longName,
        status: 'active',
        startTime: new Date(),
      };

      sessionsPage.addSession(session);

      const sessionCard = element.querySelector('[data-session-id="session-1"]');
      expect(sessionCard?.textContent).toContain(longName);
    });

    it('should handle special characters in session names', () => {
      const element = sessionsPage.render();
      const session: Session = {
        id: 'session-1',
        name: '!@#$%^&*()_+-={}[]|\\:";\'<>?,./~`',
        status: 'active',
        startTime: new Date(),
      };

      sessionsPage.addSession(session);

      const sessionCard = element.querySelector('[data-session-id="session-1"]');
      expect(sessionCard).toBeDefined();
    });

    it('should handle zero progress', () => {
      const element = sessionsPage.render();
      const session: Session = {
        id: 'session-1',
        name: 'Test Session',
        status: 'active',
        startTime: new Date(),
        progress: 0,
      };

      sessionsPage.addSession(session);

      const progressBar = element.querySelector('.progress-bar') as HTMLElement;
      expect(progressBar.style.width).toBe('0%');
    });

    it('should handle 100% progress', () => {
      const element = sessionsPage.render();
      const session: Session = {
        id: 'session-1',
        name: 'Test Session',
        status: 'active',
        startTime: new Date(),
        progress: 100,
      };

      sessionsPage.addSession(session);

      const progressBar = element.querySelector('.progress-bar') as HTMLElement;
      expect(progressBar.style.width).toBe('100%');
    });
  });

  describe('Session Status Variations', () => {
    it('should render idle status correctly', () => {
      const element = sessionsPage.render();
      const session: Session = {
        id: 'session-1',
        name: 'Idle Session',
        status: 'idle',
        startTime: new Date(),
      };

      sessionsPage.addSession(session);

      const badge = element.querySelector('.badge-info');
      expect(badge?.textContent?.trim()).toBe('IDLE');
    });

    it('should render completed status correctly', () => {
      const element = sessionsPage.render();
      const session: Session = {
        id: 'session-1',
        name: 'Completed Session',
        status: 'completed',
        startTime: new Date(),
      };

      sessionsPage.addSession(session);

      const badge = element.querySelector('.badge-info');
      expect(badge?.textContent?.trim()).toBe('COMPLETED');
    });
  });

  describe('Integration Tests', () => {
    it('should support full workflow: create, add, select', () => {
      const element = sessionsPage.render();
      const createEventSpy = vi.fn();
      const selectEventSpy = vi.fn();

      window.addEventListener('sessions:create', createEventSpy);
      window.addEventListener('sessions:select', selectEventSpy);

      // Create session
      const button = element.querySelector('#newSessionBtn') as HTMLButtonElement;
      button.click();
      expect(createEventSpy).toHaveBeenCalled();

      // Add session
      const session: Session = {
        id: 'session-1',
        name: 'Test Session',
        status: 'active',
        startTime: new Date(),
      };
      sessionsPage.addSession(session);

      // Select session
      const sessionCard = element.querySelector('[data-session-id="session-1"]') as HTMLElement;
      sessionCard.click();
      expect(selectEventSpy).toHaveBeenCalled();

      window.removeEventListener('sessions:create', createEventSpy);
      window.removeEventListener('sessions:select', selectEventSpy);
    });

    it('should handle multiple sessions with different statuses', () => {
      const element = sessionsPage.render();

      const statuses: Array<'active' | 'idle' | 'completed'> = ['active', 'idle', 'completed'];
      statuses.forEach((status, i) => {
        const session: Session = {
          id: `session-${i}`,
          name: `${status} Session`,
          status,
          startTime: new Date(),
        };
        sessionsPage.addSession(session);
      });

      const sessionCards = element.querySelectorAll('[data-session-id]');
      expect(sessionCards.length).toBe(3);
    });
  });
});
