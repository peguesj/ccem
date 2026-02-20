/**
 * AgentCard Unit Tests
 *
 * Comprehensive tests for the AgentCard component demonstrating TDD patterns:
 * - Red phase: Write failing tests first
 * - Green phase: Implement minimal code to pass
 * - Refactor phase: Optimize while maintaining tests
 *
 * Coverage target: 95%+
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { AgentCard, Agent, AgentStatus, AgentClickHandler } from '../../src/components/AgentCard';

describe('AgentCard', () => {
  let mockAgent: Agent;
  let container: HTMLElement;

  beforeEach(() => {
    // Create mock agent
    mockAgent = {
      id: 'agent-1',
      name: 'Test Agent',
      status: 'idle',
      branch: 'main',
      currentTask: 'Running tests',
      tasksCompleted: 5,
      progress: 75,
      updatedAt: new Date(),
    };

    // Create container
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    // Clean up
    document.body.removeChild(container);
    vi.clearAllMocks();
  });

  describe('Component Creation', () => {
    it('should create an AgentCard instance', () => {
      // Act
      const card = new AgentCard(mockAgent);

      // Assert
      expect(card).toBeInstanceOf(AgentCard);
    });

    it('should log component creation', () => {
      // Arrange
      const consoleSpy = vi.spyOn(console, 'log');

      // Act
      new AgentCard(mockAgent);

      // Assert
      expect(consoleSpy).toHaveBeenCalledWith('[COMPONENT] AgentCard created:', mockAgent.id);
    });
  });

  describe('Rendering', () => {
    it('should render agent card with basic information', () => {
      // Arrange
      const card = new AgentCard(mockAgent);

      // Act
      const element = card.render();

      // Assert
      expect(element).toBeTruthy();
      expect(element.id).toBe(mockAgent.id);
      expect(element.className).toContain('agent-card');
      expect(element.textContent).toContain(mockAgent.name);
    });

    it('should render with idle status', () => {
      // Arrange
      mockAgent.status = 'idle';
      const card = new AgentCard(mockAgent);

      // Act
      const element = card.render();

      // Assert
      expect(element.className).toContain('idle');
      expect(element.textContent).toContain('IDLE');
      expect(element.querySelector('.status-indicator.idle')).toBeTruthy();
    });

    it('should render with running status', () => {
      // Arrange
      mockAgent.status = 'running';
      const card = new AgentCard(mockAgent);

      // Act
      const element = card.render();

      // Assert
      expect(element.className).toContain('running');
      expect(element.textContent).toContain('RUNNING');
      expect(element.querySelector('.status-indicator.running')).toBeTruthy();
    });

    it('should render with complete status', () => {
      // Arrange
      mockAgent.status = 'complete';
      const card = new AgentCard(mockAgent);

      // Act
      const element = card.render();

      // Assert
      expect(element.className).toContain('complete');
      expect(element.textContent).toContain('COMPLETE');
      expect(element.querySelector('.status-indicator.complete')).toBeTruthy();
    });

    it('should render with error status', () => {
      // Arrange
      mockAgent.status = 'error';
      const card = new AgentCard(mockAgent);

      // Act
      const element = card.render();

      // Assert
      expect(element.className).toContain('error');
      expect(element.textContent).toContain('ERROR');
      expect(element.querySelector('.status-indicator.error')).toBeTruthy();
    });

    it('should render branch information', () => {
      // Arrange
      mockAgent.branch = 'feature-branch';
      const card = new AgentCard(mockAgent);

      // Act
      const element = card.render();

      // Assert
      expect(element.textContent).toContain('Branch: feature-branch');
    });

    it('should render default branch when not provided', () => {
      // Arrange
      mockAgent.branch = undefined;
      const card = new AgentCard(mockAgent);

      // Act
      const element = card.render();

      // Assert
      expect(element.textContent).toContain('Branch: main');
    });

    it('should render current task', () => {
      // Arrange
      mockAgent.currentTask = 'Processing data';
      const card = new AgentCard(mockAgent);

      // Act
      const element = card.render();

      // Assert
      expect(element.textContent).toContain('Processing data');
    });

    it('should render progress bar', () => {
      // Arrange
      mockAgent.progress = 65;
      const card = new AgentCard(mockAgent);

      // Act
      const element = card.render();

      // Assert
      const progressBar = element.querySelector('.progress-bar');
      expect(progressBar).toBeTruthy();
      expect(progressBar?.getAttribute('style')).toContain('width: 65%');
      expect(element.textContent).toContain('65%');
    });

    it('should render zero progress when not provided', () => {
      // Arrange
      mockAgent.progress = undefined;
      const card = new AgentCard(mockAgent);

      // Act
      const element = card.render();

      // Assert
      const progressBar = element.querySelector('.progress-bar');
      expect(progressBar?.getAttribute('style')).toContain('width: 0%');
      expect(element.textContent).toContain('0%');
    });

    it('should escape HTML in agent name to prevent XSS', () => {
      // Arrange
      mockAgent.name = '<script>alert("xss")</script>';
      const card = new AgentCard(mockAgent);

      // Act
      const element = card.render();

      // Assert
      expect(element.innerHTML).not.toContain('<script>');
      expect(element.textContent).toContain('<script>alert("xss")</script>');
    });

    it('should escape HTML in branch name to prevent XSS', () => {
      // Arrange
      mockAgent.branch = '<img src=x onerror=alert(1)>';
      const card = new AgentCard(mockAgent);

      // Act
      const element = card.render();

      // Assert
      expect(element.innerHTML).not.toContain('<img');
      expect(element.textContent).toContain('<img src=x onerror=alert(1)>');
    });

    it('should escape HTML in current task to prevent XSS', () => {
      // Arrange
      mockAgent.currentTask = '<b>bold task</b>';
      const card = new AgentCard(mockAgent);

      // Act
      const element = card.render();

      // Assert
      expect(element.innerHTML).not.toContain('<b>bold task</b>');
      expect(element.textContent).toContain('<b>bold task</b>');
    });
  });

  describe('Time Formatting', () => {
    it('should display "now" for recent updates', () => {
      // Arrange
      mockAgent.updatedAt = new Date();
      const card = new AgentCard(mockAgent);

      // Act
      const element = card.render();

      // Assert
      expect(element.textContent).toContain('now');
    });

    it('should display minutes ago', () => {
      // Arrange
      const now = new Date();
      mockAgent.updatedAt = new Date(now.getTime() - 5 * 60 * 1000); // 5 minutes ago
      const card = new AgentCard(mockAgent);

      // Act
      const element = card.render();

      // Assert
      expect(element.textContent).toMatch(/\d+m ago/);
    });

    it('should display hours ago', () => {
      // Arrange
      const now = new Date();
      mockAgent.updatedAt = new Date(now.getTime() - 2 * 60 * 60 * 1000); // 2 hours ago
      const card = new AgentCard(mockAgent);

      // Act
      const element = card.render();

      // Assert
      expect(element.textContent).toMatch(/\d+h ago/);
    });

    it('should display days ago', () => {
      // Arrange
      const now = new Date();
      mockAgent.updatedAt = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000); // 3 days ago
      const card = new AgentCard(mockAgent);

      // Act
      const element = card.render();

      // Assert
      expect(element.textContent).toMatch(/\d+d ago/);
    });

    it('should handle string date format', () => {
      // Arrange
      mockAgent.updatedAt = new Date().toISOString();
      const card = new AgentCard(mockAgent);

      // Act
      const element = card.render();

      // Assert
      expect(element.textContent).toContain('now');
    });
  });

  describe('Task Display', () => {
    it('should display current task when provided', () => {
      // Arrange
      mockAgent.currentTask = 'Executing build';
      const card = new AgentCard(mockAgent);

      // Act
      const element = card.render();

      // Assert
      expect(element.textContent).toContain('Executing build');
    });

    it('should display "Waiting for tasks..." when idle and no task', () => {
      // Arrange
      mockAgent.status = 'idle';
      mockAgent.currentTask = undefined;
      const card = new AgentCard(mockAgent);

      // Act
      const element = card.render();

      // Assert
      expect(element.textContent).toContain('Waiting for tasks...');
    });

    it('should display task count when no current task and not idle', () => {
      // Arrange
      mockAgent.status = 'running';
      mockAgent.currentTask = undefined;
      mockAgent.tasksCompleted = 7;
      const card = new AgentCard(mockAgent);

      // Act
      const element = card.render();

      // Assert
      expect(element.textContent).toContain('Tasks: 7 ✓');
    });

    it('should display task count as 0 when not provided', () => {
      // Arrange
      mockAgent.status = 'running';
      mockAgent.currentTask = undefined;
      mockAgent.tasksCompleted = undefined;
      const card = new AgentCard(mockAgent);

      // Act
      const element = card.render();

      // Assert
      expect(element.textContent).toContain('Tasks: 0 ✓');
    });
  });

  describe('Badge Classes', () => {
    it('should use success badge for complete status', () => {
      // Arrange
      mockAgent.status = 'complete';
      const card = new AgentCard(mockAgent);

      // Act
      const element = card.render();

      // Assert
      expect(element.querySelector('.badge-success')).toBeTruthy();
    });

    it('should use error badge for error status', () => {
      // Arrange
      mockAgent.status = 'error';
      const card = new AgentCard(mockAgent);

      // Act
      const element = card.render();

      // Assert
      expect(element.querySelector('.badge-error')).toBeTruthy();
    });

    it('should use info badge for running status', () => {
      // Arrange
      mockAgent.status = 'running';
      const card = new AgentCard(mockAgent);

      // Act
      const element = card.render();

      // Assert
      expect(element.querySelector('.badge-info')).toBeTruthy();
    });

    it('should use primary badge for idle status', () => {
      // Arrange
      mockAgent.status = 'idle';
      const card = new AgentCard(mockAgent);

      // Act
      const element = card.render();

      // Assert
      expect(element.querySelector('.badge-primary')).toBeTruthy();
    });
  });

  describe('Progress Bar Classes', () => {
    it('should use success progress bar for complete status', () => {
      // Arrange
      mockAgent.status = 'complete';
      const card = new AgentCard(mockAgent);

      // Act
      const element = card.render();

      // Assert
      expect(element.querySelector('.progress-bar.success')).toBeTruthy();
    });

    it('should use error progress bar for error status', () => {
      // Arrange
      mockAgent.status = 'error';
      const card = new AgentCard(mockAgent);

      // Act
      const element = card.render();

      // Assert
      expect(element.querySelector('.progress-bar.error')).toBeTruthy();
    });

    it('should use default progress bar for other statuses', () => {
      // Arrange
      mockAgent.status = 'running';
      const card = new AgentCard(mockAgent);

      // Act
      const element = card.render();

      // Assert
      const progressBar = element.querySelector('.progress-bar');
      expect(progressBar).toBeTruthy();
      expect(progressBar?.classList.contains('success')).toBe(false);
      expect(progressBar?.classList.contains('error')).toBe(false);
    });
  });

  describe('Event Handlers', () => {
    it('should call click handler when card is clicked', () => {
      // Arrange
      const card = new AgentCard(mockAgent);
      const clickHandler: AgentClickHandler = vi.fn();
      card.setClickHandler(clickHandler);

      // Act
      const element = card.render();
      container.appendChild(element);
      element.click();

      // Assert
      expect(clickHandler).toHaveBeenCalledWith(mockAgent);
    });

    it('should log when card is clicked', () => {
      // Arrange
      const card = new AgentCard(mockAgent);
      const consoleSpy = vi.spyOn(console, 'log');
      card.setClickHandler(vi.fn());

      // Act
      const element = card.render();
      container.appendChild(element);
      element.click();

      // Assert
      expect(consoleSpy).toHaveBeenCalledWith('[AGENT-CARD] Card clicked:', mockAgent.id);
    });

    it('should not error when clicked without handler', () => {
      // Arrange
      const card = new AgentCard(mockAgent);

      // Act
      const element = card.render();
      container.appendChild(element);

      // Assert
      expect(() => element.click()).not.toThrow();
    });

    it('should allow handler to be updated', () => {
      // Arrange
      const card = new AgentCard(mockAgent);
      const handler1 = vi.fn();
      const handler2 = vi.fn();

      card.setClickHandler(handler1);
      const element1 = card.render();
      container.appendChild(element1);
      element1.click();

      // Act
      card.setClickHandler(handler2);
      const element2 = card.render();
      container.appendChild(element2);
      element2.click();

      // Assert
      expect(handler1).toHaveBeenCalledTimes(1);
      expect(handler2).toHaveBeenCalledTimes(1);
    });
  });

  describe('Update Functionality', () => {
    it('should update agent data', () => {
      // Arrange
      const card = new AgentCard(mockAgent);
      const element = card.render();
      container.appendChild(element);

      // Act
      card.update({ status: 'running', progress: 90 });

      // Assert
      const updatedElement = container.querySelector('.agent-card');
      expect(updatedElement?.className).toContain('running');
      expect(updatedElement?.textContent).toContain('90%');
    });

    it('should log when updated', () => {
      // Arrange
      const card = new AgentCard(mockAgent);
      const element = card.render();
      container.appendChild(element);
      const consoleSpy = vi.spyOn(console, 'log');

      // Act
      card.update({ status: 'complete' });

      // Assert
      expect(consoleSpy).toHaveBeenCalledWith('[AGENT-CARD] Updated:', mockAgent.id);
    });

    it('should preserve existing data when updating', () => {
      // Arrange
      const card = new AgentCard(mockAgent);
      const element = card.render();
      container.appendChild(element);

      // Act
      card.update({ progress: 85 });

      // Assert
      const updatedElement = container.querySelector('.agent-card');
      expect(updatedElement?.textContent).toContain(mockAgent.name);
      expect(updatedElement?.textContent).toContain('85%');
    });

    it('should replace element in DOM when updated', () => {
      // Arrange
      const card = new AgentCard(mockAgent);
      const element = card.render();
      container.appendChild(element);
      const originalElement = container.querySelector('.agent-card');

      // Act
      card.update({ status: 'error' });

      // Assert
      const updatedElement = container.querySelector('.agent-card');
      expect(updatedElement).not.toBe(originalElement);
    });

    it('should not error when updating without DOM parent', () => {
      // Arrange
      const card = new AgentCard(mockAgent);

      // Act & Assert
      expect(() => card.update({ status: 'running' })).not.toThrow();
    });
  });

  describe('Active State', () => {
    it('should set active class when setActive(true)', () => {
      // Arrange
      const card = new AgentCard(mockAgent);
      const element = card.render();
      container.appendChild(element);

      // Act
      card.setActive(true);

      // Assert
      expect(element.classList.contains('active')).toBe(true);
    });

    it('should remove active class when setActive(false)', () => {
      // Arrange
      const card = new AgentCard(mockAgent);
      const element = card.render();
      container.appendChild(element);
      card.setActive(true);

      // Act
      card.setActive(false);

      // Assert
      expect(element.classList.contains('active')).toBe(false);
    });

    it('should not error when setting active without element', () => {
      // Arrange
      const card = new AgentCard(mockAgent);

      // Act & Assert
      expect(() => card.setActive(true)).not.toThrow();
    });
  });

  describe('Component Destruction', () => {
    it('should remove element from DOM when destroyed', () => {
      // Arrange
      const card = new AgentCard(mockAgent);
      const element = card.render();
      container.appendChild(element);

      // Act
      card.destroy();

      // Assert
      expect(container.querySelector('.agent-card')).toBeNull();
    });

    it('should log when destroyed', () => {
      // Arrange
      const card = new AgentCard(mockAgent);
      const element = card.render();
      container.appendChild(element);
      const consoleSpy = vi.spyOn(console, 'log');

      // Act
      card.destroy();

      // Assert
      expect(consoleSpy).toHaveBeenCalledWith('[AGENT-CARD] Destroyed:', mockAgent.id);
    });

    it('should not error when destroying without parent', () => {
      // Arrange
      const card = new AgentCard(mockAgent);

      // Act & Assert
      expect(() => card.destroy()).not.toThrow();
    });
  });

  describe('Multiple Agents', () => {
    it('should render multiple agent cards independently', () => {
      // Arrange
      const agent1 = { ...mockAgent, id: 'agent-1', name: 'Agent 1' };
      const agent2 = { ...mockAgent, id: 'agent-2', name: 'Agent 2' };
      const card1 = new AgentCard(agent1);
      const card2 = new AgentCard(agent2);

      // Act
      const element1 = card1.render();
      const element2 = card2.render();
      container.appendChild(element1);
      container.appendChild(element2);

      // Assert
      expect(container.querySelectorAll('.agent-card')).toHaveLength(2);
      expect(element1.textContent).toContain('Agent 1');
      expect(element2.textContent).toContain('Agent 2');
    });

    it('should update agents independently', () => {
      // Arrange
      const agent1 = { ...mockAgent, id: 'agent-1', name: 'Agent 1' };
      const agent2 = { ...mockAgent, id: 'agent-2', name: 'Agent 2' };
      const card1 = new AgentCard(agent1);
      const card2 = new AgentCard(agent2);
      container.appendChild(card1.render());
      container.appendChild(card2.render());

      // Act
      card1.update({ status: 'running' });

      // Assert
      const cards = container.querySelectorAll('.agent-card');
      expect(cards[0].className).toContain('running');
      expect(cards[1].className).toContain('idle');
    });
  });
});
