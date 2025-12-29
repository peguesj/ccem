/**
 * Terminal Unit Tests
 *
 * Comprehensive tests for the Terminal component demonstrating TDD patterns:
 * - Red phase: Write failing tests first
 * - Green phase: Implement minimal code to pass
 * - Refactor phase: Optimize while maintaining tests
 *
 * Coverage target: 95%+
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { Terminal, LogLevel, LogEntry } from '../../src/components/Terminal';

describe('Terminal', () => {
  let terminal: Terminal;
  let container: HTMLElement;

  beforeEach(() => {
    // Create container
    container = document.createElement('div');
    container.id = 'terminal-container';
    document.body.appendChild(container);

    // Create terminal
    terminal = new Terminal();
  });

  afterEach(() => {
    // Clean up
    terminal.unmount();
    document.body.removeChild(container);
    vi.clearAllMocks();
  });

  describe('Component Creation', () => {
    it('should create a Terminal instance with default title', () => {
      // Assert
      expect(terminal).toBeInstanceOf(Terminal);
    });

    it('should create with custom title', () => {
      // Act
      const customTerminal = new Terminal('custom.log');

      // Assert
      expect(customTerminal).toBeInstanceOf(Terminal);
    });

    it('should create with custom maxLogs', () => {
      // Act
      const customTerminal = new Terminal('test.log', 500);

      // Assert
      expect(customTerminal).toBeInstanceOf(Terminal);
    });

    it('should log initialization with default title', () => {
      // Arrange
      const consoleSpy = vi.spyOn(console, 'log');

      // Act
      new Terminal();

      // Assert
      expect(consoleSpy).toHaveBeenCalledWith('[COMPONENT] Terminal initialized:', 'output.log');
    });

    it('should log initialization with custom title', () => {
      // Arrange
      const consoleSpy = vi.spyOn(console, 'log');

      // Act
      new Terminal('custom.log');

      // Assert
      expect(consoleSpy).toHaveBeenCalledWith('[COMPONENT] Terminal initialized:', 'custom.log');
    });
  });

  describe('Mounting', () => {
    it('should mount to specified container', () => {
      // Act
      terminal.mount('terminal-container');

      // Assert
      const terminalElement = container.querySelector('.terminal-container');
      expect(terminalElement).toBeTruthy();
    });

    it('should log when mounted', () => {
      // Arrange
      const consoleSpy = vi.spyOn(console, 'log');

      // Act
      terminal.mount('terminal-container');

      // Assert
      expect(consoleSpy).toHaveBeenCalledWith('[TERMINAL] Mounted to:', 'terminal-container');
    });

    it('should log error when container not found', () => {
      // Arrange
      const consoleSpy = vi.spyOn(console, 'error');

      // Act
      terminal.mount('nonexistent');

      // Assert
      expect(consoleSpy).toHaveBeenCalledWith('[TERMINAL] Container not found:', 'nonexistent');
    });

    it('should not error when mounting to nonexistent container', () => {
      // Act & Assert
      expect(() => terminal.mount('nonexistent')).not.toThrow();
    });
  });

  describe('Rendering', () => {
    beforeEach(() => {
      terminal.mount('terminal-container');
    });

    it('should render terminal container', () => {
      // Assert
      const terminalElement = container.querySelector('.terminal-container');
      expect(terminalElement).toBeTruthy();
    });

    it('should render terminal header', () => {
      // Assert
      const header = container.querySelector('.terminal-header');
      expect(header).toBeTruthy();
    });

    it('should render title in header', () => {
      // Assert
      const title = container.querySelector('.terminal-title');
      expect(title?.textContent).toBe('output.log');
    });

    it('should render custom title', () => {
      // Arrange
      const customTerminal = new Terminal('build.log');
      customTerminal.mount('terminal-container');

      // Assert
      const title = container.querySelector('.terminal-title');
      expect(title?.textContent).toBe('build.log');

      // Cleanup
      customTerminal.unmount();
    });

    it('should render terminal content area', () => {
      // Assert
      const content = container.querySelector('#terminalContent');
      expect(content).toBeTruthy();
    });

    it('should render cursor', () => {
      // Assert
      const cursor = container.querySelector('.terminal-cursor');
      expect(cursor).toBeTruthy();
    });

    it('should escape HTML in title to prevent XSS', () => {
      // Arrange
      const xssTerminal = new Terminal('<script>alert("xss")</script>');
      xssTerminal.mount('terminal-container');

      // Assert
      const title = container.querySelector('.terminal-title');
      expect(title?.innerHTML).not.toContain('<script>');
      expect(title?.textContent).toContain('<script>alert("xss")</script>');

      // Cleanup
      xssTerminal.unmount();
    });
  });

  describe('Log Functionality', () => {
    beforeEach(() => {
      terminal.mount('terminal-container');
    });

    it('should log INFO message', () => {
      // Act
      terminal.log('Test message', 'INFO');

      // Assert
      const content = container.querySelector('#terminalContent');
      expect(content?.textContent).toContain('Test message');
      expect(content?.textContent).toContain('[INFO]');
    });

    it('should log ERROR message', () => {
      // Act
      terminal.log('Error occurred', 'ERROR');

      // Assert
      const content = container.querySelector('#terminalContent');
      expect(content?.textContent).toContain('Error occurred');
      expect(content?.textContent).toContain('[ERROR]');
    });

    it('should log WARN message', () => {
      // Act
      terminal.log('Warning message', 'WARN');

      // Assert
      const content = container.querySelector('#terminalContent');
      expect(content?.textContent).toContain('Warning message');
      expect(content?.textContent).toContain('[WARN]');
    });

    it('should log SUCCESS message', () => {
      // Act
      terminal.log('Success!', 'SUCCESS');

      // Assert
      const content = container.querySelector('#terminalContent');
      expect(content?.textContent).toContain('Success!');
      expect(content?.textContent).toContain('[SUCCESS]');
    });

    it('should log AGENT message', () => {
      // Act
      terminal.log('Agent started', 'AGENT');

      // Assert
      const content = container.querySelector('#terminalContent');
      expect(content?.textContent).toContain('Agent started');
      expect(content?.textContent).toContain('[AGENT]');
    });

    it('should log SCAN message', () => {
      // Act
      terminal.log('Scanning files', 'SCAN');

      // Assert
      const content = container.querySelector('#terminalContent');
      expect(content?.textContent).toContain('Scanning files');
      expect(content?.textContent).toContain('[SCAN]');
    });

    it('should log FIX message', () => {
      // Act
      terminal.log('Fixing issue', 'FIX');

      // Assert
      const content = container.querySelector('#terminalContent');
      expect(content?.textContent).toContain('Fixing issue');
      expect(content?.textContent).toContain('[FIX]');
    });

    it('should use INFO level by default', () => {
      // Act
      terminal.log('Default level');

      // Assert
      const content = container.querySelector('#terminalContent');
      expect(content?.textContent).toContain('[INFO]');
    });

    it('should include timestamp in log', () => {
      // Act
      terminal.log('Timestamped message');

      // Assert
      const content = container.querySelector('#terminalContent');
      expect(content?.textContent).toMatch(/\[\d{1,2}:\d{2}:\d{2}.*\]/);
    });

    it('should log to console', () => {
      // Arrange
      const consoleSpy = vi.spyOn(console, 'log');

      // Act
      terminal.log('Console message', 'INFO');

      // Assert
      expect(consoleSpy).toHaveBeenCalledWith('[TERMINAL] INFO:', 'Console message');
    });

    it('should apply correct CSS class for log level', () => {
      // Act
      terminal.log('Error message', 'ERROR');

      // Assert
      const logEntry = container.querySelector('.log-entry.ERROR');
      expect(logEntry).toBeTruthy();
    });

    it('should maintain cursor after logging', () => {
      // Act
      terminal.log('Test message');

      // Assert
      const cursor = container.querySelector('.terminal-cursor');
      expect(cursor).toBeTruthy();
    });
  });

  describe('Log History', () => {
    beforeEach(() => {
      terminal.mount('terminal-container');
    });

    it('should store log entries', () => {
      // Act
      terminal.log('Message 1');
      terminal.log('Message 2');

      // Assert
      const logs = terminal.getLogs();
      expect(logs).toHaveLength(2);
    });

    it('should return log entries with all properties', () => {
      // Act
      terminal.log('Test message', 'INFO');

      // Assert
      const logs = terminal.getLogs();
      expect(logs[0]).toHaveProperty('id');
      expect(logs[0]).toHaveProperty('timestamp');
      expect(logs[0]).toHaveProperty('message', 'Test message');
      expect(logs[0]).toHaveProperty('level', 'INFO');
    });

    it('should limit log history to maxLogs', () => {
      // Arrange
      const limitedTerminal = new Terminal('test.log', 5);
      limitedTerminal.mount('terminal-container');

      // Act
      for (let i = 0; i < 10; i++) {
        limitedTerminal.log(`Message ${i}`);
      }

      // Assert
      const logs = limitedTerminal.getLogs();
      expect(logs).toHaveLength(5);

      // Cleanup
      limitedTerminal.unmount();
    });

    it('should remove oldest log when exceeding maxLogs', () => {
      // Arrange
      const limitedTerminal = new Terminal('test.log', 3);
      limitedTerminal.mount('terminal-container');

      // Act
      limitedTerminal.log('Message 1');
      limitedTerminal.log('Message 2');
      limitedTerminal.log('Message 3');
      limitedTerminal.log('Message 4');

      // Assert
      const logs = limitedTerminal.getLogs();
      expect(logs).toHaveLength(3);
      expect(logs[0].message).toBe('Message 2');

      // Cleanup
      limitedTerminal.unmount();
    });

    it('should return copy of logs array', () => {
      // Act
      terminal.log('Message 1');
      const logs1 = terminal.getLogs();
      terminal.log('Message 2');
      const logs2 = terminal.getLogs();

      // Assert
      expect(logs1).toHaveLength(1);
      expect(logs2).toHaveLength(2);
    });
  });

  describe('Log Export', () => {
    beforeEach(() => {
      terminal.mount('terminal-container');
    });

    it('should export logs as text', () => {
      // Act
      terminal.log('Message 1', 'INFO');
      terminal.log('Message 2', 'ERROR');

      const exported = terminal.exportLogs();

      // Assert
      expect(exported).toContain('Message 1');
      expect(exported).toContain('Message 2');
      expect(exported).toContain('[INFO]');
      expect(exported).toContain('[ERROR]');
    });

    it('should export logs with timestamps', () => {
      // Act
      terminal.log('Test message');
      const exported = terminal.exportLogs();

      // Assert
      expect(exported).toMatch(/\[\d{1,2}:\d{2}:\d{2}.*\]/);
    });

    it('should export logs separated by newlines', () => {
      // Act
      terminal.log('Line 1');
      terminal.log('Line 2');
      terminal.log('Line 3');

      const exported = terminal.exportLogs();

      // Assert
      const lines = exported.split('\n');
      expect(lines).toHaveLength(3);
    });

    it('should export empty string when no logs', () => {
      // Act
      const exported = terminal.exportLogs();

      // Assert
      expect(exported).toBe('');
    });
  });

  describe('Clear Functionality', () => {
    beforeEach(() => {
      terminal.mount('terminal-container');
    });

    it('should clear all logs', () => {
      // Arrange
      terminal.log('Message 1');
      terminal.log('Message 2');

      // Act
      terminal.clear();

      // Assert
      const logs = terminal.getLogs();
      expect(logs).toHaveLength(0);
    });

    it('should clear terminal display', () => {
      // Arrange
      terminal.log('Message to clear');

      // Act
      terminal.clear();

      // Assert
      const content = container.querySelector('#terminalContent');
      expect(content?.textContent).not.toContain('Message to clear');
    });

    it('should maintain cursor after clear', () => {
      // Arrange
      terminal.log('Message');

      // Act
      terminal.clear();

      // Assert
      const cursor = container.querySelector('.terminal-cursor');
      expect(cursor).toBeTruthy();
    });

    it('should log when cleared', () => {
      // Arrange
      const consoleSpy = vi.spyOn(console, 'log');

      // Act
      terminal.clear();

      // Assert
      expect(consoleSpy).toHaveBeenCalledWith('[TERMINAL] Cleared');
    });
  });

  describe('Autoscroll', () => {
    beforeEach(() => {
      terminal.mount('terminal-container');
    });

    it('should autoscroll by default', () => {
      // Act
      terminal.log('Test message');

      // Assert
      const content = container.querySelector('#terminalContent') as HTMLElement;
      // Autoscroll should set scrollTop to scrollHeight
      expect(content.scrollTop).toBe(content.scrollHeight);
    });

    it('should disable autoscroll', () => {
      // Arrange
      const consoleSpy = vi.spyOn(console, 'log');

      // Act
      terminal.setAutoscroll(false);

      // Assert
      expect(consoleSpy).toHaveBeenCalledWith('[TERMINAL] Autoscroll:', false);
    });

    it('should enable autoscroll', () => {
      // Arrange
      terminal.setAutoscroll(false);
      const consoleSpy = vi.spyOn(console, 'log');

      // Act
      terminal.setAutoscroll(true);

      // Assert
      expect(consoleSpy).toHaveBeenCalledWith('[TERMINAL] Autoscroll:', true);
    });

    it('should not autoscroll when disabled', () => {
      // Arrange
      terminal.setAutoscroll(false);
      const content = container.querySelector('#terminalContent') as HTMLElement;
      content.scrollTop = 0;

      // Act
      terminal.log('Test message');

      // Assert
      expect(content.scrollTop).toBe(0);
    });
  });

  describe('Multiple Log Levels', () => {
    beforeEach(() => {
      terminal.mount('terminal-container');
    });

    it('should support all standard log levels', () => {
      // Arrange
      const levels: LogLevel[] = ['log', 'debug', 'info', 'error', 'warn'];

      // Act
      levels.forEach((level) => terminal.log(`${level} message`, level));

      // Assert
      const logs = terminal.getLogs();
      expect(logs).toHaveLength(5);
      levels.forEach((level, index) => {
        expect(logs[index].level).toBe(level);
      });
    });

    it('should support CCEM-specific log levels', () => {
      // Arrange
      const levels: LogLevel[] = ['AGENT', 'SCAN', 'FIX', 'ERROR', 'WARN', 'INFO', 'SUCCESS'];

      // Act
      levels.forEach((level) => terminal.log(`${level} message`, level));

      // Assert
      const logs = terminal.getLogs();
      expect(logs).toHaveLength(7);
      levels.forEach((level, index) => {
        expect(logs[index].level).toBe(level);
      });
    });

    it('should support extended log levels', () => {
      // Arrange
      const levels: LogLevel[] = [
        'dir',
        'dirxml',
        'table',
        'trace',
        'clear',
        'startGroup',
        'startGroupCollapsed',
        'endGroup',
        'assert',
        'profile',
        'profileEnd',
        'count',
        'timeEnd',
        'verbose',
        'issue',
      ];

      // Act
      levels.forEach((level) => terminal.log(`${level} message`, level));

      // Assert
      const logs = terminal.getLogs();
      expect(logs).toHaveLength(15);
    });
  });

  describe('Unmount', () => {
    it('should remove element from DOM when unmounted', () => {
      // Arrange
      terminal.mount('terminal-container');

      // Act
      terminal.unmount();

      // Assert
      expect(container.querySelector('.terminal-container')).toBeNull();
    });

    it('should log when unmounted', () => {
      // Arrange
      terminal.mount('terminal-container');
      const consoleSpy = vi.spyOn(console, 'log');

      // Act
      terminal.unmount();

      // Assert
      expect(consoleSpy).toHaveBeenCalledWith('[TERMINAL] Unmounted');
    });

    it('should not error when unmounting without element', () => {
      // Act & Assert
      expect(() => terminal.unmount()).not.toThrow();
    });
  });

  describe('Edge Cases', () => {
    beforeEach(() => {
      terminal.mount('terminal-container');
    });

    it('should handle empty log messages', () => {
      // Act
      terminal.log('');

      // Assert
      const logs = terminal.getLogs();
      expect(logs).toHaveLength(1);
      expect(logs[0].message).toBe('');
    });

    it('should handle very long log messages', () => {
      // Arrange
      const longMessage = 'a'.repeat(10000);

      // Act
      terminal.log(longMessage);

      // Assert
      const logs = terminal.getLogs();
      expect(logs[0].message).toBe(longMessage);
    });

    it('should handle special characters in messages', () => {
      // Act
      terminal.log('Special chars: <>&"\'');

      // Assert
      const logs = terminal.getLogs();
      expect(logs[0].message).toBe('Special chars: <>&"\'');
    });

    it('should handle Unicode characters', () => {
      // Act
      terminal.log('Unicode: 🚀 ✓ ⌘');

      // Assert
      const logs = terminal.getLogs();
      expect(logs[0].message).toBe('Unicode: 🚀 ✓ ⌘');
    });

    it('should handle rapid logging', () => {
      // Act
      for (let i = 0; i < 100; i++) {
        terminal.log(`Message ${i}`);
      }

      // Assert
      const logs = terminal.getLogs();
      expect(logs).toHaveLength(100);
    });

    it('should generate unique IDs for logs', () => {
      // Act
      terminal.log('Message 1');
      terminal.log('Message 2');
      terminal.log('Message 3');

      // Assert
      const logs = terminal.getLogs();
      const ids = logs.map((log) => log.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(3);
    });

    it('should not error when logging without mounting', () => {
      // Arrange
      const unmountedTerminal = new Terminal();

      // Act & Assert
      expect(() => unmountedTerminal.log('Test')).not.toThrow();
    });

    it('should not error when clearing without mounting', () => {
      // Arrange
      const unmountedTerminal = new Terminal();

      // Act & Assert
      expect(() => unmountedTerminal.clear()).not.toThrow();
    });
  });

  describe('CSS Classes', () => {
    beforeEach(() => {
      terminal.mount('terminal-container');
    });

    it('should apply correct color class for AGENT logs', () => {
      // Act
      terminal.log('Agent message', 'AGENT');

      // Assert
      const logEntry = container.querySelector('.log-entry.AGENT');
      expect(logEntry).toBeTruthy();
    });

    it('should apply correct color class for ERROR logs', () => {
      // Act
      terminal.log('Error message', 'ERROR');

      // Assert
      const logEntry = container.querySelector('.log-entry.ERROR');
      expect(logEntry).toBeTruthy();
    });

    it('should apply correct color class for SUCCESS logs', () => {
      // Act
      terminal.log('Success message', 'SUCCESS');

      // Assert
      const logEntry = container.querySelector('.log-entry.SUCCESS');
      expect(logEntry).toBeTruthy();
    });

    it('should apply correct color class for lowercase error', () => {
      // Act
      terminal.log('Error message', 'error');

      // Assert
      const logEntry = container.querySelector('.log-entry.error');
      expect(logEntry).toBeTruthy();
    });
  });

  describe('Multiple Terminals', () => {
    it('should support multiple terminal instances', () => {
      // Arrange
      const container2 = document.createElement('div');
      container2.id = 'terminal-container-2';
      document.body.appendChild(container2);

      const terminal2 = new Terminal('second.log');

      // Act
      terminal.mount('terminal-container');
      terminal2.mount('terminal-container-2');

      terminal.log('Terminal 1 message');
      terminal2.log('Terminal 2 message');

      // Assert
      expect(container.querySelector('.terminal-container')).toBeTruthy();
      expect(container2.querySelector('.terminal-container')).toBeTruthy();

      const logs1 = terminal.getLogs();
      const logs2 = terminal2.getLogs();
      expect(logs1).toHaveLength(1);
      expect(logs2).toHaveLength(1);
      expect(logs1[0].message).toBe('Terminal 1 message');
      expect(logs2[0].message).toBe('Terminal 2 message');

      // Cleanup
      terminal2.unmount();
      document.body.removeChild(container2);
    });
  });
});
