/**
 * CCEM UI Server
 * Main entry point for the REST API and WebSocket server
 */
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { createServer } from 'http';
import path from 'path';
import { fileURLToPath } from 'url';

import sessionsRouter from './api/sessions.js';
import agentsRouter from './api/agents.js';
import WebSocketManager from './ws/index.js';
import type { ErrorResponse } from './types/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const PORT = process.env.PORT || 8638;
const HOST = process.env.HOST || 'localhost';

// Create Express app
const app = express();

// Create HTTP server
const server = createServer(app);

// Initialize WebSocket manager
const wsManager = new WebSocketManager(server);

// Export WebSocket manager for use in other modules
export { wsManager };

// Middleware
app.use(
  cors({
    origin: '*', // Development only - restrict in production
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use((req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path} - ${res.statusCode} (${duration}ms)`);
  });
  next();
});

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
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

// Session view HTML page
app.get('/session-view', (req: Request, res: Response) => {
  res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>CCEM Session Monitor</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      margin: 0;
      padding: 20px;
      background: #1a1a1a;
      color: #e0e0e0;
    }
    .container {
      max-width: 1200px;
      margin: 0 auto;
    }
    h1 {
      color: #4fc3f7;
      margin-bottom: 30px;
    }
    .info {
      background: #2a2a2a;
      padding: 20px;
      border-radius: 8px;
      margin-bottom: 20px;
    }
    .endpoint {
      font-family: 'Courier New', monospace;
      background: #333;
      padding: 10px;
      border-radius: 4px;
      margin: 10px 0;
    }
    .status {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 4px;
      background: #4caf50;
      color: white;
      font-size: 12px;
      font-weight: bold;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>CCEM Session Monitor</h1>
    <div class="info">
      <p><span class="status">RUNNING</span></p>
      <p><strong>Server:</strong> http://${HOST}:${PORT}</p>
      <p><strong>WebSocket:</strong> ws://${HOST}:${PORT}/ws/sessions/:id</p>
    </div>
    <div class="info">
      <h2>Available Endpoints</h2>
      <div class="endpoint">GET /api/sessions - List all sessions</div>
      <div class="endpoint">GET /api/sessions/:id - Get session details</div>
      <div class="endpoint">POST /api/sessions - Create new session</div>
      <div class="endpoint">GET /api/sessions/:id/stream - SSE stream</div>
      <div class="endpoint">GET /api/agents - List all agents</div>
      <div class="endpoint">GET /api/agents/:id/status - Get agent status</div>
      <div class="endpoint">POST /api/agents/:id/task - Assign task to agent</div>
      <div class="endpoint">WS /ws/sessions/:id - WebSocket connection</div>
    </div>
    <div class="info">
      <h2>Next Steps</h2>
      <p>Use the React UI to interact with the server, or test the API directly:</p>
      <pre style="background: #333; padding: 10px; border-radius: 4px; overflow-x: auto;">
# List sessions
curl http://${HOST}:${PORT}/api/sessions

# Create session
curl -X POST http://${HOST}:${PORT}/api/sessions \\
  -H "Content-Type: application/json" \\
  -d '{"name":"Test Session","agents":["task-analyzer"],"auto_start":true}'

# List agents
curl http://${HOST}:${PORT}/api/agents
      </pre>
    </div>
  </div>
</body>
</html>
  `);
});

// 404 handler
app.use((req: Request, res: Response) => {
  const error: ErrorResponse = {
    error: 'not_found',
    message: `Route ${req.path} not found`,
  };
  res.status(404).json(error);
});

// Error handler
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('[ERROR]', err);

  const error: ErrorResponse = {
    error: 'internal_error',
    message: err.message || 'Internal server error',
    request_id: `req_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
  };

  res.status(500).json(error);
});

// Start server
server.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════════════════════╗
║                    CCEM UI Server                          ║
╠════════════════════════════════════════════════════════════╣
║  Status:      RUNNING                                      ║
║  Version:     1.0.0                                        ║
║  Port:        ${PORT}                                       ║
║  Host:        ${HOST}                                       ║
║                                                            ║
║  REST API:    http://${HOST}:${PORT}/api                   ║
║  WebSocket:   ws://${HOST}:${PORT}/ws                      ║
║  Session UI:  http://${HOST}:${PORT}/session-view          ║
║  Health:      http://${HOST}:${PORT}/health                ║
╚════════════════════════════════════════════════════════════╝
  `);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('\n[SIGTERM] Shutting down gracefully...');
  server.close(() => {
    console.log('[SHUTDOWN] Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('\n[SIGINT] Shutting down gracefully...');
  server.close(() => {
    console.log('[SHUTDOWN] Server closed');
    process.exit(0);
  });
});

export default app;
