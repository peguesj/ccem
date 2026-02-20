# ETL Strategy for Unified Conversation Schema

## Table of Contents

1. [Overview](#overview)
2. [Architecture Decision: ELT vs ETL](#architecture-decision-elt-vs-etl)
3. [Data Pipeline Architecture](#data-pipeline-architecture)
4. [Extraction Layer](#extraction-layer)
5. [Transformation Layer](#transformation-layer)
6. [Loading Layer](#loading-layer)
7. [Normalization Procedures](#normalization-procedures)
8. [Deduplication Strategy](#deduplication-strategy)
9. [Version Tracking](#version-tracking)
10. [Performance Optimization](#performance-optimization)
11. [Monitoring and Observability](#monitoring-and-observability)

---

## Overview

This document outlines the Extract, Transform, Load (ETL) strategy for normalizing AI coding assistant conversations from multiple platforms into a unified schema. The strategy emphasizes data quality, scalability, and maintainability.

### Design Principles

- **Schema-First**: All transformations validate against the unified JSON Schema
- **Idempotent**: Pipeline can be re-run safely without duplicating data
- **Incremental**: Support for incremental updates and backfills
- **Observable**: Comprehensive logging and metrics at each stage
- **Extensible**: Easy to add new platforms without modifying core pipeline

---

## Architecture Decision: ELT vs ETL

### Chosen Approach: **Hybrid ELT with Transformation Validation**

We use an **ELT (Extract-Load-Transform)** approach with validation:

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   Extract    │────▶│  Raw Storage │────▶│  Transform   │────▶│  Validated   │
│  (Raw Data)  │     │   (Staging)  │     │  + Validate  │     │   Storage    │
└──────────────┘     └──────────────┘     └──────────────┘     └──────────────┘
```

### Rationale

1. **Raw Data Preservation**: Keep original platform data immutable for auditing and reprocessing
2. **Flexible Transformation**: Transform in the data warehouse using SQL/DataFrame operations
3. **Schema Evolution**: Easily update transformations without re-extracting data
4. **Data Lineage**: Clear tracking from raw to transformed state

### Alternative Considered: Pure ETL

Pure ETL transforms before loading, which is faster for initial ingest but:
- Loses raw data for debugging
- Harder to update transformation logic retroactively
- More complex error recovery

---

## Data Pipeline Architecture

### Three-Layer Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                       EXTRACTION LAYER                          │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐       │
│  │  Claude  │  │  Copilot │  │  ChatGPT │  │   Roo    │  ...  │
│  │  Extractor│  │ Extractor│  │ Extractor│  │ Extractor│       │
│  └─────┬────┘  └─────┬────┘  └─────┬────┘  └─────┬────┘       │
└────────┼─────────────┼─────────────┼─────────────┼─────────────┘
         │             │             │             │
         ▼             ▼             ▼             ▼
┌─────────────────────────────────────────────────────────────────┐
│                      RAW STORAGE LAYER                          │
│  ┌──────────────────────────────────────────────────┐           │
│  │   Object Storage (S3, GCS, Azure Blob)           │           │
│  │   - Partitioned by: platform/date/session        │           │
│  │   - Format: Parquet or JSONL                     │           │
│  │   - Retention: Indefinite (cheap storage)        │           │
│  └──────────────────────────────────────────────────┘           │
└─────────────────────────┬───────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│                   TRANSFORMATION LAYER                          │
│  ┌─────────────────────────────────────────────────┐            │
│  │  Transformation Engine (dbt, Spark, Polars)    │            │
│  │  - Platform-specific transformers               │            │
│  │  - Schema validation                            │            │
│  │  - Deduplication                                │            │
│  │  - Enrichment                                   │            │
│  └─────────────────────────────────────────────────┘            │
└─────────────────────────┬───────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│                      LOADING LAYER                              │
│  ┌──────────────────────────────────────────────────┐           │
│  │   Data Warehouse (DuckDB, PostgreSQL, BigQuery)  │           │
│  │   - Conversations table                          │           │
│  │   - Messages table (normalized)                  │           │
│  │   - Metrics table (aggregated)                   │           │
│  │   - Audit log table                              │           │
│  └──────────────────────────────────────────────────┘           │
└─────────────────────────────────────────────────────────────────┘
```

### Technology Stack Recommendations

#### For Local Development / Small Scale
- **Extraction**: Node.js/Python scripts
- **Raw Storage**: Local filesystem with Parquet files
- **Transformation**: DuckDB + SQL
- **Loading**: DuckDB or SQLite
- **Orchestration**: Simple cron jobs or Node.js scheduler

#### For Production / Large Scale
- **Extraction**: Python/Go microservices
- **Raw Storage**: S3/GCS with Parquet
- **Transformation**: dbt + Spark/Polars
- **Loading**: PostgreSQL, ClickHouse, or BigQuery
- **Orchestration**: Airflow, Dagster, or Prefect

---

## Extraction Layer

### Extractor Interface

All platform extractors implement a common interface:

```typescript
interface Extractor {
  platform: PlatformName;
  version: string;

  // Extract conversations from source
  extract(options: ExtractionOptions): AsyncIterableIterator<RawConversation>;

  // Validate source data availability
  validateSource(): Promise<ValidationResult>;

  // Get extraction metadata
  getMetadata(): ExtractionMetadata;
}

interface ExtractionOptions {
  startDate?: Date;
  endDate?: Date;
  sessionIds?: string[];
  incremental?: boolean;
  batchSize?: number;
}

interface RawConversation {
  platform: PlatformName;
  extractedAt: Date;
  sourceVersion: string;
  rawData: any; // Platform-specific format
  checksum: string; // SHA-256 of rawData
}
```

### Claude Code Extractor

```typescript
class ClaudeCodeExtractor implements Extractor {
  platform = 'claude_code' as const;
  version = '1.0.0';

  async *extract(options: ExtractionOptions): AsyncIterableIterator<RawConversation> {
    const projectDirs = await this.findProjectDirectories();

    for (const projectDir of projectDirs) {
      const sessions = await this.findSessions(projectDir, options);

      for (const sessionFile of sessions) {
        const rawData = await this.readJSONL(sessionFile);
        const checksum = this.computeChecksum(rawData);

        yield {
          platform: this.platform,
          extractedAt: new Date(),
          sourceVersion: this.detectVersion(rawData),
          rawData,
          checksum
        };
      }
    }
  }

  private async findProjectDirectories(): Promise<string[]> {
    const claudeHome = path.join(os.homedir(), '.claude', 'projects');
    return await fs.readdir(claudeHome);
  }

  private async findSessions(
    projectDir: string,
    options: ExtractionOptions
  ): Promise<string[]> {
    const sessions = await fs.readdir(projectDir);

    return sessions
      .filter(f => f.endsWith('.jsonl'))
      .filter(f => this.matchesDateRange(f, options));
  }

  private computeChecksum(data: any): string {
    return crypto
      .createHash('sha256')
      .update(JSON.stringify(data))
      .digest('hex');
  }
}
```

### Extraction Best Practices

1. **Streaming**: Use async iterators for memory efficiency
2. **Checkpointing**: Track last extracted session ID for incremental updates
3. **Error Handling**: Log errors but continue processing other sessions
4. **Rate Limiting**: Respect API rate limits for cloud-based sources
5. **Checksums**: Compute SHA-256 hashes for deduplication

---

## Transformation Layer

### Transformation Pipeline

```typescript
interface Transformer {
  platform: PlatformName;

  // Transform raw data to unified schema
  transform(raw: RawConversation): Promise<UnifiedConversation>;

  // Validate transformed data against schema
  validate(unified: UnifiedConversation): ValidationResult;

  // Enrich with additional metadata
  enrich(unified: UnifiedConversation): Promise<UnifiedConversation>;
}

class TransformationPipeline {
  private transformers: Map<PlatformName, Transformer>;
  private validator: SchemaValidator;

  async process(raw: RawConversation): Promise<TransformationResult> {
    const transformer = this.transformers.get(raw.platform);
    if (!transformer) {
      throw new Error(`No transformer for platform: ${raw.platform}`);
    }

    try {
      // 1. Transform
      let unified = await transformer.transform(raw);

      // 2. Validate against schema
      const validation = this.validator.validate(unified);
      if (!validation.valid) {
        return {
          success: false,
          errors: validation.errors,
          rawChecksum: raw.checksum
        };
      }

      // 3. Enrich
      unified = await transformer.enrich(unified);

      // 4. Normalize
      unified = this.normalize(unified);

      // 5. Compute metadata
      unified.metrics = this.computeMetrics(unified);

      return {
        success: true,
        data: unified,
        rawChecksum: raw.checksum
      };
    } catch (error) {
      return {
        success: false,
        errors: [error.message],
        rawChecksum: raw.checksum
      };
    }
  }

  private normalize(conversation: UnifiedConversation): UnifiedConversation {
    // Normalize timestamps
    conversation.created_at = normalizeTimestamp(conversation.created_at);
    conversation.updated_at = normalizeTimestamp(conversation.updated_at);

    conversation.messages = conversation.messages.map(msg => ({
      ...msg,
      timestamp: normalizeTimestamp(msg.timestamp),
      content: normalizeContent(msg.content)
    }));

    return conversation;
  }

  private computeMetrics(conversation: UnifiedConversation): ConversationMetrics {
    return {
      total_messages: conversation.messages.length,
      total_tokens: this.sumTokens(conversation.messages),
      tool_calls: this.countToolCalls(conversation.messages),
      duration_ms: this.calculateDuration(conversation)
    };
  }
}
```

### Platform-Specific Transformers

Each platform has a dedicated transformer implementing the mapping logic from [platform-mappings.md](./platform-mappings.md).

Example structure:

```
transformers/
├── claude-code-transformer.ts
├── copilot-transformer.ts
├── chatgpt-transformer.ts
├── continue-transformer.ts
├── roo-code-transformer.ts
└── azure-openai-transformer.ts
```

---

## Loading Layer

### Database Schema

#### Conversations Table

```sql
CREATE TABLE conversations (
  conversation_id UUID PRIMARY KEY,
  platform VARCHAR(50) NOT NULL,
  platform_version VARCHAR(50),
  model VARCHAR(100),
  session_id VARCHAR(255),
  parent_conversation_id UUID REFERENCES conversations(conversation_id),
  is_sidechain BOOLEAN DEFAULT FALSE,

  -- Context
  workspace_path TEXT,
  git_branch VARCHAR(255),
  git_commit VARCHAR(40),

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL,
  imported_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

  -- Status
  status VARCHAR(20) DEFAULT 'active',

  -- Metrics (denormalized for performance)
  total_messages INTEGER,
  total_input_tokens INTEGER,
  total_output_tokens INTEGER,
  total_cost DECIMAL(10, 6),
  duration_ms INTEGER,

  -- Checksums for deduplication
  raw_checksum VARCHAR(64) NOT NULL UNIQUE,
  content_hash VARCHAR(64) NOT NULL,

  -- Metadata
  platform_metadata JSONB,
  tags TEXT[],

  -- Indexes
  INDEX idx_platform (platform),
  INDEX idx_created_at (created_at),
  INDEX idx_workspace_path (workspace_path),
  INDEX idx_raw_checksum (raw_checksum),
  INDEX idx_content_hash (content_hash)
);
```

#### Messages Table

```sql
CREATE TABLE messages (
  message_id UUID PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES conversations(conversation_id) ON DELETE CASCADE,
  parent_message_id UUID REFERENCES messages(message_id),

  -- Core fields
  role VARCHAR(20) NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL,

  -- Content (stored as JSONB for flexibility)
  content JSONB NOT NULL,

  -- Tokens
  input_tokens INTEGER,
  output_tokens INTEGER,
  cache_read_tokens INTEGER,
  cache_write_tokens INTEGER,

  -- Cost
  cost DECIMAL(10, 6),

  -- Metadata
  user_type VARCHAR(50),
  model_override VARCHAR(100),
  metadata JSONB,

  -- Sequence for ordering
  sequence_number INTEGER NOT NULL,

  -- Indexes
  INDEX idx_conversation_id (conversation_id),
  INDEX idx_role (role),
  INDEX idx_timestamp (timestamp),
  INDEX idx_sequence (conversation_id, sequence_number)
);
```

#### Summaries Table

```sql
CREATE TABLE summaries (
  summary_id UUID PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES conversations(conversation_id) ON DELETE CASCADE,

  type VARCHAR(50) NOT NULL,
  text TEXT NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL,

  -- Coverage tracking
  covers_messages UUID[] NOT NULL,

  -- Indexes
  INDEX idx_conversation_id (conversation_id),
  INDEX idx_type (type)
);
```

#### Tool Calls Table (Denormalized for Analytics)

```sql
CREATE TABLE tool_calls (
  tool_call_id UUID PRIMARY KEY,
  message_id UUID NOT NULL REFERENCES messages(message_id) ON DELETE CASCADE,
  conversation_id UUID NOT NULL REFERENCES conversations(conversation_id) ON DELETE CASCADE,

  tool_name VARCHAR(255) NOT NULL,
  tool_input JSONB NOT NULL,
  tool_output JSONB,

  is_error BOOLEAN DEFAULT FALSE,
  duration_ms INTEGER,
  exit_code INTEGER,

  timestamp TIMESTAMP WITH TIME ZONE NOT NULL,

  -- Indexes
  INDEX idx_tool_name (tool_name),
  INDEX idx_conversation_id (conversation_id),
  INDEX idx_timestamp (timestamp)
);
```

#### Audit Log Table

```sql
CREATE TABLE audit_log (
  id BIGSERIAL PRIMARY KEY,
  operation VARCHAR(50) NOT NULL, -- 'extract', 'transform', 'load', 'deduplicate'
  platform VARCHAR(50),
  conversation_id UUID,

  status VARCHAR(20) NOT NULL, -- 'success', 'error', 'warning'
  message TEXT,
  details JSONB,

  duration_ms INTEGER,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

  -- Indexes
  INDEX idx_operation (operation),
  INDEX idx_status (status),
  INDEX idx_timestamp (timestamp)
);
```

### Loading Strategy

```typescript
class Loader {
  async load(conversation: UnifiedConversation): Promise<LoadResult> {
    const tx = await this.db.transaction();

    try {
      // 1. Check for duplicates
      const exists = await this.checkDuplicate(conversation.conversation_id);
      if (exists) {
        await tx.rollback();
        return { success: false, reason: 'duplicate', id: conversation.conversation_id };
      }

      // 2. Insert conversation
      await tx.query(`
        INSERT INTO conversations (...)
        VALUES (...)
      `, [...]);

      // 3. Insert messages
      for (const [idx, message] of conversation.messages.entries()) {
        await tx.query(`
          INSERT INTO messages (sequence_number, ...)
          VALUES ($1, ...)
        `, [idx, ...]);

        // 4. Extract and insert tool calls
        await this.insertToolCalls(tx, message);
      }

      // 5. Insert summaries
      for (const summary of conversation.summaries || []) {
        await tx.query(`
          INSERT INTO summaries (...)
          VALUES (...)
        `, [...]);
      }

      // 6. Update metrics
      await this.updateAggregateMetrics(tx, conversation);

      await tx.commit();

      return { success: true, id: conversation.conversation_id };
    } catch (error) {
      await tx.rollback();
      return { success: false, reason: 'error', error: error.message };
    }
  }

  private async checkDuplicate(conversationId: string): Promise<boolean> {
    const result = await this.db.query(
      'SELECT 1 FROM conversations WHERE conversation_id = $1',
      [conversationId]
    );
    return result.rows.length > 0;
  }
}
```

---

## Normalization Procedures

### 1. Timestamp Normalization

All timestamps converted to ISO 8601 UTC:

```typescript
function normalizeTimestamp(ts: string | number | Date): string {
  let date: Date;

  if (typeof ts === 'number') {
    // Detect seconds vs milliseconds
    date = ts < 10000000000 ? new Date(ts * 1000) : new Date(ts);
  } else if (ts instanceof Date) {
    date = ts;
  } else {
    date = new Date(ts);
  }

  if (isNaN(date.getTime())) {
    throw new Error(`Invalid timestamp: ${ts}`);
  }

  return date.toISOString();
}
```

### 2. Content Array Normalization

Ensure all message content is array format:

```typescript
function normalizeContent(content: any): ContentBlock[] {
  if (Array.isArray(content)) {
    return content.map(block => normalizeContentBlock(block));
  }

  if (typeof content === 'string') {
    return [{ type: 'text', text: content }];
  }

  if (content.type) {
    return [normalizeContentBlock(content)];
  }

  throw new Error('Invalid content format');
}

function normalizeContentBlock(block: any): ContentBlock {
  // Ensure required fields
  if (!block.type) {
    throw new Error('Content block missing type');
  }

  // Normalize text blocks
  if (block.type === 'text' && !block.text) {
    throw new Error('Text block missing text field');
  }

  return block;
}
```

### 3. Token Usage Normalization

Handle different token reporting formats:

```typescript
function normalizeTokens(tokens: any): TokenUsage {
  return {
    input_tokens: tokens.input_tokens || tokens.prompt_tokens || 0,
    output_tokens: tokens.output_tokens || tokens.completion_tokens || 0,
    cache_read_input_tokens: tokens.cache_read_input_tokens || 0,
    cache_creation_input_tokens: tokens.cache_creation_input_tokens || tokens.cache_write_tokens || 0
  };
}
```

### 4. Role Normalization

Map platform-specific roles to standard roles:

```typescript
const ROLE_MAPPING: Record<string, string> = {
  'human': 'user',
  'ai': 'assistant',
  'agent': 'assistant',
  'bot': 'assistant',
  'function': 'tool',
  'function_call': 'tool'
};

function normalizeRole(role: string): MessageRole {
  const normalized = ROLE_MAPPING[role.toLowerCase()] || role;

  if (!['user', 'assistant', 'system', 'tool', 'function'].includes(normalized)) {
    throw new Error(`Invalid role: ${role}`);
  }

  return normalized as MessageRole;
}
```

---

## Deduplication Strategy

### Multi-Level Deduplication

```
Level 1: Raw Checksum (Fast)
  ↓
Level 2: Content Hash (Medium)
  ↓
Level 3: Fuzzy Match (Slow, for edge cases)
```

### Implementation

```typescript
class Deduplicator {
  // Level 1: Exact duplicate via raw checksum
  async isDuplicateRaw(checksum: string): Promise<boolean> {
    const result = await this.db.query(
      'SELECT 1 FROM conversations WHERE raw_checksum = $1 LIMIT 1',
      [checksum]
    );
    return result.rows.length > 0;
  }

  // Level 2: Content-based duplicate
  async isDuplicateContent(conversation: UnifiedConversation): Promise<boolean> {
    const contentHash = this.computeContentHash(conversation);

    const result = await this.db.query(
      'SELECT 1 FROM conversations WHERE content_hash = $1 LIMIT 1',
      [contentHash]
    );
    return result.rows.length > 0;
  }

  // Content hash includes: messages, timestamps, roles
  private computeContentHash(conversation: UnifiedConversation): string {
    const hashInput = {
      messages: conversation.messages.map(m => ({
        role: m.role,
        content: m.content,
        timestamp: m.timestamp
      }))
    };

    return crypto
      .createHash('sha256')
      .update(JSON.stringify(hashInput))
      .digest('hex');
  }

  // Level 3: Fuzzy duplicate detection (time window + similarity)
  async findFuzzyDuplicates(
    conversation: UnifiedConversation,
    windowMs: number = 60000
  ): Promise<string[]> {
    const startTime = new Date(
      new Date(conversation.created_at).getTime() - windowMs
    ).toISOString();
    const endTime = new Date(
      new Date(conversation.created_at).getTime() + windowMs
    ).toISOString();

    const candidates = await this.db.query(`
      SELECT conversation_id, content_hash
      FROM conversations
      WHERE platform = $1
        AND created_at BETWEEN $2 AND $3
        AND total_messages = $4
    `, [
      conversation.platform.name,
      startTime,
      endTime,
      conversation.messages.length
    ]);

    // Compare content similarity
    const duplicates: string[] = [];
    for (const candidate of candidates.rows) {
      const similarity = this.computeSimilarity(
        conversation,
        candidate.conversation_id
      );

      if (similarity > 0.95) {
        duplicates.push(candidate.conversation_id);
      }
    }

    return duplicates;
  }
}
```

### Deduplication Policy

```typescript
enum DuplicateAction {
  SKIP = 'skip',          // Skip loading duplicate
  MERGE = 'merge',        // Merge metadata/tags
  VERSION = 'version',    // Keep as new version
  ERROR = 'error'         // Report as error
}

interface DeduplicationConfig {
  rawChecksum: DuplicateAction;
  contentHash: DuplicateAction;
  fuzzyMatch: DuplicateAction;
}

const DEFAULT_CONFIG: DeduplicationConfig = {
  rawChecksum: DuplicateAction.SKIP,
  contentHash: DuplicateAction.MERGE,
  fuzzyMatch: DuplicateAction.VERSION
};
```

---

## Version Tracking

### Schema Versioning

Track schema versions in the database:

```sql
CREATE TABLE schema_versions (
  version VARCHAR(20) PRIMARY KEY,
  applied_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  description TEXT,
  migration_script TEXT
);

-- Current version
INSERT INTO schema_versions (version, description)
VALUES ('1.0.0', 'Initial unified conversation schema');
```

### Migration Strategy

Use a migration-based approach:

```typescript
interface Migration {
  version: string;
  up: (db: Database) => Promise<void>;
  down: (db: Database) => Promise<void>;
}

const migrations: Migration[] = [
  {
    version: '1.0.0',
    up: async (db) => {
      await db.query(`CREATE TABLE conversations (...)`);
      await db.query(`CREATE TABLE messages (...)`);
    },
    down: async (db) => {
      await db.query(`DROP TABLE messages`);
      await db.query(`DROP TABLE conversations`);
    }
  },
  {
    version: '1.1.0',
    up: async (db) => {
      await db.query(`ALTER TABLE conversations ADD COLUMN tags TEXT[]`);
    },
    down: async (db) => {
      await db.query(`ALTER TABLE conversations DROP COLUMN tags`);
    }
  }
];

class MigrationRunner {
  async migrate(targetVersion?: string): Promise<void> {
    const currentVersion = await this.getCurrentVersion();
    const migrationsToRun = this.getMigrationsToRun(currentVersion, targetVersion);

    for (const migration of migrationsToRun) {
      console.log(`Applying migration ${migration.version}...`);
      await migration.up(this.db);
      await this.updateVersion(migration.version);
    }
  }
}
```

### Lazy Migration Pattern

Support multiple schema versions simultaneously:

```typescript
interface VersionedConversation extends UnifiedConversation {
  _schema_version: string;
}

class VersionAdapter {
  // Read any version, always return latest
  async read(id: string): Promise<UnifiedConversation> {
    const raw = await this.db.query(
      'SELECT *, schema_version FROM conversations WHERE conversation_id = $1',
      [id]
    );

    return this.migrateToLatest(raw.rows[0]);
  }

  // Migrate on read
  private migrateToLatest(conv: any): UnifiedConversation {
    const version = conv._schema_version || '1.0.0';

    if (version === CURRENT_VERSION) {
      return conv;
    }

    // Apply migration transformations
    let migrated = conv;
    for (const transform of this.getMigrationPath(version, CURRENT_VERSION)) {
      migrated = transform(migrated);
    }

    // Optionally write back migrated version
    if (this.config.writeBackMigrations) {
      this.updateConversation(migrated);
    }

    return migrated;
  }
}
```

---

## Performance Optimization

### 1. Parallel Processing

```typescript
class ParallelETL {
  async processDirectory(
    directory: string,
    concurrency: number = 10
  ): Promise<ProcessingReport> {
    const files = await this.listFiles(directory);
    const queue = new PQueue({ concurrency });

    const results = await Promise.allSettled(
      files.map(file =>
        queue.add(() => this.processSingleFile(file))
      )
    );

    return this.generateReport(results);
  }

  private async processSingleFile(file: string): Promise<void> {
    const raw = await this.extractor.extract(file);
    const transformed = await this.transformer.transform(raw);
    await this.loader.load(transformed);
  }
}
```

### 2. Batch Inserts

```typescript
class BatchLoader {
  private batch: UnifiedConversation[] = [];
  private batchSize: number = 100;

  async add(conversation: UnifiedConversation): Promise<void> {
    this.batch.push(conversation);

    if (this.batch.length >= this.batchSize) {
      await this.flush();
    }
  }

  async flush(): Promise<void> {
    if (this.batch.length === 0) return;

    // Use COPY for PostgreSQL or bulk insert
    await this.db.query(`
      COPY conversations (...)
      FROM STDIN
      WITH (FORMAT CSV, HEADER)
    `);

    this.batch = [];
  }
}
```

### 3. Incremental Updates

```typescript
class IncrementalETL {
  async processIncremental(): Promise<void> {
    const checkpoint = await this.getLastCheckpoint();

    const newData = await this.extractor.extract({
      startDate: checkpoint.lastProcessedDate,
      incremental: true
    });

    for await (const raw of newData) {
      await this.processOne(raw);
      await this.updateCheckpoint(raw.extractedAt);
    }
  }

  private async getLastCheckpoint(): Promise<Checkpoint> {
    const result = await this.db.query(
      'SELECT MAX(created_at) as last_date FROM conversations WHERE platform = $1',
      [this.platform]
    );

    return {
      lastProcessedDate: result.rows[0].last_date || new Date(0)
    };
  }
}
```

### 4. Indexing Strategy

```sql
-- Covering indexes for common queries
CREATE INDEX idx_conversations_lookup
ON conversations (platform, created_at, status)
INCLUDE (total_messages, total_cost);

-- Partial indexes for active conversations
CREATE INDEX idx_active_conversations
ON conversations (created_at DESC)
WHERE status = 'active';

-- GIN index for JSONB metadata queries
CREATE INDEX idx_platform_metadata
ON conversations USING GIN (platform_metadata);

-- B-tree index for text search
CREATE INDEX idx_workspace_path_pattern
ON conversations (workspace_path text_pattern_ops);
```

---

## Monitoring and Observability

### Metrics to Track

```typescript
interface ETLMetrics {
  // Throughput
  conversations_processed: number;
  messages_processed: number;
  bytes_processed: number;

  // Latency
  avg_extraction_time_ms: number;
  avg_transformation_time_ms: number;
  avg_loading_time_ms: number;

  // Quality
  validation_failures: number;
  duplicate_count: number;
  error_rate: number;

  // Resource
  memory_usage_mb: number;
  cpu_usage_percent: number;
  disk_usage_gb: number;
}
```

### Logging Strategy

```typescript
class ETLLogger {
  log(level: 'info' | 'warn' | 'error', message: string, context: any): void {
    const logEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      context,
      pipeline_stage: this.getCurrentStage(),
      conversation_id: context.conversation_id
    };

    // Structured logging
    console.log(JSON.stringify(logEntry));

    // Also write to audit log
    this.auditLog.insert(logEntry);
  }
}
```

### Health Checks

```typescript
class ETLHealthCheck {
  async check(): Promise<HealthStatus> {
    const checks = await Promise.all([
      this.checkDatabaseConnection(),
      this.checkStorageAccess(),
      this.checkDataFreshness(),
      this.checkErrorRate()
    ]);

    return {
      healthy: checks.every(c => c.passed),
      checks
    };
  }

  private async checkDataFreshness(): Promise<HealthCheckResult> {
    const result = await this.db.query(`
      SELECT MAX(created_at) as latest
      FROM conversations
      WHERE platform = 'claude_code'
    `);

    const latestDate = new Date(result.rows[0].latest);
    const hoursSinceUpdate = (Date.now() - latestDate.getTime()) / (1000 * 60 * 60);

    return {
      name: 'data_freshness',
      passed: hoursSinceUpdate < 24,
      message: `Latest data is ${hoursSinceUpdate.toFixed(1)} hours old`
    };
  }
}
```

---

## Error Handling and Recovery

### Retry Strategy

```typescript
class RetryableETL {
  private maxRetries = 3;
  private retryDelayMs = 1000;

  async processWithRetry(raw: RawConversation): Promise<void> {
    let lastError: Error;

    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        await this.process(raw);
        return; // Success
      } catch (error) {
        lastError = error;
        console.warn(`Attempt ${attempt} failed:`, error.message);

        if (attempt < this.maxRetries) {
          const delay = this.retryDelayMs * Math.pow(2, attempt - 1);
          await this.sleep(delay);
        }
      }
    }

    // All retries failed
    await this.logFailure(raw, lastError);
    throw lastError;
  }
}
```

### Dead Letter Queue

```typescript
class DeadLetterQueue {
  async add(
    conversation: RawConversation,
    error: Error,
    retries: number
  ): Promise<void> {
    await this.db.query(`
      INSERT INTO dead_letter_queue (
        conversation_id,
        platform,
        raw_data,
        error_message,
        retry_count,
        created_at
      ) VALUES ($1, $2, $3, $4, $5, NOW())
    `, [
      conversation.rawData.conversation_id,
      conversation.platform,
      JSON.stringify(conversation.rawData),
      error.message,
      retries
    ]);
  }

  async reprocess(): Promise<void> {
    const failed = await this.db.query(`
      SELECT * FROM dead_letter_queue
      WHERE retry_count < 5
        AND created_at > NOW() - INTERVAL '7 days'
      ORDER BY created_at ASC
      LIMIT 100
    `);

    for (const item of failed.rows) {
      try {
        await this.processOne(item);
        await this.removeFromQueue(item.id);
      } catch (error) {
        await this.incrementRetryCount(item.id);
      }
    }
  }
}
```

---

## Orchestration Example

### Simple Orchestrator

```typescript
class ETLOrchestrator {
  async runFullPipeline(): Promise<void> {
    console.log('Starting ETL pipeline...');

    // 1. Validate sources
    await this.validateSources();

    // 2. Extract
    const rawData = await this.extract();

    // 3. Transform and Load
    await this.transformAndLoad(rawData);

    // 4. Post-processing
    await this.postProcess();

    // 5. Generate report
    await this.generateReport();

    console.log('ETL pipeline completed successfully');
  }

  private async validateSources(): Promise<void> {
    for (const extractor of this.extractors) {
      const validation = await extractor.validateSource();
      if (!validation.valid) {
        throw new Error(`Source validation failed: ${validation.errors}`);
      }
    }
  }

  private async extract(): Promise<RawConversation[]> {
    const allData: RawConversation[] = [];

    for (const extractor of this.extractors) {
      for await (const conversation of extractor.extract()) {
        allData.push(conversation);
      }
    }

    return allData;
  }

  private async transformAndLoad(rawData: RawConversation[]): Promise<void> {
    const pipeline = new TransformationPipeline();
    const loader = new Loader();

    for (const raw of rawData) {
      const result = await pipeline.process(raw);

      if (result.success) {
        await loader.load(result.data);
      } else {
        await this.deadLetterQueue.add(raw, result.errors);
      }
    }
  }

  private async postProcess(): Promise<void> {
    // Compute aggregations
    await this.db.query(`
      REFRESH MATERIALIZED VIEW conversation_daily_stats
    `);

    // Run deduplication
    await new Deduplicator().findAndMergeDuplicates();
  }
}
```

---

## Summary

This ETL strategy provides:

1. **Robustness**: Multi-level validation and error handling
2. **Performance**: Parallel processing, batch operations, incremental updates
3. **Maintainability**: Clear separation of concerns, versioned schema
4. **Observability**: Comprehensive logging and metrics
5. **Extensibility**: Easy to add new platforms via extractor interface

The hybrid ELT approach preserves raw data while enabling flexible transformation and reprocessing as requirements evolve.
