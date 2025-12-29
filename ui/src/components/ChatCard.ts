/**
 * CCEM-UI ChatCard Component
 * Display and manage individual chat session cards
 */

/**
 * Chat message interface
 */
export interface ChatMessage {
  id: string;
  content: string;
  sender: 'user' | 'agent';
  timestamp: Date | string;
}

/**
 * Chat data interface
 */
export interface Chat {
  id: string;
  title: string;
  createdAt: Date | string;
  updatedAt: Date | string;
  messageCount?: number;
  isActive?: boolean;
  agentId?: string;
}

/**
 * Chat click handler type
 */
export type ChatClickHandler = (chat: Chat) => void;

/**
 * ChatCard component for displaying individual chat sessions
 */
export class ChatCard {
  private chat: Chat;
  private messages: ChatMessage[];
  private element: HTMLElement | null = null;
  private onClick: ChatClickHandler | null = null;

  /**
   * Creates a new ChatCard instance
   * @param chat - Chat data
   * @param messages - Chat messages
   */
  constructor(chat: Chat, messages: ChatMessage[] = []) {
    this.chat = chat;
    this.messages = messages;

    console.log('[COMPONENT] ChatCard created:', chat.id);
  }

  /**
   * Render the chat card
   * @returns Card element
   */
  render(): HTMLElement {
    const card = document.createElement('div');
    card.id = this.chat.id;
    card.className = 'card card-hover chat-card';

    const timeSince = this.getTimeSince(this.chat.updatedAt);
    const preview = this.getPreviewText();

    card.innerHTML = `
      <div class="flex items-center justify-between mb-3">
        <div class="flex items-center gap-2">
          <span class="status-indicator ${this.chat.isActive ? 'running' : 'idle'}"></span>
          <span class="font-medium text-primary">${this.escapeHtml(this.chat.title)}</span>
        </div>
        <span class="text-xs text-tertiary">${timeSince}</span>
      </div>

      <div class="text-sm text-secondary mb-3 chat-preview">
        ${this.escapeHtml(preview)}
      </div>

      <div class="flex items-center justify-between text-xs text-tertiary">
        <span>${this.getMessageCount()} messages</span>
        ${this.chat.agentId ? `<span class="badge badge-info">Agent: ${this.escapeHtml(this.chat.agentId)}</span>` : ''}
      </div>
    `;

    // Attach click handler
    if (this.onClick) {
      card.addEventListener('click', () => {
        console.log('[CHAT-CARD] Card clicked:', this.chat.id);
        if (this.onClick) {
          this.onClick(this.chat);
        }
      });
    }

    this.element = card;
    return card;
  }

  /**
   * Update chat data and re-render
   * @param updates - Updated chat properties
   * @param messages - Updated messages array
   */
  update(updates: Partial<Chat>, messages?: ChatMessage[]): void {
    this.chat = { ...this.chat, ...updates };
    if (messages) {
      this.messages = messages;
    }

    if (this.element && this.element.parentNode) {
      const newElement = this.render();
      this.element.parentNode.replaceChild(newElement, this.element);
      console.log('[CHAT-CARD] Updated:', this.chat.id);
    }
  }

  /**
   * Set active state
   * @param active - Active state
   */
  setActive(active: boolean): void {
    if (this.element) {
      this.chat.isActive = active;
      if (active) {
        this.element.classList.add('active');
      } else {
        this.element.classList.remove('active');
      }
    }
  }

  /**
   * Set click handler
   * @param handler - Click handler function
   */
  setClickHandler(handler: ChatClickHandler): void {
    this.onClick = handler;
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
   * Get preview text for the card
   * @returns Preview text
   */
  private getPreviewText(): string {
    if (this.messages.length > 0) {
      const lastMessage = this.messages[this.messages.length - 1];
      return lastMessage.content.substring(0, 50) + '...';
    }
    return 'No messages yet';
  }

  /**
   * Get message count
   * @returns Number of messages
   */
  private getMessageCount(): number {
    return this.chat.messageCount !== undefined
      ? this.chat.messageCount
      : this.messages.length;
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
   * Destroy the component
   */
  destroy(): void {
    if (this.element && this.element.parentNode) {
      this.element.parentNode.removeChild(this.element);
      console.log('[CHAT-CARD] Destroyed:', this.chat.id);
    }
  }
}

export default ChatCard;
