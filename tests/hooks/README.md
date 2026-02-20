# CCEM Hook System Tests

Comprehensive test suite for the CCEM Hook System including unit tests, integration tests, and end-to-end testing.

## Quick Start

```bash
# Run all tests
./run-hook-tests.sh

# Run unit tests only
npm test -- tests/hooks/

# Run integration tests only
./test-hook-integration.sh
```

## Test Files

### TypeScript Unit Tests

- **test-message-analysis.ts** - Tests VIKI message analysis hook
  - Category detection
  - Keyword extraction
  - Code query identification
  - File and command suggestions

- **test-conversation-storage.ts** - Tests conversation storage hook
  - Conversation submission
  - Server configuration
  - Error handling

- **test-server-submission.ts** - Tests server submission utilities
  - Authentication (bearer, JWT, API key)
  - Retry logic
  - Error handling
  - Parallel submission

### Bash Integration Tests

- **test-hook-integration.sh** - End-to-end API endpoint tests
  - Health check endpoint
  - Message analysis endpoint
  - Conversation storage endpoint
  - Authentication validation
  - Error handling

### Test Runners

- **run-hook-tests.sh** - Master test runner
  - Runs all unit tests
  - Runs integration tests
  - Generates coverage reports
  - Runs type checking
  - Runs linting

## Prerequisites

1. **Environment Setup**
   ```bash
   cp ../../.env.example ../../.env
   # Edit .env with your credentials
   ```

2. **Required Tools**
   - Node.js 18+
   - npm
   - curl
   - jq (install: `brew install jq`)

3. **Environment Variables**
   - `VIKI_API_TOKEN` - Your VIKI API token
   - `VIKI_URL` - VIKI server URL (default: https://viki.yjos.lgtm.build)

## Running Tests

### All Tests
```bash
./run-hook-tests.sh
```

### Individual Test Files
```bash
npm test -- tests/hooks/test-message-analysis.ts
npm test -- tests/hooks/test-conversation-storage.ts
npm test -- tests/hooks/test-server-submission.ts
```

### Integration Tests
```bash
./test-hook-integration.sh
```

### With Coverage
```bash
npm test -- --coverage tests/hooks/
```

### Watch Mode
```bash
npm test -- --watch tests/hooks/
```

## Expected Results

- **48 unit tests** across 3 test files
- **12 integration tests** in bash script
- **> 95% code coverage** for hook system
- **All tests pass** in < 1 minute

See [TEST_RESULTS.md](./TEST_RESULTS.md) for detailed expected output.

## Test Structure

```
tests/hooks/
├── README.md                      # This file
├── TEST_RESULTS.md                # Expected test output
├── test-message-analysis.ts       # Unit tests for message analysis
├── test-conversation-storage.ts   # Unit tests for conversation storage
├── test-server-submission.ts      # Unit tests for server submission
├── test-hook-integration.sh       # Integration tests (bash)
└── run-hook-tests.sh              # Master test runner
```

## Test Coverage

### Current Coverage Targets
- Statement Coverage: > 95%
- Branch Coverage: > 90%
- Function Coverage: > 95%
- Line Coverage: > 95%

### Coverage Report
After running tests with coverage, open:
```bash
open ../../coverage/lcov-report/index.html
```

## Troubleshooting

### .env file not found
```bash
cp ../../.env.example ../../.env
# Edit with your credentials
```

### jq not installed
```bash
brew install jq
```

### Tests fail with 401
- Verify `VIKI_API_TOKEN` in .env
- Check token is not expired

### Module not found errors
```bash
cd ../..
npm install
npm run build
```

## CI/CD Integration

Add to GitHub Actions:
```yaml
- name: Run Hook Tests
  run: ./tests/hooks/run-hook-tests.sh
  env:
    VIKI_API_TOKEN: ${{ secrets.VIKI_API_TOKEN }}
    VIKI_URL: ${{ secrets.VIKI_URL }}
```

## Contributing

When adding new hook functionality:
1. Add corresponding test file
2. Update run-hook-tests.sh if needed
3. Update TEST_RESULTS.md with expected output
4. Ensure > 95% coverage maintained

## License

MIT
