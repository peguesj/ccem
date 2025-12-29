# Validation Requirements and Extension Points

## Table of Contents

1. [Schema Validation](#schema-validation)
2. [Data Quality Rules](#data-quality-rules)
3. [Business Logic Validation](#business-logic-validation)
4. [Extension Points](#extension-points)
5. [Custom Validators](#custom-validators)
6. [Platform-Specific Extensions](#platform-specific-extensions)
7. [API Validation](#api-validation)

---

## Schema Validation

### JSON Schema Validator

Use [Ajv](https://ajv.js.org/) or similar for strict JSON Schema validation:

```typescript
import Ajv from 'ajv';
import addFormats from 'ajv-formats';

class SchemaValidator {
  private ajv: Ajv;
  private schema: object;

  constructor(schemaPath: string) {
    this.ajv = new Ajv({
      allErrors: true,
      verbose: true,
      strict: true,
      validateFormats: true
    });

    addFormats(this.ajv);
    this.schema = require(schemaPath);
    this.ajv.compile(this.schema);
  }

  validate(data: any): ValidationResult {
    const valid = this.ajv.validate(this.schema, data);

    if (!valid) {
      return {
        valid: false,
        errors: this.ajv.errors?.map(err => ({
          path: err.instancePath,
          message: err.message || 'Validation error',
          keyword: err.keyword,
          params: err.params
        })) || []
      };
    }

    return { valid: true, errors: [] };
  }

  validatePartial(data: any, schemaPath: string): ValidationResult {
    // Validate against a specific schema definition
    const subSchema = this.resolveSchemaPath(schemaPath);
    const valid = this.ajv.validate(subSchema, data);

    return {
      valid,
      errors: this.ajv.errors?.map(this.formatError) || []
    };
  }

  private resolveSchemaPath(path: string): object {
    // Navigate to nested schema definition
    // e.g., "#/definitions/message" → schema.definitions.message
    const parts = path.replace('#/', '').split('/');
    let current: any = this.schema;

    for (const part of parts) {
      current = current[part];
      if (!current) {
        throw new Error(`Schema path not found: ${path}`);
      }
    }

    return current;
  }
}
```

### Validation Levels

```typescript
enum ValidationLevel {
  STRICT = 'strict',       // Must pass all validations
  STANDARD = 'standard',   // Must pass required fields + critical rules
  LENIENT = 'lenient'      // Only validate required fields
}

interface ValidationConfig {
  level: ValidationLevel;
  allowAdditionalProperties: boolean;
  coerceTypes: boolean;
  removeAdditional: boolean;
}

const VALIDATION_PROFILES: Record<ValidationLevel, ValidationConfig> = {
  [ValidationLevel.STRICT]: {
    level: ValidationLevel.STRICT,
    allowAdditionalProperties: false,
    coerceTypes: false,
    removeAdditional: false
  },
  [ValidationLevel.STANDARD]: {
    level: ValidationLevel.STANDARD,
    allowAdditionalProperties: true,
    coerceTypes: true,
    removeAdditional: false
  },
  [ValidationLevel.LENIENT]: {
    level: ValidationLevel.LENIENT,
    allowAdditionalProperties: true,
    coerceTypes: true,
    removeAdditional: true
  }
};
```

---

## Data Quality Rules

### Rule Engine

```typescript
interface ValidationRule {
  name: string;
  level: 'error' | 'warning';
  validate(conversation: UnifiedConversation): RuleResult;
}

interface RuleResult {
  passed: boolean;
  message?: string;
  details?: any;
}

class DataQualityValidator {
  private rules: ValidationRule[] = [];

  addRule(rule: ValidationRule): void {
    this.rules.push(rule);
  }

  validate(conversation: UnifiedConversation): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationError[] = [];

    for (const rule of this.rules) {
      const result = rule.validate(conversation);

      if (!result.passed) {
        const error = {
          rule: rule.name,
          message: result.message || `Rule ${rule.name} failed`,
          details: result.details
        };

        if (rule.level === 'error') {
          errors.push(error);
        } else {
          warnings.push(error);
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }
}
```

### Standard Data Quality Rules

```typescript
// Rule: Timestamps must be chronological
class ChronologicalTimestampsRule implements ValidationRule {
  name = 'chronological_timestamps';
  level = 'error' as const;

  validate(conversation: UnifiedConversation): RuleResult {
    const timestamps = conversation.messages.map(m =>
      new Date(m.timestamp).getTime()
    );

    for (let i = 1; i < timestamps.length; i++) {
      if (timestamps[i] < timestamps[i - 1]) {
        return {
          passed: false,
          message: 'Message timestamps are not chronological',
          details: {
            messageIndex: i,
            currentTimestamp: conversation.messages[i].timestamp,
            previousTimestamp: conversation.messages[i - 1].timestamp
          }
        };
      }
    }

    return { passed: true };
  }
}

// Rule: Conversation must have at least one user message
class RequireUserMessageRule implements ValidationRule {
  name = 'require_user_message';
  level = 'error' as const;

  validate(conversation: UnifiedConversation): RuleResult {
    const hasUserMessage = conversation.messages.some(m => m.role === 'user');

    return {
      passed: hasUserMessage,
      message: hasUserMessage ? undefined : 'Conversation must contain at least one user message'
    };
  }
}

// Rule: Tool results must reference valid tool uses
class ValidToolReferencesRule implements ValidationRule {
  name = 'valid_tool_references';
  level = 'error' as const;

  validate(conversation: UnifiedConversation): RuleResult {
    const toolUseIds = new Set<string>();

    // Collect all tool_use IDs
    for (const message of conversation.messages) {
      for (const content of message.content) {
        if (content.type === 'tool_use') {
          toolUseIds.add(content.id);
        }
      }
    }

    // Check all tool_result references
    for (const message of conversation.messages) {
      for (const content of message.content) {
        if (content.type === 'tool_result') {
          if (!toolUseIds.has(content.tool_use_id)) {
            return {
              passed: false,
              message: 'Tool result references non-existent tool use',
              details: {
                messageId: message.message_id,
                toolUseId: content.tool_use_id
              }
            };
          }
        }
      }
    }

    return { passed: true };
  }
}

// Rule: Token counts should be non-negative
class NonNegativeTokensRule implements ValidationRule {
  name = 'non_negative_tokens';
  level = 'error' as const;

  validate(conversation: UnifiedConversation): RuleResult {
    for (const message of conversation.messages) {
      if (!message.tokens) continue;

      const tokenFields = [
        'input_tokens',
        'output_tokens',
        'cache_read_input_tokens',
        'cache_creation_input_tokens'
      ];

      for (const field of tokenFields) {
        const value = message.tokens[field];
        if (value !== undefined && value < 0) {
          return {
            passed: false,
            message: `Token count cannot be negative`,
            details: {
              messageId: message.message_id,
              field,
              value
            }
          };
        }
      }
    }

    return { passed: true };
  }
}

// Rule: Message content cannot be empty
class NonEmptyContentRule implements ValidationRule {
  name = 'non_empty_content';
  level = 'error' as const;

  validate(conversation: UnifiedConversation): RuleResult {
    for (const message of conversation.messages) {
      if (!message.content || message.content.length === 0) {
        return {
          passed: false,
          message: 'Message content cannot be empty',
          details: { messageId: message.message_id }
        };
      }

      // Check each content block
      for (const content of message.content) {
        if (content.type === 'text' && (!content.text || content.text.trim() === '')) {
          return {
            passed: false,
            message: 'Text content cannot be empty',
            details: { messageId: message.message_id }
          };
        }
      }
    }

    return { passed: true };
  }
}

// Rule: Conversation timestamps must be within reasonable bounds
class ReasonableTimestampsRule implements ValidationRule {
  name = 'reasonable_timestamps';
  level = 'warning' as const;

  validate(conversation: UnifiedConversation): RuleResult {
    const now = Date.now();
    const minDate = new Date('2020-01-01').getTime(); // AI assistants weren't widespread before 2020

    const created = new Date(conversation.created_at).getTime();
    const updated = new Date(conversation.updated_at).getTime();

    if (created < minDate) {
      return {
        passed: false,
        message: 'Conversation created date is unreasonably old',
        details: { created_at: conversation.created_at }
      };
    }

    if (created > now || updated > now) {
      return {
        passed: false,
        message: 'Conversation timestamp is in the future',
        details: {
          created_at: conversation.created_at,
          updated_at: conversation.updated_at
        }
      };
    }

    return { passed: true };
  }
}

// Rule: Cost calculations should be reasonable
class ReasonableCostRule implements ValidationRule {
  name = 'reasonable_cost';
  level = 'warning' as const;

  validate(conversation: UnifiedConversation): RuleResult {
    if (!conversation.metrics?.total_cost) {
      return { passed: true };
    }

    const cost = conversation.metrics.total_cost.amount;
    const MAX_REASONABLE_COST = 100; // $100 per conversation seems high

    if (cost > MAX_REASONABLE_COST) {
      return {
        passed: false,
        message: 'Conversation cost exceeds reasonable threshold',
        details: {
          cost,
          threshold: MAX_REASONABLE_COST,
          currency: conversation.metrics.total_cost.currency
        }
      };
    }

    return { passed: true };
  }
}
```

### Using the Rule Engine

```typescript
const validator = new DataQualityValidator();

// Add standard rules
validator.addRule(new ChronologicalTimestampsRule());
validator.addRule(new RequireUserMessageRule());
validator.addRule(new ValidToolReferencesRule());
validator.addRule(new NonNegativeTokensRule());
validator.addRule(new NonEmptyContentRule());
validator.addRule(new ReasonableTimestampsRule());
validator.addRule(new ReasonableCostRule());

// Validate conversation
const result = validator.validate(conversation);

if (!result.valid) {
  console.error('Validation failed:', result.errors);
}

if (result.warnings.length > 0) {
  console.warn('Validation warnings:', result.warnings);
}
```

---

## Business Logic Validation

### Semantic Validation

```typescript
// Rule: Assistant messages should follow user messages
class ProperMessageFlowRule implements ValidationRule {
  name = 'proper_message_flow';
  level = 'warning' as const;

  validate(conversation: UnifiedConversation): RuleResult {
    let lastRole: string | null = null;

    for (const message of conversation.messages) {
      if (message.role === 'system') {
        continue; // System messages can appear anywhere
      }

      if (message.role === 'assistant' && lastRole !== 'user') {
        return {
          passed: false,
          message: 'Assistant message without preceding user message',
          details: { messageId: message.message_id }
        };
      }

      lastRole = message.role;
    }

    return { passed: true };
  }
}

// Rule: Tool uses should be followed by tool results
class ToolUseCompletionRule implements ValidationRule {
  name = 'tool_use_completion';
  level = 'warning' as const;

  validate(conversation: UnifiedConversation): RuleResult {
    const toolUses = new Set<string>();
    const toolResults = new Set<string>();

    for (const message of conversation.messages) {
      for (const content of message.content) {
        if (content.type === 'tool_use') {
          toolUses.add(content.id);
        } else if (content.type === 'tool_result') {
          toolResults.add(content.tool_use_id);
        }
      }
    }

    const incompleteCalls = [...toolUses].filter(id => !toolResults.has(id));

    if (incompleteCalls.length > 0) {
      return {
        passed: false,
        message: 'Tool uses without corresponding results',
        details: { incompleteCalls }
      };
    }

    return { passed: true };
  }
}

// Rule: Message duration should be reasonable
class ReasonableMessageDurationRule implements ValidationRule {
  name = 'reasonable_message_duration';
  level = 'warning' as const;

  validate(conversation: UnifiedConversation): RuleResult {
    const messages = conversation.messages;

    for (let i = 1; i < messages.length; i++) {
      const prevTime = new Date(messages[i - 1].timestamp).getTime();
      const currTime = new Date(messages[i].timestamp).getTime();
      const durationMs = currTime - prevTime;

      const MAX_REASONABLE_DURATION = 1000 * 60 * 60; // 1 hour

      if (durationMs > MAX_REASONABLE_DURATION) {
        return {
          passed: false,
          message: 'Unusually long gap between messages',
          details: {
            messageIndex: i,
            durationMs,
            durationMinutes: Math.round(durationMs / 1000 / 60)
          }
        };
      }
    }

    return { passed: true };
  }
}
```

---

## Extension Points

### 1. Platform Metadata Extension

Any platform can add custom metadata:

```typescript
interface ExtendedPlatformMetadata {
  // Standard fields
  name: PlatformName;
  version: string;
  model?: string;

  // Extension point
  metadata?: {
    [key: string]: any; // Platform-specific fields
  };
}

// Example: Claude Code extensions
interface ClaudeCodeMetadata {
  isSidechain?: boolean;
  userType?: string;
  version?: string;
}

const claudeConversation: UnifiedConversation = {
  platform: {
    name: 'claude_code',
    version: '1.0.89',
    model: 'claude-sonnet-4-5',
    metadata: {
      isSidechain: false,
      userType: 'human',
      sessionType: 'coding'
    } as ClaudeCodeMetadata
  }
  // ...
};
```

### 2. Context Extension Point

Custom context data can be added:

```typescript
interface ExtendedContext {
  workspace?: WorkspaceContext;
  environment?: EnvironmentContext;

  // Extension point
  custom?: {
    [key: string]: any;
  };
}

// Example: Continue.dev context providers
const continueConversation: UnifiedConversation = {
  context: {
    workspace: {
      path: '/project',
      git_branch: 'main'
    },
    custom: {
      context_providers: [
        { name: 'code', query: 'function handleSubmit' },
        { name: 'docs', query: 'API documentation' }
      ],
      selected_code: {
        file: 'src/app.ts',
        lines: [10, 25]
      }
    }
  }
  // ...
};
```

### 3. Message Metadata Extension

Per-message custom fields:

```typescript
interface ExtendedMessageMetadata {
  user_type?: string;
  edit_count?: number;
  model_override?: string;

  // Extension point
  [key: string]: any;
}

// Example: GitHub Copilot completion metadata
const copilotMessage: UnifiedMessage = {
  message_id: 'msg-123',
  role: 'assistant',
  timestamp: '2024-10-28T10:00:00Z',
  content: [{ type: 'code', code: 'const x = 42;' }],
  metadata: {
    accepted: true,
    completion_index: 0,
    suggestion_count: 3,
    trigger: 'automatic',
    language: 'typescript'
  }
};
```

### 4. Content Type Extension

Add new content block types:

```typescript
type ExtendedContentBlock =
  | TextContent
  | ToolUseContent
  | ToolResultContent
  | ImageContent
  | CodeContent
  | ThinkingContent
  | CustomContentBlock; // Extension point

interface CustomContentBlock {
  type: string; // Must not conflict with standard types
  [key: string]: any; // Custom fields
}

// Example: Diagram content type
interface DiagramContent extends CustomContentBlock {
  type: 'diagram';
  diagram_type: 'mermaid' | 'plantuml' | 'graphviz';
  source: string;
  rendered_url?: string;
}

const messageWithDiagram: UnifiedMessage = {
  message_id: 'msg-456',
  role: 'assistant',
  timestamp: '2024-10-28T10:00:00Z',
  content: [
    { type: 'text', text: 'Here is the architecture:' },
    {
      type: 'diagram',
      diagram_type: 'mermaid',
      source: 'graph TD\nA-->B'
    } as DiagramContent
  ]
};
```

### 5. Summary Type Extension

Custom summary types:

```typescript
interface ExtendedSummary {
  summary_id: string;
  type: 'automatic' | 'user_generated' | 'system' | string; // Allow custom types
  text: string;
  timestamp: string;
  covers_messages: string[];

  // Extension point for custom summary data
  metadata?: {
    [key: string]: any;
  };
}

// Example: AI-generated summary with confidence score
const aiSummary: ExtendedSummary = {
  summary_id: 'sum-123',
  type: 'ai_generated',
  text: 'User implemented authentication flow with JWT tokens',
  timestamp: '2024-10-28T10:00:00Z',
  covers_messages: ['msg-1', 'msg-2', 'msg-3'],
  metadata: {
    model: 'claude-sonnet-4-5',
    confidence: 0.95,
    key_topics: ['authentication', 'jwt', 'security']
  }
};
```

---

## Custom Validators

### Validator Plugin System

```typescript
interface ValidatorPlugin {
  name: string;
  version: string;
  rules: ValidationRule[];
}

class ValidatorRegistry {
  private plugins: Map<string, ValidatorPlugin> = new Map();

  register(plugin: ValidatorPlugin): void {
    this.plugins.set(plugin.name, plugin);
  }

  getPlugin(name: string): ValidatorPlugin | undefined {
    return this.plugins.get(name);
  }

  getAllRules(): ValidationRule[] {
    const allRules: ValidationRule[] = [];

    for (const plugin of this.plugins.values()) {
      allRules.push(...plugin.rules);
    }

    return allRules;
  }
}

// Example: Security validator plugin
const securityValidatorPlugin: ValidatorPlugin = {
  name: 'security_validator',
  version: '1.0.0',
  rules: [
    new NoSecretsInContentRule(),
    new NoPersonalInfoRule(),
    new SanitizedFilePathsRule()
  ]
};

const registry = new ValidatorRegistry();
registry.register(securityValidatorPlugin);
```

### Example Custom Validators

```typescript
// Security: Check for potential secrets
class NoSecretsInContentRule implements ValidationRule {
  name = 'no_secrets_in_content';
  level = 'error' as const;

  private secretPatterns = [
    /api[_-]?key[_-]?=\s*['"]?\w+/i,
    /password[_-]?=\s*['"]?\w+/i,
    /secret[_-]?=\s*['"]?\w+/i,
    /token[_-]?=\s*['"]?\w+/i,
    /-----BEGIN [A-Z]+ PRIVATE KEY-----/
  ];

  validate(conversation: UnifiedConversation): RuleResult {
    for (const message of conversation.messages) {
      for (const content of message.content) {
        if (content.type === 'text') {
          for (const pattern of this.secretPatterns) {
            if (pattern.test(content.text)) {
              return {
                passed: false,
                message: 'Potential secret detected in message content',
                details: {
                  messageId: message.message_id,
                  pattern: pattern.source
                }
              };
            }
          }
        }
      }
    }

    return { passed: true };
  }
}

// Business: Ensure minimum interaction quality
class MinimumInteractionRule implements ValidationRule {
  name = 'minimum_interaction';
  level = 'warning' as const;

  validate(conversation: UnifiedConversation): RuleResult {
    const MIN_MESSAGES = 2; // At least one exchange
    const MIN_TOKENS = 10; // Non-trivial conversation

    if (conversation.messages.length < MIN_MESSAGES) {
      return {
        passed: false,
        message: 'Conversation has too few messages',
        details: {
          messageCount: conversation.messages.length,
          minimum: MIN_MESSAGES
        }
      };
    }

    const totalTokens = conversation.metrics?.total_tokens;
    const tokenSum = totalTokens
      ? (totalTokens.input || 0) + (totalTokens.output || 0)
      : 0;

    if (tokenSum < MIN_TOKENS) {
      return {
        passed: false,
        message: 'Conversation is too short',
        details: {
          totalTokens: tokenSum,
          minimum: MIN_TOKENS
        }
      };
    }

    return { passed: true };
  }
}

// Platform-specific: Claude Code version compatibility
class ClaudeCodeVersionRule implements ValidationRule {
  name = 'claude_code_version';
  level = 'warning' as const;

  private SUPPORTED_VERSIONS = ['1.0.0', '1.0.89', '1.1.0'];

  validate(conversation: UnifiedConversation): RuleResult {
    if (conversation.platform.name !== 'claude_code') {
      return { passed: true }; // Not applicable
    }

    const version = conversation.platform.version;

    if (!this.SUPPORTED_VERSIONS.includes(version)) {
      return {
        passed: false,
        message: 'Unsupported Claude Code version',
        details: {
          version,
          supported: this.SUPPORTED_VERSIONS
        }
      };
    }

    return { passed: true };
  }
}
```

---

## Platform-Specific Extensions

### Extension Registry

```typescript
interface PlatformExtension {
  platform: PlatformName;
  validators: ValidationRule[];
  transformers?: {
    pre?: (conversation: any) => any;
    post?: (conversation: UnifiedConversation) => UnifiedConversation;
  };
  metadata?: {
    [key: string]: any;
  };
}

class PlatformExtensionRegistry {
  private extensions: Map<PlatformName, PlatformExtension> = new Map();

  register(extension: PlatformExtension): void {
    this.extensions.set(extension.platform, extension);
  }

  getExtension(platform: PlatformName): PlatformExtension | undefined {
    return this.extensions.get(platform);
  }

  getValidators(platform: PlatformName): ValidationRule[] {
    const extension = this.extensions.get(platform);
    return extension?.validators || [];
  }
}
```

### Example: Claude Code Extension

```typescript
const claudeCodeExtension: PlatformExtension = {
  platform: 'claude_code',
  validators: [
    new ClaudeCodeVersionRule(),
    {
      name: 'valid_session_structure',
      level: 'error',
      validate: (conversation) => {
        const metadata = conversation.platform.metadata;

        if (metadata?.isSidechain && !conversation.session?.parent_conversation_id) {
          return {
            passed: false,
            message: 'Sidechain conversation must have parent_conversation_id'
          };
        }

        return { passed: true };
      }
    }
  ],
  transformers: {
    post: (conversation) => {
      // Add Claude Code-specific enrichments
      if (!conversation.platform.metadata) {
        conversation.platform.metadata = {};
      }

      conversation.platform.metadata.processed_by = 'claude-code-extension';
      conversation.platform.metadata.processed_at = new Date().toISOString();

      return conversation;
    }
  },
  metadata: {
    documentation: 'https://docs.anthropic.com/claude-code',
    supportedFeatures: ['tool_use', 'caching', 'extended_thinking']
  }
};
```

---

## API Validation

### Request Validation

```typescript
class APIValidator {
  validateConversationQuery(query: any): ValidationResult {
    const errors: string[] = [];

    // Validate date range
    if (query.startDate && query.endDate) {
      const start = new Date(query.startDate);
      const end = new Date(query.endDate);

      if (start > end) {
        errors.push('startDate must be before endDate');
      }

      const maxRange = 1000 * 60 * 60 * 24 * 90; // 90 days
      if (end.getTime() - start.getTime() > maxRange) {
        errors.push('Date range cannot exceed 90 days');
      }
    }

    // Validate limit
    if (query.limit !== undefined) {
      if (!Number.isInteger(query.limit) || query.limit < 1 || query.limit > 1000) {
        errors.push('limit must be an integer between 1 and 1000');
      }
    }

    // Validate platform
    if (query.platform) {
      const validPlatforms = [
        'claude_code',
        'github_copilot',
        'chatgpt',
        'continue_dev',
        'roo_code',
        'azure_openai'
      ];

      if (!validPlatforms.includes(query.platform)) {
        errors.push(`Invalid platform: ${query.platform}`);
      }
    }

    return {
      valid: errors.length === 0,
      errors: errors.map(msg => ({ message: msg }))
    };
  }

  validateConversationCreate(data: any): ValidationResult {
    const schemaValidator = new SchemaValidator('./unified-conversation-schema.json');
    const schemaResult = schemaValidator.validate(data);

    if (!schemaResult.valid) {
      return schemaResult;
    }

    // Additional business logic validation
    const qualityValidator = new DataQualityValidator();
    qualityValidator.addRule(new RequireUserMessageRule());
    qualityValidator.addRule(new ChronologicalTimestampsRule());
    qualityValidator.addRule(new NonEmptyContentRule());

    return qualityValidator.validate(data);
  }
}
```

### Response Validation

```typescript
class ResponseValidator {
  validateConversationResponse(conversation: UnifiedConversation): ValidationResult {
    const errors: string[] = [];

    // Ensure sensitive data is removed
    if (this.containsSensitiveData(conversation)) {
      errors.push('Response contains sensitive data');
    }

    // Validate response structure
    if (!conversation.conversation_id) {
      errors.push('Missing conversation_id');
    }

    if (!conversation.messages || conversation.messages.length === 0) {
      errors.push('Conversation has no messages');
    }

    return {
      valid: errors.length === 0,
      errors: errors.map(msg => ({ message: msg }))
    };
  }

  private containsSensitiveData(conversation: UnifiedConversation): boolean {
    // Check for PII, secrets, etc.
    const sensitivePatterns = [
      /\b\d{3}-\d{2}-\d{4}\b/, // SSN
      /\b\d{16}\b/, // Credit card
      /api[_-]?key/i,
      /password/i
    ];

    for (const message of conversation.messages) {
      for (const content of message.content) {
        if (content.type === 'text') {
          for (const pattern of sensitivePatterns) {
            if (pattern.test(content.text)) {
              return true;
            }
          }
        }
      }
    }

    return false;
  }
}
```

---

## Validation Pipeline

### Complete Validation Flow

```typescript
class ValidationPipeline {
  constructor(
    private schemaValidator: SchemaValidator,
    private qualityValidator: DataQualityValidator,
    private extensionRegistry: PlatformExtensionRegistry
  ) {}

  async validate(
    conversation: UnifiedConversation,
    level: ValidationLevel = ValidationLevel.STANDARD
  ): Promise<ValidationResult> {
    const results: ValidationResult[] = [];

    // 1. Schema validation (always run)
    results.push(this.schemaValidator.validate(conversation));

    if (level === ValidationLevel.LENIENT && !results[0].valid) {
      return results[0]; // Stop early for lenient mode
    }

    // 2. Data quality validation
    results.push(this.qualityValidator.validate(conversation));

    // 3. Platform-specific validation
    const platformValidators = this.extensionRegistry.getValidators(
      conversation.platform.name
    );

    for (const validator of platformValidators) {
      const result = validator.validate(conversation);
      if (!result.passed) {
        results.push({
          valid: false,
          errors: [{
            rule: validator.name,
            message: result.message || 'Platform validation failed'
          }]
        });
      }
    }

    // Combine all results
    return this.combineResults(results, level);
  }

  private combineResults(
    results: ValidationResult[],
    level: ValidationLevel
  ): ValidationResult {
    const allErrors = results.flatMap(r => r.errors || []);
    const allWarnings = results.flatMap(r => r.warnings || []);

    return {
      valid: level === ValidationLevel.STRICT
        ? allErrors.length === 0 && allWarnings.length === 0
        : allErrors.length === 0,
      errors: allErrors,
      warnings: allWarnings
    };
  }
}
```

### Usage Example

```typescript
// Setup
const schemaValidator = new SchemaValidator('./unified-conversation-schema.json');
const qualityValidator = new DataQualityValidator();
const extensionRegistry = new PlatformExtensionRegistry();

// Add standard rules
qualityValidator.addRule(new ChronologicalTimestampsRule());
qualityValidator.addRule(new RequireUserMessageRule());
qualityValidator.addRule(new ValidToolReferencesRule());

// Register platform extensions
extensionRegistry.register(claudeCodeExtension);

// Create pipeline
const pipeline = new ValidationPipeline(
  schemaValidator,
  qualityValidator,
  extensionRegistry
);

// Validate conversation
const result = await pipeline.validate(conversation, ValidationLevel.STANDARD);

if (!result.valid) {
  console.error('Validation errors:', result.errors);
}

if (result.warnings.length > 0) {
  console.warn('Validation warnings:', result.warnings);
}
```

---

## Summary

This validation framework provides:

1. **Multi-level validation**: Schema, data quality, business logic, platform-specific
2. **Extensibility**: Easy to add custom validators and platform extensions
3. **Flexibility**: Configurable validation levels (strict/standard/lenient)
4. **Maintainability**: Clear separation of concerns with plugin architecture
5. **Comprehensive coverage**: From basic schema checks to complex business rules

The extension points allow platforms to add custom behavior without modifying core schema or validation logic, ensuring the unified schema remains flexible and future-proof.
