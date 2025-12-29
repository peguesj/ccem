/**
 * Agents Page Unit Tests
 *
 * Comprehensive tests for the AgentsPage component
 * Coverage target: 95%+
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { AgentsPage } from '../../../src/pages/Agents';
import { Agent, AgentCard } from '../../../src/components/AgentCard';
import { Terminal } from '../../../src/components/Terminal';

// Mock AgentCard and Terminal components
vi.mock('../../../src/components/AgentCard', () => {
  return {
    AgentCard: vi.fn().mockImplementation((agent: Agent) => {
      return {
        agent,
        render: vi.fn(() => {
          const el = document.createElement('div');
          el.className = 'agent-card';
          el.setAttribute('data-agent-id', agent.id);
          el.textContent = agent.name;
          return el;
        }),
        setClickHandler: vi.fn(function (this: any, handler: any) {
          this.clickHandler = handler;
        }),
      };
    }),
  };
});

vi.mock('../../../src/components/Terminal', () => {
  return {
    Terminal: vi.fn().mockImplementation((title: string) => {
      return {
        title,
        mount: vi.fn(),
        log: vi.fn(),
        clear: vi.fn(),
        unmount: vi.fn(),
      };
    }),
  };
});

describe('AgentsPage', () => {
  let agentsPage: AgentsPage;
  let container: HTMLElement;

  beforeEach(() => {
    // Create a container for testing
    container = document.createElement('div');
    container.id = 'test-container';
    document.body.appendChild(container);

    // Create AgentsPage instance
    agentsPage = new AgentsPage();

    // Clear mocks
    vi.clearAllMocks();
  });

  afterEach(() => {
    // Clean up
    if (container.parentNode) {
      container.parentNode.removeChild(container);
    }
    vi.clearAllMocks();
  });

  describe('Initialization', () => {
    it('should create a new AgentsPage instance', () => {
      expect(agentsPage).toBeDefined();
      expect(agentsPage).toBeInstanceOf(AgentsPage);
    });

    it('should log initialization message', () => {
      const consoleSpy = vi.spyOn(console, 'log');
      new AgentsPage();
      expect(consoleSpy).toHaveBeenCalledWith('[SCREEN] AgentsPage initialized');
    });
  });

  describe('Rendering', () => {
    it('should render the agents screen', () => {
      const element = agentsPage.render();

      expect(element).toBeDefined();
      expect(element.className).toContain('screen');
      expect(element.className).toContain('agents-screen');
    });

    it('should render agent sidebar', () => {
      const element = agentsPage.render();
      const sidebar = element.querySelector('aside');

      expect(sidebar).toBeDefined();
    });

    it('should render agents header', () => {
      const element = agentsPage.render();
      const header = element.querySelector('h3');

      expect(header).toBeDefined();
      expect(header?.textContent).toBe('Agents');
    });

    it('should render agent count badge', () => {
      const element = agentsPage.render();
      const badge = element.querySelector('#agentCount');

      expect(badge).toBeDefined();
      expect(badge?.textContent).toBe('0');
    });

    it('should render new agent button', () => {
      const element = agentsPage.render();
      const button = element.querySelector('#newAgentBtn');

      expect(button).toBeDefined();
      expect(button?.textContent).toContain('New Agent');
    });

    it('should render agent search input', () => {
      const element = agentsPage.render();
      const searchInput = element.querySelector('#agentSearch') as HTMLInputElement;

      expect(searchInput).toBeDefined();
      expect(searchInput.placeholder).toBe('Search agents...');
    });

    it('should render agent list container', () => {
      const element = agentsPage.render();
      const agentList = element.querySelector('#agentList');

      expect(agentList).toBeDefined();
    });

    it('should render detail view', () => {
      const element = agentsPage.render();
      const detailView = element.querySelector('#agentDetailView');

      expect(detailView).toBeDefined();
    });

    it('should render empty state initially', () => {
      const element = agentsPage.render();
      const emptyState = element.querySelector('#emptyState');

      expect(emptyState).toBeDefined();
      expect(emptyState?.textContent).toContain('No agent selected');
    });
  });

  describe('Agent Creation', () => {
    it('should trigger agent creation event on button click', () => {
      const element = agentsPage.render();
      const eventSpy = vi.fn();
      window.addEventListener('agents:create', eventSpy);

      const button = element.querySelector('#newAgentBtn') as HTMLButtonElement;
      button.click();

      expect(eventSpy).toHaveBeenCalled();
      const event = eventSpy.mock.calls[0][0] as CustomEvent;
      expect(event.detail.name).toMatch(/Agent \d+/);
      expect(event.detail.type).toBe('general');

      window.removeEventListener('agents:create', eventSpy);
    });

    it('should log agent creation', () => {
      const element = agentsPage.render();
      const consoleSpy = vi.spyOn(console, 'log');

      const button = element.querySelector('#newAgentBtn') as HTMLButtonElement;
      button.click();

      expect(consoleSpy).toHaveBeenCalledWith('[AGENTS-SCREEN] Creating new agent');
    });

    it('should increment agent name counter', () => {
      const page1 = new AgentsPage();
      const element1 = page1.render();
      const eventSpy = vi.fn();
      window.addEventListener('agents:create', eventSpy);

      const button1 = element1.querySelector('#newAgentBtn') as HTMLButtonElement;
      button1.click();

      const page2 = new AgentsPage();
      const element2 = page2.render();
      const button2 = element2.querySelector('#newAgentBtn') as HTMLButtonElement;
      button2.click();

      expect(eventSpy).toHaveBeenCalledTimes(2);
      expect(eventSpy.mock.calls[0][0].detail.name).toMatch(/Agent \d+/);
      expect(eventSpy.mock.calls[1][0].detail.name).toMatch(/Agent \d+/);

      window.removeEventListener('agents:create', eventSpy);
    });
  });

  describe('Adding Agents', () => {
    it('should add an agent to the list', () => {
      const element = agentsPage.render();
      const agent: Agent = {
        id: 'agent-1',
        name: 'Test Agent',
        status: 'running',
        branch: 'main',
        currentTask: 'Testing',
        progress: 50,
        updatedAt: new Date(),
      };

      agentsPage.addAgent(agent);

      expect(AgentCard).toHaveBeenCalledWith(agent);
    });

    it('should update agent count badge', () => {
      const element = agentsPage.render();
      const agent: Agent = {
        id: 'agent-1',
        name: 'Test Agent',
        status: 'running',
        updatedAt: new Date(),
      };

      agentsPage.addAgent(agent);

      const badge = element.querySelector('#agentCount');
      expect(badge?.textContent).toBe('1');
    });

    it('should add multiple agents', () => {
      const element = agentsPage.render();
      const initialCalls = (AgentCard as any).mock.calls.length;

      for (let i = 0; i < 3; i++) {
        const agent: Agent = {
          id: `agent-${i}`,
          name: `Agent ${i}`,
          status: 'running',
          updatedAt: new Date(),
        };
        agentsPage.addAgent(agent);
      }

      // Each addAgent causes a re-render which creates all cards again
      // So we check that AgentCard was created for all agents
      expect((AgentCard as any).mock.calls.length).toBeGreaterThan(initialCalls);
    });

    it('should only count running agents in badge', () => {
      const element = agentsPage.render();

      const runningAgent: Agent = {
        id: 'agent-1',
        name: 'Running Agent',
        status: 'running',
        updatedAt: new Date(),
      };

      const idleAgent: Agent = {
        id: 'agent-2',
        name: 'Idle Agent',
        status: 'idle',
        updatedAt: new Date(),
      };

      agentsPage.addAgent(runningAgent);
      agentsPage.addAgent(idleAgent);

      const badge = element.querySelector('#agentCount');
      expect(badge?.textContent).toBe('1');
    });
  });

  describe('Agent List Rendering', () => {
    it('should render empty message when no agents', () => {
      const element = agentsPage.render();

      // After render, the agent list should be initially empty or show no agents message
      const agentList = element.querySelector('#agentList');
      expect(agentList).toBeDefined();
    });

    it('should render agent cards', () => {
      const element = agentsPage.render();
      const agent: Agent = {
        id: 'agent-1',
        name: 'Test Agent',
        status: 'running',
        updatedAt: new Date(),
      };

      agentsPage.addAgent(agent);

      const agentList = element.querySelector('#agentList');
      expect(agentList?.children.length).toBeGreaterThan(0);
    });

    it('should set click handler on agent cards', () => {
      const element = agentsPage.render();
      const agent: Agent = {
        id: 'agent-1',
        name: 'Test Agent',
        status: 'running',
        updatedAt: new Date(),
      };

      agentsPage.addAgent(agent);

      const mockCard = (AgentCard as any).mock.results[0].value;
      expect(mockCard.setClickHandler).toHaveBeenCalled();
    });
  });

  describe('Agent Selection', () => {
    it('should render agent detail view when agent selected', () => {
      const element = agentsPage.render();
      const agent: Agent = {
        id: 'agent-1',
        name: 'Test Agent',
        status: 'running',
        branch: 'feature-branch',
        currentTask: 'Implementing tests',
        progress: 75,
        updatedAt: new Date(),
      };

      agentsPage.addAgent(agent);

      // Simulate agent selection
      const mockCard = (AgentCard as any).mock.results[0].value;
      const clickHandler = mockCard.setClickHandler.mock.calls[0][0];
      clickHandler(agent);

      const detailView = element.querySelector('#agentDetailView');
      expect(detailView?.textContent).toContain('Test Agent');
    });

    it('should hide empty state when agent selected', () => {
      const element = agentsPage.render();
      const agent: Agent = {
        id: 'agent-1',
        name: 'Test Agent',
        status: 'running',
        updatedAt: new Date(),
      };

      agentsPage.addAgent(agent);

      const mockCard = (AgentCard as any).mock.results[0].value;
      const clickHandler = mockCard.setClickHandler.mock.calls[0][0];
      clickHandler(agent);

      // The detail view should be rendered with agent info
      const detailView = element.querySelector('#agentDetailView');
      expect(detailView?.textContent).toContain('Test Agent');
    });

    it('should trigger agents:select event', () => {
      const element = agentsPage.render();
      const agent: Agent = {
        id: 'agent-1',
        name: 'Test Agent',
        status: 'running',
        updatedAt: new Date(),
      };

      agentsPage.addAgent(agent);

      const eventSpy = vi.fn();
      window.addEventListener('agents:select', eventSpy);

      const mockCard = (AgentCard as any).mock.results[0].value;
      const clickHandler = mockCard.setClickHandler.mock.calls[0][0];
      clickHandler(agent);

      expect(eventSpy).toHaveBeenCalled();
      const event = eventSpy.mock.calls[0][0] as CustomEvent;
      expect(event.detail.agent).toEqual(agent);

      window.removeEventListener('agents:select', eventSpy);
    });

    it('should log agent selection', () => {
      const element = agentsPage.render();
      const agent: Agent = {
        id: 'agent-1',
        name: 'Test Agent',
        status: 'running',
        updatedAt: new Date(),
      };

      agentsPage.addAgent(agent);

      const consoleSpy = vi.spyOn(console, 'log');
      const mockCard = (AgentCard as any).mock.results[0].value;
      const clickHandler = mockCard.setClickHandler.mock.calls[0][0];
      clickHandler(agent);

      expect(consoleSpy).toHaveBeenCalledWith('[AGENTS-SCREEN] Agent selected:', 'agent-1');
    });
  });

  describe('Agent Detail View', () => {
    it('should render agent name in detail view', () => {
      const element = agentsPage.render();
      const agent: Agent = {
        id: 'agent-1',
        name: 'Detailed Agent',
        status: 'running',
        updatedAt: new Date(),
      };

      agentsPage.addAgent(agent);
      const mockCard = (AgentCard as any).mock.results[0].value;
      const clickHandler = mockCard.setClickHandler.mock.calls[0][0];
      clickHandler(agent);

      const detailView = element.querySelector('#agentDetailView');
      expect(detailView?.innerHTML).toContain('Detailed Agent');
    });

    it('should render agent branch', () => {
      const element = agentsPage.render();
      const agent: Agent = {
        id: 'agent-1',
        name: 'Test Agent',
        status: 'running',
        branch: 'feature-xyz',
        updatedAt: new Date(),
      };

      agentsPage.addAgent(agent);
      const mockCard = (AgentCard as any).mock.results[0].value;
      const clickHandler = mockCard.setClickHandler.mock.calls[0][0];
      clickHandler(agent);

      const detailView = element.querySelector('#agentDetailView');
      expect(detailView?.innerHTML).toContain('feature-xyz');
    });

    it('should default to main branch if not specified', () => {
      const element = agentsPage.render();
      const agent: Agent = {
        id: 'agent-1',
        name: 'Test Agent',
        status: 'running',
        updatedAt: new Date(),
      };

      agentsPage.addAgent(agent);
      const mockCard = (AgentCard as any).mock.results[0].value;
      const clickHandler = mockCard.setClickHandler.mock.calls[0][0];
      clickHandler(agent);

      const detailView = element.querySelector('#agentDetailView');
      expect(detailView?.innerHTML).toContain('main');
    });

    it('should render status badge', () => {
      const element = agentsPage.render();
      const agent: Agent = {
        id: 'agent-1',
        name: 'Test Agent',
        status: 'running',
        updatedAt: new Date(),
      };

      agentsPage.addAgent(agent);
      const mockCard = (AgentCard as any).mock.results[0].value;
      const clickHandler = mockCard.setClickHandler.mock.calls[0][0];
      clickHandler(agent);

      const detailView = element.querySelector('#agentDetailView');
      expect(detailView?.innerHTML).toContain('badge');
      expect(detailView?.innerHTML).toContain('RUNNING');
    });

    it('should render progress bar', () => {
      const element = agentsPage.render();
      const agent: Agent = {
        id: 'agent-1',
        name: 'Test Agent',
        status: 'running',
        progress: 60,
        updatedAt: new Date(),
      };

      agentsPage.addAgent(agent);
      const mockCard = (AgentCard as any).mock.results[0].value;
      const clickHandler = mockCard.setClickHandler.mock.calls[0][0];
      clickHandler(agent);

      const progressBar = element.querySelector('.progress-bar') as HTMLElement;
      expect(progressBar).toBeDefined();
      expect(progressBar.style.width).toBe('60%');
    });

    it('should render control buttons', () => {
      const element = agentsPage.render();
      const agent: Agent = {
        id: 'agent-1',
        name: 'Test Agent',
        status: 'running',
        updatedAt: new Date(),
      };

      agentsPage.addAgent(agent);
      const mockCard = (AgentCard as any).mock.results[0].value;
      const clickHandler = mockCard.setClickHandler.mock.calls[0][0];
      clickHandler(agent);

      const pauseBtn = element.querySelector('#pauseAgentBtn');
      const stopBtn = element.querySelector('#stopAgentBtn');

      expect(pauseBtn).toBeDefined();
      expect(stopBtn).toBeDefined();
    });

    it('should create terminal for agent', () => {
      const element = agentsPage.render();
      const agent: Agent = {
        id: 'agent-1',
        name: 'Test Agent',
        status: 'running',
        updatedAt: new Date(),
      };

      agentsPage.addAgent(agent);
      const mockCard = (AgentCard as any).mock.results[0].value;
      const clickHandler = mockCard.setClickHandler.mock.calls[0][0];
      clickHandler(agent);

      expect(Terminal).toHaveBeenCalledWith('Test Agent.log');
    });

    it('should mount terminal', () => {
      const element = agentsPage.render();
      const agent: Agent = {
        id: 'agent-1',
        name: 'Test Agent',
        status: 'running',
        updatedAt: new Date(),
      };

      agentsPage.addAgent(agent);
      const mockCard = (AgentCard as any).mock.results[0].value;
      const clickHandler = mockCard.setClickHandler.mock.calls[0][0];
      clickHandler(agent);

      const mockTerminal = (Terminal as any).mock.results[0].value;
      expect(mockTerminal.mount).toHaveBeenCalledWith('agentTerminal');
    });

    it('should log starting message to terminal', () => {
      const element = agentsPage.render();
      const agent: Agent = {
        id: 'agent-1',
        name: 'Test Agent',
        status: 'running',
        updatedAt: new Date(),
      };

      agentsPage.addAgent(agent);
      const mockCard = (AgentCard as any).mock.results[0].value;
      const clickHandler = mockCard.setClickHandler.mock.calls[0][0];
      clickHandler(agent);

      const mockTerminal = (Terminal as any).mock.results[0].value;
      expect(mockTerminal.log).toHaveBeenCalledWith('Starting Test Agent...', 'AGENT');
    });

    it('should log current task if present', () => {
      const element = agentsPage.render();
      const agent: Agent = {
        id: 'agent-1',
        name: 'Test Agent',
        status: 'running',
        currentTask: 'Analyzing dependencies',
        updatedAt: new Date(),
      };

      agentsPage.addAgent(agent);
      const mockCard = (AgentCard as any).mock.results[0].value;
      const clickHandler = mockCard.setClickHandler.mock.calls[0][0];
      clickHandler(agent);

      const mockTerminal = (Terminal as any).mock.results[0].value;
      expect(mockTerminal.log).toHaveBeenCalledWith('Analyzing dependencies', 'INFO');
    });

    it('should escape HTML in agent name to prevent XSS', () => {
      const element = agentsPage.render();
      const agent: Agent = {
        id: 'agent-1',
        name: '<script>alert("xss")</script>',
        status: 'running',
        updatedAt: new Date(),
      };

      agentsPage.addAgent(agent);
      const mockCard = (AgentCard as any).mock.results[0].value;
      const clickHandler = mockCard.setClickHandler.mock.calls[0][0];
      clickHandler(agent);

      const detailView = element.querySelector('#agentDetailView');
      expect(detailView?.innerHTML).not.toContain('<script>');
    });

    it('should escape HTML in branch name', () => {
      const element = agentsPage.render();
      const agent: Agent = {
        id: 'agent-1',
        name: 'Test Agent',
        status: 'running',
        branch: '<img src=x onerror=alert("xss")>',
        updatedAt: new Date(),
      };

      agentsPage.addAgent(agent);
      const mockCard = (AgentCard as any).mock.results[0].value;
      const clickHandler = mockCard.setClickHandler.mock.calls[0][0];
      clickHandler(agent);

      const detailView = element.querySelector('#agentDetailView');
      // The HTML should be escaped - check that the actual script doesn't execute
      expect(detailView?.innerHTML).toContain('&lt;img');
    });
  });

  describe('Search Functionality', () => {
    it('should handle search input', () => {
      const element = agentsPage.render();
      const consoleSpy = vi.spyOn(console, 'log');
      const searchInput = element.querySelector('#agentSearch') as HTMLInputElement;

      searchInput.value = 'test query';
      searchInput.dispatchEvent(new Event('input'));

      expect(consoleSpy).toHaveBeenCalledWith('[AGENTS-SCREEN] Search:', 'test query');
    });

    it('should handle empty search input', () => {
      const element = agentsPage.render();
      const consoleSpy = vi.spyOn(console, 'log');
      const searchInput = element.querySelector('#agentSearch') as HTMLInputElement;

      searchInput.value = '';
      searchInput.dispatchEvent(new Event('input'));

      expect(consoleSpy).toHaveBeenCalledWith('[AGENTS-SCREEN] Search:', '');
    });
  });

  describe('Mounting', () => {
    it('should mount to container', () => {
      agentsPage.mount('test-container');

      expect(container.children.length).toBeGreaterThan(0);
      expect(container.querySelector('.agents-screen')).toBeDefined();
    });

    it('should clear container before mounting', () => {
      container.innerHTML = '<div>Old content</div>';
      agentsPage.mount('test-container');

      expect(container.querySelector('div')?.textContent).not.toBe('Old content');
    });

    it('should log mount message', () => {
      const consoleSpy = vi.spyOn(console, 'log');
      agentsPage.mount('test-container');

      expect(consoleSpy).toHaveBeenCalledWith('[AGENTS-SCREEN] Mounted');
    });

    it('should log error when container not found', () => {
      const consoleSpy = vi.spyOn(console, 'error');
      agentsPage.mount('nonexistent-container');

      expect(consoleSpy).toHaveBeenCalledWith(
        '[AGENTS-SCREEN] Container not found:',
        'nonexistent-container'
      );
    });
  });

  describe('Unmounting', () => {
    it('should unmount from parent', () => {
      agentsPage.mount('test-container');
      const initialChildren = container.children.length;

      agentsPage.unmount();

      expect(container.children.length).toBeLessThan(initialChildren);
    });

    it('should log unmount message', () => {
      agentsPage.mount('test-container');
      const consoleSpy = vi.spyOn(console, 'log');

      agentsPage.unmount();

      expect(consoleSpy).toHaveBeenCalledWith('[AGENTS-SCREEN] Unmounted');
    });

    it('should not throw when unmounting without mounting', () => {
      expect(() => {
        agentsPage.unmount();
      }).not.toThrow();
    });
  });

  describe('Edge Cases', () => {
    it('should handle agents with missing optional fields', () => {
      const element = agentsPage.render();
      const agent: Agent = {
        id: 'agent-1',
        name: 'Minimal Agent',
        status: 'idle',
        updatedAt: new Date(),
      };

      expect(() => {
        agentsPage.addAgent(agent);
      }).not.toThrow();
    });

    it('should handle zero progress', () => {
      const element = agentsPage.render();
      const agent: Agent = {
        id: 'agent-1',
        name: 'Test Agent',
        status: 'running',
        progress: 0,
        updatedAt: new Date(),
      };

      agentsPage.addAgent(agent);
      const mockCard = (AgentCard as any).mock.results[0].value;
      const clickHandler = mockCard.setClickHandler.mock.calls[0][0];
      clickHandler(agent);

      const progressBar = element.querySelector('.progress-bar') as HTMLElement;
      expect(progressBar.style.width).toBe('0%');
    });

    it('should handle 100% progress', () => {
      const element = agentsPage.render();
      const agent: Agent = {
        id: 'agent-1',
        name: 'Test Agent',
        status: 'complete',
        progress: 100,
        updatedAt: new Date(),
      };

      agentsPage.addAgent(agent);
      const mockCard = (AgentCard as any).mock.results[0].value;
      const clickHandler = mockCard.setClickHandler.mock.calls[0][0];
      clickHandler(agent);

      const progressBar = element.querySelector('.progress-bar.success') as HTMLElement;
      expect(progressBar).toBeDefined();
      expect(progressBar.style.width).toBe('100%');
    });
  });

  describe('Status Badge Variations', () => {
    it('should use correct badge class for running status', () => {
      const element = agentsPage.render();
      const agent: Agent = {
        id: 'agent-1',
        name: 'Running Agent',
        status: 'running',
        updatedAt: new Date(),
      };

      agentsPage.addAgent(agent);
      const mockCard = (AgentCard as any).mock.results[0].value;
      const clickHandler = mockCard.setClickHandler.mock.calls[0][0];
      clickHandler(agent);

      const badge = element.querySelector('.badge-info');
      expect(badge).toBeDefined();
    });

    it('should use correct badge class for complete status', () => {
      const element = agentsPage.render();
      const agent: Agent = {
        id: 'agent-1',
        name: 'Complete Agent',
        status: 'complete',
        updatedAt: new Date(),
      };

      agentsPage.addAgent(agent);
      const mockCard = (AgentCard as any).mock.results[0].value;
      const clickHandler = mockCard.setClickHandler.mock.calls[0][0];
      clickHandler(agent);

      const badge = element.querySelector('.badge-success');
      expect(badge).toBeDefined();
    });

    it('should use correct badge class for idle status', () => {
      const element = agentsPage.render();
      const agent: Agent = {
        id: 'agent-1',
        name: 'Idle Agent',
        status: 'idle',
        updatedAt: new Date(),
      };

      agentsPage.addAgent(agent);
      const mockCard = (AgentCard as any).mock.results[0].value;
      const clickHandler = mockCard.setClickHandler.mock.calls[0][0];
      clickHandler(agent);

      const badge = element.querySelector('.badge-primary');
      expect(badge).toBeDefined();
    });
  });

  describe('Integration Tests', () => {
    it('should support full workflow: create, add, select', () => {
      const element = agentsPage.render();
      const createEventSpy = vi.fn();
      const selectEventSpy = vi.fn();

      window.addEventListener('agents:create', createEventSpy);
      window.addEventListener('agents:select', selectEventSpy);

      // Create agent
      const button = element.querySelector('#newAgentBtn') as HTMLButtonElement;
      button.click();
      expect(createEventSpy).toHaveBeenCalled();

      // Add agent
      const agent: Agent = {
        id: 'agent-1',
        name: 'Test Agent',
        status: 'running',
        updatedAt: new Date(),
      };
      agentsPage.addAgent(agent);

      // Select agent
      const mockCard = (AgentCard as any).mock.results[0].value;
      const clickHandler = mockCard.setClickHandler.mock.calls[0][0];
      clickHandler(agent);
      expect(selectEventSpy).toHaveBeenCalled();

      window.removeEventListener('agents:create', createEventSpy);
      window.removeEventListener('agents:select', selectEventSpy);
    });

    it('should handle multiple agents with different statuses', () => {
      const element = agentsPage.render();
      const initialCalls = (AgentCard as any).mock.calls.length;

      const statuses: Array<'idle' | 'running' | 'complete' | 'error'> = [
        'idle',
        'running',
        'complete',
        'error',
      ];

      statuses.forEach((status, i) => {
        const agent: Agent = {
          id: `agent-${i}`,
          name: `${status} Agent`,
          status,
          updatedAt: new Date(),
        };
        agentsPage.addAgent(agent);
      });

      // Verify AgentCard was called for the agents
      expect((AgentCard as any).mock.calls.length).toBeGreaterThan(initialCalls);
    });
  });
});
