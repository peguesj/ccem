/**
 * WebSocket Server for Real-Time Communication
 */
import { WebSocketServer, WebSocket } from 'ws';
import { Server } from 'http';
import type {
  WSClientMessage,
  WSServerMessage,
  WSSubscribeMessage,
  WSAgentCommandMessage,
  WSTaskAssignMessage,
  WSAgentUpdateMessage,
  WSTaskUpdateMessage,
  WSLogEntryMessage,
  WSFileChangeMessage,
} from '../types/index.js';

interface ClientConnection {
  ws: WebSocket;
  sessionId: string;
  channels: Set<string>;
}

class WebSocketManager {
  private wss: WebSocketServer;
  private clients: Map<string, ClientConnection>;

  constructor(server: Server) {
    this.wss = new WebSocketServer({ server, path: '/ws/sessions' });
    this.clients = new Map();

    this.wss.on('connection', this.handleConnection.bind(this));
  }

  private handleConnection(ws: WebSocket, request: any): void {
    // Extract session ID from URL path: /ws/sessions/:id
    const urlParts = request.url.split('/');
    const sessionId = urlParts[urlParts.length - 1];

    if (!sessionId || sessionId === 'sessions') {
      ws.close(1008, 'Invalid session ID');
      return;
    }

    const clientId = this.generateClientId();
    const connection: ClientConnection = {
      ws,
      sessionId,
      channels: new Set(['all']), // Default subscribe to all
    };

    this.clients.set(clientId, connection);

    console.log(`[WS] Client ${clientId} connected to session ${sessionId}`);

    // Send welcome message
    this.sendToClient(clientId, {
      type: 'log_entry',
      data: {
        timestamp: new Date().toISOString(),
        level: 'info',
        message: 'Connected to session',
        context: { session_id: sessionId },
      },
      timestamp: new Date().toISOString(),
    });

    // Set up message handler
    ws.on('message', (data: Buffer) => {
      this.handleMessage(clientId, data);
    });

    // Handle client disconnect
    ws.on('close', () => {
      console.log(`[WS] Client ${clientId} disconnected`);
      this.clients.delete(clientId);
    });

    // Handle errors
    ws.on('error', (error) => {
      console.error(`[WS] Client ${clientId} error:`, error);
      this.clients.delete(clientId);
    });
  }

  private handleMessage(clientId: string, data: Buffer): void {
    const connection = this.clients.get(clientId);
    if (!connection) return;

    try {
      const message = JSON.parse(data.toString()) as WSClientMessage;

      switch (message.type) {
        case 'subscribe':
          this.handleSubscribe(clientId, message as WSSubscribeMessage);
          break;

        case 'agent_command':
          this.handleAgentCommand(clientId, message as WSAgentCommandMessage);
          break;

        case 'task_assign':
          this.handleTaskAssign(clientId, message as WSTaskAssignMessage);
          break;

        default:
          console.warn(`[WS] Unknown message type: ${message.type}`);
      }
    } catch (error) {
      console.error('[WS] Error parsing message:', error);
      this.sendError(clientId, 'Invalid message format');
    }
  }

  private handleSubscribe(clientId: string, message: WSSubscribeMessage): void {
    const connection = this.clients.get(clientId);
    if (!connection) return;

    connection.channels = new Set(message.channels);

    console.log(`[WS] Client ${clientId} subscribed to:`, Array.from(connection.channels));

    this.sendToClient(clientId, {
      type: 'log_entry',
      data: {
        timestamp: new Date().toISOString(),
        level: 'info',
        message: 'Subscription updated',
        context: { channels: Array.from(connection.channels) },
      },
      timestamp: new Date().toISOString(),
    });
  }

  private handleAgentCommand(clientId: string, message: WSAgentCommandMessage): void {
    const connection = this.clients.get(clientId);
    if (!connection) return;

    console.log(
      `[WS] Agent command from ${clientId}: ${message.command} for agent ${message.agent_id}`
    );

    // Mock response - in production, this would interact with CCEM
    this.broadcastToSession(connection.sessionId, {
      type: 'agent_update',
      data: {
        agent_id: message.agent_id,
        status: message.command === 'pause' ? 'idle' : 'running',
        progress: 0,
        message: `Agent ${message.command}d by user`,
      },
      timestamp: new Date().toISOString(),
    });
  }

  private handleTaskAssign(clientId: string, message: WSTaskAssignMessage): void {
    const connection = this.clients.get(clientId);
    if (!connection) return;

    console.log(
      `[WS] Task assignment from ${clientId}: task ${message.task_id} to agent ${message.agent_id}`
    );

    // Mock response - in production, this would interact with CCEM
    this.broadcastToSession(connection.sessionId, {
      type: 'task_update',
      data: {
        task_id: message.task_id,
        status: 'assigned',
        progress: 0,
        agent_id: message.agent_id,
      },
      timestamp: new Date().toISOString(),
    });
  }

  private sendToClient(clientId: string, message: WSServerMessage): void {
    const connection = this.clients.get(clientId);
    if (!connection || connection.ws.readyState !== WebSocket.OPEN) return;

    try {
      connection.ws.send(JSON.stringify(message));
    } catch (error) {
      console.error(`[WS] Error sending to client ${clientId}:`, error);
    }
  }

  private sendError(clientId: string, message: string): void {
    this.sendToClient(clientId, {
      type: 'log_entry',
      data: {
        timestamp: new Date().toISOString(),
        level: 'error',
        message,
      },
      timestamp: new Date().toISOString(),
    });
  }

  private broadcastToSession(sessionId: string, message: WSServerMessage): void {
    this.clients.forEach((connection, clientId) => {
      if (connection.sessionId === sessionId) {
        this.sendToClient(clientId, message);
      }
    });
  }

  /**
   * Broadcast agent update to all clients in a session
   */
  public broadcastAgentUpdate(
    sessionId: string,
    agentId: string,
    status: string,
    progress: number,
    message: string
  ): void {
    const msg: WSAgentUpdateMessage = {
      type: 'agent_update',
      data: {
        agent_id: agentId,
        status: status as any,
        progress,
        message,
      },
      timestamp: new Date().toISOString(),
    };

    this.broadcastToSession(sessionId, msg);
  }

  /**
   * Broadcast task update to all clients in a session
   */
  public broadcastTaskUpdate(
    sessionId: string,
    taskId: string,
    status: string,
    progress: number,
    agentId?: string
  ): void {
    const msg: WSTaskUpdateMessage = {
      type: 'task_update',
      data: {
        task_id: taskId,
        status: status as any,
        progress,
        agent_id: agentId,
      },
      timestamp: new Date().toISOString(),
    };

    this.broadcastToSession(sessionId, msg);
  }

  /**
   * Broadcast log entry to all clients in a session
   */
  public broadcastLog(
    sessionId: string,
    level: string,
    message: string,
    source?: string,
    context?: Record<string, unknown>
  ): void {
    const msg: WSLogEntryMessage = {
      type: 'log_entry',
      data: {
        timestamp: new Date().toISOString(),
        level: level as any,
        message,
        source,
        context,
      },
      timestamp: new Date().toISOString(),
    };

    this.broadcastToSession(sessionId, msg);
  }

  /**
   * Broadcast file change to all clients in a session
   */
  public broadcastFileChange(
    sessionId: string,
    path: string,
    operation: 'created' | 'modified' | 'deleted' | 'renamed',
    agentId?: string
  ): void {
    const msg: WSFileChangeMessage = {
      type: 'file_change',
      data: {
        path,
        operation,
        agent_id: agentId,
      },
      timestamp: new Date().toISOString(),
    };

    this.broadcastToSession(sessionId, msg);
  }

  private generateClientId(): string {
    return `client_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }
}

export default WebSocketManager;
