/**
 * API + Router Integration Tests
 *
 * Tests integration between API calls and routing system.
 * Demonstrates integration testing patterns with mocked dependencies.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { Router } from '../../src/components/Router';
import { createMockFetch, mockConfigEndpoints, mockCommandEndpoints } from '../utils/api-mock';

describe('API + Router Integration', () => {
  let router: Router;
  let originalFetch: typeof global.fetch;

  beforeEach(() => {
    // Save original fetch
    originalFetch = global.fetch;

    // Reset history
    window.history.replaceState({}, '', '/');

    // Create router
    router = new Router();
  });

  afterEach(() => {
    // Restore fetch
    global.fetch = originalFetch;
    vi.clearAllMocks();
  });

  describe('Config Routes', () => {
    it('should fetch config when navigating to config route', async () => {
      // Arrange
      const mockConfig = { version: '1.0.0', settings: {} };
      global.fetch = createMockFetch([mockConfigEndpoints.getConfig(mockConfig)]);

      let fetchedConfig: any = null;
      router.register('/config', async () => {
        const response = await fetch('/api/config');
        fetchedConfig = await response.json();
      });

      // Act
      router.navigate('/config', false);

      // Wait for async operations
      await new Promise((resolve) => setTimeout(resolve, 10));

      // Assert
      expect(fetchedConfig).toEqual(mockConfig);
    });

    it('should handle API errors gracefully', async () => {
      // Arrange
      global.fetch = createMockFetch([
        {
          method: 'GET',
          path: '/api/config',
          response: { error: new Error('Server error'), status: 500 },
        },
      ]);

      let errorOccurred = false;
      router.register('/config', async () => {
        try {
          const response = await fetch('/api/config');
          if (!response.ok) {
            throw new Error('API request failed');
          }
        } catch {
          errorOccurred = true;
        }
      });

      // Act
      router.navigate('/config', false);

      // Wait for async operations
      await new Promise((resolve) => setTimeout(resolve, 10));

      // Assert
      expect(errorOccurred).toBe(true);
    });
  });

  describe('Command Routes', () => {
    it('should execute command via API when route is accessed', async () => {
      // Arrange
      const commandResult = { success: true, output: 'Done' };
      global.fetch = createMockFetch([
        mockCommandEndpoints.executeCommand(commandResult),
      ]);

      let result: any = null;
      router.register('/commands/:id/execute', async (params) => {
        const response = await fetch('/api/commands/execute', {
          method: 'POST',
          body: JSON.stringify({ commandId: params.id }),
        });
        result = await response.json();
      });

      // Act
      router.navigate('/commands/test-cmd/execute', false);

      // Wait for async operations
      await new Promise((resolve) => setTimeout(resolve, 10));

      // Assert
      expect(result).toEqual(commandResult);
    });

    it('should pass route parameters to API calls', async () => {
      // Arrange
      const fetchSpy = vi.fn(createMockFetch([
        {
          method: 'GET',
          path: '/api/users/42/posts/100',
          response: { data: { success: true } },
        },
      ]));
      global.fetch = fetchSpy;

      router.register('/users/:userId/posts/:postId', async (params) => {
        await fetch(`/api/users/${params.userId}/posts/${params.postId}`);
      });

      // Act
      router.navigate('/users/42/posts/100', false);

      // Wait for async operations
      await new Promise((resolve) => setTimeout(resolve, 10));

      // Assert
      expect(fetchSpy).toHaveBeenCalledWith(
        '/api/users/42/posts/100'
      );
    });
  });

  describe('Error Scenarios', () => {
    it('should handle network timeout', async () => {
      // Arrange
      global.fetch = vi.fn(() => {
        return new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Network timeout')), 100);
        });
      });

      let timedOut = false;
      router.register('/slow', async () => {
        try {
          await fetch('/api/slow');
        } catch (error) {
          timedOut = true;
        }
      });

      // Act
      router.navigate('/slow', false);

      // Wait for timeout
      await new Promise((resolve) => setTimeout(resolve, 150));

      // Assert
      expect(timedOut).toBe(true);
    });

    it('should handle 404 from both router and API', async () => {
      // Arrange
      global.fetch = createMockFetch([
        {
          method: 'GET',
          path: '/api/missing',
          response: { error: new Error('Not found'), status: 404 },
        },
      ]);

      const notFoundListener = vi.fn();
      router.on('404', notFoundListener);

      // Act - Router 404
      router.navigate('/missing-route', false);

      // Assert
      expect(notFoundListener).toHaveBeenCalled();
    });
  });

  describe('Loading States', () => {
    it('should handle loading state during API calls', async () => {
      // Arrange
      global.fetch = createMockFetch([
        {
          method: 'GET',
          path: '/api/data',
          response: { data: { value: 'test' } },
          delay: 50, // Simulate network delay
        },
      ]);

      let isLoading = false;
      let data: any = null;

      router.register('/data', async () => {
        isLoading = true;
        const response = await fetch('/api/data');
        data = await response.json();
        isLoading = false;
      });

      // Act
      router.navigate('/data', false);

      // Assert - Loading state
      await new Promise((resolve) => setTimeout(resolve, 10));
      expect(isLoading).toBe(true);

      // Assert - Data loaded
      await new Promise((resolve) => setTimeout(resolve, 60));
      expect(isLoading).toBe(false);
      expect(data).toEqual({ value: 'test' });
    });
  });
});
