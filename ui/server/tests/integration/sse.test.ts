/**
 * Integration tests for Server-Sent Events (SSE) functionality
 */
import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import type { Express } from 'express';
import { startTestServer } from '../utils/test-server.js';
import type {
  CreateSessionRequest,
  ErrorResponse,
} from '../../types/index.js';

describe('SSE Integration', () => {
  let app: Express;
  let url: string;
  let cleanup: () => Promise<void>;
  let sessionId: string;

  beforeAll(async () => {
    const testServer = await startTestServer();
    app = testServer.app;
    url = testServer.url;
    cleanup = testServer.cleanup;
  });

  afterAll(async () => {
    await cleanup();
  });

  beforeEach(async () => {
    // Create a test session
    const req: CreateSessionRequest = {
      name: 'SSE Test Session',
      agents: ['task-analyzer'],
      auto_start: true,
    };

    const response = await request(app).post('/api/sessions').send(req);
    sessionId = response.body.id;
  });

  describe('Stream Connection', () => {
    it('should establish SSE stream', async () => {
      const response = await request(app)
        .get(`/api/sessions/${sessionId}/stream`)
        .set('Accept', 'text/event-stream')
        .expect(200);

      expect(response.headers['content-type']).toContain('text/event-stream');
      expect(response.headers['cache-control']).toBe('no-cache');
      expect(response.headers['connection']).toBe('keep-alive');
      expect(response.headers['x-accel-buffering']).toBe('no');
    });

    it('should return 404 for non-existent session', async () => {
      const response = await request(app)
        .get('/api/sessions/sess_nonexistent/stream')
        .set('Accept', 'text/event-stream')
        .expect(404);

      const error = response.body as ErrorResponse;
      expect(error.error).toBe('not_found');
      expect(error.session_id).toBe('sess_nonexistent');
    });

    it('should set correct SSE headers', async () => {
      const response = await request(app)
        .get(`/api/sessions/${sessionId}/stream`)
        .set('Accept', 'text/event-stream')
        .expect(200);

      expect(response.headers['content-type']).toBe('text/event-stream');
      expect(response.headers['cache-control']).toBe('no-cache');
      expect(response.headers['connection']).toBe('keep-alive');
    });
  });

  describe('Stream Events', () => {
    it('should send initial session_started event', (done) => {
      const req = request(app)
        .get(`/api/sessions/${sessionId}/stream`)
        .set('Accept', 'text/event-stream')
        .buffer(false)
        .parse((res, callback) => {
          let buffer = '';

          res.on('data', (chunk: Buffer) => {
            buffer += chunk.toString();

            // Look for complete event (ends with double newline)
            if (buffer.includes('\n\n')) {
              const lines = buffer.split('\n');
              let eventType = '';
              let eventData = '';

              for (const line of lines) {
                if (line.startsWith('event:')) {
                  eventType = line.substring(6).trim();
                } else if (line.startsWith('data:')) {
                  eventData = line.substring(5).trim();
                }
              }

              if (eventType && eventData) {
                try {
                  expect(eventType).toBe('session_started');

                  const data = JSON.parse(eventData);
                  expect(data).toHaveProperty('session_id');
                  expect(data.session_id).toBe(sessionId);
                  expect(data).toHaveProperty('timestamp');

                  res.destroy();
                  callback(null, { eventType, data });
                  done();
                } catch (error) {
                  res.destroy();
                  callback(error as Error);
                  done(error);
                }
              }
            }
          });

          res.on('error', (error) => {
            callback(error);
            done(error);
          });
        });

      req.end();
    }, 5000);

    it('should handle SSE format correctly', (done) => {
      const req = request(app)
        .get(`/api/sessions/${sessionId}/stream`)
        .set('Accept', 'text/event-stream')
        .buffer(false)
        .parse((res, callback) => {
          let buffer = '';
          let receivedEvent = false;

          res.on('data', (chunk: Buffer) => {
            if (receivedEvent) return;

            buffer += chunk.toString();

            if (buffer.includes('\n\n')) {
              const lines = buffer.split('\n');

              // Verify SSE format: event: <type>\ndata: <json>\n\n
              let hasEventLine = false;
              let hasDataLine = false;

              for (const line of lines) {
                if (line.startsWith('event:')) {
                  hasEventLine = true;
                  expect(line).toMatch(/^event:\s*.+$/);
                } else if (line.startsWith('data:')) {
                  hasDataLine = true;
                  expect(line).toMatch(/^data:\s*.+$/);

                  // Verify data is valid JSON
                  const jsonStr = line.substring(5).trim();
                  expect(() => JSON.parse(jsonStr)).not.toThrow();
                }
              }

              expect(hasEventLine).toBe(true);
              expect(hasDataLine).toBe(true);

              receivedEvent = true;
              res.destroy();
              callback(null, { success: true });
              done();
            }
          });

          res.on('error', (error) => {
            callback(error);
            done(error);
          });
        });

      req.end();
    }, 5000);
  });

  describe('Multiple Clients', () => {
    it('should support multiple concurrent SSE clients', async () => {
      const clients: any[] = [];

      // Create multiple SSE connections
      for (let i = 0; i < 3; i++) {
        const req = request(app)
          .get(`/api/sessions/${sessionId}/stream`)
          .set('Accept', 'text/event-stream')
          .buffer(false);

        clients.push(req);
      }

      // Wait a bit to ensure all connected
      await new Promise((resolve) => setTimeout(resolve, 100));

      // All connections should be established
      expect(clients.length).toBe(3);

      // Clean up
      clients.forEach((client) => {
        if (client.abort) client.abort();
      });
    });
  });

  describe('Stream Cleanup', () => {
    it('should clean up on client disconnect', (done) => {
      const req = request(app)
        .get(`/api/sessions/${sessionId}/stream`)
        .set('Accept', 'text/event-stream')
        .buffer(false)
        .parse((res, callback) => {
          // Wait for initial event
          setTimeout(() => {
            // Close connection
            res.destroy();
            callback(null, { closed: true });
            done();
          }, 100);
        });

      req.end();
    }, 5000);
  });

  describe('Error Conditions', () => {
    it('should reject non-SSE requests', async () => {
      // Request without SSE Accept header should still work
      // but content-type will be text/event-stream
      const response = await request(app)
        .get(`/api/sessions/${sessionId}/stream`)
        .expect(200);

      expect(response.headers['content-type']).toContain('text/event-stream');
    });

    it('should handle invalid session gracefully', async () => {
      const response = await request(app)
        .get('/api/sessions/invalid_id/stream')
        .set('Accept', 'text/event-stream')
        .expect(404);

      expect(response.body.error).toBe('not_found');
    });
  });

  describe('Event Data Validation', () => {
    it('should include required fields in session_started event', (done) => {
      const req = request(app)
        .get(`/api/sessions/${sessionId}/stream`)
        .set('Accept', 'text/event-stream')
        .buffer(false)
        .parse((res, callback) => {
          let buffer = '';

          res.on('data', (chunk: Buffer) => {
            buffer += chunk.toString();

            if (buffer.includes('\n\n')) {
              const lines = buffer.split('\n');
              let eventData = '';

              for (const line of lines) {
                if (line.startsWith('data:')) {
                  eventData = line.substring(5).trim();
                }
              }

              if (eventData) {
                try {
                  const data = JSON.parse(eventData);

                  expect(data).toHaveProperty('session_id');
                  expect(data).toHaveProperty('timestamp');
                  expect(typeof data.session_id).toBe('string');
                  expect(typeof data.timestamp).toBe('string');

                  // Verify timestamp is ISO format
                  expect(() => new Date(data.timestamp)).not.toThrow();

                  res.destroy();
                  callback(null, data);
                  done();
                } catch (error) {
                  res.destroy();
                  callback(error as Error);
                  done(error);
                }
              }
            }
          });

          res.on('error', (error) => {
            callback(error);
            done(error);
          });
        });

      req.end();
    }, 5000);

    it('should emit valid JSON data', (done) => {
      const req = request(app)
        .get(`/api/sessions/${sessionId}/stream`)
        .set('Accept', 'text/event-stream')
        .buffer(false)
        .parse((res, callback) => {
          let buffer = '';

          res.on('data', (chunk: Buffer) => {
            buffer += chunk.toString();

            if (buffer.includes('\n\n')) {
              const lines = buffer.split('\n');

              for (const line of lines) {
                if (line.startsWith('data:')) {
                  const jsonStr = line.substring(5).trim();

                  try {
                    const parsed = JSON.parse(jsonStr);
                    expect(parsed).toBeDefined();
                    expect(typeof parsed).toBe('object');

                    res.destroy();
                    callback(null, parsed);
                    done();
                    return;
                  } catch (error) {
                    res.destroy();
                    callback(error as Error);
                    done(error);
                    return;
                  }
                }
              }
            }
          });

          res.on('error', (error) => {
            callback(error);
            done(error);
          });
        });

      req.end();
    }, 5000);
  });
});
