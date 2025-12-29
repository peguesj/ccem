# CCEM Hook System Architecture

## Overview

The CCEM Hook System provides a modular, extensible framework for integrating Claude Code with external monitoring, analytics, and data collection services like VIKI (AI conversation storage) and YJOS (unified portal).

## Design Goals

1. **Modularity** - Hooks should be composable and reusable across projects
2. **Server-Agnostic** - Support submission to multiple backend services (VIKI, YJOS, custom)
3. **Easy Initialization** - Simple CLI command to set up hooks in any project
4. **Type-Safe** - Full TypeScript support with Zod validation
5. **Secure** - Safe handling of credentials, rate limiting, retry logic
6. **Extensible** - Plugin architecture for custom hook handlers

## Hook Types

### 1. Pre-Execution Hooks
Execute before Claude Code processes user input.

**Use Cases:**
- Message analysis and categorization
- Context extraction
- Intent detection
- Project state capture

**Example:**
```typescript
// .claude/hooks/pre-execution/analyze-message.ts
export async function preExecutionHook(context: HookContext) {
  const analysis = analyzeMessage(context.userMessage);
  await submitToServer('viki', '/api/v1/messages/analyze', analysis);
  return { analysis };
}
```

### 2. Post-Execution Hooks
Execute after Claude Code completes a task.

**Use Cases:**
- Conversation storage
- Performance metrics
- Result analysis
- Audit logging

**Example:**
```typescript
// .claude/hooks/post-execution/store-conversation.ts
export async function postExecutionHook(context: HookContext) {
  const conversation = {
    timestamp: Date.now(),
    input: context.userMessage,
    output: context.assistantResponse,
    tools_used: context.toolsUsed,
  };
  await submitToServer('viki', '/api/v1/conversations', conversation);
}
```

### 3. Tool-Specific Hooks
Execute around specific tool invocations (Read, Write, Bash, etc.).

**Use Cases:**
- File modification tracking
- Command execution logging
- Security auditing

**Example:**
```typescript
// .claude/hooks/tools/track-file-changes.ts
export async function toolHook(context: ToolHookContext) {
  if (context.tool === 'Write' || context.tool === 'Edit') {
    await submitToServer('yjos', '/api/v1/audit/file-changes', {
      file: context.params.file_path,
      timestamp: Date.now(),
      project: context.project,
    });
  }
}
```

### 4. Error Hooks
Execute when errors occur.

**Use Cases:**
- Error tracking
- Failure analysis
- Alerting

**Example:**
```typescript
// .claude/hooks/errors/track-errors.ts
export async function errorHook(context: ErrorHookContext) {
  await submitToServer('yjos', '/api/v1/errors', {
    error: context.error.message,
    stack: context.error.stack,
    context: context.executionContext,
  });
}
```

## Hook Configuration

### Server Configuration

Hooks submit data to configured servers defined in `.claude/hooks/servers.json`:

```json
{
  "servers": {
    "viki": {
      "url": "https://viki.yjos.lgtm.build",
      "auth": {
        "type": "bearer",
        "token_env": "VIKI_API_TOKEN"
      },
      "retry": {
        "max_attempts": 3,
        "backoff": "exponential"
      },
      "timeout_ms": 5000
    },
    "yjos": {
      "url": "https://yjos.lgtm.build",
      "auth": {
        "type": "jwt",
        "token_env": "YJOS_JWT_TOKEN"
      },
      "retry": {
        "max_attempts": 3,
        "backoff": "exponential"
      },
      "timeout_ms": 5000
    },
    "custom": {
      "url": "${CUSTOM_HOOK_SERVER_URL}",
      "auth": {
        "type": "none"
      }
    }
  }
}
```

### Hook Registry

Hooks are registered in `.claude/hooks/registry.json`:

```json
{
  "hooks": {
    "pre-execution": [
      {
        "name": "analyze-message",
        "enabled": true,
        "handler": "./pre-execution/analyze-message.ts",
        "servers": ["viki"],
        "async": true
      }
    ],
    "post-execution": [
      {
        "name": "store-conversation",
        "enabled": true,
        "handler": "./post-execution/store-conversation.ts",
        "servers": ["viki"],
        "async": true
      }
    ],
    "tools": [
      {
        "name": "track-file-changes",
        "enabled": true,
        "handler": "./tools/track-file-changes.ts",
        "tools": ["Write", "Edit"],
        "servers": ["yjos"],
        "async": true
      }
    ],
    "errors": [
      {
        "name": "track-errors",
        "enabled": true,
        "handler": "./errors/track-errors.ts",
        "servers": ["yjos"],
        "async": false
      }
    ]
  }
}
```

## Server-Side Endpoints

### VIKI Endpoints

VIKI provides conversation storage and analytics endpoints:

```
POST /api/v1/messages/analyze
POST /api/v1/conversations
POST /api/v1/conversations/search
GET  /api/v1/conversations/{id}
POST /api/v1/embeddings
```

### YJOS Endpoints

YJOS provides audit logging and monitoring endpoints:

```
POST /api/v1/audit/file-changes
POST /api/v1/audit/commands
POST /api/v1/errors
POST /api/v1/metrics
GET  /api/v1/projects/{id}/audit-log
```

## Implementation Plan

### Phase 1: Core Infrastructure (Current)
- [ ] Hook template system in CCEM
- [ ] Hook submission utilities with retry/backoff
- [ ] Server configuration schema
- [ ] Hook registry schema

### Phase 2: CLI Integration
- [ ] `ccem init-hooks` command
- [ ] Hook template selection (viki, yjos, custom)
- [ ] Interactive configuration wizard
- [ ] Environment variable setup

### Phase 3: Server Endpoints
- [ ] VIKI conversation ingestion endpoint
- [ ] VIKI message analysis endpoint
- [ ] YJOS audit logging endpoint
- [ ] YJOS error tracking endpoint

### Phase 4: Advanced Features
- [ ] Hook orchestration (sequencing, dependencies)
- [ ] Local caching with offline queue
- [ ] Hook performance monitoring
- [ ] Security scanning for hook code

## Hook Template Structure

```
.claude/
└── hooks/
    ├── servers.json              # Server configurations
    ├── registry.json             # Hook registry
    ├── utils/
    │   ├── submit.ts            # Server submission utility
    │   ├── retry.ts             # Retry logic
    │   └── cache.ts             # Offline queue
    ├── pre-execution/
    │   ├── analyze-message.ts
    │   └── extract-context.ts
    ├── post-execution/
    │   ├── store-conversation.ts
    │   └── track-metrics.ts
    ├── tools/
    │   ├── track-file-changes.ts
    │   └── log-commands.ts
    └── errors/
        └── track-errors.ts
```

## CCEM CLI Usage

### Initialize Hooks

```bash
# Initialize with VIKI template
ccem init-hooks --template viki

# Initialize with YJOS template
ccem init-hooks --template yjos

# Initialize with both
ccem init-hooks --template viki,yjos

# Initialize with custom server
ccem init-hooks --template custom --server-url https://my-server.com

# Interactive wizard
ccem init-hooks --interactive
```

### Manage Hooks

```bash
# List registered hooks
ccem hooks list

# Enable/disable specific hook
ccem hooks enable analyze-message
ccem hooks disable track-file-changes

# Test hook submission
ccem hooks test analyze-message --dry-run

# View hook logs
ccem hooks logs --tail 50

# Update server configuration
ccem hooks config servers --edit
```

## Security Considerations

1. **Credential Management**
   - Never store tokens in config files
   - Use environment variables for secrets
   - Support for secret management services (AWS Secrets Manager, Azure Key Vault)

2. **Rate Limiting**
   - Client-side rate limiting to prevent overwhelming servers
   - Exponential backoff on failures
   - Configurable submission intervals

3. **Data Privacy**
   - Configurable PII filtering
   - Opt-in for sensitive data submission
   - Local-only mode for testing

4. **Code Validation**
   - TypeScript type checking for hooks
   - ESLint validation
   - Security scanning for hook code

## Performance Considerations

1. **Asynchronous Execution**
   - Non-blocking hook execution
   - Parallel submissions to multiple servers
   - Timeout management

2. **Caching & Queuing**
   - Local cache for offline operation
   - Queue-based submission with batching
   - Deduplication of identical submissions

3. **Resource Limits**
   - Max payload size limits
   - Connection pooling
   - Memory-efficient streaming for large payloads

## Extensibility

### Custom Hook Handlers

Users can create custom hook handlers:

```typescript
// .claude/hooks/custom/my-handler.ts
import { HookContext, HookHandler } from '@ccem/hooks';

export const handler: HookHandler = async (context: HookContext) => {
  // Custom logic
  const result = await processMessage(context.userMessage);

  // Submit to custom endpoint
  await context.submit('custom', '/api/my-endpoint', result);

  return { processed: true };
};
```

### Plugin System

Future support for installable hook plugins:

```bash
# Install hook plugin from npm
ccem hooks install @ccem-plugins/analytics

# Install from git
ccem hooks install git+https://github.com/user/hook-plugin.git
```

## Testing

### Unit Tests
- Hook handler logic
- Submission utilities
- Retry mechanisms
- Schema validation

### Integration Tests
- End-to-end hook execution
- Server communication
- Error handling
- Offline queue behavior

### E2E Tests
- Full Claude Code integration
- Multi-hook orchestration
- Real server submissions (staging)

## Monitoring & Observability

1. **Hook Execution Metrics**
   - Execution time per hook
   - Success/failure rates
   - Submission latency

2. **Health Checks**
   - Server availability monitoring
   - Credential validation
   - Queue depth monitoring

3. **Alerting**
   - Hook failure alerts
   - Server unavailability alerts
   - Queue overflow warnings

## Version Compatibility

- **CCEM**: v1.0.0+
- **Claude Code**: v2.0.10+
- **Node.js**: 18.0.0+
- **TypeScript**: 5.3+

## Migration Path

For existing projects with custom hooks:

```bash
# Analyze existing hooks
ccem hooks analyze --path ./.claude/hooks

# Migrate to new format
ccem hooks migrate --backup

# Validate migrated hooks
ccem hooks validate
```

---

**Status**: Architecture Design Complete
**Next Steps**: Begin Phase 1 implementation
**Timeline**: 2-3 weeks for full implementation
