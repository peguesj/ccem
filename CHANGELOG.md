# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2025-10-17

### Added
- **Core Merge System**
  - Configuration merge strategies with conflict detection
  - Deep merge support for nested configurations
  - Custom merge rules for permissions and settings
  - Conflict resolution with manual review support

- **Backup System**
  - Automated backup creation with tar.gz compression (level 9)
  - Backup validation with integrity checking
  - Snapshot system with file checksums
  - Restore functionality with error handling

- **Security Audit System**
  - Comprehensive security scanning for configurations
  - Detection of exposed credentials and API keys
  - Weak password identification
  - Insecure URL detection (HTTP vs HTTPS)
  - Risk level calculation (low, medium, high, critical)

- **Fork Discovery System**
  - Conversation history parsing and analysis
  - Git worktree detection and analysis
  - Context extraction by topic, file, and time range
  - Dependency graph building with circular dependency detection
  - Conversation-to-code mapping

- **Schema Validation System**
  - Zod-based schema definitions for all data structures
  - Strict type validation for configurations
  - Schema export and validation utilities

- **TUI Components** (Foundation)
  - Menu component with navigation support
  - Navigation component with arrow key handling
  - React-based TUI using Ink framework

- **Comprehensive Test Suite**
  - 336 passing tests across all modules
  - 92.37% code coverage (statements)
  - Edge case testing for all major functions
  - Integration test foundation

- **TypeScript Support**
  - Strict mode enabled with noUncheckedIndexedAccess
  - Complete TSDoc documentation
  - Type definitions for all exported functions
  - ES Module support with Node16 module resolution

- **CI/CD Pipeline**
  - GitHub Actions workflow for automated testing
  - Multi-version Node.js support (18, 20, 22)
  - Automated NPM publishing on version tags
  - Code coverage reporting with Codecov

### Developer Experience
- ESLint configuration with TypeScript support
- Prettier for code formatting
- Jest for testing with coverage reporting
- Husky for git hooks
- TypeDoc for API documentation generation

### Documentation
- Complete API documentation with TSDoc
- Training data and examples preserved from original conversation
- Comprehensive implementation guides
- Development roadmap

### Performance
- Level 9 gzip compression for backups
- Efficient SHA-256 checksum calculation
- Optimized dependency graph algorithms

### Security
- Security audit system for configuration scanning
- Input validation with Zod schemas
- Safe file operations with error handling
- No hardcoded credentials or sensitive data

[1.0.0]: https://github.com/peguesj/ccem/releases/tag/v1.0.0
