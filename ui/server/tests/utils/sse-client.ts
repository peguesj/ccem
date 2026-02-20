/**
 * Server-Sent Events (SSE) test client utilities
 */
import type { SSEEvent } from '../../types/index.js';

export interface SSEMessage {
  event: string;
  data: unknown;
}

export class TestSSEClient {
  private events: SSEMessage[] = [];
  private eventHandlers: Map<string, (msg: SSEMessage) => void> = new Map();
  private controller: AbortController | null = null;

  constructor(private url: string) {}

  /**
   * Connect to SSE stream
   */
  async connect(): Promise<void> {
    this.controller = new AbortController();

    const response = await fetch(this.url, {
      signal: this.controller.signal,
      headers: {
        Accept: 'text/event-stream',
      },
    });

    if (!response.ok) {
      throw new Error(`SSE connection failed: ${response.status}`);
    }

    if (!response.body) {
      throw new Error('SSE response has no body');
    }

    // Process the stream
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    const processStream = async () => {
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          let currentEvent = '';
          let currentData = '';

          for (const line of lines) {
            if (line.startsWith('event:')) {
              currentEvent = line.substring(6).trim();
            } else if (line.startsWith('data:')) {
              currentData = line.substring(5).trim();
            } else if (line === '') {
              // Empty line indicates end of message
              if (currentEvent && currentData) {
                this.handleMessage(currentEvent, currentData);
                currentEvent = '';
                currentData = '';
              }
            }
          }
        }
      } catch (error) {
        if ((error as Error).name !== 'AbortError') {
          console.error('SSE stream error:', error);
        }
      }
    };

    // Start processing stream in background
    processStream();
  }

  /**
   * Handle incoming SSE message
   */
  private handleMessage(event: string, data: string): void {
    try {
      const parsed = JSON.parse(data);
      const message: SSEMessage = { event, data: parsed };
      this.events.push(message);

      // Call event-specific handler
      const handler = this.eventHandlers.get(event);
      if (handler) {
        handler(message);
      }

      // Call wildcard handler
      const wildcardHandler = this.eventHandlers.get('*');
      if (wildcardHandler) {
        wildcardHandler(message);
      }
    } catch (error) {
      console.error('Error parsing SSE data:', error);
    }
  }

  /**
   * Register handler for specific event type
   */
  on(event: string, handler: (msg: SSEMessage) => void): void {
    this.eventHandlers.set(event, handler);
  }

  /**
   * Wait for a specific event type
   */
  async waitForEvent(
    event: string,
    timeout = 5000
  ): Promise<SSEMessage> {
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        this.eventHandlers.delete(event);
        reject(new Error(`Timeout waiting for event: ${event}`));
      }, timeout);

      this.on(event, (msg) => {
        clearTimeout(timeoutId);
        this.eventHandlers.delete(event);
        resolve(msg);
      });
    });
  }

  /**
   * Wait for any event
   */
  async waitForAnyEvent(timeout = 5000): Promise<SSEMessage> {
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        this.eventHandlers.delete('*');
        reject(new Error('Timeout waiting for any event'));
      }, timeout);

      this.on('*', (msg) => {
        clearTimeout(timeoutId);
        this.eventHandlers.delete('*');
        resolve(msg);
      });
    });
  }

  /**
   * Get all received events
   */
  getEvents(): SSEMessage[] {
    return [...this.events];
  }

  /**
   * Get events by type
   */
  getEventsByType(event: string): SSEMessage[] {
    return this.events.filter((e) => e.event === event);
  }

  /**
   * Clear event history
   */
  clearEvents(): void {
    this.events = [];
  }

  /**
   * Close the SSE connection
   */
  close(): void {
    if (this.controller) {
      this.controller.abort();
      this.controller = null;
    }
  }
}
