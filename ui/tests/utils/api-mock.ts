/**
 * API Mocking Utilities
 *
 * Provides utilities for mocking API calls in tests, including
 * REST endpoints and error scenarios.
 */

import { vi } from 'vitest';

/**
 * Mock response type
 */
export interface MockResponse<T = any> {
  data?: T;
  error?: Error;
  status?: number;
  headers?: Record<string, string>;
}

/**
 * API endpoint configuration
 */
export interface ApiEndpoint {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  path: string;
  response: MockResponse;
  delay?: number;
}

/**
 * Create a mock fetch function that intercepts API calls
 *
 * @example
 * ```ts
 * const mockFetch = createMockFetch([
 *   {
 *     method: 'GET',
 *     path: '/api/config',
 *     response: { data: { version: '1.0.0' } }
 *   }
 * ]);
 * global.fetch = mockFetch;
 * ```
 */
export function createMockFetch(endpoints: ApiEndpoint[]) {
  return vi.fn((url: string, options?: RequestInit) => {
    const method = (options?.method || 'GET').toUpperCase();
    const endpoint = endpoints.find(
      (e) => e.method === method && url.includes(e.path)
    );

    if (!endpoint) {
      return Promise.reject(new Error(`No mock found for ${method} ${url}`));
    }

    const { response, delay = 0 } = endpoint;

    return new Promise((resolve) => {
      setTimeout(() => {
        if (response.error) {
          resolve({
            ok: false,
            status: response.status || 500,
            statusText: response.error.message,
            json: () => Promise.resolve({ error: response.error?.message }),
            text: () => Promise.resolve(response.error?.message || ''),
          });
        } else {
          resolve({
            ok: true,
            status: response.status || 200,
            statusText: 'OK',
            headers: new Headers(response.headers || {}),
            json: () => Promise.resolve(response.data),
            text: () => Promise.resolve(JSON.stringify(response.data)),
          });
        }
      }, delay);
    });
  });
}

/**
 * Create a successful API response
 */
export function createSuccessResponse<T>(data: T, status = 200): MockResponse<T> {
  return { data, status };
}

/**
 * Create an error API response
 */
export function createErrorResponse(message: string, status = 500): MockResponse {
  return {
    error: new Error(message),
    status,
  };
}

/**
 * Mock configuration endpoints
 */
export const mockConfigEndpoints = {
  getConfig: (config: any): ApiEndpoint => ({
    method: 'GET',
    path: '/api/config',
    response: createSuccessResponse(config),
  }),

  updateConfig: (config: any): ApiEndpoint => ({
    method: 'POST',
    path: '/api/config',
    response: createSuccessResponse(config),
  }),

  validateConfig: (isValid: boolean): ApiEndpoint => ({
    method: 'POST',
    path: '/api/config/validate',
    response: createSuccessResponse({ valid: isValid }),
  }),
};

/**
 * Mock command endpoints
 */
export const mockCommandEndpoints = {
  listCommands: (commands: any[]): ApiEndpoint => ({
    method: 'GET',
    path: '/api/commands',
    response: createSuccessResponse(commands),
  }),

  executeCommand: (result: any): ApiEndpoint => ({
    method: 'POST',
    path: '/api/commands/execute',
    response: createSuccessResponse(result),
  }),
};

/**
 * Mock MCP endpoints
 */
export const mockMcpEndpoints = {
  listServers: (servers: any[]): ApiEndpoint => ({
    method: 'GET',
    path: '/api/mcp/servers',
    response: createSuccessResponse(servers),
  }),

  getServerStatus: (status: any): ApiEndpoint => ({
    method: 'GET',
    path: '/api/mcp/servers/',
    response: createSuccessResponse(status),
  }),
};

/**
 * Create a complete mock API with all endpoints
 */
export function createMockApi(overrides: Partial<ApiEndpoint>[] = []) {
  const defaultEndpoints: ApiEndpoint[] = [
    mockConfigEndpoints.getConfig({ version: '1.0.0' }),
    mockConfigEndpoints.updateConfig({ version: '1.0.0' }),
    mockConfigEndpoints.validateConfig(true),
    mockCommandEndpoints.listCommands([]),
    mockMcpEndpoints.listServers([]),
  ];

  return createMockFetch([...defaultEndpoints, ...overrides]);
}

/**
 * Simulate network delay
 */
export async function simulateNetworkDelay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Simulate network error
 */
export function simulateNetworkError(message = 'Network error') {
  return vi.fn().mockRejectedValue(new Error(message));
}

/**
 * Simulate rate limiting (429 error)
 */
export function simulateRateLimit(): ApiEndpoint {
  return {
    method: 'GET',
    path: '*',
    response: createErrorResponse('Too Many Requests', 429),
  };
}
