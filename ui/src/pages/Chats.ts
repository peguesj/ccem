/**
 * CCEM-UI Chats Page
 * Chat interface and message management
 */

import { Chat, ChatMessage, ChatCard } from '../components/ChatCard';

/**
 * Chats page component
 */
export class ChatsPage {
  private element: HTMLElement | null = null;
  private chats: Chat[] = [];
  private selectedChat: Chat | null = null;
  private messages: Record<string, ChatMessage[]> = {};

  /**
   * Creates a new ChatsPage instance
   */
  constructor() {
    console.log('[SCREEN] ChatsPage initialized');
  }

  /**
   * Render the chats screen
   * @returns Screen element
   */
  render(): HTMLElement {
    const screen = document.createElement('div');
    screen.className = 'screen chats-screen flex';
    screen.style.cssText = 'height: 100%;';

    screen.innerHTML = `
      <!-- Chat Sidebar -->
      <aside style="
        width: 320px;
        border-right: 1px solid var(--color-border-primary);
        display: flex;
        flex-direction: column;
        background: var(--color-bg-secondary);
      ">
        <div style="padding: 24px; border-bottom: 1px solid var(--color-border-primary);">
          <div class="flex items-center justify-between mb-4">
            <h3>Chats</h3>
            <span class="badge badge-primary" id="chatCount">0</span>
          </div>

          <button class="btn btn-primary w-full mb-3" id="newChatBtn">
            <span>+</span>
            <span>New Chat</span>
          </button>

          <input type="text"
                 class="input"
                 id="chatSearch"
                 placeholder="Search chats...">
        </div>

        <div style="flex: 1; overflow-y: auto; padding: 16px;" id="chatList">
          <!-- Chat cards will be rendered here -->
        </div>
      </aside>

      <!-- Chat View -->
      <main style="flex: 1; display: flex; flex-direction: column; overflow: hidden;">
        <div id="chatView" style="display: flex; flex-direction: column; height: 100%;">
          <!-- Empty state -->
          <div id="emptyState" style="
            display: flex;
            align-items: center;
            justify-content: center;
            flex: 1;
            text-align: center;
            color: var(--color-text-tertiary);
          ">
            <div>
              <div style="font-size: 64px; margin-bottom: 16px;">💬</div>
              <p style="font-size: 18px; margin-bottom: 8px;">No chat selected</p>
              <p style="font-size: 14px;">Select a chat from the sidebar or create a new one</p>
            </div>
          </div>

          <!-- Messages container (hidden initially) -->
          <div id="messagesContainer" class="hidden" style="flex: 1; display: flex; flex-direction: column;">
            <div style="flex: 1; overflow-y: auto; padding: 24px;" id="messagesList">
              <!-- Messages will be rendered here -->
            </div>

            <!-- Input area -->
            <div style="
              padding: 24px;
              border-top: 1px solid var(--color-border-primary);
              background: var(--color-bg-secondary);
            ">
              <div class="flex gap-3 mb-3">
                <select class="input" id="agentSelector" style="width: 200px;">
                  <option value="">@Agent: Select...</option>
                </select>

                <select class="input" id="modelSelector" style="width: 150px;">
                  <option value="sonnet">Sonnet 4.5</option>
                  <option value="opus">Opus 4</option>
                  <option value="haiku">Haiku 3.5</option>
                </select>

                <button class="btn btn-secondary" id="attachBtn">
                  📎 Attach
                </button>
              </div>

              <div class="flex gap-3">
                <textarea
                  class="textarea"
                  id="messageInput"
                  placeholder="Type your message... (use @ to mention files)"
                  rows="3"
                  style="flex: 1; resize: none;"></textarea>

                <button class="btn btn-primary" id="sendBtn" style="height: fit-content; align-self: flex-end;">
                  Send →
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    `;

    // Attach event listeners
    const newChatBtn = screen.querySelector('#newChatBtn');
    newChatBtn?.addEventListener('click', () => this.createChat());

    const searchInput = screen.querySelector('#chatSearch') as HTMLInputElement;
    searchInput?.addEventListener('input', (e: Event) => {
      const target = e.target as HTMLInputElement;
      this.handleSearch(target.value);
    });

    const sendBtn = screen.querySelector('#sendBtn');
    sendBtn?.addEventListener('click', () => this.sendMessage());

    const messageInput = screen.querySelector('#messageInput') as HTMLTextAreaElement;
    messageInput?.addEventListener('keydown', (e: KeyboardEvent) => {
      if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        this.sendMessage();
      }
    });

    this.element = screen;
    return screen;
  }

  /**
   * Create a new chat
   */
  private createChat(): void {
    console.log('[CHATS-SCREEN] Creating new chat');

    const chat: Chat = {
      id: `chat-${Date.now()}`,
      title: `Chat ${this.chats.length + 1}`,
      createdAt: new Date(),
      updatedAt: new Date(),
      messageCount: 0,
      isActive: false,
    };

    this.chats.push(chat);
    this.messages[chat.id] = [];
    this.renderChatList();
    this.selectChat(chat);
  }

  /**
   * Render chat list
   */
  private renderChatList(): void {
    if (!this.element) return;

    const container = this.element.querySelector('#chatList');
    if (!container) return;

    if (this.chats.length === 0) {
      container.innerHTML = `
        <div style="text-align: center; padding: 40px; color: var(--color-text-tertiary);">
          <p>No chats yet</p>
        </div>
      `;
      return;
    }

    container.innerHTML = '';

    this.chats.forEach((chat) => {
      const card = new ChatCard(chat, this.messages[chat.id] || []);
      card.setClickHandler((chat) => this.selectChat(chat));
      card.setActive(this.selectedChat !== null && chat.id === this.selectedChat.id);
      container.appendChild(card.render());
    });

    // Update count
    const countEl = this.element.querySelector('#chatCount');
    if (countEl) {
      countEl.textContent = String(this.chats.length);
    }
  }

  /**
   * Select a chat
   * @param chat - Chat to select
   */
  private selectChat(chat: Chat): void {
    this.selectedChat = chat;
    this.renderChatView(chat);
    this.renderChatList(); // Re-render to update active states

    console.log('[CHATS-SCREEN] Chat selected:', chat.id);
  }

  /**
   * Render chat view
   * @param chat - Chat to display
   */
  private renderChatView(chat: Chat): void {
    if (!this.element) return;

    const emptyState = this.element.querySelector('#emptyState') as HTMLElement;
    const messagesContainer = this.element.querySelector('#messagesContainer') as HTMLElement;

    if (emptyState) emptyState.classList.add('hidden');
    if (messagesContainer) messagesContainer.classList.remove('hidden');

    this.renderMessages(chat.id);
  }

  /**
   * Render messages for a chat
   * @param chatId - Chat ID
   */
  private renderMessages(chatId: string): void {
    if (!this.element) return;

    const container = this.element.querySelector('#messagesList');
    if (!container) return;

    const messages = this.messages[chatId] || [];

    if (messages.length === 0) {
      container.innerHTML = `
        <div style="
          display: flex;
          align-items: center;
          justify-content: center;
          height: 100%;
          text-align: center;
          color: var(--color-text-tertiary);
        ">
          <div>
            <p style="font-size: 18px; margin-bottom: 8px;">What do you want to get done?</p>
            <p style="font-size: 14px;">Start typing to describe your task</p>
          </div>
        </div>
      `;
      return;
    }

    container.innerHTML = messages
      .map(
        (msg) => `
      <div class="flex gap-3 mb-6 ${msg.sender === 'user' ? 'justify-end' : ''}">
        ${
          msg.sender === 'agent'
            ? `
          <div class="avatar avatar-sm" style="background: var(--color-primary);">🤖</div>
        `
            : ''
        }

        <div style="max-width: 70%;">
          <div style="
            padding: 12px 16px;
            background: ${msg.sender === 'user' ? 'var(--color-primary)' : 'var(--color-bg-tertiary)'};
            border-radius: 12px;
            ${msg.sender === 'user' ? 'border-bottom-right-radius: 4px;' : 'border-bottom-left-radius: 4px;'}
          ">
            <div class="text-sm mb-1" style="opacity: 0.7;">
              ${msg.sender === 'user' ? 'You' : 'Agent'}
            </div>
            <div>${this.escapeHtml(msg.content)}</div>
          </div>
          <div class="text-xs text-tertiary mt-1">
            ${this.getTimeSince(msg.timestamp)}
          </div>
        </div>

        ${
          msg.sender === 'user'
            ? `
          <div class="avatar avatar-sm">👤</div>
        `
            : ''
        }
      </div>
    `
      )
      .join('');

    // Scroll to bottom
    container.scrollTop = container.scrollHeight;
  }

  /**
   * Send a message
   */
  private sendMessage(): void {
    if (!this.selectedChat) return;

    const input = this.element?.querySelector('#messageInput') as HTMLTextAreaElement;
    if (!input) return;

    const content = input.value.trim();
    if (!content) return;

    const message: ChatMessage = {
      id: `msg-${Date.now()}`,
      content,
      sender: 'user',
      timestamp: new Date(),
    };

    this.messages[this.selectedChat.id].push(message);
    if (this.selectedChat.messageCount !== undefined) {
      this.selectedChat.messageCount++;
    }
    this.selectedChat.updatedAt = new Date();

    input.value = '';
    this.renderMessages(this.selectedChat.id);
    this.renderChatList();

    console.log('[CHATS-SCREEN] Message sent:', message);

    // Simulate agent response
    setTimeout(() => {
      if (!this.selectedChat) return;

      const response: ChatMessage = {
        id: `msg-${Date.now()}`,
        content: "I'm working on that task. Let me analyze the files and get back to you...",
        sender: 'agent',
        timestamp: new Date(),
      };

      this.messages[this.selectedChat.id].push(response);
      if (this.selectedChat.messageCount !== undefined) {
        this.selectedChat.messageCount++;
      }
      this.renderMessages(this.selectedChat.id);
      this.renderChatList();
    }, 1500);
  }

  /**
   * Handle search
   * @param query - Search query
   */
  private handleSearch(query: string): void {
    console.log('[CHATS-SCREEN] Search:', query);
    // TODO: Implement search filtering
  }

  /**
   * Get time since date
   * @param date - Date to calculate from
   * @returns Formatted time string
   */
  private getTimeSince(date: Date | string): string {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    const seconds = Math.floor((new Date().getTime() - dateObj.getTime()) / 1000);

    if (seconds < 60) return 'now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  }

  /**
   * Escape HTML to prevent XSS
   * @param text - Text to escape
   * @returns Escaped text
   */
  private escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * Mount the screen
   * @param containerId - Container element ID
   */
  mount(containerId: string): void {
    const container = document.getElementById(containerId);
    if (!container) {
      console.error('[CHATS-SCREEN] Container not found:', containerId);
      return;
    }

    container.innerHTML = '';
    container.appendChild(this.render());

    console.log('[CHATS-SCREEN] Mounted');
  }

  /**
   * Unmount the screen
   */
  unmount(): void {
    if (this.element && this.element.parentNode) {
      this.element.parentNode.removeChild(this.element);
      console.log('[CHATS-SCREEN] Unmounted');
    }
  }
}

export default ChatsPage;
