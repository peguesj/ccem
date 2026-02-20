/**
 * Integration tests for WebSocket functionality
 */
import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import type { Express } from 'express';
import { startTestServer } from '../utils/test-server.js';
import { TestWebSocketClient } from '../utils/websocket-client.js';
import type {
  CreateSessionRequest,
  CreateSessionResponse,
  WSAgentUpdateMessage,
  WSTaskUpdateMessage,
  WSLogEntryMessage,
  WSServerMessage,
} from '../../types/index.js';

describe('WebSocket Integration', () => {
  let app: Express;
  let url: string;
  let wsUrl: string;
  let cleanup: () => Promise<void>;
  let sessionId: string;
  let wsClient: TestWebSocketClient | null = null;

  beforeAll(async () => {
    const testServer = await startTestServer();
    app = testServer.app;
    url = testServer.url;
    wsUrl = testServer.wsUrl;
    cleanup = testServer.cleanup;
  });

  afterAll(async () => {
    await cleanup();
  });

  beforeEach(async () => {
    // Create a test session
    const req: CreateSessionRequest = {
      name: 'WebSocket Test Session',
      agents: ['task-analyzer'],
      auto_start: true,
    };

    const response = await request(app).post('/api/sessions').send(req);
    sessionId = response.body.id;
  });

  afterEach(async () => {
    // Clean up WebSocket client
    if (wsClient) {
      await wsClient.close();
      wsClient = null;
    }
  });

  describe('Connection', () => {
    it('should establish WebSocket connection', async () => {
      wsClient = new TestWebSocketClient(`${wsUrl}/ws/sessions/${sessionId}`);
      await wsClient.connect();

      expect(wsClient.isConnected()).toBe(true);
    });

    it('should reject connection without session ID', async () => {
      wsClient = new TestWebSocketClient(`${wsUrl}/ws/sessions`);

      await expect(wsClient.connect()).rejects.toThrow();
    });

    it('should send welcome message on connection', async () => {
      wsClient = new TestWebSocketClient(`${wsUrl}/ws/sessions/${sessionId}`);
      await wsClient.connect();

      // Wait for welcome message
      const message = await wsClient.waitForMessage('log_entry', 3000);

      expect(message).toBeDefined();
      expect(message.type).toBe('log_entry');

      const logMsg = message as WSLogEntryMessage;
      expect(logMsg.data.message).toContain('Connected to session');
      expect(logMsg.data.level).toBe('info');
      expect(logMsg.data.context?.session_id).toBe(sessionId);
    });

    it('should handle multiple concurrent connections', async () => {
      const client1 = new TestWebSocketClient(
        `${wsUrl}/ws/sessions/${sessionId}`
      );
      const client2 = new TestWebSocketClient(
        `${wsUrl}/ws/sessions/${sessionId}`
      );

      await client1.connect();
      await client2.connect();

      expect(client1.isConnected()).toBe(true);
      expect(client2.isConnected()).toBe(true);

      await client1.close();
      await client2.close();
    });
  });

  describe('Message Handling', () => {
    beforeEach(async () => {
      wsClient = new TestWebSocketClient(`${wsUrl}/ws/sessions/${sessionId}`);
      await wsClient.connect();
      // Clear initial welcome message
      wsClient.clearMessages();
    });

    it('should handle subscribe message', async () => {
      wsClient!.subscribe(['agents', 'tasks']);

      // Wait for confirmation
      const message = await wsClient!.waitForMessage('log_entry', 3000);

      expect(message).toBeDefined();
      const logMsg = message as WSLogEntryMessage;
      expect(logMsg.data.message).toContain('Subscription updated');
      expect(logMsg.data.context?.channels).toContain('agents');
      expect(logMsg.data.context?.channels).toContain('tasks');
    });

    it('should handle agent command message', async () => {
      wsClient!.sendAgentCommand('agent_001', 'pause');

      // Wait for agent update
      const message = await wsClient!.waitForMessage('agent_update', 3000);

      expect(message).toBeDefined();
      expect(message.type).toBe('agent_update');

      const agentMsg = message as WSAgentUpdateMessage;
      expect(agentMsg.data.agent_id).toBe('agent_001');
      expect(agentMsg.data.status).toBe('idle');
      expect(agentMsg.data.message).toContain('pause');
    });

    it('should handle task assignment message', async () => {
      wsClient!.assignTask('task_001', 'agent_001');

      // Wait for task update
      const message = await wsClient!.waitForMessage('task_update', 3000);

      expect(message).toBeDefined();
      expect(message.type).toBe('task_update');

      const taskMsg = message as WSTaskUpdateMessage;
      expect(taskMsg.data.task_id).toBe('task_001');
      expect(taskMsg.data.agent_id).toBe('agent_001');
      expect(taskMsg.data.status).toBe('assigned');
      expect(taskMsg.data.progress).toBe(0);
    });

    it('should handle multiple command types', async () => {
      wsClient!.sendAgentCommand('agent_001', 'pause');
      wsClient!.sendAgentCommand('agent_001', 'resume');

      const msg1 = await wsClient!.waitForMessage('agent_update', 3000);
      const msg2 = await wsClient!.waitForMessage('agent_update', 3000);

      const agentMsg1 = msg1 as WSAgentUpdateMessage;
      const agentMsg2 = msg2 as WSAgentUpdateMessage;

      expect(agentMsg1.data.message).toContain('pause');
      expect(agentMsg2.data.message).toContain('resume');
    });

    it('should ignore invalid JSON messages', async () => {
      // Send invalid JSON (this will be caught by the server)
      const ws = (wsClient as any).ws;
      ws.send('invalid json');

      // Should not crash, connection should remain open
      await new Promise((resolve) => setTimeout(resolve, 100));
      expect(wsClient!.isConnected()).toBe(true);
    });
  });

  describe('Broadcasting', () => {
    let client1: TestWebSocketClient;
    let client2: TestWebSocketClient;

    beforeEach(async () => {
      client1 = new TestWebSocketClient(`${wsUrl}/ws/sessions/${sessionId}`);
      client2 = new TestWebSocketClient(`${wsUrl}/ws/sessions/${sessionId}`);

      await client1.connect();
      await client2.connect();

      // Clear initial welcome messages
      client1.clearMessages();
      client2.clearMessages();
    });

    afterEach(async () => {
      await client1.close();
      await client2.close();
    });

    it('should broadcast agent updates to all clients', async () => {
      // Client 1 sends agent command
      client1.sendAgentCommand('agent_001', 'pause');

      // Both clients should receive the update
      const msg1 = await client1.waitForMessage('agent_update', 3000);
      const msg2 = await client2.waitForMessage('agent_update', 3000);

      expect(msg1.type).toBe('agent_update');
      expect(msg2.type).toBe('agent_update');

      const agentMsg1 = msg1 as WSAgentUpdateMessage;
      const agentMsg2 = msg2 as WSAgentUpdateMessage;

      expect(agentMsg1.data.agent_id).toBe('agent_001');
      expect(agentMsg2.data.agent_id).toBe('agent_001');
    });

    it('should broadcast task updates to all clients', async () => {
      // Client 1 assigns task
      client1.assignTask('task_001', 'agent_001');

      // Both clients should receive the update
      const msg1 = await client1.waitForMessage('task_update', 3000);
      const msg2 = await client2.waitForMessage('task_update', 3000);

      expect(msg1.type).toBe('task_update');
      expect(msg2.type).toBe('task_update');

      const taskMsg1 = msg1 as WSTaskUpdateMessage;
      const taskMsg2 = msg2 as WSTaskUpdateMessage;

      expect(taskMsg1.data.task_id).toBe('task_001');
      expect(taskMsg2.data.task_id).toBe('task_001');
    });

    it('should not broadcast to different sessions', async () => {
      // Create a second session
      const req: CreateSessionRequest = {
        name: 'Second Session',
        agents: ['task-analyzer'],
        auto_start: true,
      };

      const response = await request(app).post('/api/sessions').send(req);
      const sessionId2 = response.body.id;

      // Connect client to second session
      const client3 = new TestWebSocketClient(
        `${wsUrl}/ws/sessions/${sessionId2}`
      );
      await client3.connect();
      client3.clearMessages();

      // Send command in first session
      client1.sendAgentCommand('agent_001', 'pause');

      // Wait for messages
      await client1.waitForMessage('agent_update', 3000);
      await client2.waitForMessage('agent_update', 3000);

      // Client 3 should not receive any agent_update
      await expect(
        client3.waitForMessage('agent_update', 1000)
      ).rejects.toThrow();

      await client3.close();
    });
  });

  describe('Message Types', () => {
    beforeEach(async () => {
      wsClient = new TestWebSocketClient(`${wsUrl}/ws/sessions/${sessionId}`);
      await wsClient.connect();
      wsClient.clearMessages();
    });

    it('should receive agent_update messages', async () => {
      wsClient!.sendAgentCommand('agent_001', 'resume');

      const message = await wsClient!.waitForMessage('agent_update', 3000);
      const agentMsg = message as WSAgentUpdateMessage;

      expect(agentMsg.type).toBe('agent_update');
      expect(agentMsg.data).toHaveProperty('agent_id');
      expect(agentMsg.data).toHaveProperty('status');
      expect(agentMsg.data).toHaveProperty('progress');
      expect(agentMsg.data).toHaveProperty('message');
      expect(agentMsg).toHaveProperty('timestamp');
    });

    it('should receive task_update messages', async () => {
      wsClient!.assignTask('task_123', 'agent_001');

      const message = await wsClient!.waitForMessage('task_update', 3000);
      const taskMsg = message as WSTaskUpdateMessage;

      expect(taskMsg.type).toBe('task_update');
      expect(taskMsg.data).toHaveProperty('task_id');
      expect(taskMsg.data).toHaveProperty('status');
      expect(taskMsg.data).toHaveProperty('progress');
      expect(taskMsg).toHaveProperty('timestamp');
    });

    it('should receive log_entry messages', async () => {
      // Subscribe triggers a log entry
      wsClient!.subscribe(['all']);

      const message = await wsClient!.waitForMessage('log_entry', 3000);
      const logMsg = message as WSLogEntryMessage;

      expect(logMsg.type).toBe('log_entry');
      expect(logMsg.data).toHaveProperty('timestamp');
      expect(logMsg.data).toHaveProperty('level');
      expect(logMsg.data).toHaveProperty('message');
    });
  });

  describe('Error Handling', () => {
    it('should handle client disconnect gracefully', async () => {
      wsClient = new TestWebSocketClient(`${wsUrl}/ws/sessions/${sessionId}`);
      await wsClient.connect();
      expect(wsClient.isConnected()).toBe(true);

      await wsClient.close();
      expect(wsClient.isConnected()).toBe(false);
    });

    it('should clean up on connection close', async () => {
      const client = new TestWebSocketClient(
        `${wsUrl}/ws/sessions/${sessionId}`
      );
      await client.connect();

      // Get initial message
      await client.waitForMessage('log_entry', 3000);

      await client.close();

      // Verify cleanup by checking connection is closed
      expect(client.isConnected()).toBe(false);
    });

    it('should handle unknown message types', async () => {
      wsClient = new TestWebSocketClient(`${wsUrl}/ws/sessions/${sessionId}`);
      await wsClient.connect();
      wsClient.clearMessages();

      // Send unknown message type
      wsClient.send({ type: 'unknown_type' as any });

      // Wait a bit
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Connection should still be alive
      expect(wsClient.isConnected()).toBe(true);
    });
  });

  describe('Client Subscriptions', () => {
    beforeEach(async () => {
      wsClient = new TestWebSocketClient(`${wsUrl}/ws/sessions/${sessionId}`);
      await wsClient.connect();
      wsClient.clearMessages();
    });

    it('should subscribe to specific channels', async () => {
      wsClient!.subscribe(['agents', 'tasks', 'logs']);

      const message = await wsClient!.waitForMessage('log_entry', 3000);
      const logMsg = message as WSLogEntryMessage;

      expect(logMsg.data.context?.channels).toEqual(['agents', 'tasks', 'logs']);
    });

    it('should override previous subscriptions', async () => {
      // First subscription
      wsClient!.subscribe(['agents']);
      await wsClient!.waitForMessage('log_entry', 3000);
      wsClient!.clearMessages();

      // Second subscription (should replace first)
      wsClient!.subscribe(['tasks']);
      const message = await wsClient!.waitForMessage('log_entry', 3000);
      const logMsg = message as WSLogEntryMessage;

      expect(logMsg.data.context?.channels).toEqual(['tasks']);
    });

    it('should handle empty channel subscription', async () => {
      wsClient!.subscribe([]);

      const message = await wsClient!.waitForMessage('log_entry', 3000);
      const logMsg = message as WSLogEntryMessage;

      expect(logMsg.data.context?.channels).toEqual([]);
    });
  });
});
