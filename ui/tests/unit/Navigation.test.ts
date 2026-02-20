/**
 * Navigation Unit Tests
 *
 * Comprehensive tests for the Navigation component demonstrating TDD patterns:
 * - Red phase: Write failing tests first
 * - Green phase: Implement minimal code to pass
 * - Refactor phase: Optimize while maintaining tests
 *
 * Coverage target: 95%+
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { Navigation } from '../../src/components/Navigation';
import { Router } from '../../src/components/Router';

describe('Navigation', () => {
  let navigation: Navigation;
  let router: Router;
  let container: HTMLElement;

  beforeEach(() => {
    // Reset history
    window.history.replaceState({}, '', '/');

    // Create router and navigation
    router = new Router();
    navigation = new Navigation(router);

    // Create container
    container = document.createElement('div');
    container.id = 'nav-container';
    document.body.appendChild(container);
  });

  afterEach(() => {
    // Clean up
    navigation.unmount();
    document.body.removeChild(container);
    vi.clearAllMocks();
  });

  describe('Component Creation', () => {
    it('should create a Navigation instance', () => {
      // Assert
      expect(navigation).toBeInstanceOf(Navigation);
    });

    it('should require router instance', () => {
      // Act
      const nav = new Navigation(router);

      // Assert
      expect(nav).toBeInstanceOf(Navigation);
    });

    it('should log initialization', () => {
      // Arrange
      const consoleSpy = vi.spyOn(console, 'log');

      // Act
      new Navigation(router);

      // Assert
      expect(consoleSpy).toHaveBeenCalledWith('[COMPONENT] Navigation initialized');
    });
  });

  describe('Mounting', () => {
    it('should mount to specified container', () => {
      // Act
      navigation.mount('nav-container');

      // Assert
      const navElement = container.querySelector('.top-nav');
      expect(navElement).toBeTruthy();
    });

    it('should log when mounted', () => {
      // Arrange
      const consoleSpy = vi.spyOn(console, 'log');

      // Act
      navigation.mount('nav-container');

      // Assert
      expect(consoleSpy).toHaveBeenCalledWith('[NAVIGATION] Mounted to:', 'nav-container');
    });

    it('should log error when container not found', () => {
      // Arrange
      const consoleSpy = vi.spyOn(console, 'error');

      // Act
      navigation.mount('nonexistent');

      // Assert
      expect(consoleSpy).toHaveBeenCalledWith('[NAVIGATION] Container not found:', 'nonexistent');
    });

    it('should not error when mounting to nonexistent container', () => {
      // Act & Assert
      expect(() => navigation.mount('nonexistent')).not.toThrow();
    });
  });

  describe('Rendering', () => {
    beforeEach(() => {
      navigation.mount('nav-container');
    });

    it('should render navigation bar', () => {
      // Assert
      const navElement = container.querySelector('.top-nav');
      expect(navElement).toBeTruthy();
    });

    it('should render back button', () => {
      // Assert
      const backBtn = container.querySelector('#backBtn');
      expect(backBtn).toBeTruthy();
      expect(backBtn?.textContent).toContain('←');
    });

    it('should render forward button', () => {
      // Assert
      const forwardBtn = container.querySelector('#forwardBtn');
      expect(forwardBtn).toBeTruthy();
      expect(forwardBtn?.textContent).toContain('→');
    });

    it('should render refresh button', () => {
      // Assert
      const refreshBtn = container.querySelector('#refreshBtn');
      expect(refreshBtn).toBeTruthy();
      expect(refreshBtn?.textContent).toContain('↻');
    });

    it('should render toggle sidebar button', () => {
      // Assert
      const toggleBtn = container.querySelector('#toggleSidebarBtn');
      expect(toggleBtn).toBeTruthy();
      expect(toggleBtn?.textContent).toContain('≡');
    });

    it('should render command palette button', () => {
      // Assert
      const cmdBtn = container.querySelector('#commandPaletteBtn');
      expect(cmdBtn).toBeTruthy();
      expect(cmdBtn?.textContent).toContain('⌘');
    });

    it('should render preview button', () => {
      // Assert
      const previewBtn = container.querySelector('#previewBtn');
      expect(previewBtn).toBeTruthy();
      expect(previewBtn?.textContent).toContain('Preview');
    });

    it('should render changes button', () => {
      // Assert
      const changesBtn = container.querySelector('#changesBtn');
      expect(changesBtn).toBeTruthy();
      expect(changesBtn?.textContent).toContain('Changes');
    });

    it('should render default title', () => {
      // Assert
      const title = container.querySelector('#navTitle');
      expect(title?.textContent).toBe('CCEM-UI');
    });
  });

  describe('Navigation Buttons', () => {
    beforeEach(() => {
      navigation.mount('nav-container');
    });

    it('should call router.back() when back button clicked', () => {
      // Arrange
      const backSpy = vi.spyOn(router, 'back');
      const backBtn = container.querySelector('#backBtn') as HTMLElement;

      // Act
      backBtn.click();

      // Assert
      expect(backSpy).toHaveBeenCalled();
    });

    it('should log when back button clicked', () => {
      // Arrange
      const consoleSpy = vi.spyOn(console, 'log');
      const backBtn = container.querySelector('#backBtn') as HTMLElement;

      // Act
      backBtn.click();

      // Assert
      expect(consoleSpy).toHaveBeenCalledWith('[NAVIGATION] Back button clicked');
    });

    it('should call router.forward() when forward button clicked', () => {
      // Arrange
      const forwardSpy = vi.spyOn(router, 'forward');
      const forwardBtn = container.querySelector('#forwardBtn') as HTMLElement;

      // Act
      forwardBtn.click();

      // Assert
      expect(forwardSpy).toHaveBeenCalled();
    });

    it('should log when forward button clicked', () => {
      // Arrange
      const consoleSpy = vi.spyOn(console, 'log');
      const forwardBtn = container.querySelector('#forwardBtn') as HTMLElement;

      // Act
      forwardBtn.click();

      // Assert
      expect(consoleSpy).toHaveBeenCalledWith('[NAVIGATION] Forward button clicked');
    });

    it('should reload page when refresh button clicked', () => {
      // Arrange
      const reloadSpy = vi.spyOn(window.location, 'reload').mockImplementation(() => {});
      const refreshBtn = container.querySelector('#refreshBtn') as HTMLElement;

      // Act
      refreshBtn.click();

      // Assert
      expect(reloadSpy).toHaveBeenCalled();
    });

    it('should log when refresh button clicked', () => {
      // Arrange
      vi.spyOn(window.location, 'reload').mockImplementation(() => {});
      const consoleSpy = vi.spyOn(console, 'log');
      const refreshBtn = container.querySelector('#refreshBtn') as HTMLElement;

      // Act
      refreshBtn.click();

      // Assert
      expect(consoleSpy).toHaveBeenCalledWith('[NAVIGATION] Refresh button clicked');
    });
  });

  describe('Event Emission', () => {
    beforeEach(() => {
      navigation.mount('nav-container');
    });

    it('should emit toggle-sidebar event when toggle button clicked', () => {
      // Arrange
      const eventListener = vi.fn();
      window.addEventListener('navigation:toggle-sidebar', eventListener);
      const toggleBtn = container.querySelector('#toggleSidebarBtn') as HTMLElement;

      // Act
      toggleBtn.click();

      // Assert
      expect(eventListener).toHaveBeenCalled();
      window.removeEventListener('navigation:toggle-sidebar', eventListener);
    });

    it('should log when toggle sidebar button clicked', () => {
      // Arrange
      const consoleSpy = vi.spyOn(console, 'log');
      const toggleBtn = container.querySelector('#toggleSidebarBtn') as HTMLElement;

      // Act
      toggleBtn.click();

      // Assert
      expect(consoleSpy).toHaveBeenCalledWith('[NAVIGATION] Toggle sidebar clicked');
    });

    it('should emit open-command-palette event when command button clicked', () => {
      // Arrange
      const eventListener = vi.fn();
      window.addEventListener('navigation:open-command-palette', eventListener);
      const cmdBtn = container.querySelector('#commandPaletteBtn') as HTMLElement;

      // Act
      cmdBtn.click();

      // Assert
      expect(eventListener).toHaveBeenCalled();
      window.removeEventListener('navigation:open-command-palette', eventListener);
    });

    it('should log when command palette button clicked', () => {
      // Arrange
      const consoleSpy = vi.spyOn(console, 'log');
      const cmdBtn = container.querySelector('#commandPaletteBtn') as HTMLElement;

      // Act
      cmdBtn.click();

      // Assert
      expect(consoleSpy).toHaveBeenCalledWith('[NAVIGATION] Command palette button clicked');
    });

    it('should emit preview event when preview button clicked', () => {
      // Arrange
      const eventListener = vi.fn();
      window.addEventListener('navigation:preview', eventListener);
      const previewBtn = container.querySelector('#previewBtn') as HTMLElement;

      // Act
      previewBtn.click();

      // Assert
      expect(eventListener).toHaveBeenCalled();
      window.removeEventListener('navigation:preview', eventListener);
    });

    it('should log when preview button clicked', () => {
      // Arrange
      const consoleSpy = vi.spyOn(console, 'log');
      const previewBtn = container.querySelector('#previewBtn') as HTMLElement;

      // Act
      previewBtn.click();

      // Assert
      expect(consoleSpy).toHaveBeenCalledWith('[NAVIGATION] Preview button clicked');
    });

    it('should emit changes event when changes button clicked', () => {
      // Arrange
      const eventListener = vi.fn();
      window.addEventListener('navigation:changes', eventListener);
      const changesBtn = container.querySelector('#changesBtn') as HTMLElement;

      // Act
      changesBtn.click();

      // Assert
      expect(eventListener).toHaveBeenCalled();
      window.removeEventListener('navigation:changes', eventListener);
    });

    it('should log when changes button clicked', () => {
      // Arrange
      const consoleSpy = vi.spyOn(console, 'log');
      const changesBtn = container.querySelector('#changesBtn') as HTMLElement;

      // Act
      changesBtn.click();

      // Assert
      expect(consoleSpy).toHaveBeenCalledWith('[NAVIGATION] Changes button clicked');
    });
  });

  describe('Route Change Handling', () => {
    beforeEach(() => {
      navigation.mount('nav-container');
      router.register('/', vi.fn());
      router.register('/sessions', vi.fn());
      router.register('/agents', vi.fn());
      router.register('/chats', vi.fn());
      router.register('/settings', vi.fn());
    });

    it('should update title on route change to home', () => {
      // Act
      router.navigate('/', false);

      // Assert
      const title = container.querySelector('#navTitle');
      expect(title?.textContent).toBe('CCEM-UI - Home');
    });

    it('should update title on route change to sessions', () => {
      // Act
      router.navigate('/sessions', false);

      // Assert
      const title = container.querySelector('#navTitle');
      expect(title?.textContent).toBe('Session Monitoring');
    });

    it('should update title on route change to agents', () => {
      // Act
      router.navigate('/agents', false);

      // Assert
      const title = container.querySelector('#navTitle');
      expect(title?.textContent).toBe('Agent Management');
    });

    it('should update title on route change to chats', () => {
      // Act
      router.navigate('/chats', false);

      // Assert
      const title = container.querySelector('#navTitle');
      expect(title?.textContent).toBe('Chat Interface');
    });

    it('should update title on route change to settings', () => {
      // Act
      router.navigate('/settings', false);

      // Assert
      const title = container.querySelector('#navTitle');
      expect(title?.textContent).toBe('Settings');
    });

    it('should use default title for unknown routes', () => {
      // Act
      router.navigate('/unknown', false);

      // Assert
      const title = container.querySelector('#navTitle');
      expect(title?.textContent).toBe('CCEM-UI');
    });

    it('should log route changes', () => {
      // Arrange
      const consoleSpy = vi.spyOn(console, 'log');

      // Act
      router.navigate('/', false);

      // Assert
      expect(consoleSpy).toHaveBeenCalledWith(
        '[NAVIGATION] Route changed:',
        expect.objectContaining({ path: '/' })
      );
    });
  });

  describe('Custom Title', () => {
    beforeEach(() => {
      navigation.mount('nav-container');
    });

    it('should set custom title', () => {
      // Act
      navigation.setTitle('Custom Page Title');

      // Assert
      const title = container.querySelector('#navTitle');
      expect(title?.textContent).toBe('Custom Page Title');
    });

    it('should override route title', () => {
      // Arrange
      router.register('/', vi.fn());
      router.navigate('/', false);

      // Act
      navigation.setTitle('Override Title');

      // Assert
      const title = container.querySelector('#navTitle');
      expect(title?.textContent).toBe('Override Title');
    });

    it('should not error when setting title without element', () => {
      // Arrange
      const nav = new Navigation(router);

      // Act & Assert
      expect(() => nav.setTitle('Test')).not.toThrow();
    });
  });

  describe('Event Listeners', () => {
    it('should allow listening to navigation events', () => {
      // Arrange
      const callback = vi.fn();
      navigation.on('toggle-sidebar', callback);

      navigation.mount('nav-container');
      const toggleBtn = container.querySelector('#toggleSidebarBtn') as HTMLElement;

      // Act
      toggleBtn.click();

      // Assert
      expect(callback).toHaveBeenCalled();
    });

    it('should receive event data in callback', () => {
      // Arrange
      const callback = vi.fn();
      navigation.on('preview', callback);

      navigation.mount('nav-container');
      const previewBtn = container.querySelector('#previewBtn') as HTMLElement;

      // Act
      previewBtn.click();

      // Assert
      expect(callback).toHaveBeenCalledWith(expect.any(Object));
    });

    it('should support multiple event listeners', () => {
      // Arrange
      const callback1 = vi.fn();
      const callback2 = vi.fn();
      navigation.on('changes', callback1);
      navigation.on('changes', callback2);

      navigation.mount('nav-container');
      const changesBtn = container.querySelector('#changesBtn') as HTMLElement;

      // Act
      changesBtn.click();

      // Assert
      expect(callback1).toHaveBeenCalled();
      expect(callback2).toHaveBeenCalled();
    });
  });

  describe('Unmount', () => {
    it('should remove element from DOM when unmounted', () => {
      // Arrange
      navigation.mount('nav-container');

      // Act
      navigation.unmount();

      // Assert
      expect(container.querySelector('.top-nav')).toBeNull();
    });

    it('should log when unmounted', () => {
      // Arrange
      navigation.mount('nav-container');
      const consoleSpy = vi.spyOn(console, 'log');

      // Act
      navigation.unmount();

      // Assert
      expect(consoleSpy).toHaveBeenCalledWith('[NAVIGATION] Unmounted');
    });

    it('should not error when unmounting without element', () => {
      // Act & Assert
      expect(() => navigation.unmount()).not.toThrow();
    });
  });

  describe('Multiple Instances', () => {
    it('should support multiple navigation instances', () => {
      // Arrange
      const container2 = document.createElement('div');
      container2.id = 'nav-container-2';
      document.body.appendChild(container2);

      const router2 = new Router();
      const navigation2 = new Navigation(router2);

      // Act
      navigation.mount('nav-container');
      navigation2.mount('nav-container-2');

      // Assert
      expect(container.querySelector('.top-nav')).toBeTruthy();
      expect(container2.querySelector('.top-nav')).toBeTruthy();

      // Cleanup
      navigation2.unmount();
      document.body.removeChild(container2);
    });

    it('should handle routes independently', () => {
      // Arrange
      const container2 = document.createElement('div');
      container2.id = 'nav-container-2';
      document.body.appendChild(container2);

      const router2 = new Router();
      const navigation2 = new Navigation(router2);

      navigation.mount('nav-container');
      navigation2.mount('nav-container-2');

      router.register('/', vi.fn());
      router2.register('/sessions', vi.fn());

      // Act
      router.navigate('/', false);
      router2.navigate('/sessions', false);

      // Assert
      const title1 = container.querySelector('#navTitle');
      const title2 = container2.querySelector('#navTitle');
      expect(title1?.textContent).toBe('CCEM-UI - Home');
      expect(title2?.textContent).toBe('Session Monitoring');

      // Cleanup
      navigation2.unmount();
      document.body.removeChild(container2);
    });
  });

  describe('Edge Cases', () => {
    it('should handle rapid button clicks', () => {
      // Arrange
      navigation.mount('nav-container');
      const backBtn = container.querySelector('#backBtn') as HTMLElement;
      const backSpy = vi.spyOn(router, 'back');

      // Act
      backBtn.click();
      backBtn.click();
      backBtn.click();

      // Assert
      expect(backSpy).toHaveBeenCalledTimes(3);
    });

    it('should handle route changes without mounting', () => {
      // Arrange
      const nav = new Navigation(router);
      router.register('/', vi.fn());

      // Act & Assert
      expect(() => router.navigate('/', false)).not.toThrow();
    });

    it('should not error when buttons clicked without router methods', () => {
      // Arrange
      navigation.mount('nav-container');
      const backBtn = container.querySelector('#backBtn') as HTMLElement;

      // Act & Assert
      expect(() => backBtn.click()).not.toThrow();
    });
  });

  describe('Title Map Coverage', () => {
    beforeEach(() => {
      navigation.mount('nav-container');
    });

    it('should have titles for all main routes', () => {
      // Arrange
      const routes = ['/', '/sessions', '/agents', '/chats', '/settings'];
      const expectedTitles = [
        'CCEM-UI - Home',
        'Session Monitoring',
        'Agent Management',
        'Chat Interface',
        'Settings',
      ];

      routes.forEach((route, index) => {
        router.register(route, vi.fn());

        // Act
        router.navigate(route, false);

        // Assert
        const title = container.querySelector('#navTitle');
        expect(title?.textContent).toBe(expectedTitles[index]);
      });
    });
  });
});
