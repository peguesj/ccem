/**
 * CCEM-UI Router Component
 * Client-side routing using History API with TypeScript support
 */

/**
 * Route configuration interface
 */
export interface RouteConfig {
  pattern: RegExp;
  handler: RouteHandler;
  path: string;
}

/**
 * Route match result interface
 */
export interface RouteMatch {
  path: string;
  params: Record<string, string>;
  handler: RouteHandler;
}

/**
 * Current route info interface
 */
export interface CurrentRoute {
  path: string | null;
  params: Record<string, string>;
  fullPath: string;
}

/**
 * Route change event detail interface
 */
export interface RouteChangeDetail {
  path: string;
  params: Record<string, string>;
}

/**
 * 404 event detail interface
 */
export interface NotFoundDetail {
  path: string;
}

/**
 * Route handler function type
 */
export type RouteHandler = (params: Record<string, string>) => void;

/**
 * Router class for client-side navigation
 */
export class Router {
  private routes: Record<string, RouteConfig> = {};
  private currentRoute: string | null = null;
  private currentParams: Record<string, string> = {};

  /**
   * Creates a new Router instance
   */
  constructor() {
    console.log('[ROUTER] Router initialized');

    // Listen to browser navigation
    window.addEventListener('popstate', () => this.handlePopState());

    // Handle initial route
    this.navigate(window.location.pathname, false);
  }

  /**
   * Register a route
   * @param path - Route path (e.g., '/agents/:id')
   * @param handler - Handler function to execute
   */
  register(path: string, handler: RouteHandler): void {
    this.routes[path] = {
      pattern: this.pathToRegex(path),
      handler,
      path,
    };

    console.log('[ROUTER] Route registered:', path);
  }

  /**
   * Convert path to regex pattern
   * @param path - Route path
   * @returns Regular expression for matching
   */
  private pathToRegex(path: string): RegExp {
    // Convert :param to named capture groups
    const pattern = path
      .replace(/\//g, '\\/')
      .replace(/:(\w+)/g, '(?<$1>[^/]+)');

    return new RegExp(`^${pattern}$`);
  }

  /**
   * Navigate to a route
   * @param path - Path to navigate to
   * @param pushState - Whether to push to history
   */
  navigate(path: string, pushState = true): void {
    console.log('[ROUTER] Navigating to:', path, { pushState });

    // Find matching route
    const route = this.matchRoute(path);

    if (!route) {
      console.warn('[ROUTER] No route found for:', path);
      this.handle404(path);
      return;
    }

    // Update browser history
    if (pushState) {
      window.history.pushState({ path }, '', path);
    }

    // Update current route
    this.currentRoute = route.path;
    this.currentParams = route.params;

    // Execute route handler
    try {
      route.handler(route.params);
      console.log('[ROUTER] Route handler executed:', {
        path: route.path,
        params: route.params,
      });
    } catch (error) {
      console.error('[ROUTER] Route handler error:', error);
    }

    // Emit route change event
    this.emit('routechange', { path, params: route.params });
  }

  /**
   * Match a path to a registered route
   * @param path - Path to match
   * @returns Matched route with params or null
   */
  private matchRoute(path: string): RouteMatch | null {
    for (const [routePath, route] of Object.entries(this.routes)) {
      const match = path.match(route.pattern);

      if (match) {
        return {
          path: routePath,
          params: match.groups || {},
          handler: route.handler,
        };
      }
    }

    return null;
  }

  /**
   * Handle browser back/forward navigation
   */
  private handlePopState(): void {
    const path = window.location.pathname;
    console.log('[ROUTER] Popstate event:', path);
    this.navigate(path, false);
  }

  /**
   * Handle 404 not found
   * @param path - Path that wasn't found
   */
  private handle404(path: string): void {
    console.error('[ROUTER] 404 Not Found:', path);

    // Emit 404 event
    this.emit('404', { path });
  }

  /**
   * Get current route
   * @returns Current route info
   */
  getCurrentRoute(): CurrentRoute {
    return {
      path: this.currentRoute,
      params: this.currentParams,
      fullPath: window.location.pathname,
    };
  }

  /**
   * Simple event emitter
   * @param event - Event name
   * @param data - Event data
   */
  private emit(event: string, data: RouteChangeDetail | NotFoundDetail): void {
    const customEvent = new CustomEvent(`router:${event}`, { detail: data });
    window.dispatchEvent(customEvent);
  }

  /**
   * Listen to router events
   * @param event - Event name
   * @param callback - Callback function
   */
  on(event: string, callback: (data: RouteChangeDetail | NotFoundDetail) => void): void {
    window.addEventListener(`router:${event}`, (e: Event) => {
      const customEvent = e as CustomEvent<RouteChangeDetail | NotFoundDetail>;
      callback(customEvent.detail);
    });
  }

  /**
   * Go back in history
   */
  back(): void {
    console.log('[ROUTER] Going back');
    window.history.back();
  }

  /**
   * Go forward in history
   */
  forward(): void {
    console.log('[ROUTER] Going forward');
    window.history.forward();
  }
}

export default Router;
