# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.2.1] - 2026-02-20

### Changed
- Updated version identifiers across package.json, apm-v4/mix.exs, and CCEMAgent Info.plist to 2.2.1

### Added
- APM v4 documentation updates
- Port manager for multi-project APM server coordination
- Elixir-architect principles documentation and enforcement in apm-v4

---

## [2.2.0] - 2026-02-01

### Added
- APM v4 gap closure: browser notifications, D3.js graph hierarchy improvements
- Toast notification system in APM dashboard
- Improved project status display in CCEM menubar agent

---

## [2.1.0] - 2025-12-01

### Added
- SwiftUI CCEM menubar agent (CCEMAgent) for macOS
- All/Active filter toggle in menubar project list
- Plane PM backfill for project tracking
- Wiki and documentation updates

---

## [2.0.0] - 2025-11-01

### Added
- CCEM APM v4 as git submodule (peguesj/ccem-apm-v4)
- Phoenix/Elixir real-time dashboard on port 3031
- D3.js dependency graph visualization
- Ralph methodology display in APM dashboard
- Multi-session token tracking

---

## [0.1.0] - 2025-09-01

### Added
- Initial TypeScript project scaffold
- Commander CLI entrypoint
- Ink-based TUI skeleton
- Basic project structure and build pipeline

---

## [1.0.0] - 2025-10-17

### Added

#### CLI Commands (7 Total)
- **`ccem merge`** - Merge configurations with 5 strategies
  - Strategy options: recommended, default, conservative, hybrid, custom
  - Auto-discovery of `.claude` directories
  - Conflict detection and resolution
  - JSON output with detailed statistics

- **`ccem backup`** - Create compressed backups
  - Configurable compression levels (1-9)
  - tar.gz format with checksums
  - Automatic validation after creation
  - Custom output directory support

- **`ccem restore`** - Restore from backups
  - Pre-restore validation
  - Force flag for confirmation skip
  - Custom restore target
  - Detailed metadata display

- **`ccem audit`** - Security vulnerability scanning
  - Severity filtering (low, medium, high, critical)
  - Pattern-based credential detection
  - Risk level assessment
  - Actionable recommendations

- **`ccem fork-discover`** - Conversation history analysis
  - Fork point identification
  - Code-to-conversation mapping
  - Context extraction
  - Training data generation

- **`ccem validate`** - Schema validation
  - Zod-based validation
  - Type checking
  - Detailed error messages

- **`ccem tui`/`ccem interactive`** - Launch interactive TUI

#### Interactive TUI (6 Views)
- **Configuration Manager**
  - Drill-down navigation for nested structures
  - View permissions, MCP servers, settings
  - Real-time validation
  - Keyboard navigation (arrow keys, enter, escape)

- **Merge View**
  - Interactive strategy selection
  - Configuration source picker
  - Conflict visualization
  - Side-by-side comparison
  - Auto-save functionality

- **Security Audit View**
  - Run security scans with progress indicators
  - Filter issues by severity
  - View detailed recommendations
  - Export audit reports
  - Color-coded severity (critical=red, high=red, medium=yellow, low=green)

- **Backup/Restore View**
  - Create backups with progress bars
  - File browser for backup selection
  - Integrity validation display
  - Restore with confirmation dialog
  - Backup metadata viewer

- **Fork Discovery View**
  - Conversation history analyzer
  - Fork point visualization
  - Code mapping display
  - Pattern recognition results
  - Export analysis functionality

- **Settings View** (Planned for v1.1.0)
  - Default strategy configuration
  - Compression level settings
  - Auto-backup management
  - TUI theme customization

#### Configuration Management Layer
- **Config Discovery**
  - Auto-detect user-level (`~/.claude`) configs
  - Auto-detect project-level (`./.claude`) configs
  - Multi-project configuration support

- **Config Reader/Writer**
  - Safe file operations with error handling
  - JSON parsing with validation
  - Multiple config file format support (config.json, claude.json, settings.json)

- **Config Comparison**
  - Deep diff for nested structures
  - Conflict identification
  - Change tracking

#### Merge System (5 Strategies)
- **Recommended Merge** - Balanced approach with smart conflict resolution
- **Default Merge** - Keep all unique values, union permissions
- **Conservative Merge** - Prefer first configuration on conflicts
- **Hybrid Merge** - Combine conservative + default strategies
- **Custom Merge** - User-defined rules for conflict resolution

**Merge Features:**
- Deep merge support for nested configurations
- Conflict detection with field-level granularity
- Auto-resolution suggestions
- Manual review flagging
- Statistics tracking (projects analyzed, conflicts detected, auto-resolved)

#### Backup System
- **Backup Creation**
  - tar.gz compression with configurable levels (1-9, default: 9)
  - Automatic timestamping
  - Source path tracking
  - File count calculation

- **Backup Validation**
  - Integrity checking with checksums
  - Metadata verification
  - File count validation
  - Timestamp validation

- **Backup Restoration**
  - Pre-restore validation
  - Safe extraction with error handling
  - Custom restore targets
  - Progress reporting

#### Security Audit System
- **Pattern Detection**
  - Exposed API keys (various formats)
  - Credentials and passwords
  - Weak passwords
  - Insecure URLs (HTTP vs HTTPS)
  - Sensitive data patterns

- **Severity Classification**
  - Critical - Immediate action required
  - High - Should fix soon
  - Medium - Review recommended
  - Low - Minor issues

- **Risk Assessment**
  - Overall risk level calculation
  - Issue count by severity
  - Security score

- **Recommendations**
  - Actionable remediation steps
  - Priority ordering
  - Context-aware suggestions

#### Fork Discovery System
- **Conversation Analysis**
  - Message parsing from JSON
  - Phase identification
  - Context extraction by topic
  - Context extraction by file
  - Context extraction by time range

- **Git Worktree Detection**
  - Worktree enumeration
  - Branch analysis
  - Parallel development pattern identification

- **Dependency Graphs**
  - Node and edge construction
  - Circular dependency detection
  - Visualization-ready data

- **Training Data Generation**
  - Fork point extraction
  - Code context preservation
  - Conversation-to-code mapping

#### Schema Validation System
- **Zod Schemas**
  - Type-safe schema definitions
  - Runtime validation
  - Type inference for TypeScript

- **Validation Engine**
  - Comprehensive error messages
  - Path tracking for nested errors
  - Custom error formatting

- **Schema Types**
  - MergeConfig schema
  - ConflictReport schema
  - BackupMetadata schema
  - SecurityAudit schema

#### UX Components
- **Progress Indicators**
  - Progress bars with percentage
  - Spinners for indeterminate operations
  - Step indicators for multi-step processes

- **Feedback Messages**
  - Success messages (green checkmarks)
  - Error messages (red alerts with suggestions)
  - Warning messages (yellow cautions)
  - Info messages (blue information)

- **Interactive Dialogs**
  - Confirmation dialogs with yes/no
  - Input dialogs for text entry
  - File selectors with keyboard navigation
  - Multi-select pickers

- **Color Coding**
  - ANSI escape codes for terminal colors
  - Severity-based coloring
  - Status-based coloring
  - Accessible color choices

#### Testing Infrastructure
- **Unit Tests** - 334+ passing tests
  - Merge strategy tests
  - Backup system tests
  - Security audit tests
  - Fork discovery tests
  - Schema validation tests

- **Integration Tests** - 135+ tests across 4 suites
  - CLI command integration
  - TUI component integration
  - End-to-end workflows
  - Error handling scenarios

- **Test Coverage** - 92.37% overall
  - Statement coverage: 92.37%
  - Branch coverage: 81.08%
  - Function coverage: 80.48%
  - Line coverage: 92.05%

- **Test Utilities**
  - ink-testing-library for TUI tests
  - Mock file system operations
  - Test fixtures and factories
  - Coverage reporting with Jest

#### TypeScript Support
- **Strict Mode** - Full strict type checking enabled
  - noUncheckedIndexedAccess
  - strictNullChecks
  - strictFunctionTypes
  - noImplicitAny

- **TSDoc Documentation**
  - Complete API documentation
  - Parameter descriptions
  - Return type documentation
  - Example usage
  - Version tags

- **Type Definitions**
  - Exported types for all public APIs
  - Type inference from Zod schemas
  - Generic type support

- **ES Module Support**
  - ESNext module target
  - .js extension in imports
  - bundler module resolution
  - Tree-shaking optimization

#### CI/CD Pipeline
- **GitHub Actions Workflow**
  - Automated testing on push/PR
  - Multi-version Node.js matrix (18, 20, 22)
  - Parallel test execution
  - Coverage reporting

- **NPM Publishing**
  - Automated publish on version tags
  - Registry authentication with token
  - Package verification

- **Quality Gates**
  - Lint checking
  - Type checking
  - Test suite execution
  - Coverage threshold enforcement (95%)

### Developer Experience
- **ESLint Configuration**
  - TypeScript-specific rules
  - React/JSX support for TUI
  - Strict type checking rules
  - Auto-fix capabilities

- **Prettier Integration**
  - Consistent code formatting
  - Auto-format on save
  - Import sorting

- **Development Scripts**
  - `npm test` - Run test suite
  - `npm run test:watch` - Watch mode
  - `npm run test:coverage` - Coverage report
  - `npm run lint` - Lint checking
  - `npm run typecheck` - Type validation
  - `npm run build` - Production build
  - `npm run docs` - Generate documentation

- **Git Hooks**
  - Pre-commit: Lint and format
  - Pre-push: Test execution
  - Commit message validation

### Documentation
- **README.md** - Complete with:
  - Installation instructions
  - Quick start guide
  - CLI command reference
  - Interactive TUI guide
  - API documentation
  - Architecture overview
  - Troubleshooting guide

- **CHANGELOG.md** - Semantic versioning
- **CONTRIBUTING.md** - Contribution guidelines
- **DEPLOYMENT_CHECKLIST.md** - Release process
- **TSDoc Comments** - Inline code documentation
- **Training Data** - Original conversation preserved

### Performance Optimizations
- **Compression**
  - Level 9 gzip for maximum compression
  - Configurable compression levels
  - Efficient streaming for large files

- **Algorithms**
  - Optimized conflict detection
  - Efficient dependency graph construction
  - Fast SHA-256 checksum calculation

- **Caching**
  - Configuration caching
  - Schema validation caching

### Security Features
- **Input Validation**
  - Zod schema validation
  - Path sanitization
  - File permission checks

- **Safe Operations**
  - Atomic file writes
  - Backup before modifications
  - Error recovery

- **Audit Capabilities**
  - Credential detection
  - Weak password identification
  - Insecure configuration detection
  - Risk level assessment

- **No Sensitive Data**
  - No hardcoded credentials
  - No telemetry collection
  - Local-only operations

[1.0.0]: https://github.com/peguesj/ccem/releases/tag/v1.0.0
[2.2.1]: https://github.com/peguesj/ccem/releases/tag/v2.2.1
[2.2.0]: https://github.com/peguesj/ccem/releases/tag/v2.2.0
[2.1.0]: https://github.com/peguesj/ccem/releases/tag/v2.1.0
[2.0.0]: https://github.com/peguesj/ccem/releases/tag/v2.0.0
[0.1.0]: https://github.com/peguesj/ccem/releases/tag/v0.1.0
