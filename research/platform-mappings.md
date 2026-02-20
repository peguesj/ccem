# Platform-Specific Mapping Specifications

This document defines how to map conversations from each AI coding assistant platform to the Unified Conversation Schema.

## Table of Contents

1. [Claude Code](#claude-code)
2. [GitHub Copilot](#github-copilot)
3. [ChatGPT](#chatgpt)
4. [Continue.dev](#continuedev)
5. [Roo Code](#roo-code)
6. [Azure OpenAI](#azure-openai)
7. [Common Mapping Patterns](#common-mapping-patterns)

---

## Claude Code

### Source Format
Claude Code stores conversations in JSONL format at `~/.claude/projects/<project>/<session-id>.jsonl`

### Field Mappings

| Unified Schema Field | Claude Code Source | Transformation Notes |
|---------------------|-------------------|---------------------|
| `schema_version` | Static: "1.0.0" | Added during transformation |
| `conversation_id` | `sessionId` | Direct mapping |
| `platform.name` | Static: "claude_code" | Added during transformation |
| `platform.version` | `version` | Direct mapping |
| `platform.model` | Extract from API response | May need to query API or infer from timestamps |
| `session.session_id` | `sessionId` | Same as conversation_id |
| `session.parent_conversation_id` | `parentUuid` | Maps to parent if not null |
| `session.is_sidechain` | `isSidechain` | Direct mapping (boolean) |
| `context.workspace.path` | `cwd` | Direct mapping |
| `context.workspace.git_branch` | `gitBranch` | Direct mapping |
| `created_at` | First message `timestamp` | Use earliest timestamp |
| `updated_at` | Last message `timestamp` | Use latest timestamp |
| `messages[].message_id` | `uuid` | Direct mapping |
| `messages[].parent_message_id` | `parentUuid` | Maps to previous message |
| `messages[].role` | `message.role` | Direct mapping |
| `messages[].timestamp` | `timestamp` | Direct mapping (ISO 8601) |
| `messages[].content` | `message.content[]` | Array mapping (see below) |
| `messages[].tokens` | `message.usage` | Object mapping (see below) |
| `messages[].metadata.user_type` | `userType` | Direct mapping |
| `summaries[].text` | `summary` (where `type="summary"`) | Extract from summary entries |

### Content Block Mapping

Claude Code content blocks map directly with minor adjustments:

```javascript
// Text content
{type: "text", text: "..."} → {type: "text", text: "..."}

// Tool use
{
  type: "tool_use",
  id: "...",
  name: "...",
  input: {...}
} → {
  type: "tool_use",
  id: "...",
  name: "...",
  input: {...}
}

// Tool result
{
  type: "tool_result",
  tool_use_id: "...",
  content: "..." | [{type: "text", text: "..."}]
} → {
  type: "tool_result",
  tool_use_id: "...",
  content: "..." | [{type: "text", text: "..."}],
  is_error: false  // Infer from content or add explicit field
}
```

### Token Usage Mapping

```javascript
// Claude Code format
{
  "input_tokens": 4,
  "output_tokens": 1,
  "cache_creation_input_tokens": 88240,
  "cache_read_input_tokens": 0,
  "cache_creation": {
    "ephemeral_5m_input_tokens": 88240,
    "ephemeral_1h_input_tokens": 0
  },
  "service_tier": "standard"
}

// Maps directly to unified schema tokens object
```

### Example Transformation

```typescript
function transformClaudeCodeMessage(claudeMessage: ClaudeCodeMessage): UnifiedMessage {
  return {
    message_id: claudeMessage.uuid,
    parent_message_id: claudeMessage.parentUuid,
    role: claudeMessage.message.role,
    timestamp: claudeMessage.timestamp,
    content: claudeMessage.message.content, // Direct array copy
    tokens: claudeMessage.message.usage,
    metadata: {
      user_type: claudeMessage.userType,
      model_override: claudeMessage.message.model
    }
  };
}
```

---

## GitHub Copilot

### Source Format
GitHub Copilot primarily uses telemetry APIs and doesn't expose conversation logs directly. Data must be collected via:
- Metrics API (`/orgs/{org}/copilot/metrics`)
- IDE extension telemetry
- VS Code extension logs

### Field Mappings

| Unified Schema Field | GitHub Copilot Source | Transformation Notes |
|---------------------|---------------------|---------------------|
| `schema_version` | Static: "1.0.0" | Added during transformation |
| `conversation_id` | Generate UUID | Create from session/timestamp |
| `platform.name` | Static: "github_copilot" | Added during transformation |
| `platform.version` | Extension version | From telemetry metadata |
| `platform.model` | Static: "copilot-codex" | Model identifier |
| `context.environment.editor` | IDE identifier | From telemetry (vscode, jetbrains, etc.) |
| `messages[].role` | Infer from event type | "user" for prompts, "assistant" for completions |
| `messages[].content` | Completion/prompt text | Reconstruct from telemetry |
| `metrics.total_tokens` | Not directly available | May need to estimate |

### Challenges
- **Limited conversation history**: Copilot focuses on code completions, not full conversations
- **Privacy restrictions**: Full prompt/response content may not be logged
- **Telemetry focus**: Data emphasizes metrics over conversational content

### Mapping Strategy
1. Treat each completion request as a mini-conversation
2. Group completions by file/time window to create conversation threads
3. Infer context from file contents and cursor position

### Example Transformation

```typescript
function transformCopilotCompletion(event: CopilotEvent): UnifiedConversation {
  return {
    schema_version: "1.0.0",
    conversation_id: generateUUID(event.timestamp, event.file),
    platform: {
      name: "github_copilot",
      version: event.extensionVersion,
      model: "copilot-codex"
    },
    messages: [
      {
        message_id: generateUUID(event.timestamp, "prompt"),
        role: "user",
        timestamp: event.timestamp,
        content: [{
          type: "code",
          code: event.promptContext,
          language: event.language,
          file_path: event.file
        }]
      },
      {
        message_id: generateUUID(event.timestamp, "completion"),
        role: "assistant",
        timestamp: event.timestamp,
        content: [{
          type: "code",
          code: event.completion,
          language: event.language
        }],
        metadata: {
          accepted: event.accepted,
          completion_index: event.completionIndex
        }
      }
    ]
  };
}
```

---

## ChatGPT

### Source Format
ChatGPT exports conversations in a `conversations.json` file delivered via ZIP archive.

### Field Mappings

| Unified Schema Field | ChatGPT Source | Transformation Notes |
|---------------------|---------------------|---------------------|
| `schema_version` | Static: "1.0.0" | Added during transformation |
| `conversation_id` | Conversation ID | From export structure |
| `platform.name` | Static: "chatgpt" | Added during transformation |
| `platform.model` | `model_slug` or infer | May be in metadata |
| `created_at` | `create_time` | Unix timestamp → ISO 8601 |
| `updated_at` | `update_time` | Unix timestamp → ISO 8601 |
| `messages[].message_id` | Message ID | From conversation structure |
| `messages[].role` | Message role | user/assistant/system |
| `messages[].content` | Message content | Parse content structure |

### Content Structure

ChatGPT exports have varied content structures:

```javascript
// Text message
{
  "role": "user",
  "content": {
    "content_type": "text",
    "parts": ["user message text"]
  }
}

// Transform to:
{
  "role": "user",
  "content": [{
    "type": "text",
    "text": "user message text"
  }]
}

// Multi-modal message (with images)
{
  "role": "user",
  "content": {
    "content_type": "multimodal_text",
    "parts": [
      {"asset_pointer": "file-service://...", "content_type": "image_asset_pointer"},
      "Describe this image"
    ]
  }
}

// Transform to:
{
  "role": "user",
  "content": [
    {
      "type": "image",
      "source": {
        "type": "url",
        "data": "file-service://..."
      }
    },
    {
      "type": "text",
      "text": "Describe this image"
    }
  ]
}
```

### Example Transformation

```typescript
function transformChatGPTMessage(chatgptMessage: any): UnifiedMessage {
  const content = [];

  if (Array.isArray(chatgptMessage.content.parts)) {
    for (const part of chatgptMessage.content.parts) {
      if (typeof part === "string") {
        content.push({type: "text", text: part});
      } else if (part.content_type === "image_asset_pointer") {
        content.push({
          type: "image",
          source: {
            type: "url",
            data: part.asset_pointer
          }
        });
      }
    }
  }

  return {
    message_id: chatgptMessage.id,
    role: chatgptMessage.author.role,
    timestamp: new Date(chatgptMessage.create_time * 1000).toISOString(),
    content: content
  };
}
```

---

## Continue.dev

### Source Format
Continue.dev uses a `config.yaml` for configuration and likely stores conversation history in a local database or cache.

### Field Mappings

| Unified Schema Field | Continue.dev Source | Transformation Notes |
|---------------------|---------------------|---------------------|
| `schema_version` | Static: "1.0.0" | Added during transformation |
| `conversation_id` | Session/thread ID | From internal storage |
| `platform.name` | Static: "continue_dev" | Added during transformation |
| `platform.version` | Extension version | From config or metadata |
| `platform.model` | `models[].model` | From config.yaml |
| `context.environment.editor` | IDE context | vscode, jetbrains, etc. |
| `messages[].role` | Message role | user/assistant/system |

### Chat Template Handling

Continue.dev uses chat templates (llama2, alpaca, chatml, etc.) that need to be parsed:

```javascript
// ChatML format example
"<|im_start|>user\nHow are you<|im_end|>\n<|im_start|>assistant\nI am doing well!<|im_end|>"

// Transform to structured messages:
[
  {
    message_id: generateUUID(),
    role: "user",
    content: [{type: "text", text: "How are you"}]
  },
  {
    message_id: generateUUID(),
    role: "assistant",
    content: [{type: "text", text: "I am doing well!"}]
  }
]
```

### Context Providers

Continue.dev has rich context providers that should be captured:

```typescript
function transformContinueContext(context: ContinueContext): UnifiedContext {
  return {
    workspace: {
      path: context.workspaceDir,
      git_branch: context.gitBranch
    },
    custom: {
      context_providers: context.providers.map(p => ({
        name: p.name,
        query: p.query
      })),
      codebase_context: context.codebaseContext
    }
  };
}
```

---

## Roo Code

### Source Format
Roo Code uses structured prompts with system messages, modes, and custom instructions.

### Field Mappings

| Unified Schema Field | Roo Code Source | Transformation Notes |
|---------------------|---------------------|---------------------|
| `schema_version` | Static: "1.0.0" | Added during transformation |
| `conversation_id` | Session ID | Generate or extract from logs |
| `platform.name` | Static: "roo_code" | Added during transformation |
| `platform.metadata.mode` | Active mode | architect, code, ask, etc. |
| `context.custom.custom_instructions` | Custom instructions | Global + mode-specific |
| `messages[].role` | Message type | System/User/Assistant/Tool |

### System Prompt Handling

Roo Code generates dynamic system prompts that should be captured:

```typescript
function transformRooSystemPrompt(rooPrompt: RooPrompt): UnifiedMessage {
  return {
    message_id: generateUUID(),
    role: "system",
    timestamp: rooPrompt.timestamp,
    content: [{
      type: "text",
      text: [
        rooPrompt.roleDefinition,
        rooPrompt.toolDescriptions,
        rooPrompt.customInstructions
      ].join("\n\n")
    }],
    metadata: {
      mode: rooPrompt.mode,
      capabilities: rooPrompt.capabilities,
      system_info: rooPrompt.systemInfo
    }
  };
}
```

### Mode Tracking

Roo Code modes should be preserved in metadata:

```javascript
{
  "platform": {
    "metadata": {
      "active_mode": "architect",
      "available_modes": ["architect", "code", "ask", "debug"],
      "mode_persistence": true
    }
  }
}
```

---

## Azure OpenAI

### Source Format
Azure OpenAI logs are typically collected through:
- Azure Diagnostics (AzureDiagnostics table)
- API Management (APIM) gateway logs
- Custom logging implementations

### Field Mappings

| Unified Schema Field | Azure OpenAI Source | Transformation Notes |
|---------------------|---------------------|---------------------|
| `schema_version` | Static: "1.0.0" | Added during transformation |
| `conversation_id` | `apim-request-id` or custom | Generate from correlation ID |
| `platform.name` | Static: "azure_openai" | Added during transformation |
| `platform.model` | Deployment name | From request metadata |
| `messages[].role` | Request body `messages[].role` | Standard OpenAI format |
| `messages[].content` | Request body `messages[].content` | Standard OpenAI format |
| `messages[].tokens` | Response usage | From response body |
| `metadata.duration_ms` | `DurationMs` | From diagnostic logs |

### APIM Gateway Integration

When using APIM for logging:

```typescript
function transformAzureAPIMLog(apimLog: APIMLog): UnifiedConversation {
  const request = JSON.parse(apimLog.requestBody);
  const response = JSON.parse(apimLog.responseBody);

  return {
    schema_version: "1.0.0",
    conversation_id: apimLog.requestId,
    platform: {
      name: "azure_openai",
      version: apimLog.apiVersion,
      model: apimLog.deploymentName
    },
    messages: [
      ...request.messages.map((msg: any, idx: number) => ({
        message_id: `${apimLog.requestId}-${idx}`,
        role: msg.role,
        timestamp: apimLog.timestamp,
        content: Array.isArray(msg.content)
          ? msg.content
          : [{type: "text", text: msg.content}]
      })),
      {
        message_id: `${apimLog.requestId}-response`,
        role: "assistant",
        timestamp: apimLog.responseTimestamp,
        content: [{
          type: "text",
          text: response.choices[0].message.content
        }],
        tokens: response.usage
      }
    ],
    metrics: {
      duration_ms: apimLog.durationMs
    }
  };
}
```

---

## Common Mapping Patterns

### UUID Generation

For platforms that don't provide UUIDs:

```typescript
import { v5 as uuidv5 } from 'uuid';

const NAMESPACE_UUID = '6ba7b810-9dad-11d1-80b4-00c04fd430c8'; // Example namespace

function generateDeterministicUUID(input: string): string {
  return uuidv5(input, NAMESPACE_UUID);
}

// Usage
const conversationId = generateDeterministicUUID(
  `${platform}-${timestamp}-${userIdentifier}`
);
```

### Timestamp Normalization

Convert all timestamps to ISO 8601:

```typescript
function normalizeTimestamp(timestamp: string | number | Date): string {
  if (typeof timestamp === 'number') {
    // Unix timestamp (seconds)
    if (timestamp < 10000000000) {
      return new Date(timestamp * 1000).toISOString();
    }
    // Unix timestamp (milliseconds)
    return new Date(timestamp).toISOString();
  }
  if (timestamp instanceof Date) {
    return timestamp.toISOString();
  }
  // Already ISO 8601 string
  return new Date(timestamp).toISOString();
}
```

### Content Array Standardization

Ensure all content is in array format:

```typescript
function normalizeContent(content: any): ContentBlock[] {
  // Already an array
  if (Array.isArray(content)) {
    return content;
  }

  // Simple string
  if (typeof content === 'string') {
    return [{type: 'text', text: content}];
  }

  // Object with content field
  if (content.content) {
    return normalizeContent(content.content);
  }

  // Single content block
  if (content.type) {
    return [content];
  }

  throw new Error('Unsupported content format');
}
```

### Token Cost Calculation

Calculate costs when not provided:

```typescript
interface PricingModel {
  input: number;  // per 1M tokens
  output: number; // per 1M tokens
  cacheRead: number;
  cacheWrite: number;
}

const PRICING: Record<string, PricingModel> = {
  'claude-sonnet-4-5': {
    input: 3.00,
    output: 15.00,
    cacheRead: 0.30,
    cacheWrite: 3.75
  },
  'gpt-4': {
    input: 30.00,
    output: 60.00,
    cacheRead: 0,
    cacheWrite: 0
  }
};

function calculateCost(tokens: TokenUsage, model: string): number {
  const pricing = PRICING[model];
  if (!pricing) return 0;

  let cost = 0;
  cost += (tokens.input_tokens / 1_000_000) * pricing.input;
  cost += (tokens.output_tokens / 1_000_000) * pricing.output;
  cost += ((tokens.cache_read_input_tokens || 0) / 1_000_000) * pricing.cacheRead;
  cost += ((tokens.cache_creation_input_tokens || 0) / 1_000_000) * pricing.cacheWrite;

  return cost;
}
```

### Deduplication Strategy

Use content hashing for deduplication:

```typescript
import crypto from 'crypto';

function generateMessageHash(message: UnifiedMessage): string {
  const hashInput = {
    role: message.role,
    content: message.content,
    timestamp: message.timestamp
  };

  return crypto
    .createHash('sha256')
    .update(JSON.stringify(hashInput))
    .digest('hex');
}

function isDuplicate(
  msg1: UnifiedMessage,
  msg2: UnifiedMessage,
  windowMs: number = 5000
): boolean {
  // Check if messages are within time window
  const timeDiff = Math.abs(
    new Date(msg1.timestamp).getTime() -
    new Date(msg2.timestamp).getTime()
  );

  if (timeDiff > windowMs) return false;

  // Check content hash
  return generateMessageHash(msg1) === generateMessageHash(msg2);
}
```

---

## Validation Rules

### Required Fields per Platform

| Platform | Minimum Required Fields |
|----------|------------------------|
| Claude Code | sessionId, timestamp, message.role, message.content |
| GitHub Copilot | timestamp, completion text, file path |
| ChatGPT | conversation ID, create_time, messages |
| Continue.dev | session ID, messages, model config |
| Roo Code | session ID, mode, messages |
| Azure OpenAI | request ID, deployment, messages |

### Data Quality Checks

```typescript
interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

function validateConversation(conv: UnifiedConversation): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Required fields
  if (!conv.conversation_id) errors.push('Missing conversation_id');
  if (!conv.platform.name) errors.push('Missing platform name');
  if (!conv.messages?.length) errors.push('No messages found');

  // Timestamp validation
  conv.messages?.forEach((msg, idx) => {
    if (!msg.timestamp) {
      errors.push(`Message ${idx} missing timestamp`);
    }
    if (msg.timestamp > new Date().toISOString()) {
      warnings.push(`Message ${idx} has future timestamp`);
    }
  });

  // Content validation
  conv.messages?.forEach((msg, idx) => {
    if (!msg.content?.length) {
      errors.push(`Message ${idx} has empty content`);
    }
  });

  // Role validation
  const validRoles = ['user', 'assistant', 'system', 'tool', 'function'];
  conv.messages?.forEach((msg, idx) => {
    if (!validRoles.includes(msg.role)) {
      errors.push(`Message ${idx} has invalid role: ${msg.role}`);
    }
  });

  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}
```

---

## Extension Points

Platforms can add custom data via:

1. **platform.metadata**: Platform-specific configuration
2. **context.custom**: Custom context data
3. **message.metadata**: Per-message custom fields
4. **additionalProperties**: Any unmapped fields

Example:

```json
{
  "platform": {
    "metadata": {
      "custom_field": "value",
      "integration_id": "xyz-123"
    }
  },
  "context": {
    "custom": {
      "project_type": "typescript",
      "framework": "nextjs",
      "dependencies": ["react", "prisma"]
    }
  }
}
```
