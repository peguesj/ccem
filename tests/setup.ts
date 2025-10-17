/**
 * Jest setup file
 *
 * This file is executed before each test file.
 * Use it for global test configuration and setup.
 */

// Add any global test setup here
// For example: mock environment variables, configure test utilities, etc.

// Silence console logs during tests unless explicitly needed
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  // Keep error for debugging test failures
  error: console.error,
}
