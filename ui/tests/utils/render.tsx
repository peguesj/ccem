/**
 * Test Rendering Utilities
 *
 * Provides custom render functions and utilities for testing React components
 * with proper context providers and common test scenarios.
 */

import { ReactElement, ReactNode } from 'react';
import { render, RenderOptions, RenderResult } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

/**
 * Custom render options that extend RTL's RenderOptions
 */
interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  /** Initial route for router testing */
  route?: string;
  /** Mock user data */
  user?: any;
  /** Additional providers */
  providers?: ReactNode;
}

/**
 * Custom wrapper component that provides common context providers
 */
function AllProviders({ children, providers }: { children: ReactNode; providers?: ReactNode }) {
  return (
    <>
      {providers ? providers : null}
      {children}
    </>
  );
}

/**
 * Custom render function that wraps @testing-library/react render
 * with common providers and setup.
 *
 * @example
 * ```tsx
 * const { getByText } = renderWithProviders(<MyComponent />);
 * ```
 */
export function renderWithProviders(
  ui: ReactElement,
  options: CustomRenderOptions = {}
): RenderResult {
  const { route = '/', providers, ...renderOptions } = options;

  // Set initial route if provided
  if (route !== '/') {
    window.history.pushState({}, 'Test page', route);
  }

  return render(ui, {
    wrapper: ({ children }) => <AllProviders providers={providers}>{children}</AllProviders>,
    ...renderOptions,
  });
}

/**
 * Render a component with user-event utilities pre-configured
 *
 * @example
 * ```tsx
 * const { user, getByRole } = renderWithUser(<LoginForm />);
 * await user.click(getByRole('button'));
 * ```
 */
export function renderWithUser(ui: ReactElement, options: CustomRenderOptions = {}) {
  return {
    user: userEvent.setup(),
    ...renderWithProviders(ui, options),
  };
}

/**
 * Wait for async updates to complete
 * Useful for testing loading states and async operations
 */
export async function waitForLoadingToFinish() {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

/**
 * Create a mock IntersectionObserver for testing components that use it
 */
export function mockIntersectionObserver() {
  const mockIntersectionObserver = vi.fn();
  mockIntersectionObserver.mockReturnValue({
    observe: () => null,
    unobserve: () => null,
    disconnect: () => null,
  });
  window.IntersectionObserver = mockIntersectionObserver as any;
}

/**
 * Create a mock ResizeObserver for testing components that use it
 */
export function mockResizeObserver() {
  const mockResizeObserver = vi.fn();
  mockResizeObserver.mockReturnValue({
    observe: () => null,
    unobserve: () => null,
    disconnect: () => null,
  });
  window.ResizeObserver = mockResizeObserver as any;
}

/**
 * Utility to test keyboard navigation
 */
export async function pressKey(key: string, user = userEvent.setup()) {
  await user.keyboard(`{${key}}`);
}

/**
 * Utility to simulate typing with delay
 */
export async function typeWithDelay(
  element: HTMLElement,
  text: string,
  user = userEvent.setup()
) {
  await user.type(element, text, { delay: 50 });
}

// Re-export everything from @testing-library/react for convenience
export * from '@testing-library/react';
export { userEvent };
