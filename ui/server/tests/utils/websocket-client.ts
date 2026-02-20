/**
 * WebSocket test client utilities
 */
import WebSocket from 'ws';
import type {
  WSClientMessage,
  WSServerMessage,
  WSSubscribeMessage,
  WSAgentCommandMessage,
  WSTaskAssignMessage,
} from '../../types/index.js';

export class TestWebSocketClient {
  private ws: WebSocket | null = null;
  private messages: WSServerMessage[] = [];
  private messageHandlers: Map<string, (msg: WSServerMessage) => void> = new Map();
  private connected = false;
  private connectPromise: Promise<void> | null = null;

  constructor(private url: string) {}

  /**
   * Connect to WebSocket server
   */
  async connect(): Promise<void> {
    if (this.connected) return;
    if (this.connectPromise) return this.connectPromise;

    this.connectPromise = new Promise((resolve, reject) => {
      this.ws = new WebSocket(this.url);

      this.ws.on('open', () => {
        this.connected = true;
        resolve();
      });

      this.ws.on('message', (data: Buffer) => {
        try {
          const message = JSON.parse(data.toString()) as WSServerMessage;
          this.messages.push(message);

          // Call type-specific handlers
          const handler = this.messageHandlers.get(message.type);
          if (handler) {
            handler(message);
          }

          // Call wildcard handler
          const wildcardHandler = this.messageHandlers.get('*');
          if (wildcardHandler) {
            wildcardHandler(message);
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      });

      this.ws.on('error', (error) => {
        reject(error);
      });

      this.ws.on('close', () => {
        this.connected = false;
      });
    });

    return this.connectPromise;
  }

  /**
   * Send a message to the server
   */
  send(message: WSClientMessage): void {
    if (!this.ws || !this.connected) {
      throw new Error('WebSocket not connected');
    }
    this.ws.send(JSON.stringify(message));
  }

  /**
   * Subscribe to channels
   */
  subscribe(channels: string[]): void {
    const message: WSSubscribeMessage = {
      type: 'subscribe',
      channels,
    };
    this.send(message);
  }

  /**
   * Send agent command
   */
  sendAgentCommand(
    agentId: string,
    command: 'pause' | 'resume' | 'cancel',
    params?: Record<string, unknown>
  ): void {
    const message: WSAgentCommandMessage = {
      type: 'agent_command',
      agent_id: agentId,
      command,
      params,
    };
    this.send(message);
  }

  /**
   * Assign task to agent
   */
  assignTask(taskId: string, agentId: string): void {
    const message: WSTaskAssignMessage = {
      type: 'task_assign',
      task_id: taskId,
      agent_id: agentId,
    };
    this.send(message);
  }

  /**
   * Register a handler for a specific message type
   */
  on(type: string, handler: (msg: WSServerMessage) => void): void {
    this.messageHandlers.set(type, handler);
  }

  /**
   * Wait for a specific message type
   */
  async waitForMessage(
    type: string,
    timeout = 5000
  ): Promise<WSServerMessage> {
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        this.messageHandlers.delete(type);
        reject(new Error(`Timeout waiting for message type: ${type}`));
      }, timeout);

      this.on(type, (msg) => {
        clearTimeout(timeoutId);
        this.messageHandlers.delete(type);
        resolve(msg);
      });
    });
  }

  /**
   * Wait for any message
   */
  async waitForAnyMessage(timeout = 5000): Promise<WSServerMessage> {
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        this.messageHandlers.delete('*');
        reject(new Error('Timeout waiting for any message'));
      }, timeout);

      this.on('*', (msg) => {
        clearTimeout(timeoutId);
        this.messageHandlers.delete('*');
        resolve(msg);
      });
    });
  }

  /**
   * Get all received messages
   */
  getMessages(): WSServerMessage[] {
    return [...this.messages];
  }

  /**
   * Get messages of a specific type
   */
  getMessagesByType(type: string): WSServerMessage[] {
    return this.messages.filter((msg) => msg.type === type);
  }

  /**
   * Clear message history
   */
  clearMessages(): void {
    this.messages = [];
  }

  /**
   * Close the WebSocket connection
   */
  async close(): Promise<void> {
    return new Promise((resolve) => {
      if (!this.ws) {
        resolve();
        return;
      }

      this.ws.on('close', () => {
        this.connected = false;
        resolve();
      });

      this.ws.close();
    });
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.connected;
  }
}
