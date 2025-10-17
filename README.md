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

### Global Installation (Recommended)

```bash
npm install -g @ccem/core
```

### Local Installation

```bash
npm install @ccem/core
```

## Quick Start

### CLI Quick Start

```bash
# Launch interactive TUI
ccem tui

# Merge configurations with recommended strategy
ccem merge --strategy recommended --config ./proj1/.claude ./proj2/.claude

# Create backup with compression
ccem backup --source ~/.claude --compress 9

# Security audit
ccem audit --config ~/.claude --severity high

# Validate configuration schema
ccem validate ~/.claude/config.json
```

### Programmatic Quick Start

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

## CLI Commands

CCEM provides 7 fully functional commands:

### `ccem merge`

Merge multiple Claude Code configurations with intelligent conflict detection.

```bash
# Merge with recommended strategy (balanced approach)
ccem merge --strategy recommended --config ./proj1/.claude ./proj2/.claude

# Use conservative strategy (prefer first config on conflicts)
ccem merge --strategy conservative --config ~/.claude ./.claude

# Output to file
ccem merge --strategy hybrid --output merged-config.json

# Available strategies:
# - recommended: Balanced merge with smart conflict resolution (default)
# - default: Standard merge, keeps all unique values
# - conservative: Prefer first configuration on conflicts
# - hybrid: Combines conservative + default approaches
# - custom: Use custom merge rules (programmatic only)
```

**Options:**
- `--strategy <name>` - Merge strategy (required)
- `--config <paths...>` - Configuration paths to merge (auto-discovers if omitted)
- `--output <path>` - Output file (stdout if omitted)

### `ccem backup`

Create compressed backups of Claude Code configurations.

```bash
# Backup with maximum compression
ccem backup --source ~/.claude --compress 9

# Backup to specific directory
ccem backup --source ~/.claude --output ./backups

# Quick backup (default compression level 6)
ccem backup
```

**Options:**
- `--source <path>` - Source directory (default: `./.claude`)
- `--output <path>` - Output directory (default: current directory)
- `--compress <level>` - Compression level 1-9 (default: 9)

### `ccem restore`

Restore Claude Code configurations from backup.

```bash
# Restore with confirmation
ccem restore backup-20251017.tar.gz --target ~/.claude --force

# Validate backup without restoring
ccem restore backup-20251017.tar.gz
```

**Options:**
- `--target <path>` - Restore destination (default: `./.claude`)
- `--force` - Skip confirmation prompt

### `ccem audit`

Run comprehensive security audits on configurations.

```bash
# Audit with all severity levels
ccem audit --config ~/.claude

# Show only high and critical issues
ccem audit --config ~/.claude --severity high

# Audit current directory
ccem audit
```

**Options:**
- `--config <path>` - Configuration path (default: `./.claude`)
- `--severity <level>` - Minimum severity: low, medium, high, critical (default: medium)

**Detection Capabilities:**
- Exposed API keys and credentials
- Weak passwords and authentication
- Insecure URLs (HTTP vs HTTPS)
- Sensitive data in configurations
- Permission misconfigurations

### `ccem fork-discover`

Analyze conversation history to identify fork points and code mappings.

```bash
# Analyze conversation file
ccem fork-discover --chat conversation.json --output analysis.json

# Analyze and display results
ccem fork-discover --chat ./chats/session-123.json
```

**Options:**
- `--chat <path>` - Conversation history file (required)
- `--output <path>` - Output file (stdout if omitted)

**Identifies:**
- Conversation fork points
- Code-to-conversation mappings
- Development patterns
- File modification contexts

### `ccem validate`

Validate configuration files against schema.

```bash
# Validate specific file
ccem validate ~/.claude/config.json

# Validate with detailed output
ccem validate ./project/.claude/settings.json
```

**Features:**
- Zod schema validation
- Type checking
- Structure validation
- Helpful error messages

### `ccem tui` / `ccem interactive`

Launch the interactive Terminal User Interface.

```bash
# Launch TUI
ccem tui

# Or use alias
ccem interactive
```

See [Interactive TUI](#interactive-tui) section below for details.

## Interactive TUI

CCEM features a comprehensive interactive TUI built with React and Ink, providing a visual interface for all operations.

### Launching the TUI

```bash
ccem tui
```

### TUI Views

#### 1. Configuration Manager
- Browse and inspect configurations
- Drill-down navigation for nested structures
- View permissions, MCP servers, and settings
- Real-time validation

**Navigation:**
- `↑↓` - Navigate items
- `Enter` - Select/expand item
- `Esc` - Go back

#### 2. Merge View
- Select merge strategy interactively
- Choose configuration sources
- Preview merge results
- Resolve conflicts with visual diff
- Save merged configuration

**Features:**
- Strategy comparison
- Conflict highlighting
- Side-by-side comparison
- Auto-save options

#### 3. Security Audit View
- Run security scans
- Filter by severity level
- View detailed issue information
- Export audit reports
- Apply recommendations

**Severity Levels:**
- 🔴 Critical - Immediate action required
- 🔴 High - Should fix soon
- 🟡 Medium - Review recommended
- 🟢 Low - Minor issues

#### 4. Backup/Restore View
- Create backups with progress indicator
- Browse backup files
- Validate backup integrity
- Restore with confirmation
- View backup metadata

**Features:**
- File browser
- Compression settings
- Backup history
- Integrity validation

#### 5. Fork Discovery View
- Analyze conversation history
- Visualize fork points
- View code mappings
- Export analysis results
- Training data extraction

**Analysis Features:**
- Fork point scoring
- Context extraction
- Dependency visualization
- Pattern recognition

#### 6. Settings View (Planned)
- Configure default strategies
- Set compression levels
- Manage auto-backup
- Customize TUI theme

### TUI Keyboard Shortcuts

**Global:**
- `q` or `Ctrl+C` - Quit application
- `Esc` - Go back/cancel
- `Tab` - Next field
- `Shift+Tab` - Previous field

**Navigation:**
- `↑↓` - Move up/down
- `←→` - Move left/right (tabs)
- `Enter` - Select/confirm
- `Space` - Toggle checkbox

**Lists:**
- `j/k` - Vim-style navigation
- `Home` - Jump to top
- `End` - Jump to bottom
- `PgUp/PgDn` - Page navigation

### UX Features

#### Progress Indicators
- **Progress Bars** - Visual feedback for long operations
- **Spinners** - Loading states
- **Step Indicators** - Multi-step process tracking

#### Feedback
- **Success Messages** - Green checkmarks for completed actions
- **Error Messages** - Red alerts with helpful suggestions
- **Warning Messages** - Yellow cautions for important info

#### Dialogs
- **Confirmation Dialogs** - Prevent accidental operations
- **Input Dialogs** - Collect user input
- **File Selectors** - Browse filesystem

## API Documentation

### Merge System

- `customMerge(configs, rules)` - Merge configurations with custom rules
- `recommendedMerge(configs)` - Merge with balanced strategy
- `defaultMerge(configs)` - Merge with standard strategy
- `conservativeMerge(configs)` - Merge preferring first config
- `hybridMerge(configs)` - Merge with hybrid strategy
- `detectConflicts(configs)` - Detect conflicts between configurations

### Backup System

- `createBackup(sourcePath, outputDir?)` - Create tar.gz backup with level 9 compression
- `validateBackup(backupPath)` - Validate backup integrity
- `restoreBackup(backupPath, restorePath)` - Restore files from backup
- `createSnapshot(sourcePath)` - Create snapshot with file checksums

### Security Audit

- `auditMerge(mergeResult)` - Run comprehensive security scan

### Fork Discovery

- `parseConversation(data)` - Parse conversation from data
- `identifyForkPoints(conversation)` - Identify fork points in conversation
- `detectWorktrees(repoPath)` - Detect git worktrees
- `analyzeWorktreeStructure(repoPath)` - Analyze worktree structure
- `identifyParallelDevelopment(repoPath)` - Identify parallel development patterns

### Schema Validation

- `validateSchema(data, schema)` - Validate data against Zod schema

## Architecture

CCEM is built with a modular architecture designed for extensibility and maintainability:

### Core Layers

#### Configuration Layer (`src/config/`)
- **Discovery** - Auto-detect `.claude` directories at user and project levels
- **Reader/Writer** - Safe configuration file operations with validation
- **Validator** - Schema validation using Zod
- **Compare** - Configuration diff and comparison utilities
- **Path Resolution** - Handle user-level (`~/.claude`) and project-level (`./.claude`) paths

#### Merge System (`src/merge/`)
- **Strategies** - 5 merge strategies with conflict resolution:
  - `recommendedMerge` - Balanced approach with smart defaults
  - `defaultMerge` - Keep all unique values
  - `conservativeMerge` - Prefer first configuration
  - `hybridMerge` - Combine conservative + default
  - `customMerge` - User-defined rules
- **Conflict Detection** - Deep inspection of configuration differences
- **Resolution Engine** - Automatic and manual conflict resolution
- **Backup Integration** - Auto-backup before merge operations

#### Backup System (`src/backup/`)
- **Backup Creation** - tar.gz compression with configurable levels
- **Validation** - Integrity checking with checksums
- **Restoration** - Safe restore with pre-restore validation
- **Snapshot System** - Point-in-time configuration snapshots
- **Metadata Tracking** - Timestamps, file counts, source paths

#### Security System (`src/security/`)
- **Pattern Detection** - Regex-based credential scanning
- **Severity Classification** - 4-level severity system (low, medium, high, critical)
- **Risk Assessment** - Overall security score calculation
- **Recommendations** - Actionable remediation suggestions
- **Audit Reports** - Detailed security findings

#### Fork Discovery System (`src/fork/`)
- **Chat Analyzer** - Parse and analyze conversation history
- **Worktree Detector** - Identify git worktrees and branches
- **Context Extraction** - Extract by topic, file, or time range
- **Dependency Graph** - Build code dependency visualizations
- **Pattern Recognition** - Identify parallel development patterns

#### Schema System (`src/schema/`)
- **Zod Schemas** - Type-safe schema definitions
- **Validation Engine** - Runtime validation with helpful errors
- **Type Exports** - TypeScript type generation from schemas
- **Schema Evolution** - Backward compatibility support

#### TUI Layer (`src/tui/`)
- **Views** - 6 interactive views:
  - `ConfigManager` - Browse configurations
  - `MergeView` - Interactive merging
  - `AuditView` - Security scanning
  - `BackupView` - Backup/restore operations
  - `ForkDiscoveryView` - Conversation analysis
  - `SettingsView` - Configuration (planned)
- **Components** - Reusable UI components:
  - `Progress` - Progress bars and spinners
  - `Feedback` - Success/error/warning messages
  - `ConfirmDialog` - User confirmations
  - `FileSelector` - File system browser
  - `ErrorDisplay` - Error formatting
  - `StatusMessage` - Status indicators
- **Navigation** - Keyboard-driven interface with arrow keys
- **State Management** - React hooks for component state

#### CLI Layer (`src/cli/`)
- **Command Parser** - Commander.js integration
- **Command Handlers** - 7 CLI commands
- **Option Validation** - Input validation and error handling
- **Output Formatting** - Colorized terminal output
- **Error Handling** - Graceful error messages

### Integration Points

```
┌─────────────────────────────────────────────┐
│              CLI / TUI Entry                │
└─────────────┬───────────────────────────────┘
              │
    ┌─────────┴─────────┐
    │                   │
    ▼                   ▼
┌────────┐         ┌────────┐
│  CLI   │         │  TUI   │
│Handler │         │ Views  │
└───┬────┘         └────┬───┘
    │                   │
    └─────────┬─────────┘
              │
    ┌─────────┴─────────────┐
    │                       │
    ▼                       ▼
┌──────────┐         ┌──────────┐
│  Config  │         │  Merge   │
│  Layer   │────────▶│  System  │
└────┬─────┘         └─────┬────┘
     │                     │
     │    ┌────────────────┘
     │    │
     ▼    ▼
┌──────────────┐
│   Schema     │
│  Validation  │
└──────────────┘
     │
     ├──────────┬──────────┬──────────┐
     ▼          ▼          ▼          ▼
┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐
│Backup  │ │Security│ │  Fork  │ │ Future │
│System  │ │ Audit  │ │Discovery│ │Modules │
└────────┘ └────────┘ └────────┘ └────────┘
```

### Design Principles

1. **Modularity** - Each system is independent and testable
2. **Type Safety** - TypeScript strict mode with Zod validation
3. **Extensibility** - Plugin architecture for future enhancements
4. **Performance** - Efficient algorithms with streaming for large files
5. **User Experience** - Clear error messages and progress feedback
6. **Security** - Input validation and safe file operations
7. **Testing** - Comprehensive test coverage (92%+)

### Technology Stack

- **Language**: TypeScript 5.3+ (ES2022 target)
- **Runtime**: Node.js 18+ with ES Modules
- **UI Framework**: React 18 + Ink 4
- **CLI Framework**: Commander.js
- **Validation**: Zod 3.x
- **Testing**: Jest 29 + ink-testing-library
- **Build**: TypeScript compiler (tsc)
- **Linting**: ESLint with TypeScript plugin
- **Formatting**: Prettier

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

## Troubleshooting

### Build Errors

**Issue**: `error TS1479: The current file is a CommonJS module`

**Solution**: Ensure `package.json` has `"type": "module"` and `tsconfig.json` uses `"module": "ESNext"` with `"moduleResolution": "bundler"`.

### Import Errors

**Issue**: `Cannot find module` or `Module not found`

**Solution**: Check that all imports use `.js` extensions for relative imports in ES modules, or use path aliases defined in `tsconfig.json`.

### Test Failures

**Issue**: Tests fail with coverage below 95%

**Solution**: Add test cases for uncovered branches and edge cases. Run `npm run test:coverage` to see coverage report.

### Installation Issues

**Issue**: `npm install` fails with peer dependency warnings

**Solution**: Use `npm install --legacy-peer-deps` or update to Node.js >= 18.0.0.

### TUI Not Rendering

**Issue**: Menu components don't display correctly

**Solution**: Ensure your terminal supports ANSI escape codes and Unicode characters. Try a different terminal emulator if issues persist.

## FAQ

**Q: What versions of Node.js are supported?**

A: Node.js >= 18.0.0 is required. Tested on Node.js 18.x, 20.x, and 22.x.

**Q: Can I use CCEM with Claude Code v2.0.9 or earlier?**

A: No, CCEM is specifically designed for Claude Code v2.0.10+. Some features may not work with earlier versions.

**Q: How do I contribute?**

A: See [CONTRIBUTING.md](CONTRIBUTING.md) for detailed guidelines on setting up your development environment and submitting pull requests.

**Q: Where can I report bugs or request features?**

A: Please use [GitHub Issues](https://github.com/peguesj/ccem/issues) for bug reports and feature requests.

## Support

- [GitHub Issues](https://github.com/peguesj/ccem/issues)
- [Discussions](https://github.com/peguesj/ccem/discussions)
- [Documentation](https://github.com/peguesj/ccem#readme)
- [Contributing Guide](CONTRIBUTING.md)

## Changelog

See [CHANGELOG.md](CHANGELOG.md) for a complete history of changes.

---

**Made with ❤️ for the Claude Code community**
