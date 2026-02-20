# CCEM Web UI - Test Infrastructure

## Overview

Comprehensive testing infrastructure for the CCEM Web UI with TDD principles, demonstrating Red-Green-Refactor methodology and 95% coverage targets.

## Test Infrastructure Components

### Configuration Files

#### Vite Configuration (`vite.config.ts`)
- **Environment**: happy-dom for lightweight DOM simulation
- **Coverage Provider**: v8 with HTML, JSON, LCOV, and text reporters
- **Coverage Targets**: 95% minimum for lines, functions, branches, and statements
- **Parallel Execution**: Thread pool for faster test runs
- **Reporters**: Verbose console output + HTML reports

#### Playwright Configuration (`playwright.config.ts`)
- **Browsers**: Chromium, Firefox, WebKit, Mobile Chrome, Mobile Safari
- **Features**: Screenshots on failure, video retention, trace recording
- **Web Server**: Auto-start dev server on port 3000
- **Retries**: 2 retries in CI, 0 in local development

### Directory Structure

```
tests/
├── unit/               # Component unit tests
│   └── Router.test.ts  # Example Router unit tests (33 tests, 100% coverage)
├── integration/        # API integration tests
│   └── api-router.test.ts  # API + Router integration tests
├── e2e/               # End-to-end browser tests
│   └── router-navigation.spec.ts  # Playwright E2E tests
├── fixtures/          # Test data and mocks
│   ├── config.ts      # Mock configuration data
│   ├── commands.ts    # Mock command data
│   └── index.ts       # Fixture exports
├── utils/             # Test utilities
│   ├── render.tsx     # React rendering utilities
│   ├── api-mock.ts    # API mocking utilities
│   ├── websocket-mock.ts  # WebSocket mocking
│   └── index.ts       # Utility exports
└── setup.ts           # Global test setup and configuration
```

### Test Utilities

#### Rendering Utilities (`tests/utils/render.tsx`)
- **renderWithProviders**: Render components with context providers
- **renderWithUser**: Render with user-event utilities pre-configured
- **mockIntersectionObserver**: Mock for intersection observer API
- **mockResizeObserver**: Mock for resize observer API
- **Keyboard helpers**: pressKey, typeWithDelay

**Example:**
```typescript
import { renderWithUser } from '@tests/utils';

const { user, getByRole } = renderWithUser(<MyComponent />);
await user.click(getByRole('button'));
```

#### API Mocking (`tests/utils/api-mock.ts`)
- **createMockFetch**: Create mock fetch with endpoint configurations
- **createSuccessResponse**: Generate successful API responses
- **createErrorResponse**: Generate error API responses
- **Mock endpoints**: Pre-configured mocks for config, commands, MCP

**Example:**
```typescript
import { createMockFetch, mockConfigEndpoints } from '@tests/utils';

global.fetch = createMockFetch([
  mockConfigEndpoints.getConfig({ version: '1.0.0' })
]);
```

#### WebSocket Mocking (`tests/utils/websocket-mock.ts`)
- **createMockWebSocket**: Create mock WebSocket class
- **TestWebSocket**: WebSocket test wrapper with helpers
- **mockMessages**: Pre-configured message factories
- **waitForWebSocketState**: Wait for connection state changes

**Example:**
```typescript
import { TestWebSocket, mockMessages } from '@tests/utils';

const ws = new TestWebSocket('ws://localhost', {
  autoMessages: [mockMessages.connected()]
});
ws.receive(mockMessages.configUpdate({ theme: 'dark' }));
```

### Test Fixtures

#### Configuration Fixtures (`tests/fixtures/config.ts`)
- `mockConfig`: Valid configuration object
- `mockInvalidConfig`: Invalid configuration for error testing
- `mockEmptyConfig`: Empty configuration state

#### Command Fixtures (`tests/fixtures/commands.ts`)
- `mockCommands`: Array of command objects
- `mockCommandResult`: Successful command execution
- `mockCommandError`: Failed command execution

## Running Tests

### Unit and Integration Tests (Vitest)

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests once
npm run test:run

# Generate coverage report
npm run test:coverage

# Open test UI
npm run test:ui
```

### E2E Tests (Playwright)

```bash
# Run E2E tests
npm run test:e2e

# Open Playwright UI
npm run test:e2e:ui

# Debug E2E tests
npm run test:e2e:debug
```

### All Tests

```bash
# Run both unit/integration and E2E tests
npm run test:all
```

## Test Coverage Reports

Coverage reports are generated in:
- **HTML Report**: `./coverage/index.html`
- **LCOV Report**: `./coverage/lcov.info`
- **JSON Report**: `./coverage/coverage-final.json`
- **Test Results**: `./test-results/index.html`

View HTML report:
```bash
open coverage/index.html
```

## Writing Tests

### TDD Workflow

1. **Red Phase**: Write failing tests first
2. **Green Phase**: Write minimal code to pass tests
3. **Refactor Phase**: Optimize while maintaining test coverage

### Unit Test Example

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { MyComponent } from '@/components/MyComponent';

describe('MyComponent', () => {
  beforeEach(() => {
    // Setup before each test
  });

  it('should render correctly', () => {
    // Arrange
    const props = { title: 'Test' };

    // Act
    const result = MyComponent(props);

    // Assert
    expect(result).toBeTruthy();
  });
});
```

### Integration Test Example

```typescript
import { describe, it, expect } from 'vitest';
import { createMockFetch } from '@tests/utils';

describe('API Integration', () => {
  it('should fetch and process data', async () => {
    // Arrange
    global.fetch = createMockFetch([
      {
        method: 'GET',
        path: '/api/data',
        response: { data: { value: 'test' } }
      }
    ]);

    // Act
    const response = await fetch('/api/data');
    const data = await response.json();

    // Assert
    expect(data).toEqual({ value: 'test' });
  });
});
```

### E2E Test Example

```typescript
import { test, expect } from '@playwright/test';

test('user navigation flow', async ({ page }) => {
  // Navigate to home
  await page.goto('/');

  // Click navigation link
  await page.click('[href="/config"]');

  // Assert URL changed
  await expect(page).toHaveURL('/config');
});
```

## Test Patterns and Best Practices

### Arrange-Act-Assert Pattern
All tests follow the AAA pattern:
```typescript
it('should do something', () => {
  // Arrange - Set up test data and conditions
  const input = 'test';

  // Act - Execute the code under test
  const result = processInput(input);

  // Assert - Verify the results
  expect(result).toBe('expected');
});
```

### Mock External Dependencies
- Use `vi.fn()` for function mocks
- Use `createMockFetch` for API calls
- Use `TestWebSocket` for WebSocket connections

### Test Isolation
- Each test should be independent
- Use `beforeEach` for common setup
- Use `afterEach` for cleanup
- Clear mocks between tests

### Descriptive Test Names
```typescript
// Good
it('should return 404 when route is not found')

// Bad
it('test route')
```

### Coverage Guidelines
- **Target**: 95% minimum coverage
- **Unit Tests**: Test all public methods and edge cases
- **Integration Tests**: Test component interactions
- **E2E Tests**: Test critical user flows

## Example Test: Router Component

The Router component tests demonstrate comprehensive TDD patterns:

- **33 unit tests** covering all functionality
- **100% code coverage** (lines, branches, functions, statements)
- **Test categories**:
  - Route registration (4 tests)
  - Navigation (5 tests)
  - Current route tracking (3 tests)
  - Event system (3 tests)
  - Browser history (3 tests)
  - Error handling (2 tests)
  - Pattern matching (3 tests)
  - Complex scenarios (3 tests)
  - Integration tests (7 tests)

See `tests/unit/Router.test.ts` and `tests/integration/api-router.test.ts` for implementation examples.

## Continuous Integration

The test suite is designed for CI/CD:
- Fails on first error in CI (`bail: 1`)
- Generates machine-readable reports (JSON, LCOV)
- Parallel test execution for speed
- Automatic retry logic for E2E tests

## Troubleshooting

### Tests Not Running
```bash
# Clear cache and reinstall
rm -rf node_modules coverage test-results
npm install
```

### Coverage Not Meeting Thresholds
```bash
# View detailed coverage report
npm run test:coverage
open coverage/index.html
```

### E2E Tests Failing
```bash
# Run in debug mode
npm run test:e2e:debug

# Check browser output
npm run test:e2e:ui
```

## Next Steps

Other agents will write tests for:
- Component tests (AgentCard, ChatCard, Terminal, Navigation, CommandPalette)
- Page tests (Home, Sessions, Agents, Chats, Settings)
- Server API tests (agents, sessions endpoints)
- WebSocket tests (real-time communication)

Each test suite should follow the patterns demonstrated in the Router tests.

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [Playwright Documentation](https://playwright.dev/)
- [Testing Library](https://testing-library.com/)
- [TDD Best Practices](https://testdriven.io/)
