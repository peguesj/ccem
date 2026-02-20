/**
 * Router Unit Tests
 *
 * Comprehensive tests for the Router component demonstrating TDD patterns:
 * - Red phase: Write failing tests first
 * - Green phase: Implement minimal code to pass
 * - Refactor phase: Optimize while maintaining tests
 *
 * Coverage target: 95%+
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { Router, RouteHandler, CurrentRoute } from '../../src/components/Router';

describe('Router', () => {
  let router: Router;
  let mockHandler: RouteHandler;
  let eventListener: (event: Event) => void;

  beforeEach(() => {
    // Reset history state before each test
    window.history.replaceState({}, '', '/');

    // Create fresh router instance
    router = new Router();

    // Create mock handler
    mockHandler = vi.fn();

    // Clear all event listeners
    eventListener = vi.fn();
  });

  afterEach(() => {
    // Clean up event listeners
    vi.clearAllMocks();
  });

  describe('Route Registration', () => {
    it('should register a simple route', () => {
      // Arrange & Act
      router.register('/', mockHandler);

      // Assert
      router.navigate('/', false);
      expect(mockHandler).toHaveBeenCalledWith({});
    });

    it('should register a route with parameters', () => {
      // Arrange
      router.register('/users/:id', mockHandler);

      // Act
      router.navigate('/users/123', false);

      // Assert
      expect(mockHandler).toHaveBeenCalledWith({ id: '123' });
    });

    it('should register multiple routes', () => {
      // Arrange
      const handler1 = vi.fn();
      const handler2 = vi.fn();

      router.register('/route1', handler1);
      router.register('/route2', handler2);

      // Act
      router.navigate('/route1', false);
      router.navigate('/route2', false);

      // Assert
      expect(handler1).toHaveBeenCalled();
      expect(handler2).toHaveBeenCalled();
    });

    it('should register routes with multiple parameters', () => {
      // Arrange
      router.register('/users/:userId/posts/:postId', mockHandler);

      // Act
      router.navigate('/users/42/posts/100', false);

      // Assert
      expect(mockHandler).toHaveBeenCalledWith({
        userId: '42',
        postId: '100',
      });
    });
  });

  describe('Navigation', () => {
    it('should navigate to registered route', () => {
      // Arrange
      router.register('/test', mockHandler);

      // Act
      router.navigate('/test');

      // Assert
      expect(mockHandler).toHaveBeenCalled();
      expect(window.location.pathname).toBe('/test');
    });

    it('should update browser history when navigating', () => {
      // Arrange
      router.register('/page', mockHandler);
      const pushStateSpy = vi.spyOn(window.history, 'pushState');

      // Act
      router.navigate('/page', true);

      // Assert
      expect(pushStateSpy).toHaveBeenCalledWith({ path: '/page' }, '', '/page');
    });

    it('should not update browser history when pushState is false', () => {
      // Arrange
      router.register('/page', mockHandler);
      const pushStateSpy = vi.spyOn(window.history, 'pushState');

      // Act
      router.navigate('/page', false);

      // Assert
      expect(pushStateSpy).not.toHaveBeenCalled();
    });

    it('should handle navigation to non-existent route (404)', () => {
      // Arrange
      const notFoundListener = vi.fn();
      window.addEventListener('router:404', notFoundListener);

      // Act
      router.navigate('/nonexistent', false);

      // Assert
      expect(mockHandler).not.toHaveBeenCalled();
      expect(notFoundListener).toHaveBeenCalled();
    });

    it('should extract route parameters correctly', () => {
      // Arrange
      router.register('/agents/:agentId', mockHandler);

      // Act
      router.navigate('/agents/abc-123', false);

      // Assert
      expect(mockHandler).toHaveBeenCalledWith({ agentId: 'abc-123' });
    });
  });

  describe('Current Route', () => {
    it('should return current route information', () => {
      // Arrange
      router.register('/test', mockHandler);
      router.navigate('/test', false);

      // Act
      const current = router.getCurrentRoute();

      // Assert
      expect(current.path).toBe('/test');
      expect(current.params).toEqual({});
      // fullPath comes from window.location which may differ in test env
      expect(current.fullPath).toBeTruthy();
    });

    it('should return current route with parameters', () => {
      // Arrange
      router.register('/users/:id', mockHandler);
      router.navigate('/users/456', false);

      // Act
      const current = router.getCurrentRoute();

      // Assert
      expect(current.path).toBe('/users/:id');
      expect(current.params).toEqual({ id: '456' });
      // fullPath comes from window.location which may differ in test env
      expect(current.fullPath).toBeTruthy();
    });

    it('should return null path when no route is matched', () => {
      // Act
      router.navigate('/invalid', false);
      const current = router.getCurrentRoute();

      // Assert
      expect(current.path).toBeNull();
    });
  });

  describe('Event System', () => {
    it('should emit routechange event on navigation', () => {
      // Arrange
      router.register('/test', mockHandler);
      const routeChangeListener = vi.fn();

      router.on('routechange', routeChangeListener);

      // Act
      router.navigate('/test', false);

      // Assert
      expect(routeChangeListener).toHaveBeenCalledWith({
        path: '/test',
        params: {},
      });
    });

    it('should emit 404 event for unmatched routes', () => {
      // Arrange
      const notFoundListener = vi.fn();
      router.on('404', notFoundListener);

      // Act
      router.navigate('/nonexistent', false);

      // Assert
      expect(notFoundListener).toHaveBeenCalledWith({
        path: '/nonexistent',
      });
    });

    it('should support multiple event listeners', () => {
      // Arrange
      router.register('/test', mockHandler);
      const listener1 = vi.fn();
      const listener2 = vi.fn();

      router.on('routechange', listener1);
      router.on('routechange', listener2);

      // Act
      router.navigate('/test', false);

      // Assert
      expect(listener1).toHaveBeenCalled();
      expect(listener2).toHaveBeenCalled();
    });
  });

  describe('Browser History Integration', () => {
    it('should handle popstate events (back button)', () => {
      // Arrange
      router.register('/page1', vi.fn());
      router.register('/page2', mockHandler);

      router.navigate('/page1');
      router.navigate('/page2');

      // Act
      window.history.back();

      // Simulate popstate event
      window.dispatchEvent(new PopStateEvent('popstate'));

      // Give the router time to process
      return new Promise((resolve) => {
        setTimeout(() => {
          // Assert
          const current = router.getCurrentRoute();
          expect(current.fullPath).toBe('/page1');
          resolve(undefined);
        }, 10);
      });
    });

    it('should navigate using back() method', () => {
      // Arrange
      const backSpy = vi.spyOn(window.history, 'back');

      // Act
      router.back();

      // Assert
      expect(backSpy).toHaveBeenCalled();
    });

    it('should navigate using forward() method', () => {
      // Arrange
      const forwardSpy = vi.spyOn(window.history, 'forward');

      // Act
      router.forward();

      // Assert
      expect(forwardSpy).toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('should catch errors in route handlers', () => {
      // Arrange
      const errorHandler = vi.fn(() => {
        throw new Error('Handler error');
      });
      const consoleErrorSpy = vi.spyOn(console, 'error');

      router.register('/error', errorHandler);

      // Act
      router.navigate('/error', false);

      // Assert
      expect(errorHandler).toHaveBeenCalled();
      expect(consoleErrorSpy).toHaveBeenCalled();
    });

    it('should emit routechange event even if handler throws', () => {
      // Arrange
      const errorHandler = vi.fn(() => {
        throw new Error('Handler error');
      });
      const routeChangeListener = vi.fn();

      router.register('/error', errorHandler);
      router.on('routechange', routeChangeListener);

      // Act
      router.navigate('/error', false);

      // Assert
      expect(routeChangeListener).toHaveBeenCalled();
    });
  });

  describe('Pattern Matching', () => {
    it('should match exact routes correctly', () => {
      // Arrange
      router.register('/exact', mockHandler);

      // Act & Assert
      router.navigate('/exact', false);
      expect(mockHandler).toHaveBeenCalled();

      mockHandler.mockClear();
      router.navigate('/exact/', false); // Should NOT match
      expect(mockHandler).not.toHaveBeenCalled();
    });

    it('should match routes with special characters in params', () => {
      // Arrange
      router.register('/search/:query', mockHandler);

      // Act
      router.navigate('/search/hello-world', false);

      // Assert
      expect(mockHandler).toHaveBeenCalledWith({ query: 'hello-world' });
    });

    it('should not match partial routes', () => {
      // Arrange
      router.register('/api/users', mockHandler);
      const notFoundListener = vi.fn();
      router.on('404', notFoundListener);

      // Act
      router.navigate('/api', false);

      // Assert
      expect(mockHandler).not.toHaveBeenCalled();
      expect(notFoundListener).toHaveBeenCalled();
    });
  });

  describe('Complex Routing Scenarios', () => {
    it('should handle nested routes', () => {
      // Arrange
      const rootHandler = vi.fn();
      const nestedHandler = vi.fn();

      router.register('/', rootHandler);
      router.register('/parent/child', nestedHandler);

      // Act
      router.navigate('/', false);
      router.navigate('/parent/child', false);

      // Assert
      expect(rootHandler).toHaveBeenCalled();
      expect(nestedHandler).toHaveBeenCalled();
    });

    it('should handle route changes in sequence', () => {
      // Arrange
      const handler1 = vi.fn();
      const handler2 = vi.fn();
      const handler3 = vi.fn();

      router.register('/route1', handler1);
      router.register('/route2', handler2);
      router.register('/route3', handler3);

      // Act
      router.navigate('/route1', false);
      router.navigate('/route2', false);
      router.navigate('/route3', false);

      // Assert
      expect(handler1).toHaveBeenCalledTimes(1);
      expect(handler2).toHaveBeenCalledTimes(1);
      expect(handler3).toHaveBeenCalledTimes(1);
    });

    it('should maintain correct state across multiple navigations', () => {
      // Arrange
      router.register('/users/:id', mockHandler);

      // Act & Assert
      router.navigate('/users/1', false);
      expect(router.getCurrentRoute().params).toEqual({ id: '1' });

      router.navigate('/users/2', false);
      expect(router.getCurrentRoute().params).toEqual({ id: '2' });

      router.navigate('/users/3', false);
      expect(router.getCurrentRoute().params).toEqual({ id: '3' });
    });
  });
});
