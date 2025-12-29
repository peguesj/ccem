# CCEM Hook Tests - Quick Reference

## One-Line Commands

```bash
# Validate setup
./tests/hooks/setup-validation.sh

# Run all tests
./tests/hooks/run-hook-tests.sh

# Run unit tests only
npm test -- tests/hooks/

# Run integration tests only
./tests/hooks/test-hook-integration.sh

# Run with coverage
npm test -- --coverage tests/hooks/

# Watch mode
npm test -- --watch tests/hooks/
```

## Individual Test Files

```bash
# Message analysis tests (17 tests)
npm test -- tests/hooks/test-message-analysis.ts

# Conversation storage tests (13 tests)
npm test -- tests/hooks/test-conversation-storage.ts

# Server submission tests (18 tests)
npm test -- tests/hooks/test-server-submission.ts
```

## Environment Setup

```bash
# Create .env file
cp .env.example .env

# Edit with your credentials
# VIKI_API_TOKEN=your-token
# VIKI_URL=https://viki.yjos.lgtm.build
```

## Expected Results

- **48 unit tests** - All should pass
- **12 integration tests** - All should pass
- **Coverage**: >95%
- **Time**: <1 minute

## Troubleshooting

```bash
# Missing jq
brew install jq

# Module errors
npm install && npm run build

# Permission errors
chmod +x tests/hooks/*.sh
```

## Test Locations

All files in: `/Users/jeremiah/Developer/ccem/tests/hooks/`

- `test-message-analysis.ts` - Message analysis tests
- `test-conversation-storage.ts` - Conversation storage tests
- `test-server-submission.ts` - Server submission tests
- `test-hook-integration.sh` - Integration tests
- `run-hook-tests.sh` - Master test runner
- `setup-validation.sh` - Setup validator

## Quick Check

```bash
# Everything in one command
./tests/hooks/setup-validation.sh && ./tests/hooks/run-hook-tests.sh
```

## Coverage Report

```bash
# Generate and open
npm test -- --coverage tests/hooks/ && open coverage/lcov-report/index.html
```

## CI/CD

```bash
# GitHub Actions
./tests/hooks/run-hook-tests.sh
```

## Success Indicators

✓ Setup validation passes
✓ All 48 unit tests pass
✓ All 12 integration tests pass
✓ Coverage >95%
✓ No TypeScript errors
✓ No ESLint errors
✓ Execution time <1 minute
