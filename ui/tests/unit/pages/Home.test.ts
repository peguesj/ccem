/**
 * Home Page Unit Tests
 *
 * Comprehensive tests for the HomePage component
 * Coverage target: 95%+
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { HomePage, QuickAction, HomeStats } from '../../../src/pages/Home';

describe('HomePage', () => {
  let homePage: HomePage;
  let container: HTMLElement;

  beforeEach(() => {
    // Create a container for testing
    container = document.createElement('div');
    container.id = 'test-container';
    document.body.appendChild(container);

    // Create HomePage instance
    homePage = new HomePage();
  });

  afterEach(() => {
    // Clean up
    if (container.parentNode) {
      container.parentNode.removeChild(container);
    }
    vi.clearAllMocks();
  });

  describe('Initialization', () => {
    it('should create a new HomePage instance', () => {
      expect(homePage).toBeDefined();
      expect(homePage).toBeInstanceOf(HomePage);
    });

    it('should log initialization message', () => {
      const consoleSpy = vi.spyOn(console, 'log');
      new HomePage();
      expect(consoleSpy).toHaveBeenCalledWith('[SCREEN] HomePage initialized');
    });
  });

  describe('Rendering', () => {
    it('should render the home screen', () => {
      const element = homePage.render();

      expect(element).toBeDefined();
      expect(element.className).toContain('screen');
      expect(element.className).toContain('home-screen');
    });

    it('should render welcome heading', () => {
      const element = homePage.render();
      const heading = element.querySelector('h1');

      expect(heading).toBeDefined();
      expect(heading?.textContent).toContain('Welcome to CCEM-UI');
    });

    it('should render description text', () => {
      const element = homePage.render();
      const description = element.querySelector('p');

      expect(description).toBeDefined();
      expect(description?.textContent).toContain('Claude Code Environment Manager');
    });

    it('should render all four quick action cards', () => {
      const element = homePage.render();
      const cards = element.querySelectorAll('[data-action]');

      expect(cards).toHaveLength(4);
    });

    it('should render new-agent quick action card', () => {
      const element = homePage.render();
      const card = element.querySelector('[data-action="new-agent"]');

      expect(card).toBeDefined();
      expect(card?.textContent).toContain('New Agent');
      expect(card?.textContent).toContain('Deploy a specialized agent');
    });

    it('should render new-chat quick action card', () => {
      const element = homePage.render();
      const card = element.querySelector('[data-action="new-chat"]');

      expect(card).toBeDefined();
      expect(card?.textContent).toContain('New Chat');
      expect(card?.textContent).toContain('Start a conversation');
    });

    it('should render view-sessions quick action card', () => {
      const element = homePage.render();
      const card = element.querySelector('[data-action="view-sessions"]');

      expect(card).toBeDefined();
      expect(card?.textContent).toContain('Sessions');
      expect(card?.textContent).toContain('Monitor active sessions');
    });

    it('should render settings quick action card', () => {
      const element = homePage.render();
      const card = element.querySelector('[data-action="settings"]');

      expect(card).toBeDefined();
      expect(card?.textContent).toContain('Settings');
      expect(card?.textContent).toContain('Configure preferences');
    });

    it('should render Recent Activity section', () => {
      const element = homePage.render();
      const section = element.querySelector('#recentActivity');

      expect(section).toBeDefined();
      expect(section?.textContent).toContain('No recent activity');
    });

    it('should render System Status section', () => {
      const element = homePage.render();
      const activeAgents = element.querySelector('#activeAgentsCount');
      const openChats = element.querySelector('#openChatsCount');

      expect(activeAgents).toBeDefined();
      expect(openChats).toBeDefined();
      expect(activeAgents?.textContent).toBe('0');
      expect(openChats?.textContent).toBe('0');
    });

    it('should render keyboard shortcut hint', () => {
      const element = homePage.render();
      const kbd = element.querySelector('kbd');

      expect(kbd).toBeDefined();
      expect(kbd?.textContent).toContain('⌘K');
    });
  });

  describe('Quick Actions', () => {
    it('should handle new-agent action click', () => {
      const element = homePage.render();
      const eventSpy = vi.fn();
      window.addEventListener('home:action', eventSpy);

      const card = element.querySelector('[data-action="new-agent"]') as HTMLElement;
      card.click();

      expect(eventSpy).toHaveBeenCalled();
      const event = eventSpy.mock.calls[0][0] as CustomEvent;
      expect(event.detail.action).toBe('new-agent');

      window.removeEventListener('home:action', eventSpy);
    });

    it('should handle new-chat action click', () => {
      const element = homePage.render();
      const eventSpy = vi.fn();
      window.addEventListener('home:action', eventSpy);

      const card = element.querySelector('[data-action="new-chat"]') as HTMLElement;
      card.click();

      expect(eventSpy).toHaveBeenCalled();
      const event = eventSpy.mock.calls[0][0] as CustomEvent;
      expect(event.detail.action).toBe('new-chat');

      window.removeEventListener('home:action', eventSpy);
    });

    it('should handle view-sessions action click', () => {
      const element = homePage.render();
      const eventSpy = vi.fn();
      window.addEventListener('home:action', eventSpy);

      const card = element.querySelector('[data-action="view-sessions"]') as HTMLElement;
      card.click();

      expect(eventSpy).toHaveBeenCalled();
      const event = eventSpy.mock.calls[0][0] as CustomEvent;
      expect(event.detail.action).toBe('view-sessions');

      window.removeEventListener('home:action', eventSpy);
    });

    it('should handle settings action click', () => {
      const element = homePage.render();
      const eventSpy = vi.fn();
      window.addEventListener('home:action', eventSpy);

      const card = element.querySelector('[data-action="settings"]') as HTMLElement;
      card.click();

      expect(eventSpy).toHaveBeenCalled();
      const event = eventSpy.mock.calls[0][0] as CustomEvent;
      expect(event.detail.action).toBe('settings');

      window.removeEventListener('home:action', eventSpy);
    });

    it('should log quick action to console', () => {
      const element = homePage.render();
      const consoleSpy = vi.spyOn(console, 'log');

      const card = element.querySelector('[data-action="new-agent"]') as HTMLElement;
      card.click();

      expect(consoleSpy).toHaveBeenCalledWith('[HOME-SCREEN] Quick action:', 'new-agent');
    });
  });

  describe('Statistics Update', () => {
    it('should update active agents count', () => {
      const element = homePage.render();
      const stats: HomeStats = { activeAgents: 5 };

      homePage.updateStats(stats);

      const count = element.querySelector('#activeAgentsCount');
      expect(count?.textContent).toBe('5');
    });

    it('should update open chats count', () => {
      const element = homePage.render();
      const stats: HomeStats = { openChats: 3 };

      homePage.updateStats(stats);

      const count = element.querySelector('#openChatsCount');
      expect(count?.textContent).toBe('3');
    });

    it('should update both stats simultaneously', () => {
      const element = homePage.render();
      const stats: HomeStats = { activeAgents: 7, openChats: 4 };

      homePage.updateStats(stats);

      const agentsCount = element.querySelector('#activeAgentsCount');
      const chatsCount = element.querySelector('#openChatsCount');
      expect(agentsCount?.textContent).toBe('7');
      expect(chatsCount?.textContent).toBe('4');
    });

    it('should default to 0 when stats are undefined', () => {
      const element = homePage.render();
      const stats: HomeStats = {};

      homePage.updateStats(stats);

      const agentsCount = element.querySelector('#activeAgentsCount');
      const chatsCount = element.querySelector('#openChatsCount');
      expect(agentsCount?.textContent).toBe('0');
      expect(chatsCount?.textContent).toBe('0');
    });

    it('should log stats update to console', () => {
      homePage.render();
      const consoleSpy = vi.spyOn(console, 'log');
      const stats: HomeStats = { activeAgents: 2, openChats: 1 };

      homePage.updateStats(stats);

      expect(consoleSpy).toHaveBeenCalledWith('[HOME-SCREEN] Stats updated:', stats);
    });

    it('should not throw when updateStats called before render', () => {
      const stats: HomeStats = { activeAgents: 1 };

      expect(() => {
        homePage.updateStats(stats);
      }).not.toThrow();
    });
  });

  describe('Mounting', () => {
    it('should mount to container', () => {
      homePage.mount('test-container');

      expect(container.children.length).toBeGreaterThan(0);
      expect(container.querySelector('.home-screen')).toBeDefined();
    });

    it('should clear container before mounting', () => {
      container.innerHTML = '<div>Old content</div>';
      homePage.mount('test-container');

      expect(container.querySelector('div')?.textContent).not.toBe('Old content');
    });

    it('should log mount message', () => {
      const consoleSpy = vi.spyOn(console, 'log');
      homePage.mount('test-container');

      expect(consoleSpy).toHaveBeenCalledWith('[HOME-SCREEN] Mounted');
    });

    it('should log error when container not found', () => {
      const consoleSpy = vi.spyOn(console, 'error');
      homePage.mount('nonexistent-container');

      expect(consoleSpy).toHaveBeenCalledWith(
        '[HOME-SCREEN] Container not found:',
        'nonexistent-container'
      );
    });

    it('should not throw when container not found', () => {
      expect(() => {
        homePage.mount('nonexistent-container');
      }).not.toThrow();
    });
  });

  describe('Unmounting', () => {
    it('should unmount from parent', () => {
      homePage.mount('test-container');
      const initialChildren = container.children.length;

      homePage.unmount();

      expect(container.children.length).toBeLessThan(initialChildren);
    });

    it('should log unmount message', () => {
      homePage.mount('test-container');
      const consoleSpy = vi.spyOn(console, 'log');

      homePage.unmount();

      expect(consoleSpy).toHaveBeenCalledWith('[HOME-SCREEN] Unmounted');
    });

    it('should not throw when unmounting without mounting', () => {
      expect(() => {
        homePage.unmount();
      }).not.toThrow();
    });

    it('should not throw when unmounting twice', () => {
      homePage.mount('test-container');
      homePage.unmount();

      expect(() => {
        homePage.unmount();
      }).not.toThrow();
    });
  });

  describe('Integration Tests', () => {
    it('should support full lifecycle: mount, interact, update, unmount', () => {
      // Mount
      homePage.mount('test-container');
      expect(container.querySelector('.home-screen')).toBeDefined();

      // Interact
      const eventSpy = vi.fn();
      window.addEventListener('home:action', eventSpy);
      const card = container.querySelector('[data-action="new-agent"]') as HTMLElement;
      card.click();
      expect(eventSpy).toHaveBeenCalled();

      // Update stats
      homePage.updateStats({ activeAgents: 5, openChats: 3 });
      const agentsCount = container.querySelector('#activeAgentsCount');
      expect(agentsCount?.textContent).toBe('5');

      // Unmount
      homePage.unmount();
      expect(container.children.length).toBe(0);

      window.removeEventListener('home:action', eventSpy);
    });

    it('should handle multiple re-renders', () => {
      const element1 = homePage.render();
      const element2 = homePage.render();

      expect(element1).toBeDefined();
      expect(element2).toBeDefined();
      expect(element1).not.toBe(element2);
    });

    it('should maintain state across remounts', () => {
      homePage.mount('test-container');
      homePage.updateStats({ activeAgents: 10, openChats: 5 });
      homePage.unmount();

      homePage.mount('test-container');
      homePage.updateStats({ activeAgents: 15, openChats: 8 });

      const agentsCount = container.querySelector('#activeAgentsCount');
      const chatsCount = container.querySelector('#openChatsCount');
      expect(agentsCount?.textContent).toBe('15');
      expect(chatsCount?.textContent).toBe('8');
    });
  });

  describe('Accessibility', () => {
    it('should have proper heading hierarchy', () => {
      const element = homePage.render();
      const h1 = element.querySelector('h1');
      const h3 = element.querySelectorAll('h3');

      expect(h1).toBeDefined();
      expect(h3.length).toBeGreaterThan(0);
    });

    it('should have clickable card elements', () => {
      const element = homePage.render();
      const cards = element.querySelectorAll('[data-action]');

      cards.forEach((card) => {
        expect(card.getAttribute('data-action')).toBeTruthy();
        // Card should have cursor:pointer in inline styles
        const htmlCard = card as HTMLElement;
        expect(htmlCard.style.cursor || htmlCard.className).toBeTruthy();
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle rapid stat updates', () => {
      const element = homePage.render();

      for (let i = 1; i <= 100; i++) {
        homePage.updateStats({ activeAgents: i, openChats: i * 2 });
      }

      const agentsCount = element.querySelector('#activeAgentsCount');
      const chatsCount = element.querySelector('#openChatsCount');
      expect(agentsCount?.textContent).toBe('100');
      expect(chatsCount?.textContent).toBe('200');
    });

    it('should handle large stat values', () => {
      const element = homePage.render();
      homePage.updateStats({ activeAgents: 999999, openChats: 888888 });

      const agentsCount = element.querySelector('#activeAgentsCount');
      const chatsCount = element.querySelector('#openChatsCount');
      expect(agentsCount?.textContent).toBe('999999');
      expect(chatsCount?.textContent).toBe('888888');
    });

    it('should handle negative stat values gracefully', () => {
      const element = homePage.render();
      homePage.updateStats({ activeAgents: -5, openChats: -3 });

      const agentsCount = element.querySelector('#activeAgentsCount');
      const chatsCount = element.querySelector('#openChatsCount');
      expect(agentsCount?.textContent).toBe('-5');
      expect(chatsCount?.textContent).toBe('-3');
    });
  });
});
