/**
 * Test server utilities for integration tests
 */
import express, { Express } from 'express';
import { createServer, Server as HTTPServer } from 'http';
import cors from 'cors';
import type { AddressInfo } from 'net';

import sessionsRouter from '../../api/sessions.js';
import agentsRouter from '../../api/agents.js';
import WebSocketManager from '../../ws/index.js';
import type { ErrorResponse } from '../../types/index.js';

/**
 * Create a test server instance without starting it
 */
export function createTestServer(): {
  app: Express;
  server: HTTPServer;
  wsManager: WebSocketManager;
} {
  const app = express();
  const server = createServer(app);
  const wsManager = new WebSocketManager(server);

  // Middleware
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Health check endpoint
  app.get('/health', (req, res) => {
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: '1.0.0',
    });
  });

  // API Routes
  app.use('/api/sessions', sessionsRouter);
  app.use('/api/agents', agentsRouter);

  // 404 handler
  app.use((req, res) => {
    const error: ErrorResponse = {
      error: 'not_found',
      message: `Route ${req.path} not found`,
    };
    res.status(404).json(error);
  });

  // Error handler
  app.use((err: Error, req: any, res: any, next: any) => {
    const error: ErrorResponse = {
      error: 'internal_error',
      message: err.message || 'Internal server error',
      request_id: `req_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
    };

    res.status(500).json(error);
  });

  return { app, server, wsManager };
}

/**
 * Start test server and return the URL and cleanup function
 */
export async function startTestServer(): Promise<{
  app: Express;
  server: HTTPServer;
  wsManager: WebSocketManager;
  url: string;
  wsUrl: string;
  cleanup: () => Promise<void>;
}> {
  const { app, server, wsManager } = createTestServer();

  // Start server on random port
  await new Promise<void>((resolve) => {
    server.listen(0, () => resolve());
  });

  const address = server.address() as AddressInfo;
  const port = address.port;
  const url = `http://localhost:${port}`;
  const wsUrl = `ws://localhost:${port}`;

  const cleanup = async () => {
    return new Promise<void>((resolve, reject) => {
      server.close((err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  };

  return { app, server, wsManager, url, wsUrl, cleanup };
}
