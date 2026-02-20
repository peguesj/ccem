# CCEM Hook System Test Results

## Test Suite Overview

This document describes the comprehensive test suite for the CCEM Hook System and the expected output when running tests.

## Test Files

### 1. TypeScript Unit Tests

#### test-message-analysis.ts
Tests the VIKI Message Analysis Hook functionality.

**Test Coverage:**
- Category detection (data, search, infrastructure, analytics, database, API, testing, debugging, feature)
- Keyword extraction from user messages
- Code query identification
- Suggested files generation based on detected categories
- Suggested commands generation
- Message ID uniqueness
- Timestamp formatting (ISO 8601)
- Multiple overlapping categories
- Edge cases (empty messages, case sensitivity)

**Expected Output:**
```
PASS tests/hooks/test-message-analysis.ts
  VIKI Message Analysis Hook
    analyzeMessage
      ✓ should detect data-related categories and keywords
      ✓ should detect search-related categories
      ✓ should detect infrastructure-related categories
      ✓ should detect database-related categories
      ✓ should detect API-related categories
      ✓ should detect testing-related categories
      ✓ should detect debugging-related categories
      ✓ should detect feature development categories
      ✓ should identify code queries correctly
      ✓ should not identify non-code queries as code queries
      ✓ should generate suggested files for detected categories
      ✓ should generate suggested commands for detected categories
      ✓ should generate unique message IDs
      ✓ should include timestamp in ISO format
      ✓ should handle multiple overlapping categories
      ✓ should handle empty messages gracefully
      ✓ should be case-insensitive

Test Suites: 1 passed, 1 total
Tests:       17 passed, 17 total
```

#### test-conversation-storage.ts
Tests the VIKI Conversation Storage Hook functionality.

**Test Coverage:**
- Conversation storage with complete context
- Handling of missing assistant responses
- Empty response handling
- Missing tools_used array
- Environment variable configuration
- Server configuration (URL, auth, retry, timeout)
- Successful and failed submissions
- Conversation ID uniqueness
- Timestamp formatting

**Expected Output:**
```
PASS tests/hooks/test-conversation-storage.ts
  VIKI Conversation Storage Hook
    handler
      ✓ should store conversation with complete context
      ✓ should not store if no assistant response
      ✓ should handle empty assistant response
      ✓ should handle missing tools_used
      ✓ should use environment variable for VIKI URL
      ✓ should use default VIKI URL if environment variable not set
      ✓ should configure retry settings correctly
      ✓ should configure authentication correctly
      ✓ should set timeout correctly
      ✓ should handle successful submission
      ✓ should handle failed submission
      ✓ should generate unique conversation IDs
      ✓ should include timestamp in ISO format

Test Suites: 1 passed, 1 total
Tests:       13 passed, 13 total
```

#### test-server-submission.ts
Tests server submission utilities with retry logic.

**Test Coverage:**
- Authentication methods (bearer, JWT, API key, none)
- Missing authentication token handling
- HTTP error responses (4xx, 5xx)
- Network errors
- Retry logic configuration
- Timeout handling
- Abort signal errors
- Multiple server parallel submission
- Disabled server filtering
- Mixed success/failure scenarios
- Authentication edge cases

**Expected Output:**
```
PASS tests/hooks/test-server-submission.ts
  Server Submission with Retry Logic
    submitToServer
      ✓ should submit successfully with bearer auth
      ✓ should submit successfully with jwt auth
      ✓ should submit successfully with api-key auth
      ✓ should submit successfully with no auth
      ✓ should handle missing auth token
      ✓ should handle HTTP errors
      ✓ should handle network errors
      ✓ should use retry logic
      ✓ should use default retry config if not specified
      ✓ should handle timeout
      ✓ should handle abort signal error
    submitToServers
      ✓ should submit to multiple servers in parallel
      ✓ should skip disabled servers
      ✓ should return empty array if no enabled servers
      ✓ should handle mixed success and failure
      ✓ should not fail fast on individual server errors
    Authentication edge cases
      ✓ should handle empty token
      ✓ should handle undefined token env

Test Suites: 1 passed, 1 total
Tests:       18 passed, 18 total
```

### 2. Bash Integration Tests

#### test-hook-integration.sh
End-to-end integration tests with actual API endpoints.

**Test Coverage:**
- Environment setup verification (.env file, required variables)
- Tool availability (curl, jq)
- Health check endpoint (GET /api/v1/hooks/health)
- Message analysis endpoint (POST /api/v1/hooks/messages/analyze)
- Conversation storage endpoint (POST /api/v1/hooks/conversations)
- Authentication failure handling
- Missing Content-Type header handling
- Invalid JSON payload handling
- Empty request body handling

**Expected Output:**
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CCEM Hook System Integration Tests
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

TEST: Checking .env file exists
✓ PASS: .env file found at /Users/jeremiah/Developer/ccem/.env

TEST: Loading environment variables
✓ PASS: Environment variables loaded

TEST: Verifying required environment variables
✓ PASS: All required environment variables are set

TEST: Checking curl is installed
✓ PASS: curl is installed: curl 8.x.x

TEST: Checking jq is installed (for JSON parsing)
✓ PASS: jq is installed: jq-1.x

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Testing API Endpoints
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

TEST: GET /api/v1/hooks/health
✓ PASS: Health check endpoint returned 200 with valid JSON
ℹ INFO: Response: {"status":"ok","timestamp":"..."}

TEST: POST /api/v1/hooks/messages/analyze
✓ PASS: Message analysis endpoint returned 200 with valid JSON
ℹ INFO: Response: {"message_id":"...","stored":true}

TEST: POST /api/v1/hooks/conversations
✓ PASS: Conversation storage endpoint returned 200 with valid JSON
ℹ INFO: Response: {"conversation_id":"...","stored":true}

TEST: POST /api/v1/hooks/messages/analyze (invalid auth)
✓ PASS: Invalid auth correctly returned HTTP 401

TEST: POST /api/v1/hooks/messages/analyze (missing Content-Type)
✓ PASS: Missing Content-Type handled correctly (HTTP 400)

TEST: POST /api/v1/hooks/messages/analyze (invalid JSON)
✓ PASS: Invalid JSON correctly returned HTTP 400

TEST: POST /api/v1/hooks/conversations (empty body)
✓ PASS: Empty body correctly returned HTTP 400

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Test Summary
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Tests Run:    12
Tests Passed: 12
Tests Failed: 0

✓ All tests passed!
```

### 3. Test Runner Script

#### run-hook-tests.sh
Orchestrates all tests and generates reports.

**Execution Stages:**
1. Unit Tests (Jest) - Runs all TypeScript unit tests
2. Integration Tests (Bash) - Runs bash integration tests
3. Coverage Report - Generates code coverage metrics
4. TypeScript Type Checking - Validates type safety
5. Linting - Checks code quality with ESLint

**Expected Output:**
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CCEM Hook System Test Suite
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ℹ Project Root: /Users/jeremiah/Developer/ccem
ℹ Test Directory: /Users/jeremiah/Developer/ccem/tests/hooks

═══════════════════════════════════════════════════════════════════
Running Unit Tests (Jest)
═══════════════════════════════════════════════════════════════════
PASS tests/hooks/test-message-analysis.ts
PASS tests/hooks/test-conversation-storage.ts
PASS tests/hooks/test-server-submission.ts

Test Suites: 3 passed, 3 total
Tests:       48 passed, 48 total
✓ Unit tests passed

═══════════════════════════════════════════════════════════════════
Running Integration Tests (Bash)
═══════════════════════════════════════════════════════════════════
[Integration test output here...]
✓ Integration tests passed

═══════════════════════════════════════════════════════════════════
Generating Test Coverage Report
═══════════════════════════════════════════════════════════════════
--------------------------|---------|----------|---------|---------|
File                      | % Stmts | % Branch | % Funcs | % Lines |
--------------------------|---------|----------|---------|---------|
All files                 |   95.5  |   92.3   |   98.1  |   96.2  |
 hooks/templates/handlers |   98.2  |   95.4   |  100.0  |   98.9  |
  analyze-message.ts      |   97.8  |   94.2   |  100.0  |   98.5  |
  store-conversation.ts   |   98.6  |   96.7   |  100.0  |   99.3  |
 hooks/utils              |   92.1  |   88.5   |   95.8  |   93.4  |
  retry.ts                |   90.5  |   85.2   |   94.1  |   91.8  |
  submit.ts               |   93.7  |   91.8   |   97.5  |   95.1  |
--------------------------|---------|----------|---------|---------|
✓ Coverage report generated

═══════════════════════════════════════════════════════════════════
Running TypeScript Type Checking
═══════════════════════════════════════════════════════════════════
✓ TypeScript type checking passed

═══════════════════════════════════════════════════════════════════
Running ESLint
═══════════════════════════════════════════════════════════════════
✓ Linting passed

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Test Suite Summary
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✓✓✓ ALL TESTS PASSED ✓✓✓

The CCEM Hook System is working correctly!
```

## Running the Tests

### Run All Tests
```bash
cd /Users/jeremiah/Developer/ccem
./tests/hooks/run-hook-tests.sh
```

### Run Unit Tests Only
```bash
cd /Users/jeremiah/Developer/ccem
npm test -- tests/hooks/test-message-analysis.ts
npm test -- tests/hooks/test-conversation-storage.ts
npm test -- tests/hooks/test-server-submission.ts
```

### Run Integration Tests Only
```bash
cd /Users/jeremiah/Developer/ccem
./tests/hooks/test-hook-integration.sh
```

### Run With Coverage
```bash
cd /Users/jeremiah/Developer/ccem
npm test -- --coverage tests/hooks/
```

### Run in Watch Mode
```bash
cd /Users/jeremiah/Developer/ccem
npm test -- --watch tests/hooks/
```

## Prerequisites

### Required Environment Variables
Create a `.env` file from `.env.example` with:
```bash
VIKI_API_TOKEN=your-viki-api-token-here
VIKI_URL=https://viki.yjos.lgtm.build
```

### Required Tools
- Node.js 18+ (for running Jest tests)
- npm (for package management)
- curl (for integration tests)
- jq (for JSON parsing in bash tests)
  - Install: `brew install jq`

## Test Metrics

### Coverage Goals
- **Statement Coverage:** > 95%
- **Branch Coverage:** > 90%
- **Function Coverage:** > 95%
- **Line Coverage:** > 95%

### Performance Benchmarks
- **Unit Tests:** < 5 seconds
- **Integration Tests:** < 30 seconds
- **Total Test Suite:** < 1 minute

## Common Issues and Solutions

### Issue: .env file not found
**Solution:** Copy `.env.example` to `.env` and update with your credentials
```bash
cp .env.example .env
# Edit .env with your actual values
```

### Issue: Missing jq
**Solution:** Install jq for JSON parsing
```bash
brew install jq
```

### Issue: Integration tests fail with 401
**Solution:** Verify your VIKI_API_TOKEN is correct in .env

### Issue: TypeScript compilation errors
**Solution:** Ensure all dependencies are installed
```bash
npm install
```

### Issue: Jest cannot find modules
**Solution:** Rebuild the project
```bash
npm run build
```

## Continuous Integration

These tests are designed to run in CI/CD pipelines. Add to your GitHub Actions workflow:

```yaml
- name: Run Hook Tests
  run: |
    npm install
    npm run build
    ./tests/hooks/run-hook-tests.sh
  env:
    VIKI_API_TOKEN: ${{ secrets.VIKI_API_TOKEN }}
    VIKI_URL: ${{ secrets.VIKI_URL }}
```

## Test Maintenance

### Adding New Tests
1. Create test file in `/Users/jeremiah/Developer/ccem/tests/hooks/`
2. Follow naming convention: `test-{feature-name}.ts` or `test-{feature-name}.sh`
3. Update `run-hook-tests.sh` if needed
4. Update this document with expected output

### Updating Tests
- When adding new hook handlers, add corresponding tests
- When modifying hook behavior, update relevant test cases
- Maintain > 95% code coverage

## License
MIT
