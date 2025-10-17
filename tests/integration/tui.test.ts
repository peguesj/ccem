/**
 * TUI Integration Tests
 *
 * Tests TUI components with ink-testing-library
 *
 * @packageDocumentation
 * @module tests/integration
 */

import React from 'react';
import { render } from 'ink-testing-library';
import { Menu, type MenuItem } from '../../src/tui/Menu.js';

// Skip TUI integration tests - they require full React context support for hooks
// These tests would need the real ink-testing-library which uses ESM
describe.skip('TUI Integration Tests', () => {
  describe('Menu Component', () => {
    let menuItems: MenuItem[];

    beforeEach(() => {
      menuItems = [
        { id: '1', title: 'Configuration Manager', icon: '⚙️' },
        { id: '2', title: 'Merge Configurations', icon: '🔀' },
        { id: '3', title: 'Fork Discovery', icon: '🔍' },
        { id: '4', title: 'Backup & Restore', icon: '💾' },
        { id: '5', title: 'Security Audit', icon: '🔒' },
        { id: '6', title: 'Settings', icon: '🎛️' },
        { id: '7', title: 'Exit', icon: '🚪' }
      ];
    });

    it('should render menu with all items', () => {
      const { lastFrame } = render(
        React.createElement(Menu, {
          items: menuItems,
          onSelect: jest.fn(),
          onExit: jest.fn()
        })
      );

      const output = lastFrame();

      expect(output).toContain('Main Menu');
      expect(output).toContain('Configuration Manager');
      expect(output).toContain('Merge Configurations');
      expect(output).toContain('Fork Discovery');
      expect(output).toContain('Exit');
    });

    it('should highlight first item by default', () => {
      const { lastFrame } = render(
        React.createElement(Menu, {
          items: menuItems,
          onSelect: jest.fn(),
          onExit: jest.fn()
        })
      );

      const output = lastFrame();

      // First item should have selection indicator
      expect(output).toContain('> ⚙️ Configuration Manager');
    });

    it('should show all icons', () => {
      const { lastFrame } = render(
        React.createElement(Menu, {
          items: menuItems,
          onSelect: jest.fn(),
          onExit: jest.fn()
        })
      );

      const output = lastFrame();

      expect(output).toContain('⚙️');
      expect(output).toContain('🔀');
      expect(output).toContain('🔍');
      expect(output).toContain('💾');
      expect(output).toContain('🔒');
      expect(output).toContain('🎛️');
      expect(output).toContain('🚪');
    });

    it('should handle navigation with arrow keys', () => {
      const onSelect = jest.fn();

      const { stdin, lastFrame } = render(
        React.createElement(Menu, {
          items: menuItems,
          onSelect,
          onExit: jest.fn()
        })
      );

      // Navigate down twice
      stdin.write('\x1B[B'); // Down arrow
      stdin.write('\x1B[B'); // Down arrow

      const output = lastFrame();

      // Third item should be selected
      expect(output).toContain('> 🔍 Fork Discovery');
    });

    it('should handle navigation up', () => {
      const onSelect = jest.fn();

      const { stdin, lastFrame } = render(
        React.createElement(Menu, {
          items: menuItems,
          onSelect,
          onExit: jest.fn()
        })
      );

      // Navigate down then up
      stdin.write('\x1B[B'); // Down arrow
      stdin.write('\x1B[B'); // Down arrow
      stdin.write('\x1B[A'); // Up arrow

      const output = lastFrame();

      // Second item should be selected
      expect(output).toContain('> 🔀 Merge Configurations');
    });

    it('should not navigate above first item', () => {
      const { stdin, lastFrame } = render(
        React.createElement(Menu, {
          items: menuItems,
          onSelect: jest.fn(),
          onExit: jest.fn()
        })
      );

      // Try to navigate up from first item
      stdin.write('\x1B[A'); // Up arrow
      stdin.write('\x1B[A'); // Up arrow

      const output = lastFrame();

      // Should still be on first item
      expect(output).toContain('> ⚙️ Configuration Manager');
    });

    it('should not navigate below last item', () => {
      const { stdin, lastFrame } = render(
        React.createElement(Menu, {
          items: menuItems,
          onSelect: jest.fn(),
          onExit: jest.fn()
        })
      );

      // Navigate to last item and try to go further
      for (let i = 0; i < 10; i++) {
        stdin.write('\x1B[B'); // Down arrow
      }

      const output = lastFrame();

      // Should be on last item
      expect(output).toContain('> 🚪 Exit');
    });

    it('should call onSelect when Enter is pressed', () => {
      const onSelect = jest.fn();

      const { stdin } = render(
        React.createElement(Menu, {
          items: menuItems,
          onSelect,
          onExit: jest.fn()
        })
      );

      // Press Enter on first item
      stdin.write('\n');

      expect(onSelect).toHaveBeenCalledWith(menuItems[0]);
    });

    it('should call onSelect with correct item after navigation', () => {
      const onSelect = jest.fn();

      const { stdin } = render(
        React.createElement(Menu, {
          items: menuItems,
          onSelect,
          onExit: jest.fn()
        })
      );

      // Navigate to third item and select
      stdin.write('\x1B[B'); // Down arrow
      stdin.write('\x1B[B'); // Down arrow
      stdin.write('\n');      // Enter

      expect(onSelect).toHaveBeenCalledWith(menuItems[2]);
    });

    it('should call onExit when Escape is pressed', () => {
      const onExit = jest.fn();

      const { stdin } = render(
        React.createElement(Menu, {
          items: menuItems,
          onSelect: jest.fn(),
          onExit
        })
      );

      // Press Escape
      stdin.write('\x1B');

      expect(onExit).toHaveBeenCalled();
    });

    it('should not call onSelect when Escape is pressed', () => {
      const onSelect = jest.fn();

      const { stdin } = render(
        React.createElement(Menu, {
          items: menuItems,
          onSelect,
          onExit: jest.fn()
        })
      );

      stdin.write('\x1B');

      expect(onSelect).not.toHaveBeenCalled();
    });

    it('should handle empty menu items', () => {
      const { lastFrame } = render(
        React.createElement(Menu, {
          items: [],
          onSelect: jest.fn(),
          onExit: jest.fn()
        })
      );

      const output = lastFrame();

      expect(output).toContain('Main Menu');
    });

    it('should handle single menu item', () => {
      const firstItem = menuItems[0];
      if (!firstItem) throw new Error('No menu items');
      const singleItem = [firstItem];

      const { lastFrame } = render(
        React.createElement(Menu, {
          items: singleItem,
          onSelect: jest.fn(),
          onExit: jest.fn()
        })
      );

      const output = lastFrame();

      expect(output).toContain('Configuration Manager');
      expect(output).toContain('>');
    });

    it('should handle rapid navigation', () => {
      const { stdin, lastFrame } = render(
        React.createElement(Menu, {
          items: menuItems,
          onSelect: jest.fn(),
          onExit: jest.fn()
        })
      );

      // Rapid key presses
      for (let i = 0; i < 5; i++) {
        stdin.write('\x1B[B');
      }

      const output = lastFrame();

      // Should be on 6th item
      expect(output).toContain('> 🎛️ Settings');
    });

    it('should maintain visual consistency', () => {
      const { lastFrame } = render(
        React.createElement(Menu, {
          items: menuItems,
          onSelect: jest.fn(),
          onExit: jest.fn()
        })
      );

      const output = lastFrame();

      // Check for visual elements
      expect(output).toContain('─'); // Separator
      expect(output).toMatch(/Main Menu/); // Title
    });
  });

  describe('Menu Navigation Flow', () => {
    it('should support full navigation cycle', () => {
      const menuItems: MenuItem[] = [
        { id: '1', title: 'Item 1', icon: '1️⃣' },
        { id: '2', title: 'Item 2', icon: '2️⃣' },
        { id: '3', title: 'Item 3', icon: '3️⃣' }
      ];

      const onSelect = jest.fn();

      const { stdin, lastFrame } = render(
        React.createElement(Menu, {
          items: menuItems,
          onSelect,
          onExit: jest.fn()
        })
      );

      // Navigate: down, down, up, select
      stdin.write('\x1B[B');
      stdin.write('\x1B[B');
      stdin.write('\x1B[A');
      stdin.write('\n');

      expect(onSelect).toHaveBeenCalledWith(menuItems[1]);

      const output = lastFrame();
      expect(output).toContain('Item 2');
    });

    it('should handle complex navigation patterns', () => {
      const menuItems: MenuItem[] = [
        { id: '1', title: 'First', icon: '1️⃣' },
        { id: '2', title: 'Second', icon: '2️⃣' },
        { id: '3', title: 'Third', icon: '3️⃣' },
        { id: '4', title: 'Fourth', icon: '4️⃣' }
      ];

      const { stdin, lastFrame } = render(
        React.createElement(Menu, {
          items: menuItems,
          onSelect: jest.fn(),
          onExit: jest.fn()
        })
      );

      // Complex pattern: down, down, up, down, down
      stdin.write('\x1B[B'); // Go to Second
      stdin.write('\x1B[B'); // Go to Third
      stdin.write('\x1B[A'); // Go to Second
      stdin.write('\x1B[B'); // Go to Third
      stdin.write('\x1B[B'); // Go to Fourth

      const output = lastFrame();
      expect(output).toContain('> 4️⃣ Fourth');
    });
  });

  describe('Menu Callbacks', () => {
    it('should not call callbacks when not provided', () => {
      const menuItems: MenuItem[] = [
        { id: '1', title: 'Test', icon: '🧪' }
      ];

      const { stdin } = render(
        React.createElement(Menu, { items: menuItems })
      );

      // Should not throw
      expect(() => {
        stdin.write('\n');
        stdin.write('\x1B');
      }).not.toThrow();
    });

    it('should handle multiple selections', () => {
      const menuItems: MenuItem[] = [
        { id: '1', title: 'Item 1', icon: '1️⃣' },
        { id: '2', title: 'Item 2', icon: '2️⃣' }
      ];

      const onSelect = jest.fn();

      const { stdin } = render(
        React.createElement(Menu, {
          items: menuItems,
          onSelect,
          onExit: jest.fn()
        })
      );

      stdin.write('\n');
      stdin.write('\x1B[B');
      stdin.write('\n');

      expect(onSelect).toHaveBeenCalledTimes(2);
      expect(onSelect).toHaveBeenNthCalledWith(1, menuItems[0]);
      expect(onSelect).toHaveBeenNthCalledWith(2, menuItems[1]);
    });
  });

  describe('Menu Rendering', () => {
    it('should render consistently across updates', () => {
      const menuItems: MenuItem[] = [
        { id: '1', title: 'Item 1', icon: '📝' }
      ];

      const { frames } = render(
        React.createElement(Menu, {
          items: menuItems,
          onSelect: jest.fn(),
          onExit: jest.fn()
        })
      );

      // All frames should contain the menu
      frames.forEach(frame => {
        expect(frame).toContain('Main Menu');
      });
    });

    it('should handle Unicode characters correctly', () => {
      const menuItems: MenuItem[] = [
        { id: '1', title: 'Test 测试', icon: '🌍' },
        { id: '2', title: 'Тест', icon: '🌎' },
        { id: '3', title: 'テスト', icon: '🌏' }
      ];

      const { lastFrame } = render(
        React.createElement(Menu, {
          items: menuItems,
          onSelect: jest.fn(),
          onExit: jest.fn()
        })
      );

      const output = lastFrame();

      expect(output).toContain('测试');
      expect(output).toContain('Тест');
      expect(output).toContain('テスト');
    });
  });
});
