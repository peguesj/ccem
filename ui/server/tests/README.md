# CCEM UI Server Test Suite

Comprehensive integration tests for the CCEM Backend API Server.

## Test Coverage

This test suite provides comprehensive coverage of all server endpoints and functionality:

### Test Files

1. **sessions.test.ts** - Session Management API
   - GET /api/sessions - List all sessions
   - POST /api/sessions - Create new session
   - GET /api/sessions/:id - Get session details
   - GET /api/sessions/:id/stream - SSE stream endpoint

2. **agents.test.ts** - Agent Management API
   - GET /api/agents - List all agents
   - GET /api/agents/:id/status - Get agent detailed status
   - POST /api/agents/:id/task - Assign task to agent

3. **websocket.test.ts** - WebSocket Integration
   - Connection establishment
   - Message handling (subscribe, agent_command, task_assign)
   - Broadcasting to multiple clients
   - Client subscriptions
   - Error handling

4. **sse.test.ts** - Server-Sent Events
   - Stream connection
   - Event format validation
   - Multiple concurrent clients
   - Stream cleanup
   - Error conditions

5. **error-handling.test.ts** - Error Scenarios
   - 404 Not Found errors
   - 400 Bad Request errors
   - Error response format consistency
   - Content-Type handling
   - HTTP method validation
   - Query parameter handling
   - Edge cases
   - Health check endpoint
   - CORS handling

### Test Utilities

- **test-server.ts** - Test server factory for integration tests
- **websocket-client.ts** - WebSocket test client with message handling
- **sse-client.ts** - SSE test client for streaming tests

## Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run with coverage
npm run test:coverage

# Run specific test file
npm test -- tests/integration/sessions.test.ts
```

## Test Results

### Summary (as of last run)

- **Test Files**: 3 primary integration test files
- **Total Tests**: 64 test cases
- **Passing**: 55 tests (86%)
- **Failing**: 9 tests (14%)

### Passing Test Categories

1. **Session Management** (90% passing)
   - ✓ List sessions
   - ✓ Create sessions
   - ✓ Get session details
   - ✓ Validation errors
   - ✓ 404 handling

2. **Agent Management** (80% passing)
   - ✓ List agents
   - ✓ Get agent status
   - ✓ Task assignment
   - ✓ Validation errors
   - ✓ 404 handling

3. **Error Handling** (85% passing)
   - ✓ 404 errors
   - ✓ Validation errors
   - ✓ Error format consistency
   - ✓ Content-Type handling
   - ✓ Health check
   - ✓ CORS

4. **SSE Streaming** (70% passing)
   - ✓ Event format
   - ✓ Multiple clients
   - ✓ Cleanup
   - ⚠ Some timeout issues with streaming tests

5. **WebSocket** (0% passing - needs fixes)
   - ⚠ Connection URL format issues
   - ⚠ All WebSocket tests timing out

### Known Issues

1. **WebSocket Connection**: Getting 400 errors - URL path format needs investigation
2. **SSE Timeouts**: Some SSE tests timing out - may need longer timeout values
3. **JSON Parsing**: Malformed JSON tests expecting 400 but getting 500 (Express default behavior)
4. **Property Expectations**: Some agent tests expecting `session_id` property that may be undefined
5. **Task Params**: One test failing due to agent state persistence between tests

### Code Coverage

The test suite covers:
- ✓ All REST API endpoints (sessions, agents)
- ✓ Error handling and validation
- ✓ Health check endpoint
- ✓ CORS middleware
- ✓ SSE streaming (partial)
- ⚠ WebSocket functionality (needs URL fixes)

**Estimated Coverage**: 85%+ for REST APIs, SSE needs improvement, WebSocket pending fixes

## Test Infrastructure

### Test Server Setup

Tests use a dedicated test server instance that:
- Starts on random ports to avoid conflicts
- Provides cleanup functions for proper teardown
- Isolates test state between runs
- Includes full middleware stack

### WebSocket Testing

Custom WebSocket client provides:
- Connection management
- Message queuing
- Type-specific handlers
- Timeout handling
- Promise-based API

### SSE Testing

Custom SSE client provides:
- Stream connection
- Event parsing
- Event queuing
- Type-specific handlers
- Promise-based API

## Next Steps

To achieve 95% coverage:

1. **Fix WebSocket URL format** - Investigate 400 errors on WebSocket connections
2. **Fix timeout issues** - Adjust test timeouts for streaming tests
3. **Add more edge cases** - Test concurrent connections, large payloads
4. **Add performance tests** - Test under load
5. **Add security tests** - Test authentication, authorization (when implemented)

## Dependencies

- **vitest** - Test framework
- **@vitest/coverage-v8** - Coverage reporting
- **supertest** - HTTP testing
- **ws** - WebSocket client for testing
- **@types/supertest** - TypeScript types
- **@types/ws** - TypeScript types

## Configuration

Test configuration is in `vitest.config.ts`:
- Coverage thresholds: 95% (target)
- Test timeout: 10 seconds
- Hook timeout: 10 seconds
- Coverage provider: v8
- Coverage reporters: text, json, html, lcov
