/**
 * Test suite for Server Submission with Retry Logic
 * Tests submitToServer and submitToServers with various scenarios
 */

import {
  submitToServer,
  submitToServers,
} from '../../src/hooks/utils/submit.js';
import { ServerConfig } from '../../src/hooks/types.js';
import * as retryModule from '../../src/hooks/utils/retry.js';

// Mock global fetch
global.fetch = jest.fn();

// Mock retry module
jest.mock('../../src/hooks/utils/retry.js', () => ({
  retry: jest.fn((fn) => fn()),
}));

describe('Server Submission with Retry Logic', () => {
  const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;
  const mockRetry = retryModule.retry as jest.MockedFunction<
    typeof retryModule.retry
  >;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.TEST_API_TOKEN = 'test-token-12345';
  });

  afterEach(() => {
    delete process.env.TEST_API_TOKEN;
  });

  describe('submitToServer', () => {
    const baseServer: ServerConfig = {
      name: 'test-server',
      url: 'https://api.example.com',
      auth: {
        type: 'bearer',
        tokenEnv: 'TEST_API_TOKEN',
      },
      retry: {
        maxAttempts: 3,
        backoff: 'exponential',
        initialDelayMs: 1000,
      },
      timeoutMs: 5000,
      enabled: true,
    };

    it('should submit successfully with bearer auth', async () => {
      const mockResponse = {
        ok: true,
        status: 200,
        statusText: 'OK',
        json: async () => ({ success: true, data: 'test' }),
      };

      mockFetch.mockResolvedValue(mockResponse as Response);

      const result = await submitToServer(
        baseServer,
        '/api/endpoint',
        { test: 'data' }
      );

      expect(result.success).toBe(true);
      expect(result.server).toBe('test-server');
      expect(result.statusCode).toBe(200);
      expect(result.responseData).toEqual({ success: true, data: 'test' });

      // Verify fetch was called correctly
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.example.com/api/endpoint',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            Authorization: 'Bearer test-token-12345',
          }),
          body: JSON.stringify({ test: 'data' }),
        })
      );
    });

    it('should submit successfully with jwt auth', async () => {
      const server: ServerConfig = {
        ...baseServer,
        auth: { type: 'jwt', tokenEnv: 'TEST_API_TOKEN' },
      };

      const mockResponse = {
        ok: true,
        status: 200,
        statusText: 'OK',
        json: async () => ({ success: true }),
      };

      mockFetch.mockResolvedValue(mockResponse as Response);

      await submitToServer(server, '/api/endpoint', { test: 'data' });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer test-token-12345',
          }),
        })
      );
    });

    it('should submit successfully with api-key auth', async () => {
      const server: ServerConfig = {
        ...baseServer,
        auth: { type: 'api-key', tokenEnv: 'TEST_API_TOKEN' },
      };

      const mockResponse = {
        ok: true,
        status: 200,
        statusText: 'OK',
        json: async () => ({ success: true }),
      };

      mockFetch.mockResolvedValue(mockResponse as Response);

      await submitToServer(server, '/api/endpoint', { test: 'data' });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            'X-API-Key': 'test-token-12345',
          }),
        })
      );
    });

    it('should submit successfully with no auth', async () => {
      const server: ServerConfig = {
        ...baseServer,
        auth: { type: 'none' },
      };

      const mockResponse = {
        ok: true,
        status: 200,
        statusText: 'OK',
        json: async () => ({ success: true }),
      };

      mockFetch.mockResolvedValue(mockResponse as Response);

      await submitToServer(server, '/api/endpoint', { test: 'data' });

      const callHeaders = (mockFetch.mock.calls[0][1] as RequestInit)
        .headers as Record<string, string>;
      expect(callHeaders.Authorization).toBeUndefined();
      expect(callHeaders['X-API-Key']).toBeUndefined();
    });

    it('should handle missing auth token', async () => {
      delete process.env.TEST_API_TOKEN;

      const result = await submitToServer(
        baseServer,
        '/api/endpoint',
        { test: 'data' }
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain('Missing auth token');
    });

    it('should handle HTTP errors', async () => {
      const mockResponse = {
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: async () => ({}),
      };

      mockFetch.mockResolvedValue(mockResponse as Response);

      const result = await submitToServer(
        baseServer,
        '/api/endpoint',
        { test: 'data' }
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain('HTTP 500');
    });

    it('should handle network errors', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'));

      const result = await submitToServer(
        baseServer,
        '/api/endpoint',
        { test: 'data' }
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain('Network error');
    });

    it('should use retry logic', async () => {
      const mockResponse = {
        ok: true,
        status: 200,
        statusText: 'OK',
        json: async () => ({ success: true }),
      };

      mockFetch.mockResolvedValue(mockResponse as Response);

      await submitToServer(baseServer, '/api/endpoint', { test: 'data' });

      expect(mockRetry).toHaveBeenCalledWith(
        expect.any(Function),
        3,
        'exponential',
        1000
      );
    });

    it('should use default retry config if not specified', async () => {
      const server: ServerConfig = {
        ...baseServer,
        retry: undefined,
      };

      const mockResponse = {
        ok: true,
        status: 200,
        statusText: 'OK',
        json: async () => ({ success: true }),
      };

      mockFetch.mockResolvedValue(mockResponse as Response);

      await submitToServer(server, '/api/endpoint', { test: 'data' });

      expect(mockRetry).toHaveBeenCalledWith(
        expect.any(Function),
        3,
        'exponential',
        1000
      );
    });

    it('should handle timeout', async () => {
      // This test verifies timeout configuration
      const mockResponse = {
        ok: true,
        status: 200,
        statusText: 'OK',
        json: async () => ({ success: true }),
      };

      mockFetch.mockResolvedValue(mockResponse as Response);

      await submitToServer(baseServer, '/api/endpoint', { test: 'data' });

      const callOptions = mockFetch.mock.calls[0][1] as RequestInit;
      expect(callOptions.signal).toBeDefined();
    });

    it('should handle abort signal error', async () => {
      mockFetch.mockRejectedValue(new Error('The operation was aborted'));

      const result = await submitToServer(
        baseServer,
        '/api/endpoint',
        { test: 'data' }
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain('aborted');
    });
  });

  describe('submitToServers', () => {
    const servers: ServerConfig[] = [
      {
        name: 'server1',
        url: 'https://api1.example.com',
        auth: { type: 'none' },
        enabled: true,
      },
      {
        name: 'server2',
        url: 'https://api2.example.com',
        auth: { type: 'none' },
        enabled: true,
      },
    ];

    it('should submit to multiple servers in parallel', async () => {
      const mockResponse = {
        ok: true,
        status: 200,
        statusText: 'OK',
        json: async () => ({ success: true }),
      };

      mockFetch.mockResolvedValue(mockResponse as Response);

      const results = await submitToServers(
        servers,
        '/api/endpoint',
        { test: 'data' }
      );

      expect(results).toHaveLength(2);
      expect(results[0].success).toBe(true);
      expect(results[0].server).toBe('server1');
      expect(results[1].success).toBe(true);
      expect(results[1].server).toBe('server2');
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it('should skip disabled servers', async () => {
      const serversWithDisabled: ServerConfig[] = [
        ...servers,
        {
          name: 'server3',
          url: 'https://api3.example.com',
          auth: { type: 'none' },
          enabled: false,
        },
      ];

      const mockResponse = {
        ok: true,
        status: 200,
        statusText: 'OK',
        json: async () => ({ success: true }),
      };

      mockFetch.mockResolvedValue(mockResponse as Response);

      const results = await submitToServers(
        serversWithDisabled,
        '/api/endpoint',
        { test: 'data' }
      );

      expect(results).toHaveLength(2);
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it('should return empty array if no enabled servers', async () => {
      const disabledServers: ServerConfig[] = [
        {
          name: 'server1',
          url: 'https://api1.example.com',
          auth: { type: 'none' },
          enabled: false,
        },
      ];

      const results = await submitToServers(
        disabledServers,
        '/api/endpoint',
        { test: 'data' }
      );

      expect(results).toEqual([]);
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('should handle mixed success and failure', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          statusText: 'OK',
          json: async () => ({ success: true }),
        } as Response)
        .mockRejectedValueOnce(new Error('Network error'));

      const results = await submitToServers(
        servers,
        '/api/endpoint',
        { test: 'data' }
      );

      expect(results).toHaveLength(2);
      expect(results[0].success).toBe(true);
      expect(results[1].success).toBe(false);
      expect(results[1].error).toContain('Network error');
    });

    it('should not fail fast on individual server errors', async () => {
      mockFetch
        .mockRejectedValueOnce(new Error('Server 1 error'))
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          statusText: 'OK',
          json: async () => ({ success: true }),
        } as Response);

      const results = await submitToServers(
        servers,
        '/api/endpoint',
        { test: 'data' }
      );

      expect(results).toHaveLength(2);
      expect(results[0].success).toBe(false);
      expect(results[1].success).toBe(true);
    });
  });

  describe('Authentication edge cases', () => {
    it('should handle empty token', async () => {
      process.env.TEST_API_TOKEN = '';

      const server: ServerConfig = {
        name: 'test',
        url: 'https://api.example.com',
        auth: { type: 'bearer', tokenEnv: 'TEST_API_TOKEN' },
      };

      const result = await submitToServer(server, '/api/endpoint', {});

      expect(result.success).toBe(false);
      expect(result.error).toContain('Missing auth token');
    });

    it('should handle undefined token env', async () => {
      const server: ServerConfig = {
        name: 'test',
        url: 'https://api.example.com',
        auth: { type: 'bearer', tokenEnv: 'NONEXISTENT_TOKEN' },
      };

      const result = await submitToServer(server, '/api/endpoint', {});

      expect(result.success).toBe(false);
      expect(result.error).toContain('Missing auth token');
    });
  });
});
