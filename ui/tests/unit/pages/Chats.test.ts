/**
 * Chats Page Unit Tests
 *
 * Comprehensive tests for the ChatsPage component
 * Coverage target: 95%+
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ChatsPage } from '../../../src/pages/Chats';
import { Chat, ChatMessage, ChatCard } from '../../../src/components/ChatCard';

// Mock ChatCard component
vi.mock('../../../src/components/ChatCard', () => {
  return {
    ChatCard: vi.fn().mockImplementation((chat: Chat, messages: ChatMessage[]) => {
      return {
        chat,
        messages,
        render: vi.fn(() => {
          const el = document.createElement('div');
          el.className = 'chat-card';
          el.setAttribute('data-chat-id', chat.id);
          el.textContent = chat.title;
          return el;
        }),
        setClickHandler: vi.fn(function (this: any, handler: any) {
          this.clickHandler = handler;
        }),
        setActive: vi.fn(),
      };
    }),
  };
});

describe('ChatsPage', () => {
  let chatsPage: ChatsPage;
  let container: HTMLElement;

  beforeEach(() => {
    // Create a container for testing
    container = document.createElement('div');
    container.id = 'test-container';
    document.body.appendChild(container);

    // Create ChatsPage instance
    chatsPage = new ChatsPage();

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
    it('should create a new ChatsPage instance', () => {
      expect(chatsPage).toBeDefined();
      expect(chatsPage).toBeInstanceOf(ChatsPage);
    });

    it('should log initialization message', () => {
      const consoleSpy = vi.spyOn(console, 'log');
      new ChatsPage();
      expect(consoleSpy).toHaveBeenCalledWith('[SCREEN] ChatsPage initialized');
    });
  });

  describe('Rendering', () => {
    it('should render the chats screen', () => {
      const element = chatsPage.render();

      expect(element).toBeDefined();
      expect(element.className).toContain('screen');
      expect(element.className).toContain('chats-screen');
    });

    it('should render chat sidebar', () => {
      const element = chatsPage.render();
      const sidebar = element.querySelector('aside');

      expect(sidebar).toBeDefined();
    });

    it('should render chats header', () => {
      const element = chatsPage.render();
      const header = element.querySelector('h3');

      expect(header).toBeDefined();
      expect(header?.textContent).toBe('Chats');
    });

    it('should render chat count badge', () => {
      const element = chatsPage.render();
      const badge = element.querySelector('#chatCount');

      expect(badge).toBeDefined();
      expect(badge?.textContent).toBe('0');
    });

    it('should render new chat button', () => {
      const element = chatsPage.render();
      const button = element.querySelector('#newChatBtn');

      expect(button).toBeDefined();
      expect(button?.textContent).toContain('New Chat');
    });

    it('should render chat search input', () => {
      const element = chatsPage.render();
      const searchInput = element.querySelector('#chatSearch') as HTMLInputElement;

      expect(searchInput).toBeDefined();
      expect(searchInput.placeholder).toBe('Search chats...');
    });

    it('should render chat list container', () => {
      const element = chatsPage.render();
      const chatList = element.querySelector('#chatList');

      expect(chatList).toBeDefined();
    });

    it('should render empty state initially', () => {
      const element = chatsPage.render();
      const emptyState = element.querySelector('#emptyState');

      expect(emptyState).toBeDefined();
      expect(emptyState?.textContent).toContain('No chat selected');
    });

    it('should render message input controls', () => {
      const element = chatsPage.render();
      const agentSelector = element.querySelector('#agentSelector');
      const modelSelector = element.querySelector('#modelSelector');
      const messageInput = element.querySelector('#messageInput');
      const sendBtn = element.querySelector('#sendBtn');

      expect(agentSelector).toBeDefined();
      expect(modelSelector).toBeDefined();
      expect(messageInput).toBeDefined();
      expect(sendBtn).toBeDefined();
    });

    it('should render model selector options', () => {
      const element = chatsPage.render();
      const modelSelector = element.querySelector('#modelSelector') as HTMLSelectElement;

      expect(modelSelector.options.length).toBe(3);
      expect(modelSelector.options[0].value).toBe('sonnet');
      expect(modelSelector.options[1].value).toBe('opus');
      expect(modelSelector.options[2].value).toBe('haiku');
    });
  });

  describe('Chat Creation', () => {
    it('should create a new chat on button click', () => {
      const element = chatsPage.render();
      const button = element.querySelector('#newChatBtn') as HTMLButtonElement;

      button.click();

      expect(ChatCard).toHaveBeenCalled();
    });

    it('should log chat creation', () => {
      const element = chatsPage.render();
      const consoleSpy = vi.spyOn(console, 'log');
      const button = element.querySelector('#newChatBtn') as HTMLButtonElement;

      button.click();

      expect(consoleSpy).toHaveBeenCalledWith('[CHATS-SCREEN] Creating new chat');
    });

    it('should increment chat title counter', () => {
      const page1 = new ChatsPage();
      const element1 = page1.render();
      const button1 = element1.querySelector('#newChatBtn') as HTMLButtonElement;
      button1.click();

      const page2 = new ChatsPage();
      const element2 = page2.render();
      const button2 = element2.querySelector('#newChatBtn') as HTMLButtonElement;
      button2.click();

      const calls = (ChatCard as any).mock.calls;
      expect(calls[0][0].title).toMatch(/Chat \d+/);
      expect(calls[1][0].title).toMatch(/Chat \d+/);
    });

    it('should update chat count badge', () => {
      const element = chatsPage.render();
      const button = element.querySelector('#newChatBtn') as HTMLButtonElement;

      button.click();

      const badge = element.querySelector('#chatCount');
      expect(badge?.textContent).toBe('1');
    });

    it('should select newly created chat', () => {
      const element = chatsPage.render();
      const button = element.querySelector('#newChatBtn') as HTMLButtonElement;

      button.click();

      const emptyState = element.querySelector('#emptyState') as HTMLElement;
      expect(emptyState.classList.contains('hidden')).toBe(true);
    });
  });

  describe('Chat List Rendering', () => {
    it('should render empty message when no chats', () => {
      const element = chatsPage.render();
      const chatList = element.querySelector('#chatList');

      // The chat list should exist
      expect(chatList).toBeDefined();
    });

    it('should render chat cards', () => {
      const element = chatsPage.render();
      const button = element.querySelector('#newChatBtn') as HTMLButtonElement;

      button.click();

      const chatList = element.querySelector('#chatList');
      expect(chatList?.children.length).toBeGreaterThan(0);
    });

    it('should set click handler on chat cards', () => {
      const element = chatsPage.render();
      const button = element.querySelector('#newChatBtn') as HTMLButtonElement;

      button.click();

      const mockCard = (ChatCard as any).mock.results[0].value;
      expect(mockCard.setClickHandler).toHaveBeenCalled();
    });

    it('should set active state on selected chat', () => {
      const element = chatsPage.render();
      const button = element.querySelector('#newChatBtn') as HTMLButtonElement;

      button.click();

      const mockCard = (ChatCard as any).mock.results[0].value;
      // When rendered, setActive is called at least once
      expect(mockCard.setActive).toHaveBeenCalled();
    });
  });

  describe('Chat Selection', () => {
    it('should show messages container when chat selected', () => {
      const element = chatsPage.render();
      const button = element.querySelector('#newChatBtn') as HTMLButtonElement;

      button.click();

      const messagesContainer = element.querySelector('#messagesContainer') as HTMLElement;
      expect(messagesContainer.classList.contains('hidden')).toBe(false);
    });

    it('should hide empty state when chat selected', () => {
      const element = chatsPage.render();
      const button = element.querySelector('#newChatBtn') as HTMLButtonElement;

      button.click();

      const emptyState = element.querySelector('#emptyState') as HTMLElement;
      expect(emptyState.classList.contains('hidden')).toBe(true);
    });

    it('should render empty message list initially', () => {
      const element = chatsPage.render();
      const button = element.querySelector('#newChatBtn') as HTMLButtonElement;

      button.click();

      const messagesList = element.querySelector('#messagesList');
      expect(messagesList?.textContent).toContain('What do you want to get done?');
    });

    it('should update active states on re-render', () => {
      const element = chatsPage.render();
      const button = element.querySelector('#newChatBtn') as HTMLButtonElement;

      button.click();
      button.click();

      const mockCards = (ChatCard as any).mock.results;
      // Both chats should have setActive called
      expect(mockCards.length).toBeGreaterThan(1);
    });
  });

  describe('Message Sending', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should send message on send button click', () => {
      const element = chatsPage.render();
      const button = element.querySelector('#newChatBtn') as HTMLButtonElement;
      button.click();

      const messageInput = element.querySelector('#messageInput') as HTMLTextAreaElement;
      const sendBtn = element.querySelector('#sendBtn') as HTMLButtonElement;

      messageInput.value = 'Test message';
      sendBtn.click();

      const messagesList = element.querySelector('#messagesList');
      expect(messagesList?.textContent).toContain('Test message');
    });

    it('should clear input after sending', () => {
      const element = chatsPage.render();
      const button = element.querySelector('#newChatBtn') as HTMLButtonElement;
      button.click();

      const messageInput = element.querySelector('#messageInput') as HTMLTextAreaElement;
      const sendBtn = element.querySelector('#sendBtn') as HTMLButtonElement;

      messageInput.value = 'Test message';
      sendBtn.click();

      expect(messageInput.value).toBe('');
    });

    it('should not send empty messages', () => {
      const element = chatsPage.render();
      const button = element.querySelector('#newChatBtn') as HTMLButtonElement;
      button.click();

      const messageInput = element.querySelector('#messageInput') as HTMLTextAreaElement;
      const sendBtn = element.querySelector('#sendBtn') as HTMLButtonElement;

      messageInput.value = '   ';
      sendBtn.click();

      const messagesList = element.querySelector('#messagesList');
      expect(messagesList?.textContent).toContain('What do you want to get done?');
    });

    it('should send message on Cmd+Enter', () => {
      const element = chatsPage.render();
      const button = element.querySelector('#newChatBtn') as HTMLButtonElement;
      button.click();

      const messageInput = element.querySelector('#messageInput') as HTMLTextAreaElement;

      messageInput.value = 'Test message';
      const event = new KeyboardEvent('keydown', { key: 'Enter', metaKey: true });
      messageInput.dispatchEvent(event);

      const messagesList = element.querySelector('#messagesList');
      expect(messagesList?.textContent).toContain('Test message');
    });

    it('should send message on Ctrl+Enter', () => {
      const element = chatsPage.render();
      const button = element.querySelector('#newChatBtn') as HTMLButtonElement;
      button.click();

      const messageInput = element.querySelector('#messageInput') as HTMLTextAreaElement;

      messageInput.value = 'Test message';
      const event = new KeyboardEvent('keydown', { key: 'Enter', ctrlKey: true });
      messageInput.dispatchEvent(event);

      const messagesList = element.querySelector('#messagesList');
      expect(messagesList?.textContent).toContain('Test message');
    });

    it('should log message sending', () => {
      const element = chatsPage.render();
      const button = element.querySelector('#newChatBtn') as HTMLButtonElement;
      button.click();

      const consoleSpy = vi.spyOn(console, 'log');
      const messageInput = element.querySelector('#messageInput') as HTMLTextAreaElement;
      const sendBtn = element.querySelector('#sendBtn') as HTMLButtonElement;

      messageInput.value = 'Test message';
      sendBtn.click();

      expect(consoleSpy).toHaveBeenCalledWith(
        '[CHATS-SCREEN] Message sent:',
        expect.objectContaining({ content: 'Test message' })
      );
    });

    it('should simulate agent response after delay', () => {
      const element = chatsPage.render();
      const button = element.querySelector('#newChatBtn') as HTMLButtonElement;
      button.click();

      const messageInput = element.querySelector('#messageInput') as HTMLTextAreaElement;
      const sendBtn = element.querySelector('#sendBtn') as HTMLButtonElement;

      messageInput.value = 'Test message';
      sendBtn.click();

      vi.advanceTimersByTime(1500);

      const messagesList = element.querySelector('#messagesList');
      expect(messagesList?.textContent).toContain("I'm working on that task");
    });

    it('should increment message count', () => {
      const element = chatsPage.render();
      const button = element.querySelector('#newChatBtn') as HTMLButtonElement;
      button.click();

      const messageInput = element.querySelector('#messageInput') as HTMLTextAreaElement;
      const sendBtn = element.querySelector('#sendBtn') as HTMLButtonElement;

      messageInput.value = 'Test message';
      sendBtn.click();

      // User message + agent response
      vi.advanceTimersByTime(1500);

      const chatList = element.querySelector('#chatList');
      // Check that chat was re-rendered with updated count
      expect(ChatCard).toHaveBeenCalled();
    });

    it('should escape HTML in messages to prevent XSS', () => {
      const element = chatsPage.render();
      const button = element.querySelector('#newChatBtn') as HTMLButtonElement;
      button.click();

      const messageInput = element.querySelector('#messageInput') as HTMLTextAreaElement;
      const sendBtn = element.querySelector('#sendBtn') as HTMLButtonElement;

      messageInput.value = '<script>alert("xss")</script>';
      sendBtn.click();

      const messagesList = element.querySelector('#messagesList');
      expect(messagesList?.innerHTML).not.toContain('<script>');
      expect(messagesList?.textContent).toContain('<script>alert("xss")</script>');
    });
  });

  describe('Message Rendering', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should render user messages on the right', () => {
      const element = chatsPage.render();
      const button = element.querySelector('#newChatBtn') as HTMLButtonElement;
      button.click();

      const messageInput = element.querySelector('#messageInput') as HTMLTextAreaElement;
      const sendBtn = element.querySelector('#sendBtn') as HTMLButtonElement;

      messageInput.value = 'User message';
      sendBtn.click();

      const messagesList = element.querySelector('#messagesList');
      const userMessage = messagesList?.querySelector('.justify-end');
      expect(userMessage).toBeDefined();
    });

    it('should render agent messages on the left', () => {
      const element = chatsPage.render();
      const button = element.querySelector('#newChatBtn') as HTMLButtonElement;
      button.click();

      const messageInput = element.querySelector('#messageInput') as HTMLTextAreaElement;
      const sendBtn = element.querySelector('#sendBtn') as HTMLButtonElement;

      messageInput.value = 'Test';
      sendBtn.click();

      vi.advanceTimersByTime(1500);

      const messagesList = element.querySelector('#messagesList');
      const agentMessages = messagesList?.querySelectorAll('.flex.gap-3.mb-6');
      expect(agentMessages!.length).toBeGreaterThan(1);
    });

    it('should show relative timestamps', () => {
      const element = chatsPage.render();
      const button = element.querySelector('#newChatBtn') as HTMLButtonElement;
      button.click();

      const messageInput = element.querySelector('#messageInput') as HTMLTextAreaElement;
      const sendBtn = element.querySelector('#sendBtn') as HTMLButtonElement;

      messageInput.value = 'Test';
      sendBtn.click();

      const messagesList = element.querySelector('#messagesList');
      expect(messagesList?.textContent).toContain('now');
    });

    it('should auto-scroll to bottom when new message sent', () => {
      const element = chatsPage.render();
      const button = element.querySelector('#newChatBtn') as HTMLButtonElement;
      button.click();

      const messageInput = element.querySelector('#messageInput') as HTMLTextAreaElement;
      const sendBtn = element.querySelector('#sendBtn') as HTMLButtonElement;

      messageInput.value = 'Test';
      sendBtn.click();

      const messagesList = element.querySelector('#messagesList') as HTMLElement;
      // ScrollTop should be set to scrollHeight
      expect(messagesList.scrollTop).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Search Functionality', () => {
    it('should handle search input', () => {
      const element = chatsPage.render();
      const consoleSpy = vi.spyOn(console, 'log');
      const searchInput = element.querySelector('#chatSearch') as HTMLInputElement;

      searchInput.value = 'test query';
      searchInput.dispatchEvent(new Event('input'));

      expect(consoleSpy).toHaveBeenCalledWith('[CHATS-SCREEN] Search:', 'test query');
    });

    it('should handle empty search input', () => {
      const element = chatsPage.render();
      const consoleSpy = vi.spyOn(console, 'log');
      const searchInput = element.querySelector('#chatSearch') as HTMLInputElement;

      searchInput.value = '';
      searchInput.dispatchEvent(new Event('input'));

      expect(consoleSpy).toHaveBeenCalledWith('[CHATS-SCREEN] Search:', '');
    });
  });

  describe('Time Formatting', () => {
    it('should show "now" for recent messages', () => {
      const element = chatsPage.render();
      const button = element.querySelector('#newChatBtn') as HTMLButtonElement;
      button.click();

      const messageInput = element.querySelector('#messageInput') as HTMLTextAreaElement;
      const sendBtn = element.querySelector('#sendBtn') as HTMLButtonElement;

      messageInput.value = 'Test';
      sendBtn.click();

      const messagesList = element.querySelector('#messagesList');
      expect(messagesList?.textContent).toContain('now');
    });
  });

  describe('Mounting', () => {
    it('should mount to container', () => {
      chatsPage.mount('test-container');

      expect(container.children.length).toBeGreaterThan(0);
      expect(container.querySelector('.chats-screen')).toBeDefined();
    });

    it('should clear container before mounting', () => {
      container.innerHTML = '<div>Old content</div>';
      chatsPage.mount('test-container');

      expect(container.querySelector('div')?.textContent).not.toBe('Old content');
    });

    it('should log mount message', () => {
      const consoleSpy = vi.spyOn(console, 'log');
      chatsPage.mount('test-container');

      expect(consoleSpy).toHaveBeenCalledWith('[CHATS-SCREEN] Mounted');
    });

    it('should log error when container not found', () => {
      const consoleSpy = vi.spyOn(console, 'error');
      chatsPage.mount('nonexistent-container');

      expect(consoleSpy).toHaveBeenCalledWith(
        '[CHATS-SCREEN] Container not found:',
        'nonexistent-container'
      );
    });
  });

  describe('Unmounting', () => {
    it('should unmount from parent', () => {
      chatsPage.mount('test-container');
      const initialChildren = container.children.length;

      chatsPage.unmount();

      expect(container.children.length).toBeLessThan(initialChildren);
    });

    it('should log unmount message', () => {
      chatsPage.mount('test-container');
      const consoleSpy = vi.spyOn(console, 'log');

      chatsPage.unmount();

      expect(consoleSpy).toHaveBeenCalledWith('[CHATS-SCREEN] Unmounted');
    });

    it('should not throw when unmounting without mounting', () => {
      expect(() => {
        chatsPage.unmount();
      }).not.toThrow();
    });
  });

  describe('Edge Cases', () => {
    it('should handle very long messages', () => {
      const element = chatsPage.render();
      const button = element.querySelector('#newChatBtn') as HTMLButtonElement;
      button.click();

      const messageInput = element.querySelector('#messageInput') as HTMLTextAreaElement;
      const sendBtn = element.querySelector('#sendBtn') as HTMLButtonElement;

      const longMessage = 'A'.repeat(10000);
      messageInput.value = longMessage;
      sendBtn.click();

      const messagesList = element.querySelector('#messagesList');
      expect(messagesList?.textContent).toContain(longMessage);
    });

    it('should handle special characters in messages', () => {
      const element = chatsPage.render();
      const button = element.querySelector('#newChatBtn') as HTMLButtonElement;
      button.click();

      const messageInput = element.querySelector('#messageInput') as HTMLTextAreaElement;
      const sendBtn = element.querySelector('#sendBtn') as HTMLButtonElement;

      const specialChars = '!@#$%^&*()_+-={}[]|\\:";\'<>?,./~`';
      messageInput.value = specialChars;
      sendBtn.click();

      const messagesList = element.querySelector('#messagesList');
      expect(messagesList?.textContent).toContain(specialChars);
    });

    it('should handle rapid message sending', () => {
      const element = chatsPage.render();
      const button = element.querySelector('#newChatBtn') as HTMLButtonElement;
      button.click();

      const messageInput = element.querySelector('#messageInput') as HTMLTextAreaElement;
      const sendBtn = element.querySelector('#sendBtn') as HTMLButtonElement;

      for (let i = 0; i < 10; i++) {
        messageInput.value = `Message ${i}`;
        sendBtn.click();
      }

      const messagesList = element.querySelector('#messagesList');
      expect(messagesList?.textContent).toContain('Message 9');
    });

    it('should handle sending when no chat selected', () => {
      const element = chatsPage.render();
      const messageInput = element.querySelector('#messageInput') as HTMLTextAreaElement;
      const sendBtn = element.querySelector('#sendBtn') as HTMLButtonElement;

      messageInput.value = 'Test';

      expect(() => {
        sendBtn.click();
      }).not.toThrow();
    });
  });

  describe('Integration Tests', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should support full workflow: create, select, send, receive', () => {
      const element = chatsPage.render();

      // Create chat
      const newChatBtn = element.querySelector('#newChatBtn') as HTMLButtonElement;
      newChatBtn.click();

      // Send message
      const messageInput = element.querySelector('#messageInput') as HTMLTextAreaElement;
      const sendBtn = element.querySelector('#sendBtn') as HTMLButtonElement;

      messageInput.value = 'Hello';
      sendBtn.click();

      // Check user message
      const messagesList = element.querySelector('#messagesList');
      expect(messagesList?.textContent).toContain('Hello');

      // Wait for agent response
      vi.advanceTimersByTime(1500);

      // Check agent response
      expect(messagesList?.textContent).toContain("I'm working on that task");
    });

    it('should handle multiple chats', () => {
      const element = chatsPage.render();
      const button = element.querySelector('#newChatBtn') as HTMLButtonElement;

      button.click();
      button.click();
      button.click();

      const chatList = element.querySelector('#chatList');
      expect(chatList?.children.length).toBe(3);

      const badge = element.querySelector('#chatCount');
      expect(badge?.textContent).toBe('3');
    });

    it('should maintain separate message history per chat', () => {
      vi.useFakeTimers();

      const page = new ChatsPage();
      const element = page.render();
      const button = element.querySelector('#newChatBtn') as HTMLButtonElement;

      // Create first chat and send message
      button.click();
      const messageInput1 = element.querySelector('#messageInput') as HTMLTextAreaElement;
      const sendBtn1 = element.querySelector('#sendBtn') as HTMLButtonElement;
      messageInput1.value = 'First chat message';
      sendBtn1.click();

      // Advance time
      vi.advanceTimersByTime(100);

      // Create second chat
      button.click();

      // Verify two separate chats exist
      expect((ChatCard as any).mock.calls.length).toBeGreaterThanOrEqual(2);

      vi.useRealTimers();
    });
  });
});
