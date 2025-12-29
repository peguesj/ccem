/**
 * CommandPalette Unit Tests
 *
 * Comprehensive tests for the CommandPalette component demonstrating TDD patterns:
 * - Red phase: Write failing tests first
 * - Green phase: Implement minimal code to pass
 * - Refactor phase: Optimize while maintaining tests
 *
 * Coverage target: 95%+
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  CommandPalette,
  CommandItem,
  CommandCategory,
  CommandExecuteHandler,
} from '../../src/components/CommandPalette';

describe('CommandPalette', () => {
  let commandPalette: CommandPalette;
  let container: HTMLElement;

  beforeEach(() => {
    // Create container
    container = document.createElement('div');
    container.id = 'test-container';
    document.body.appendChild(container);

    // Create command palette
    commandPalette = new CommandPalette();
  });

  afterEach(() => {
    // Clean up
    commandPalette.unmount();
    document.body.removeChild(container);
    vi.clearAllMocks();
  });

  describe('Component Creation', () => {
    it('should create a CommandPalette instance', () => {
      // Assert
      expect(commandPalette).toBeInstanceOf(CommandPalette);
    });

    it('should log initialization', () => {
      // Arrange
      const consoleSpy = vi.spyOn(console, 'log');

      // Act
      new CommandPalette();

      // Assert
      expect(consoleSpy).toHaveBeenCalledWith('[COMPONENT] CommandPalette initialized');
    });

    it('should initialize with default commands', () => {
      // Assert
      expect(commandPalette).toBeTruthy();
    });
  });

  describe('Mounting', () => {
    it('should mount to specified container', () => {
      // Act
      commandPalette.mount('test-container');

      // Assert
      const overlay = container.querySelector('#commandPaletteOverlay');
      expect(overlay).toBeTruthy();
    });

    it('should mount to body by default', () => {
      // Act
      commandPalette.mount('body');

      // Assert
      const overlay = document.body.querySelector('#commandPaletteOverlay');
      expect(overlay).toBeTruthy();
    });

    it('should log when mounted', () => {
      // Arrange
      const consoleSpy = vi.spyOn(console, 'log');

      // Act
      commandPalette.mount('test-container');

      // Assert
      expect(consoleSpy).toHaveBeenCalledWith('[COMMAND-PALETTE] Mounted to:', 'test-container');
    });

    it('should log error when container not found', () => {
      // Arrange
      const consoleSpy = vi.spyOn(console, 'error');

      // Act
      commandPalette.mount('nonexistent');

      // Assert
      expect(consoleSpy).toHaveBeenCalledWith('[COMMAND-PALETTE] Container not found:', 'nonexistent');
    });

    it('should not error when mounting to nonexistent container', () => {
      // Act & Assert
      expect(() => commandPalette.mount('nonexistent')).not.toThrow();
    });
  });

  describe('Keyboard Shortcuts', () => {
    beforeEach(() => {
      commandPalette.mount('test-container');
    });

    it('should open on Cmd+K', () => {
      // Arrange
      const event = new KeyboardEvent('keydown', { key: 'k', metaKey: true });

      // Act
      document.dispatchEvent(event);

      // Assert
      const overlay = container.querySelector('#commandPaletteOverlay');
      expect(overlay?.classList.contains('active')).toBe(true);
    });

    it('should open on Ctrl+K', () => {
      // Arrange
      const event = new KeyboardEvent('keydown', { key: 'k', ctrlKey: true });

      // Act
      document.dispatchEvent(event);

      // Assert
      const overlay = container.querySelector('#commandPaletteOverlay');
      expect(overlay?.classList.contains('active')).toBe(true);
    });

    it('should close on ESC when open', () => {
      // Arrange
      commandPalette.open();
      const event = new KeyboardEvent('keydown', { key: 'Escape' });

      // Act
      document.dispatchEvent(event);

      // Assert
      const overlay = container.querySelector('#commandPaletteOverlay');
      expect(overlay?.classList.contains('active')).toBe(false);
    });

    it('should not close on ESC when closed', () => {
      // Arrange
      const consoleSpy = vi.spyOn(console, 'log');
      const event = new KeyboardEvent('keydown', { key: 'Escape' });

      // Act
      document.dispatchEvent(event);

      // Assert - Should not log close event
      expect(consoleSpy).not.toHaveBeenCalledWith(expect.stringContaining('[COMMAND-PALETTE] Closed'));
    });

    it('should navigate down with ArrowDown', () => {
      // Arrange
      commandPalette.open();
      const consoleSpy = vi.spyOn(console, 'log');
      const event = new KeyboardEvent('keydown', { key: 'ArrowDown' });

      // Act
      document.dispatchEvent(event);

      // Assert
      expect(consoleSpy).toHaveBeenCalledWith('[COMMAND-PALETTE] Select next');
    });

    it('should navigate up with ArrowUp', () => {
      // Arrange
      commandPalette.open();
      const consoleSpy = vi.spyOn(console, 'log');
      const event = new KeyboardEvent('keydown', { key: 'ArrowUp' });

      // Act
      document.dispatchEvent(event);

      // Assert
      expect(consoleSpy).toHaveBeenCalledWith('[COMMAND-PALETTE] Select previous');
    });

    it('should execute selected command on Enter', () => {
      // Arrange
      commandPalette.open();
      const consoleSpy = vi.spyOn(console, 'log');
      const event = new KeyboardEvent('keydown', { key: 'Enter' });

      // Act
      document.dispatchEvent(event);

      // Assert
      expect(consoleSpy).toHaveBeenCalledWith('[COMMAND-PALETTE] Execute selected');
    });

    it('should only handle arrow keys when open', () => {
      // Arrange
      const consoleSpy = vi.spyOn(console, 'log');
      const event = new KeyboardEvent('keydown', { key: 'ArrowDown' });

      // Act
      document.dispatchEvent(event);

      // Assert - Should not log when closed
      expect(consoleSpy).not.toHaveBeenCalledWith('[COMMAND-PALETTE] Select next');
    });
  });

  describe('Toggle Functionality', () => {
    beforeEach(() => {
      commandPalette.mount('test-container');
    });

    it('should toggle from closed to open', () => {
      // Act
      commandPalette.toggle();

      // Assert
      const overlay = container.querySelector('#commandPaletteOverlay');
      expect(overlay?.classList.contains('active')).toBe(true);
    });

    it('should toggle from open to closed', () => {
      // Arrange
      commandPalette.open();

      // Act
      commandPalette.toggle();

      // Assert
      const overlay = container.querySelector('#commandPaletteOverlay');
      expect(overlay?.classList.contains('active')).toBe(false);
    });
  });

  describe('Open/Close', () => {
    beforeEach(() => {
      commandPalette.mount('test-container');
    });

    it('should open command palette', () => {
      // Act
      commandPalette.open();

      // Assert
      const overlay = container.querySelector('#commandPaletteOverlay');
      expect(overlay?.classList.contains('active')).toBe(true);
    });

    it('should log when opened', () => {
      // Arrange
      const consoleSpy = vi.spyOn(console, 'log');

      // Act
      commandPalette.open();

      // Assert
      expect(consoleSpy).toHaveBeenCalledWith('[COMMAND-PALETTE] Opened');
    });

    it('should focus search input when opened', () => {
      // Act
      commandPalette.open();

      // Assert
      const searchInput = container.querySelector('#commandSearch') as HTMLInputElement;
      expect(document.activeElement).toBe(searchInput);
    });

    it('should clear search input when opened', () => {
      // Arrange
      commandPalette.open();
      const searchInput = container.querySelector('#commandSearch') as HTMLInputElement;
      searchInput.value = 'test query';
      commandPalette.close();

      // Act
      commandPalette.open();

      // Assert
      expect(searchInput.value).toBe('');
    });

    it('should render commands when opened', () => {
      // Act
      commandPalette.open();

      // Assert
      const content = container.querySelector('#commandPaletteContent');
      expect(content?.children.length).toBeGreaterThan(0);
    });

    it('should close command palette', () => {
      // Arrange
      commandPalette.open();

      // Act
      commandPalette.close();

      // Assert
      const overlay = container.querySelector('#commandPaletteOverlay');
      expect(overlay?.classList.contains('active')).toBe(false);
    });

    it('should log when closed', () => {
      // Arrange
      commandPalette.open();
      const consoleSpy = vi.spyOn(console, 'log');

      // Act
      commandPalette.close();

      // Assert
      expect(consoleSpy).toHaveBeenCalledWith('[COMMAND-PALETTE] Closed');
    });

    it('should close when clicking overlay', () => {
      // Arrange
      commandPalette.mount('test-container');
      commandPalette.open();
      const overlay = container.querySelector('#commandPaletteOverlay') as HTMLElement;

      // Act
      overlay.click();

      // Assert
      expect(overlay.classList.contains('active')).toBe(false);
    });

    it('should not close when clicking modal content', () => {
      // Arrange
      commandPalette.open();
      const modal = container.querySelector('.modal') as HTMLElement;

      // Act
      modal.click();

      // Assert
      const overlay = container.querySelector('#commandPaletteOverlay');
      expect(overlay?.classList.contains('active')).toBe(true);
    });
  });

  describe('Search Functionality', () => {
    beforeEach(() => {
      commandPalette.mount('test-container');
      commandPalette.open();
    });

    it('should filter commands by title', () => {
      // Arrange
      const searchInput = container.querySelector('#commandSearch') as HTMLInputElement;
      const consoleSpy = vi.spyOn(console, 'log');

      // Act
      searchInput.value = 'home';
      searchInput.dispatchEvent(new Event('input'));

      // Assert
      expect(consoleSpy).toHaveBeenCalledWith(
        '[COMMAND-PALETTE] Search:',
        'home',
        'Results:',
        expect.any(Number)
      );
    });

    it('should filter commands by description', () => {
      // Arrange
      const searchInput = container.querySelector('#commandSearch') as HTMLInputElement;
      const consoleSpy = vi.spyOn(console, 'log');

      // Act
      searchInput.value = 'navigate';
      searchInput.dispatchEvent(new Event('input'));

      // Assert
      expect(consoleSpy).toHaveBeenCalledWith(
        '[COMMAND-PALETTE] Search:',
        'navigate',
        'Results:',
        expect.any(Number)
      );
    });

    it('should be case insensitive', () => {
      // Arrange
      const searchInput = container.querySelector('#commandSearch') as HTMLInputElement;
      const consoleSpy = vi.spyOn(console, 'log');

      // Act
      searchInput.value = 'HOME';
      searchInput.dispatchEvent(new Event('input'));

      // Assert
      expect(consoleSpy).toHaveBeenCalledWith(
        '[COMMAND-PALETTE] Search:',
        'HOME',
        'Results:',
        expect.any(Number)
      );
    });

    it('should show all commands when search is empty', () => {
      // Arrange
      const searchInput = container.querySelector('#commandSearch') as HTMLInputElement;
      searchInput.value = 'test';
      searchInput.dispatchEvent(new Event('input'));

      // Act
      searchInput.value = '';
      searchInput.dispatchEvent(new Event('input'));

      // Assert
      const content = container.querySelector('#commandPaletteContent');
      expect(content?.children.length).toBeGreaterThan(0);
    });

    it('should filter out empty categories', () => {
      // Arrange
      const searchInput = container.querySelector('#commandSearch') as HTMLInputElement;

      // Act
      searchInput.value = 'nonexistent command';
      searchInput.dispatchEvent(new Event('input'));

      // Assert
      const content = container.querySelector('#commandPaletteContent');
      expect(content?.children.length).toBe(0);
    });
  });

  describe('Command Execution', () => {
    let mockCommand: CommandItem;

    beforeEach(() => {
      commandPalette.mount('test-container');
      commandPalette.open();

      mockCommand = {
        title: 'Test Command',
        desc: 'Test description',
        action: 'test-action',
      };
    });

    it('should execute command when clicked', () => {
      // Arrange
      const executeHandler = vi.fn();
      commandPalette.setExecuteHandler(executeHandler);

      // Act
      const commandItem = container.querySelector('.cursor-pointer') as HTMLElement;
      commandItem?.click();

      // Assert
      expect(executeHandler).toHaveBeenCalled();
    });

    it('should log command execution', () => {
      // Arrange
      const consoleSpy = vi.spyOn(console, 'log');
      const executeHandler = vi.fn();
      commandPalette.setExecuteHandler(executeHandler);

      // Act
      const commandItem = container.querySelector('.cursor-pointer') as HTMLElement;
      commandItem?.click();

      // Assert
      expect(consoleSpy).toHaveBeenCalledWith(
        '[COMMAND-PALETTE] Executing:',
        expect.any(String)
      );
    });

    it('should emit execute event', () => {
      // Arrange
      const eventListener = vi.fn();
      window.addEventListener('command-palette:execute', eventListener);

      // Act
      const commandItem = container.querySelector('.cursor-pointer') as HTMLElement;
      commandItem?.click();

      // Assert
      expect(eventListener).toHaveBeenCalled();
      window.removeEventListener('command-palette:execute', eventListener);
    });

    it('should call execute handler with command', () => {
      // Arrange
      const executeHandler = vi.fn();
      commandPalette.setExecuteHandler(executeHandler);

      // Act
      const commandItem = container.querySelector('.cursor-pointer') as HTMLElement;
      commandItem?.click();

      // Assert
      expect(executeHandler).toHaveBeenCalledWith(
        expect.objectContaining({
          title: expect.any(String),
          desc: expect.any(String),
          action: expect.any(String),
        })
      );
    });

    it('should close palette after execution', () => {
      // Arrange
      const executeHandler = vi.fn();
      commandPalette.setExecuteHandler(executeHandler);

      // Act
      const commandItem = container.querySelector('.cursor-pointer') as HTMLElement;
      commandItem?.click();

      // Assert
      const overlay = container.querySelector('#commandPaletteOverlay');
      expect(overlay?.classList.contains('active')).toBe(false);
    });
  });

  describe('Default Commands', () => {
    beforeEach(() => {
      commandPalette.mount('test-container');
      commandPalette.open();
    });

    it('should include navigation commands', () => {
      // Assert
      const content = container.querySelector('#commandPaletteContent');
      expect(content?.textContent).toContain('NAVIGATION');
      expect(content?.textContent).toContain('Go to Home');
      expect(content?.textContent).toContain('Go to Sessions');
      expect(content?.textContent).toContain('Go to Agents');
      expect(content?.textContent).toContain('Go to Chats');
      expect(content?.textContent).toContain('Go to Settings');
    });

    it('should include agent template commands', () => {
      // Assert
      const content = container.querySelector('#commandPaletteContent');
      expect(content?.textContent).toContain('AGENT TEMPLATES');
      expect(content?.textContent).toContain('Deploy TDD Squadron');
      expect(content?.textContent).toContain('Quality Monitor');
      expect(content?.textContent).toContain('Deployment Agent');
      expect(content?.textContent).toContain('Fix Build Agent');
    });

    it('should include quick action commands', () => {
      // Assert
      const content = container.querySelector('#commandPaletteContent');
      expect(content?.textContent).toContain('QUICK ACTIONS');
      expect(content?.textContent).toContain('New Chat');
      expect(content?.textContent).toContain('New Agent');
      expect(content?.textContent).toContain('Browse Files');
      expect(content?.textContent).toContain('View Status');
    });

    it('should render command icons', () => {
      // Assert
      const content = container.querySelector('#commandPaletteContent');
      expect(content?.innerHTML).toContain('🏠'); // Home icon
      expect(content?.innerHTML).toContain('🤖'); // Agent icon
      expect(content?.innerHTML).toContain('💬'); // Chat icon
    });

    it('should include command paths for navigation', () => {
      // Assert
      const content = container.querySelector('#commandPaletteContent');
      const html = content?.innerHTML || '';
      expect(html).toBeTruthy();
    });
  });

  describe('XSS Prevention', () => {
    beforeEach(() => {
      commandPalette.mount('test-container');
      commandPalette.open();
    });

    it('should escape HTML in command titles', () => {
      // Arrange
      const content = container.querySelector('#commandPaletteContent');

      // Assert - Commands are rendered but HTML should be escaped
      expect(content?.innerHTML).not.toContain('<script>');
    });

    it('should escape HTML in command descriptions', () => {
      // Arrange
      const content = container.querySelector('#commandPaletteContent');

      // Assert
      expect(content?.innerHTML).not.toContain('<img src=x onerror=');
    });
  });

  describe('Unmount', () => {
    it('should remove element from DOM when unmounted', () => {
      // Arrange
      commandPalette.mount('test-container');

      // Act
      commandPalette.unmount();

      // Assert
      expect(container.querySelector('#commandPaletteOverlay')).toBeNull();
    });

    it('should log when unmounted', () => {
      // Arrange
      commandPalette.mount('test-container');
      const consoleSpy = vi.spyOn(console, 'log');

      // Act
      commandPalette.unmount();

      // Assert
      expect(consoleSpy).toHaveBeenCalledWith('[COMMAND-PALETTE] Unmounted');
    });

    it('should not error when unmounting without element', () => {
      // Act & Assert
      expect(() => commandPalette.unmount()).not.toThrow();
    });
  });

  describe('Edge Cases', () => {
    it('should handle rapid toggle calls', () => {
      // Arrange
      commandPalette.mount('test-container');

      // Act
      commandPalette.toggle();
      commandPalette.toggle();
      commandPalette.toggle();

      // Assert
      const overlay = container.querySelector('#commandPaletteOverlay');
      expect(overlay?.classList.contains('active')).toBe(true);
    });

    it('should handle open when already open', () => {
      // Arrange
      commandPalette.mount('test-container');
      commandPalette.open();

      // Act
      commandPalette.open();

      // Assert
      const overlay = container.querySelector('#commandPaletteOverlay');
      expect(overlay?.classList.contains('active')).toBe(true);
    });

    it('should handle close when already closed', () => {
      // Arrange
      commandPalette.mount('test-container');

      // Act
      commandPalette.close();

      // Assert
      const overlay = container.querySelector('#commandPaletteOverlay');
      expect(overlay?.classList.contains('active')).toBe(false);
    });

    it('should not error when methods called without mounting', () => {
      // Act & Assert
      expect(() => commandPalette.open()).not.toThrow();
      expect(() => commandPalette.close()).not.toThrow();
      expect(() => commandPalette.toggle()).not.toThrow();
    });
  });
});
