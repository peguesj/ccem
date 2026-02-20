/**
 * WebSocket Mocking Utilities
 *
 * Provides utilities for mocking WebSocket connections in tests,
 * including message handling and connection states.
 */

import { vi } from 'vitest';

/**
 * WebSocket ready states
 */
export enum WebSocketState {
  CONNECTING = 0,
  OPEN = 1,
  CLOSING = 2,
  CLOSED = 3,
}

/**
 * Mock WebSocket message
 */
export interface MockMessage {
  type: string;
  data: any;
  timestamp?: number;
}

/**
 * Mock WebSocket options
 */
export interface MockWebSocketOptions {
  /** Initial ready state */
  readyState?: WebSocketState;
  /** Delay before connection opens (ms) */
  connectionDelay?: number;
  /** Auto-send messages on connection */
  autoMessages?: MockMessage[];
  /** Simulate connection errors */
  shouldError?: boolean;
}

/**
 * Create a mock WebSocket class for testing
 *
 * @example
 * ```ts
 * const MockWS = createMockWebSocket({
 *   autoMessages: [{ type: 'connected', data: { status: 'ok' } }]
 * });
 * global.WebSocket = MockWS;
 * ```
 */
export function createMockWebSocket(options: MockWebSocketOptions = {}) {
  const {
    readyState = WebSocketState.CONNECTING,
    connectionDelay = 0,
    autoMessages = [],
    shouldError = false,
  } = options;

  class MockWebSocket {
    public readyState: number = readyState;
    public url: string;
    public protocol: string;

    private listeners: Map<string, Set<Function>> = new Map();
    private messageQueue: MockMessage[] = [];

    constructor(url: string, protocols?: string | string[]) {
      this.url = url;
      this.protocol = Array.isArray(protocols) ? protocols[0] : protocols || '';

      // Simulate connection opening
      if (!shouldError) {
        setTimeout(() => {
          this.readyState = WebSocketState.OPEN;
          this.triggerEvent('open', {});

          // Send auto messages
          autoMessages.forEach((msg) => {
            setTimeout(() => this.receiveMessage(msg), 10);
          });
        }, connectionDelay);
      } else {
        setTimeout(() => {
          this.readyState = WebSocketState.CLOSED;
          this.triggerEvent('error', { message: 'Connection failed' });
        }, connectionDelay);
      }
    }

    /**
     * Send a message (mocked)
     */
    send = vi.fn((data: string) => {
      if (this.readyState !== WebSocketState.OPEN) {
        throw new Error('WebSocket is not open');
      }

      try {
        const message = JSON.parse(data);
        this.messageQueue.push(message);
      } catch {
        this.messageQueue.push({ type: 'raw', data });
      }
    });

    /**
     * Close the connection
     */
    close = vi.fn((code?: number, reason?: string) => {
      this.readyState = WebSocketState.CLOSING;
      setTimeout(() => {
        this.readyState = WebSocketState.CLOSED;
        this.triggerEvent('close', { code, reason });
      }, 10);
    });

    /**
     * Add event listener
     */
    addEventListener = vi.fn((event: string, handler: Function) => {
      if (!this.listeners.has(event)) {
        this.listeners.set(event, new Set());
      }
      this.listeners.get(event)!.add(handler);
    });

    /**
     * Remove event listener
     */
    removeEventListener = vi.fn((event: string, handler: Function) => {
      const handlers = this.listeners.get(event);
      if (handlers) {
        handlers.delete(handler);
      }
    });

    /**
     * Trigger an event
     */
    private triggerEvent(event: string, data: any) {
      const handlers = this.listeners.get(event);
      if (handlers) {
        handlers.forEach((handler) => handler(data));
      }

      // Also call onX properties
      const onEvent = `on${event}` as keyof this;
      if (typeof this[onEvent] === 'function') {
        (this[onEvent] as Function)(data);
      }
    }

    /**
     * Simulate receiving a message
     */
    receiveMessage(message: MockMessage) {
      if (this.readyState === WebSocketState.OPEN) {
        this.triggerEvent('message', {
          data: JSON.stringify(message),
          type: 'message',
        });
      }
    }

    /**
     * Get sent messages
     */
    getSentMessages(): MockMessage[] {
      return this.messageQueue;
    }

    /**
     * Clear sent messages
     */
    clearSentMessages() {
      this.messageQueue = [];
    }

    // Event handler properties
    onopen: ((event: any) => void) | null = null;
    onmessage: ((event: any) => void) | null = null;
    onerror: ((event: any) => void) | null = null;
    onclose: ((event: any) => void) | null = null;
  }

  return MockWebSocket as any;
}

/**
 * Create a WebSocket instance for testing
 */
export class TestWebSocket {
  private ws: any;

  constructor(url: string, options: MockWebSocketOptions = {}) {
    const MockWS = createMockWebSocket(options);
    this.ws = new MockWS(url);
  }

  /**
   * Simulate receiving a message
   */
  receive(message: MockMessage) {
    this.ws.receiveMessage(message);
  }

  /**
   * Get the underlying mock WebSocket
   */
  getMock() {
    return this.ws;
  }

  /**
   * Get all sent messages
   */
  getSentMessages(): MockMessage[] {
    return this.ws.getSentMessages();
  }

  /**
   * Wait for a specific message type
   */
  async waitForMessage(type: string, timeout = 1000): Promise<MockMessage> {
    return new Promise((resolve, reject) => {
      const handler = (event: MessageEvent) => {
        const message = JSON.parse(event.data);
        if (message.type === type) {
          this.ws.removeEventListener('message', handler);
          resolve(message);
        }
      };

      this.ws.addEventListener('message', handler);

      setTimeout(() => {
        this.ws.removeEventListener('message', handler);
        reject(new Error(`Timeout waiting for message type: ${type}`));
      }, timeout);
    });
  }
}

/**
 * Create preset mock messages
 */
export const mockMessages = {
  connected: (): MockMessage => ({
    type: 'connected',
    data: { status: 'ok' },
    timestamp: Date.now(),
  }),

  configUpdate: (config: any): MockMessage => ({
    type: 'config:update',
    data: config,
    timestamp: Date.now(),
  }),

  commandExecuted: (result: any): MockMessage => ({
    type: 'command:executed',
    data: result,
    timestamp: Date.now(),
  }),

  error: (message: string): MockMessage => ({
    type: 'error',
    data: { message },
    timestamp: Date.now(),
  }),

  mcpEvent: (event: any): MockMessage => ({
    type: 'mcp:event',
    data: event,
    timestamp: Date.now(),
  }),
};

/**
 * Wait for WebSocket to be in a specific state
 */
export async function waitForWebSocketState(
  ws: WebSocket,
  state: WebSocketState,
  timeout = 1000
): Promise<void> {
  return new Promise((resolve, reject) => {
    if (ws.readyState === state) {
      resolve();
      return;
    }

    const checkState = () => {
      if (ws.readyState === state) {
        resolve();
      }
    };

    ws.addEventListener('open', checkState);
    ws.addEventListener('close', checkState);

    setTimeout(() => {
      ws.removeEventListener('open', checkState);
      ws.removeEventListener('close', checkState);
      reject(new Error(`Timeout waiting for WebSocket state: ${state}`));
    }, timeout);
  });
}
