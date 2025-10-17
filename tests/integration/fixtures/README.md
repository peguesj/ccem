# Test Fixtures

This directory contains test fixtures for integration tests.

## Structure

### configs/
Sample configuration files for testing:
- `minimal-config.json` - Minimal valid config
- `full-config.json` - Complete config with all features
- `conflicting-config-1.json` - First conflicting config
- `conflicting-config-2.json` - Second conflicting config (conflicts with #1)

### conversations/
Sample conversation histories for testing fork discovery:
- `simple-conversation.json` - Basic conversation flow
- `fork-conversation.json` - Conversation with multiple fork points

### backups/
Directory for test backup files (generated during tests)

## Usage

These fixtures are used by integration tests to ensure consistent test data across test runs.

```typescript
import minimalConfig from './fixtures/configs/minimal-config.json';
import fullConfig from './fixtures/configs/full-config.json';
```

## Notes

- All configs follow the CCEM schema
- Conversation files use ISO 8601 timestamps
- Backup files are generated during test execution
