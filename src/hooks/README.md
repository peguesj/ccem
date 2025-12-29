# CCEM Hook System

Modular hook system for integrating Claude Code with external monitoring and analytics services like VIKI and YJOS.

## Overview

The CCEM Hook System enables you to:
- **Analyze messages** before Claude Code processes them
- **Store conversations** for analytics and retrieval
- **Track file changes** and command executions
- **Monitor errors** and performance metrics
- **Submit data** to multiple servers (VIKI, YJOS, custom)

## Quick Start

### Initialize Hooks in a Project

```bash
# Initialize with VIKI template
ccem init-hooks --template viki

# Initialize with YJOS template
ccem init-hooks --template yjos

# Initialize with both VIKI and YJOS
ccem init-hooks --template combined

# Interactive mode
ccem init-hooks --interactive
```

This creates the following structure in your project:

```
.claude/
└── hooks/
    ├── servers.json              # Server configurations
    ├── registry.json             # Hook registry
    ├── utils/
    │   ├── submit.ts            # Server submission utility
    │   ├── retry.ts             # Retry logic
    │   └── types.ts             # Type definitions
    ├── pre-execution/
    │   └── analyze-message.ts   # Message analysis hook
    ├── post-execution/
    │   └── store-conversation.ts # Conversation storage hook
    └── README.md                # Hook documentation
```

### Configure Environment

Set up authentication tokens:

```bash
# For VIKI
export VIKI_API_TOKEN="your-viki-token"
export VIKI_URL="https://viki.yjos.lgtm.build"  # Optional, defaults to production

# For YJOS
export YJOS_API_KEY="your-yjos-api-key"
export YJOS_URL="https://yjos.lgtm.build"  # Optional
```

## Hook Types

### Pre-Execution Hooks

Run **before** Claude Code processes user input.

**Example: Message Analysis**

```typescript
// .claude/hooks/pre-execution/analyze-message.ts
import { HookContext } from '../utils/types.js';
import { submitToServers } from '../utils/submit.js';

export default async function handler(context: HookContext) {
  const analysis = analyzeMessage(context.userMessage);
  await submitToServers(servers, '/api/v1/hooks/messages/analyze', analysis);
  return { analysis };
}
```

### Post-Execution Hooks

Run **after** Claude Code completes a task.

**Example: Conversation Storage**

```typescript
// .claude/hooks/post-execution/store-conversation.ts
export default async function handler(context: HookContext) {
  const conversation = {
    user_message: context.userMessage,
    assistant_response: context.assistantResponse,
    tools_used: context.toolsUsed,
  };
  await submitToServers(servers, '/api/v1/hooks/conversations', conversation);
}
```

## Server Configuration

### servers.json

```json
{
  "servers": {
    "viki": {
      "name": "viki",
      "url": "https://viki.yjos.lgtm.build",
      "auth": {
        "type": "bearer",
        "tokenEnv": "VIKI_API_TOKEN"
      },
      "retry": {
        "maxAttempts": 3,
        "backoff": "exponential",
        "initialDelayMs": 1000
      },
      "timeoutMs": 5000,
      "enabled": true
    }
  }
}
```

### Authentication Types

- **`bearer`** - Bearer token authentication (`Authorization: Bearer <token>`)
- **`jwt`** - JWT token authentication (alias for bearer)
- **`api-key`** - API key authentication (`X-API-Key: <key>`)
- **`none`** - No authentication

### Retry Strategies

- **`exponential`** - Exponential backoff (1s, 2s, 4s, 8s, ...)
- **`linear`** - Linear backoff (1s, 2s, 3s, 4s, ...)

## Hook Registry

### registry.json

```json
{
  "hooks": {
    "pre-execution": [
      {
        "name": "analyze-message",
        "enabled": true,
        "handler": "./pre-execution/analyze-message.js",
        "servers": ["viki"],
        "async": true,
        "type": "pre-execution"
      }
    ],
    "post-execution": [
      {
        "name": "store-conversation",
        "enabled": true,
        "handler": "./post-execution/store-conversation.js",
        "servers": ["viki"],
        "async": true,
        "type": "post-execution"
      }
    ],
    "tools": [],
    "errors": []
  }
}
```

## VIKI Integration

### Available Endpoints

- `POST /api/v1/hooks/messages/analyze` - Submit message analysis
- `POST /api/v1/hooks/conversations` - Store conversations
- `GET /api/v1/hooks/health` - Health check

### Message Analysis Schema

```typescript
{
  message_id: string;
  project: string;
  user_message: string;
  detected_categories: string[];
  detected_keywords: string[];
  is_code_query: boolean;
  suggested_files: string[];
  suggested_commands: string[];
  timestamp: string;
}
```

### Conversation Schema

```typescript
{
  conversation_id: string;
  project: string;
  user_message: string;
  assistant_response: string;
  tools_used: string[];
  timestamp: string;
}
```

## YJOS Integration

### Available Endpoints

- `POST /api/v1/hooks/audit/file-changes` - Track file modifications
- `POST /api/v1/hooks/audit/commands` - Track command executions
- `POST /api/v1/hooks/errors` - Track errors
- `POST /api/v1/hooks/metrics` - Submit performance metrics
- `GET /api/v1/hooks/health` - Health check

## Custom Hooks

### Creating a Custom Hook

```typescript
// .claude/hooks/custom/my-hook.ts
import { HookContext } from '../utils/types.js';
import { submitToServer } from '../utils/submit.js';

export default async function handler(context: HookContext) {
  // Your custom logic
  const data = {
    message: context.userMessage,
    timestamp: Date.now(),
  };

  // Submit to your server
  const server = {
    name: 'custom',
    url: process.env.CUSTOM_SERVER_URL || 'https://my-server.com',
    auth: { type: 'api-key', tokenEnv: 'CUSTOM_API_KEY' },
    enabled: true,
  };

  await submitToServer(server, '/api/hooks/ingest', data);

  return { processed: true };
}
```

### Register Custom Hook

Add to `registry.json`:

```json
{
  "hooks": {
    "pre-execution": [
      {
        "name": "my-custom-hook",
        "enabled": true,
        "handler": "./custom/my-hook.js",
        "servers": ["custom"],
        "async": true,
        "type": "pre-execution"
      }
    ]
  }
}
```

## Testing

### Test Hook Submission

```bash
# Test message analysis hook
node .claude/hooks/pre-execution/analyze-message.js

# Test with dry-run (no actual submission)
HOOK_DRY_RUN=true node .claude/hooks/post-execution/store-conversation.js
```

### Health Check

```bash
# Check VIKI connectivity
curl https://viki.yjos.lgtm.build/api/v1/hooks/health

# Check YJOS connectivity
curl https://yjos.lgtm.build/api/v1/hooks/health
```

## Troubleshooting

### Hook Not Executing

1. Check `registry.json` - ensure `enabled: true`
2. Verify server configuration in `servers.json`
3. Check environment variables are set
4. Review Claude Code logs for errors

### Authentication Failures

1. Verify token/API key in environment variable
2. Check token hasn't expired
3. Confirm correct authentication type
4. Test with `curl` directly

### Timeout Errors

1. Increase `timeoutMs` in server config
2. Check network connectivity
3. Verify server is responsive with health check

### Submission Failures

1. Check retry configuration
2. Review server logs for errors
3. Validate payload schema matches server expectations
4. Test with reduced payload size

## Best Practices

1. **Use Async Hooks** - Set `async: true` for non-blocking execution
2. **Configure Retries** - Use exponential backoff for resilience
3. **Set Timeouts** - Prevent hanging on slow servers
4. **Validate Tokens** - Ensure auth tokens are properly configured
5. **Monitor Logs** - Track submission success/failure rates
6. **Test Locally** - Use dry-run mode before production
7. **Handle Errors** - Implement error hooks for failure tracking

## Security

- **Never commit tokens** - Use environment variables only
- **Use HTTPS** - All production servers should use TLS
- **Rotate keys** - Regularly rotate API keys and tokens
- **Minimize data** - Only submit necessary information
- **Audit access** - Monitor hook submission logs

## Examples

### Example: Track File Changes (YJOS)

```typescript
// .claude/hooks/tools/track-file-changes.ts
export default async function handler(context: ToolHookContext) {
  if (context.tool === 'Write' || context.tool === 'Edit') {
    const change = {
      file_path: context.params.file_path,
      operation: context.tool.toLowerCase(),
      tool: context.tool,
      timestamp: new Date().toISOString(),
    };

    await submitToServers(servers, '/api/v1/hooks/audit/file-changes', change);
  }
}
```

### Example: Error Tracking (YJOS)

```typescript
// .claude/hooks/errors/track-errors.ts
export default async function handler(context: ErrorHookContext) {
  const error = {
    error_type: context.error.name,
    error_message: context.error.message,
    stack_trace: context.error.stack,
    context: context.executionContext,
    timestamp: new Date().toISOString(),
  };

  await submitToServers(servers, '/api/v1/hooks/errors', error);
}
```

## Support

- [CCEM Documentation](../docs/README.md)
- [Hook Architecture](../docs/HOOK_SYSTEM_ARCHITECTURE.md)
- [GitHub Issues](https://github.com/peguesj/ccem/issues)

---

**Version**: 1.0.0
**Last Updated**: 2025-12-28
