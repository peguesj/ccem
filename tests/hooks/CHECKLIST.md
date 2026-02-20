# CCEM Hook Test Suite - Verification Checklist

## Pre-Test Checklist

### Environment Setup
- [ ] Node.js 18+ installed (`node --version`)
- [ ] npm installed (`npm --version`)
- [ ] curl installed (`curl --version`)
- [ ] jq installed (`jq --version` - install: `brew install jq`)

### Project Setup
- [ ] Dependencies installed (`npm install`)
- [ ] Project built (`npm run build`)
- [ ] `.env` file created from `.env.example`
- [ ] `VIKI_API_TOKEN` set in `.env`
- [ ] `VIKI_URL` set in `.env`

### File Verification
- [ ] All test files exist (10 files in `/tests/hooks/`)
- [ ] Scripts are executable (`chmod +x tests/hooks/*.sh`)
- [ ] Source files exist in `src/hooks/`

## Test Execution Checklist

### Setup Validation
- [ ] Run `./tests/hooks/setup-validation.sh`
- [ ] All checks pass (green checkmarks)
- [ ] No critical issues reported

### Unit Tests
- [ ] Run `npm test -- tests/hooks/test-message-analysis.ts`
  - [ ] 17 tests pass
- [ ] Run `npm test -- tests/hooks/test-conversation-storage.ts`
  - [ ] 13 tests pass
- [ ] Run `npm test -- tests/hooks/test-server-submission.ts`
  - [ ] 18 tests pass
- [ ] Total: 48 unit tests pass

### Integration Tests
- [ ] Run `./tests/hooks/test-hook-integration.sh`
  - [ ] Health check endpoint (200)
  - [ ] Message analysis endpoint (200/201)
  - [ ] Conversation storage endpoint (200/201)
  - [ ] Invalid auth returns (401/403)
  - [ ] Invalid JSON returns (400/422)
- [ ] Total: 12 integration tests pass

### Full Test Suite
- [ ] Run `./tests/hooks/run-hook-tests.sh`
  - [ ] Unit tests pass
  - [ ] Integration tests pass
  - [ ] Coverage report generated
  - [ ] TypeScript type checking passes
  - [ ] ESLint passes
- [ ] Total execution time < 1 minute

### Coverage Verification
- [ ] Run `npm test -- --coverage tests/hooks/`
- [ ] Statement coverage > 95%
- [ ] Branch coverage > 90%
- [ ] Function coverage > 95%
- [ ] Line coverage > 95%

## Documentation Checklist

### Files Review
- [ ] Read `README.md` for quick start
- [ ] Review `TEST_RESULTS.md` for expected output
- [ ] Review `SUMMARY.md` for overview
- [ ] Check `QUICK_REFERENCE.md` for commands

### Verification
- [ ] All commands documented work
- [ ] Expected outputs match actual outputs
- [ ] Troubleshooting guide is accurate

## Quality Checklist

### Code Quality
- [ ] TypeScript compilation passes (`npx tsc --noEmit`)
- [ ] No ESLint errors (`npm run lint -- tests/hooks/`)
- [ ] No ESLint warnings (or acceptable)
- [ ] Code follows project conventions

### Test Quality
- [ ] All tests are deterministic
- [ ] No flaky tests
- [ ] Proper mocking implemented
- [ ] Edge cases covered

### Documentation Quality
- [ ] All file paths are absolute
- [ ] All commands are copy-pasteable
- [ ] Prerequisites clearly listed
- [ ] Troubleshooting section complete

## CI/CD Checklist

### GitHub Actions
- [ ] Tests run in CI/CD pipeline
- [ ] Environment variables configured
- [ ] All tests pass in CI/CD
- [ ] Coverage reports uploaded

### Deployment
- [ ] Tests run before deployment
- [ ] Integration tests use correct URLs
- [ ] Authentication configured correctly

## Maintenance Checklist

### Regular Checks
- [ ] Tests run weekly
- [ ] Dependencies updated monthly
- [ ] Coverage maintained >95%
- [ ] Documentation kept current

### After Code Changes
- [ ] Affected tests updated
- [ ] New tests added for new features
- [ ] Coverage verified
- [ ] Documentation updated

## Success Criteria

### All of the following must be true:
- [ ] Setup validation passes
- [ ] All 48 unit tests pass
- [ ] All 12 integration tests pass
- [ ] Code coverage >95%
- [ ] TypeScript type checking passes
- [ ] ESLint passes with no errors
- [ ] Total execution time <1 minute
- [ ] Documentation is complete and accurate

## Status

Date: _______________

Verified by: _______________

Result: [ ] PASS  [ ] FAIL

Notes:
_______________________________________________________________________
_______________________________________________________________________
_______________________________________________________________________

---

## Quick Commands

```bash
# Complete verification in one command
./tests/hooks/setup-validation.sh && ./tests/hooks/run-hook-tests.sh

# Individual checks
./tests/hooks/setup-validation.sh          # Setup
npm test -- tests/hooks/                   # Unit tests
./tests/hooks/test-hook-integration.sh     # Integration
npm test -- --coverage tests/hooks/        # Coverage
npx tsc --noEmit                          # Type check
npm run lint -- tests/hooks/               # Lint
```

## Next Steps After Verification

1. [ ] Commit test files to repository
2. [ ] Add to CI/CD pipeline
3. [ ] Run tests regularly
4. [ ] Monitor coverage trends
5. [ ] Update as hook system evolves
