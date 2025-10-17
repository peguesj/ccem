# CCEM - Claude Code Environment Manager

> Comprehensive TUI-based configuration management system for Claude Code v2.0.10+

[![CI](https://github.com/peguesj/ccem/workflows/CI/badge.svg)](https://github.com/peguesj/ccem/actions)
[![codecov](https://codecov.io/gh/peguesj/ccem/branch/main/graph/badge.svg)](https://codecov.io/gh/peguesj/ccem)
[![npm version](https://badge.fury.io/js/%40ccem%2Fcore.svg)](https://www.npmjs.com/package/@ccem/core)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Overview

CCEM (Claude Code Environment Manager) is a powerful configuration management tool designed specifically for Claude Code v2.0.10+. It provides intelligent merging, security auditing, backup/restore capabilities, and conversation-to-code mapping through an intuitive TUI interface.

### Key Features

- **🔄 Intelligent Configuration Merging** - Deep merge with conflict detection and custom resolution strategies
- **🔒 Security Auditing** - Comprehensive security scanning for credentials, weak passwords, and insecure URLs
- **💾 Backup & Restore** - Automated backups with validation and integrity checking
- **🌳 Fork Discovery** - Map conversations to code with dependency graph analysis
- **📊 Schema Validation** - Zod-based strict type validation for all configurations
- **🎨 TUI Interface** - React-based terminal interface using Ink
- **✅ 92%+ Test Coverage** - Comprehensive test suite with 336 passing tests
- **📝 Complete Documentation** - TSDoc for all exported functions

## Installation

```bash
npm install @ccem/core
```

Or globally:

```bash
npm install -g @ccem/core
```

## Quick Start

### Configuration Merging

```typescript
import { customMerge, MergeConfig } from '@ccem/core';
import { detectConflicts } from '@ccem/core';

const baseConfig: MergeConfig = {
  permissions: ['read', 'write'],
  mcpServers: {
    server1: { enabled: true, url: 'https://api.example.com' }
  },
  settings: {
    theme: 'dark',
    debug: false
  }
};

const userConfig: MergeConfig = {
  permissions: ['read', 'execute'],
  mcpServers: {
    server2: { enabled: true, url: 'https://api.custom.com' }
  },
  settings: {
    debug: true,
    verbose: true
  }
};

// Detect conflicts
const conflicts = detectConflicts([baseConfig, userConfig]);
console.log(`Found ${conflicts.summary.total} conflicts`);

// Merge with custom rules
const mergeRules = {
  permissions: { conflictResolution: 'union' as const },
  settings: {}
};

const merged = await customMerge([baseConfig, userConfig], mergeRules);
```

### Backup & Restore

```typescript
import { createBackup, validateBackup, restoreBackup } from '@ccem/core';

// Create backup
const backupPath = await createBackup('/path/to/config');
console.log(`Backup created: ${backupPath}`);

// Validate backup
const metadata = await validateBackup(backupPath);
if (metadata.isValid) {
  console.log(`Valid backup with ${metadata.fileCount} files`);
}

// Restore from backup
await restoreBackup(backupPath, '/path/to/restore');
```

### Security Auditing

```typescript
import { runSecurityAudit } from '@ccem/core';

// Run security scan
const auditResults = await runSecurityAudit('/path/to/config');

console.log(`Security Status: ${auditResults.isSecure ? 'Secure' : 'Issues Found'}`);
console.log(`Risk Level: ${auditResults.summary.riskLevel}`);

// Review findings
auditResults.findings.forEach(finding => {
  console.log(`- ${finding}`);
});
```

### Fork Discovery & Conversation Mapping

```typescript
import { parseConversationFile, identifyConversationPhases } from '@ccem/core';
import { buildDependencyGraph, extractByTopic } from '@ccem/core';

// Parse conversation
const conversation = await parseConversationFile('/path/to/conversation.txt');

// Identify phases
const phases = identifyConversationPhases(conversation);
console.log(`Found ${phases.length} conversation phases`);

// Extract context by topic
const menuContext = extractByTopic(conversation, 'menu');
console.log(`Found ${menuContext.messages.length} messages about menus`);

// Build dependency graph
const graph = buildDependencyGraph(conversation);
console.log(`Graph has ${graph.nodes.length} nodes and ${graph.edges.length} edges`);
if (graph.hasCircularDependencies) {
  console.log('Warning: Circular dependencies detected');
}
```

### Git Worktree Detection

```typescript
import { detectWorktrees, analyzeWorktreeStructure } from '@ccem/core';
import { identifyParallelDevelopment } from '@ccem/core';

// Detect worktrees
const worktrees = await detectWorktrees('/path/to/repo');
console.log(`Found ${worktrees.length} worktrees`);

// Analyze structure
const analysis = await analyzeWorktreeStructure('/path/to/repo');
if (analysis.hasParallelDevelopment) {
  console.log('Parallel development detected!');
}

// Identify patterns
const patterns = await identifyParallelDevelopment('/path/to/repo');
patterns.forEach(pattern => {
  console.log(`${pattern.type}: ${pattern.description}`);
});
```

## API Documentation

### Merge System

- `customMerge(configs, rules)` - Merge configurations with custom rules
- `detectConflicts(configs)` - Detect conflicts between configurations

### Backup System

- `createBackup(sourcePath, outputDir?)` - Create tar.gz backup with level 9 compression
- `validateBackup(backupPath)` - Validate backup integrity
- `restoreBackup(backupPath, restorePath)` - Restore files from backup
- `createSnapshot(sourcePath)` - Create snapshot with file checksums

### Security Audit

- `runSecurityAudit(configPath)` - Run comprehensive security scan

### Fork Discovery

- `parseConversationFile(filePath)` - Parse conversation from file
- `identifyConversationPhases(conversation)` - Identify conversation phases
- `detectWorktrees(repoPath)` - Detect git worktrees
- `analyzeWorktreeStructure(repoPath)` - Analyze worktree structure
- `extractByTopic(conversation, topic)` - Extract context by topic
- `extractByFile(conversation, fileName)` - Extract context by file
- `extractByTimeRange(conversation, start, end)` - Extract context by time
- `buildDependencyGraph(conversation)` - Build dependency graph

### Schema Validation

- `validateMergeConfig(data)` - Validate merge configuration
- `validateConflictReport(data)` - Validate conflict report
- `validateBackupMetadata(data)` - Validate backup metadata

## Architecture

CCEM is built with a modular architecture:

- **`src/merge/`** - Configuration merging and conflict detection
- **`src/backup/`** - Backup creation, validation, and restoration
- **`src/security/`** - Security auditing and scanning
- **`src/fork/`** - Conversation parsing and code mapping
- **`src/schema/`** - Zod schema definitions and validation
- **`src/tui/`** - Terminal UI components

## Requirements

- Node.js >= 18.0.0
- TypeScript 5.3+
- Claude Code v2.0.10+

## Development

```bash
# Install dependencies
npm install

# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Run linter
npm run lint

# Run type checking
npm run typecheck

# Build project
npm run build

# Generate documentation
npm run docs
```

## Testing

CCEM includes a comprehensive test suite with 336 tests and 92%+ coverage:

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage
```

## Contributing

Contributions are welcome! Please read our [Contributing Guidelines](CONTRIBUTING.md) before submitting a PR.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes with conventional commits
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

MIT © [Jeremiah Pegues](https://github.com/peguesj)

## Acknowledgments

- Built with [Ink](https://github.com/vadimdemedes/ink) for TUI
- Schema validation with [Zod](https://github.com/colinhacks/zod)
- Testing with [Jest](https://jestjs.io/)
- Inspired by real-world Claude Code usage patterns

## Support

- [GitHub Issues](https://github.com/peguesj/ccem/issues)
- [Documentation](https://github.com/peguesj/ccem#readme)

---

**Made with ❤️ for the Claude Code community**
