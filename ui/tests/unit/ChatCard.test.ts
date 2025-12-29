/**
 * ChatCard Unit Tests
 *
 * Comprehensive tests for the ChatCard component demonstrating TDD patterns:
 * - Red phase: Write failing tests first
 * - Green phase: Implement minimal code to pass
 * - Refactor phase: Optimize while maintaining tests
 *
 * Coverage target: 95%+
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ChatCard, Chat, ChatMessage, ChatClickHandler } from '../../src/components/ChatCard';

describe('ChatCard', () => {
  let mockChat: Chat;
  let mockMessages: ChatMessage[];
  let container: HTMLElement;

  beforeEach(() => {
    // Create mock chat
    mockChat = {
      id: 'chat-1',
      title: 'Test Chat',
      createdAt: new Date(),
      updatedAt: new Date(),
      messageCount: 10,
      isActive: false,
      agentId: 'agent-1',
    };

    // Create mock messages
    mockMessages = [
      {
        id: 'msg-1',
        content: 'Hello, how can I help?',
        sender: 'agent',
        timestamp: new Date(),
      },
      {
        id: 'msg-2',
        content: 'I need help with testing',
        sender: 'user',
        timestamp: new Date(),
      },
    ];

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
    it('should create a ChatCard instance', () => {
      // Act
      const card = new ChatCard(mockChat);

      // Assert
      expect(card).toBeInstanceOf(ChatCard);
    });

    it('should create with messages', () => {
      // Act
      const card = new ChatCard(mockChat, mockMessages);

      // Assert
      expect(card).toBeInstanceOf(ChatCard);
    });

    it('should log component creation', () => {
      // Arrange
      const consoleSpy = vi.spyOn(console, 'log');

      // Act
      new ChatCard(mockChat);

      // Assert
      expect(consoleSpy).toHaveBeenCalledWith('[COMPONENT] ChatCard created:', mockChat.id);
    });
  });

  describe('Rendering', () => {
    it('should render chat card with basic information', () => {
      // Arrange
      const card = new ChatCard(mockChat, mockMessages);

      // Act
      const element = card.render();

      // Assert
      expect(element).toBeTruthy();
      expect(element.id).toBe(mockChat.id);
      expect(element.className).toContain('chat-card');
      expect(element.textContent).toContain(mockChat.title);
    });

    it('should render with inactive state', () => {
      // Arrange
      mockChat.isActive = false;
      const card = new ChatCard(mockChat);

      // Act
      const element = card.render();

      // Assert
      expect(element.querySelector('.status-indicator.idle')).toBeTruthy();
    });

    it('should render with active state', () => {
      // Arrange
      mockChat.isActive = true;
      const card = new ChatCard(mockChat);

      // Act
      const element = card.render();

      // Assert
      expect(element.querySelector('.status-indicator.running')).toBeTruthy();
    });

    it('should render chat title', () => {
      // Arrange
      mockChat.title = 'Important Discussion';
      const card = new ChatCard(mockChat);

      // Act
      const element = card.render();

      // Assert
      expect(element.textContent).toContain('Important Discussion');
    });

    it('should render message count from chat property', () => {
      // Arrange
      mockChat.messageCount = 15;
      const card = new ChatCard(mockChat);

      // Act
      const element = card.render();

      // Assert
      expect(element.textContent).toContain('15 messages');
    });

    it('should render message count from messages array when messageCount not provided', () => {
      // Arrange
      mockChat.messageCount = undefined;
      const card = new ChatCard(mockChat, mockMessages);

      // Act
      const element = card.render();

      // Assert
      expect(element.textContent).toContain('2 messages');
    });

    it('should render agent ID badge when provided', () => {
      // Arrange
      mockChat.agentId = 'test-agent';
      const card = new ChatCard(mockChat);

      // Act
      const element = card.render();

      // Assert
      expect(element.textContent).toContain('Agent: test-agent');
      expect(element.querySelector('.badge-info')).toBeTruthy();
    });

    it('should not render agent badge when agentId not provided', () => {
      // Arrange
      mockChat.agentId = undefined;
      const card = new ChatCard(mockChat);

      // Act
      const element = card.render();

      // Assert
      expect(element.textContent).not.toContain('Agent:');
    });

    it('should escape HTML in title to prevent XSS', () => {
      // Arrange
      mockChat.title = '<script>alert("xss")</script>';
      const card = new ChatCard(mockChat);

      // Act
      const element = card.render();

      // Assert
      expect(element.innerHTML).not.toContain('<script>');
      expect(element.textContent).toContain('<script>alert("xss")</script>');
    });

    it('should escape HTML in agent ID to prevent XSS', () => {
      // Arrange
      mockChat.agentId = '<img src=x onerror=alert(1)>';
      const card = new ChatCard(mockChat);

      // Act
      const element = card.render();

      // Assert
      expect(element.innerHTML).not.toContain('<img');
      expect(element.textContent).toContain('<img src=x onerror=alert(1)>');
    });
  });

  describe('Time Formatting', () => {
    it('should display "now" for recent updates', () => {
      // Arrange
      mockChat.updatedAt = new Date();
      const card = new ChatCard(mockChat);

      // Act
      const element = card.render();

      // Assert
      expect(element.textContent).toContain('now');
    });

    it('should display minutes ago', () => {
      // Arrange
      const now = new Date();
      mockChat.updatedAt = new Date(now.getTime() - 5 * 60 * 1000); // 5 minutes ago
      const card = new ChatCard(mockChat);

      // Act
      const element = card.render();

      // Assert
      expect(element.textContent).toMatch(/\d+m ago/);
    });

    it('should display hours ago', () => {
      // Arrange
      const now = new Date();
      mockChat.updatedAt = new Date(now.getTime() - 2 * 60 * 60 * 1000); // 2 hours ago
      const card = new ChatCard(mockChat);

      // Act
      const element = card.render();

      // Assert
      expect(element.textContent).toMatch(/\d+h ago/);
    });

    it('should display days ago', () => {
      // Arrange
      const now = new Date();
      mockChat.updatedAt = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000); // 3 days ago
      const card = new ChatCard(mockChat);

      // Act
      const element = card.render();

      // Assert
      expect(element.textContent).toMatch(/\d+d ago/);
    });

    it('should handle string date format', () => {
      // Arrange
      mockChat.updatedAt = new Date().toISOString();
      const card = new ChatCard(mockChat);

      // Act
      const element = card.render();

      // Assert
      expect(element.textContent).toContain('now');
    });
  });

  describe('Message Preview', () => {
    it('should display preview from last message', () => {
      // Arrange
      const messages: ChatMessage[] = [
        {
          id: 'msg-1',
          content: 'This is the last message in the chat',
          sender: 'user',
          timestamp: new Date(),
        },
      ];
      const card = new ChatCard(mockChat, messages);

      // Act
      const element = card.render();

      // Assert
      expect(element.textContent).toContain('This is the last message in the chat...');
    });

    it('should truncate long messages to 50 characters', () => {
      // Arrange
      const longMessage = 'This is a very long message that should be truncated to fifty characters or less';
      const messages: ChatMessage[] = [
        {
          id: 'msg-1',
          content: longMessage,
          sender: 'user',
          timestamp: new Date(),
        },
      ];
      const card = new ChatCard(mockChat, messages);

      // Act
      const element = card.render();

      // Assert
      const preview = element.querySelector('.chat-preview');
      expect(preview?.textContent).toHaveLength(53); // 50 chars + '...'
      expect(preview?.textContent).toContain('This is a very long message that should be truncat...');
    });

    it('should display "No messages yet" when no messages', () => {
      // Arrange
      const card = new ChatCard(mockChat, []);

      // Act
      const element = card.render();

      // Assert
      expect(element.textContent).toContain('No messages yet');
    });

    it('should escape HTML in message preview to prevent XSS', () => {
      // Arrange
      const messages: ChatMessage[] = [
        {
          id: 'msg-1',
          content: '<script>alert("xss")</script>',
          sender: 'user',
          timestamp: new Date(),
        },
      ];
      const card = new ChatCard(mockChat, messages);

      // Act
      const element = card.render();

      // Assert
      const preview = element.querySelector('.chat-preview');
      expect(preview?.innerHTML).not.toContain('<script>');
      expect(preview?.textContent).toContain('<script>alert("xss")</script>');
    });
  });

  describe('Event Handlers', () => {
    it('should call click handler when card is clicked', () => {
      // Arrange
      const card = new ChatCard(mockChat);
      const clickHandler: ChatClickHandler = vi.fn();
      card.setClickHandler(clickHandler);

      // Act
      const element = card.render();
      container.appendChild(element);
      element.click();

      // Assert
      expect(clickHandler).toHaveBeenCalledWith(mockChat);
    });

    it('should log when card is clicked', () => {
      // Arrange
      const card = new ChatCard(mockChat);
      const consoleSpy = vi.spyOn(console, 'log');
      card.setClickHandler(vi.fn());

      // Act
      const element = card.render();
      container.appendChild(element);
      element.click();

      // Assert
      expect(consoleSpy).toHaveBeenCalledWith('[CHAT-CARD] Card clicked:', mockChat.id);
    });

    it('should not error when clicked without handler', () => {
      // Arrange
      const card = new ChatCard(mockChat);

      // Act
      const element = card.render();
      container.appendChild(element);

      // Assert
      expect(() => element.click()).not.toThrow();
    });

    it('should allow handler to be updated', () => {
      // Arrange
      const card = new ChatCard(mockChat);
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
    it('should update chat data', () => {
      // Arrange
      const card = new ChatCard(mockChat);
      const element = card.render();
      container.appendChild(element);

      // Act
      card.update({ title: 'Updated Title' });

      // Assert
      const updatedElement = container.querySelector('.chat-card');
      expect(updatedElement?.textContent).toContain('Updated Title');
    });

    it('should update messages', () => {
      // Arrange
      const card = new ChatCard(mockChat, []);
      const element = card.render();
      container.appendChild(element);

      const newMessages: ChatMessage[] = [
        {
          id: 'msg-new',
          content: 'New message content',
          sender: 'user',
          timestamp: new Date(),
        },
      ];

      // Act
      card.update({}, newMessages);

      // Assert
      const updatedElement = container.querySelector('.chat-card');
      expect(updatedElement?.textContent).toContain('New message content');
    });

    it('should update both chat and messages', () => {
      // Arrange
      const card = new ChatCard(mockChat);
      const element = card.render();
      container.appendChild(element);

      const newMessages: ChatMessage[] = [
        {
          id: 'msg-new',
          content: 'Updated content',
          sender: 'agent',
          timestamp: new Date(),
        },
      ];

      // Act
      card.update({ title: 'New Title', isActive: true }, newMessages);

      // Assert
      const updatedElement = container.querySelector('.chat-card');
      expect(updatedElement?.textContent).toContain('New Title');
      expect(updatedElement?.textContent).toContain('Updated content');
      expect(updatedElement?.querySelector('.status-indicator.running')).toBeTruthy();
    });

    it('should log when updated', () => {
      // Arrange
      const card = new ChatCard(mockChat);
      const element = card.render();
      container.appendChild(element);
      const consoleSpy = vi.spyOn(console, 'log');

      // Act
      card.update({ isActive: true });

      // Assert
      expect(consoleSpy).toHaveBeenCalledWith('[CHAT-CARD] Updated:', mockChat.id);
    });

    it('should preserve existing data when updating', () => {
      // Arrange
      const card = new ChatCard(mockChat, mockMessages);
      const element = card.render();
      container.appendChild(element);

      // Act
      card.update({ messageCount: 20 });

      // Assert
      const updatedElement = container.querySelector('.chat-card');
      expect(updatedElement?.textContent).toContain(mockChat.title);
      expect(updatedElement?.textContent).toContain('20 messages');
    });

    it('should replace element in DOM when updated', () => {
      // Arrange
      const card = new ChatCard(mockChat);
      const element = card.render();
      container.appendChild(element);
      const originalElement = container.querySelector('.chat-card');

      // Act
      card.update({ isActive: true });

      // Assert
      const updatedElement = container.querySelector('.chat-card');
      expect(updatedElement).not.toBe(originalElement);
    });

    it('should not error when updating without DOM parent', () => {
      // Arrange
      const card = new ChatCard(mockChat);

      // Act & Assert
      expect(() => card.update({ title: 'New' })).not.toThrow();
    });
  });

  describe('Active State', () => {
    it('should set active class and update isActive when setActive(true)', () => {
      // Arrange
      const card = new ChatCard(mockChat);
      const element = card.render();
      container.appendChild(element);

      // Act
      card.setActive(true);

      // Assert
      expect(element.classList.contains('active')).toBe(true);
    });

    it('should remove active class and update isActive when setActive(false)', () => {
      // Arrange
      const card = new ChatCard(mockChat);
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
      const card = new ChatCard(mockChat);

      // Act & Assert
      expect(() => card.setActive(true)).not.toThrow();
    });
  });

  describe('Component Destruction', () => {
    it('should remove element from DOM when destroyed', () => {
      // Arrange
      const card = new ChatCard(mockChat);
      const element = card.render();
      container.appendChild(element);

      // Act
      card.destroy();

      // Assert
      expect(container.querySelector('.chat-card')).toBeNull();
    });

    it('should log when destroyed', () => {
      // Arrange
      const card = new ChatCard(mockChat);
      const element = card.render();
      container.appendChild(element);
      const consoleSpy = vi.spyOn(console, 'log');

      // Act
      card.destroy();

      // Assert
      expect(consoleSpy).toHaveBeenCalledWith('[CHAT-CARD] Destroyed:', mockChat.id);
    });

    it('should not error when destroying without parent', () => {
      // Arrange
      const card = new ChatCard(mockChat);

      // Act & Assert
      expect(() => card.destroy()).not.toThrow();
    });
  });

  describe('Multiple Chats', () => {
    it('should render multiple chat cards independently', () => {
      // Arrange
      const chat1 = { ...mockChat, id: 'chat-1', title: 'Chat 1' };
      const chat2 = { ...mockChat, id: 'chat-2', title: 'Chat 2' };
      const card1 = new ChatCard(chat1);
      const card2 = new ChatCard(chat2);

      // Act
      const element1 = card1.render();
      const element2 = card2.render();
      container.appendChild(element1);
      container.appendChild(element2);

      // Assert
      expect(container.querySelectorAll('.chat-card')).toHaveLength(2);
      expect(element1.textContent).toContain('Chat 1');
      expect(element2.textContent).toContain('Chat 2');
    });

    it('should update chats independently', () => {
      // Arrange
      const chat1 = { ...mockChat, id: 'chat-1', title: 'Chat 1' };
      const chat2 = { ...mockChat, id: 'chat-2', title: 'Chat 2' };
      const card1 = new ChatCard(chat1);
      const card2 = new ChatCard(chat2);
      container.appendChild(card1.render());
      container.appendChild(card2.render());

      // Act
      card1.update({ title: 'Updated Chat 1' });

      // Assert
      const cards = container.querySelectorAll('.chat-card');
      expect(cards[0].textContent).toContain('Updated Chat 1');
      expect(cards[1].textContent).toContain('Chat 2');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty title', () => {
      // Arrange
      mockChat.title = '';
      const card = new ChatCard(mockChat);

      // Act
      const element = card.render();

      // Assert
      expect(element).toBeTruthy();
    });

    it('should handle zero message count', () => {
      // Arrange
      mockChat.messageCount = 0;
      const card = new ChatCard(mockChat, []);

      // Act
      const element = card.render();

      // Assert
      expect(element.textContent).toContain('0 messages');
      expect(element.textContent).toContain('No messages yet');
    });

    it('should handle message with empty content', () => {
      // Arrange
      const messages: ChatMessage[] = [
        {
          id: 'msg-1',
          content: '',
          sender: 'user',
          timestamp: new Date(),
        },
      ];
      const card = new ChatCard(mockChat, messages);

      // Act
      const element = card.render();

      // Assert
      expect(element).toBeTruthy();
    });

    it('should handle messages from both senders', () => {
      // Arrange
      const messages: ChatMessage[] = [
        {
          id: 'msg-1',
          content: 'Agent message',
          sender: 'agent',
          timestamp: new Date(),
        },
        {
          id: 'msg-2',
          content: 'User message',
          sender: 'user',
          timestamp: new Date(),
        },
      ];
      const card = new ChatCard(mockChat, messages);

      // Act
      const element = card.render();

      // Assert
      expect(element.textContent).toContain('User message');
    });
  });
});
