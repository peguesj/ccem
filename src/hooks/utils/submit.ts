/**
 * Hook submission utilities for sending data to external servers
 */

import { ServerConfig, HookSubmissionResult } from '../types.js';
import { retry } from './retry.js';

/**
 * Submit hook data to a configured server
 *
 * @param server - Server configuration
 * @param endpoint - API endpoint path
 * @param data - Payload data to submit
 * @returns Submission result
 */
export async function submitToServer(
  server: ServerConfig,
  endpoint: string,
  data: any
): Promise<HookSubmissionResult> {
  const startTime = Date.now();

  try {
    // Build full URL
    const url = `${server.url}${endpoint}`;

    // Build headers
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    // Add authentication
    if (server.auth.type !== 'none' && server.auth.tokenEnv) {
      const token = process.env[server.auth.tokenEnv];
      if (!token) {
        throw new Error(`Missing auth token in ${server.auth.tokenEnv}`);
      }

      switch (server.auth.type) {
        case 'bearer':
        case 'jwt':
          headers['Authorization'] = `Bearer ${token}`;
          break;
        case 'api-key':
          headers['X-API-Key'] = token;
          break;
      }
    }

    // Prepare fetch options
    const fetchOptions: RequestInit = {
      method: 'POST',
      headers,
      body: JSON.stringify(data),
    };

    // Add timeout if configured
    if (server.timeoutMs) {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), server.timeoutMs);
      fetchOptions.signal = controller.signal;
    }

    // Execute request with retry
    const retryConfig = server.retry || {
      maxAttempts: 3,
      backoff: 'exponential',
      initialDelayMs: 1000,
    };

    const response = await retry(
      async () => {
        const res = await fetch(url, fetchOptions);
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}: ${res.statusText}`);
        }
        return res;
      },
      retryConfig.maxAttempts,
      retryConfig.backoff,
      retryConfig.initialDelayMs
    );

    const responseData = await response.json();

    return {
      success: true,
      server: server.name,
      statusCode: response.status,
      responseData,
    };
  } catch (error) {
    return {
      success: false,
      server: server.name,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Submit hook data to multiple servers in parallel
 *
 * @param servers - Array of server configurations
 * @param endpoint - API endpoint path
 * @param data - Payload data to submit
 * @returns Array of submission results
 */
export async function submitToServers(
  servers: ServerConfig[],
  endpoint: string,
  data: any
): Promise<HookSubmissionResult[]> {
  const enabledServers = servers.filter((s) => s.enabled !== false);

  if (enabledServers.length === 0) {
    return [];
  }

  // Submit to all servers in parallel
  const submissions = enabledServers.map((server) =>
    submitToServer(server, endpoint, data)
  );

  return Promise.all(submissions);
}
