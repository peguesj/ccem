# Contributing to CCEM

Thank you for your interest in contributing to CCEM (Claude Code Environment Manager)! This document provides guidelines and instructions for contributing to the project.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Development Workflow](#development-workflow)
- [Testing Requirements](#testing-requirements)
- [Code Style Guidelines](#code-style-guidelines)
- [Pull Request Process](#pull-request-process)
- [Documentation Standards](#documentation-standards)
- [Release Process](#release-process)

## Code of Conduct

By participating in this project, you agree to maintain a respectful and inclusive environment for all contributors.

## Getting Started

### Prerequisites

- Node.js >= 18.0.0
- npm >= 9.0.0
- Git
- TypeScript knowledge
- Familiarity with React and Ink (for TUI development)

### Development Setup

1. **Fork the repository**

   Fork the [CCEM repository](https://github.com/peguesj/ccem) to your GitHub account.

2. **Clone your fork**

   ```bash
   git clone https://github.com/YOUR_USERNAME/ccem.git
   cd ccem
   ```

3. **Add upstream remote**

   ```bash
   git remote add upstream https://github.com/peguesj/ccem.git
   ```

4. **Install dependencies**

   ```bash
   npm install
   ```

5. **Verify setup**

   ```bash
   npm run typecheck
   npm test
   npm run build
   ```

## Development Workflow

### 1. Create a Feature Branch

Always create a new branch for your work:

```bash
git checkout -b feature/your-feature-name
# or
git checkout -b fix/your-bug-fix
```

Branch naming conventions:
- `feature/` - New features
- `fix/` - Bug fixes
- `docs/` - Documentation updates
- `refactor/` - Code refactoring
- `test/` - Test additions or modifications
- `chore/` - Maintenance tasks
- `tui/` - TUI component changes
- `cli/` - CLI command changes

### 2. Make Your Changes

Follow the [TDD approach](TDD_IMPLEMENTATION_GUIDE.md):

1. **RED**: Write failing tests first
2. **GREEN**: Write minimal code to pass tests
3. **REFACTOR**: Optimize while maintaining tests

### 3. Run Tests Frequently

```bash
# Run tests in watch mode during development
npm run test:watch

# Run full test suite with coverage
npm run test:coverage

# Run specific test suites
npm test -- --testPathPattern=tui  # TUI tests only
npm test -- --testPathPattern=cli  # CLI tests only
npm test -- --testPathPattern=integration  # Integration tests only
```

### 4. Commit Your Changes

Follow conventional commits format:

```bash
git commit -m "feat: add configuration merge conflict resolution"
git commit -m "fix: resolve race condition in backup creation"
git commit -m "docs: update API documentation for merge strategies"
git commit -m "test: add edge cases for fork detection"
```

Commit message format:
- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation changes
- `test:` - Test additions or modifications
- `refactor:` - Code refactoring
- `perf:` - Performance improvements
- `chore:` - Maintenance tasks
- `ci:` - CI/CD changes

### 5. Keep Your Branch Updated

```bash
git fetch upstream
git rebase upstream/main
```

## Testing Requirements

### Coverage Threshold

All code must maintain **95% test coverage**:
- Statements: 95%
- Branches: 95%
- Functions: 95%
- Lines: 95%

The CI pipeline will fail if coverage drops below this threshold.

### Writing Tests

#### Unit Tests

```typescript
describe('MyFunction', () => {
  it('should handle valid input correctly', () => {
    const result = myFunction('valid-input');
    expect(result).toBe('expected-output');
  });

  it('should throw error for invalid input', () => {
    expect(() => myFunction('invalid')).toThrow('Expected error message');
  });
});
```

#### Integration Tests

```typescript
describe('Configuration Merge Integration', () => {
  it('should merge multiple configurations and detect conflicts', async () => {
    const configs = [config1, config2, config3];
    const result = await customMerge(configs, rules);

    expect(result.conflicts.length).toBeGreaterThan(0);
    expect(result.stats.projectsAnalyzed).toBe(3);
  });
});
```

#### TUI Component Tests

```typescript
import { render } from 'ink-testing-library';
import { ConfigManager } from '../src/tui/ConfigManager.js';

describe('ConfigManager Component', () => {
  it('should render configuration tree', () => {
    const config = {
      permissions: ['read', 'write'],
      mcpServers: { server1: { enabled: true } }
    };

    const { lastFrame } = render(<ConfigManager config={config} />);

    expect(lastFrame()).toContain('Permissions');
    expect(lastFrame()).toContain('MCP Servers');
  });

  it('should navigate with arrow keys', () => {
    const { lastFrame, stdin } = render(<ConfigManager config={testConfig} />);

    // Simulate down arrow
    stdin.write('\x1B[B');

    expect(lastFrame()).toContain('> MCP Servers');
  });

  it('should drill down on enter key', () => {
    const { lastFrame, stdin } = render(<ConfigManager config={testConfig} />);

    // Navigate to MCP Servers
    stdin.write('\x1B[B');
    // Press enter
    stdin.write('\r');

    expect(lastFrame()).toContain('server1');
  });
});
```

#### Integration Tests

Integration tests verify end-to-end workflows and CLI commands:

```typescript
import { execSync } from 'child_process';
import * as fs from 'fs/promises';
import * as path from 'path';

describe('CLI Integration', () => {
  const testDir = path.join(__dirname, 'fixtures', 'test-configs');

  beforeAll(async () => {
    // Set up test fixtures
    await fs.mkdir(testDir, { recursive: true });
  });

  afterAll(async () => {
    // Clean up test fixtures
    await fs.rm(testDir, { recursive: true, force: true });
  });

  it('should merge configurations via CLI', () => {
    const output = execSync(
      `node dist/cli.js merge --strategy recommended --config ${testDir}`,
      { encoding: 'utf-8' }
    );

    expect(output).toContain('Merge Result');
    expect(output).toContain('Projects Analyzed: 2');
  });

  it('should create and validate backup via CLI', async () => {
    const backupOutput = execSync(
      `node dist/cli.js backup --source ${testDir}`,
      { encoding: 'utf-8' }
    );

    expect(backupOutput).toContain('Backup created successfully');

    // Extract backup path from output
    const backupPath = extractBackupPath(backupOutput);

    // Validate the backup
    const validateOutput = execSync(
      `node dist/cli.js restore ${backupPath}`,
      { encoding: 'utf-8' }
    );

    expect(validateOutput).toContain('Backup is valid');
  });
});
```

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run specific test file
npm test -- backup.test.ts

# Run tests matching pattern
npm test -- --testNamePattern="merge"
```

## TUI Development

### TUI Architecture

CCEM's TUI is built with React and Ink, providing a terminal-based interface:

```
src/tui/
├── App.tsx              # Main TUI application
├── Menu.tsx             # Main menu component
├── ConfigManager.tsx    # Configuration browser
├── MergeView.tsx        # Merge interface
├── AuditView.tsx        # Security audit view
├── BackupView.tsx       # Backup/restore view
├── ForkDiscoveryView.tsx # Fork discovery view
└── components/          # Shared components
    ├── Progress.tsx     # Progress indicators
    ├── Feedback.tsx     # Success/error messages
    ├── ConfirmDialog.tsx # Confirmation dialogs
    ├── FileSelector.tsx # File browser
    └── ...
```

### Creating TUI Components

#### Basic Component Structure

```typescript
import React, { useState } from 'react';
import { Box, Text } from 'ink';

interface MyViewProps {
  config: MergeConfig;
  onBack: () => void;
}

export const MyView: React.FC<MyViewProps> = ({ config, onBack }) => {
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Handle keyboard input
  useInput((input, key) => {
    if (key.upArrow) {
      setSelectedIndex(Math.max(0, selectedIndex - 1));
    } else if (key.downArrow) {
      setSelectedIndex(Math.min(items.length - 1, selectedIndex + 1));
    } else if (key.return) {
      // Handle selection
    } else if (key.escape) {
      onBack();
    }
  });

  return (
    <Box flexDirection="column">
      <Text bold>My View Title</Text>
      {/* Component content */}
    </Box>
  );
};
```

#### Navigation Patterns

Always implement consistent navigation:

```typescript
import { useInput } from 'ink';

// Arrow key navigation
useInput((input, key) => {
  if (key.upArrow || input === 'k') {  // Support vim keys
    navigateUp();
  } else if (key.downArrow || input === 'j') {
    navigateDown();
  } else if (key.return) {
    selectItem();
  } else if (key.escape) {
    goBack();
  }
});
```

#### Progress Indicators

Use progress components for long operations:

```typescript
import { ProgressBar, Spinner } from './components/Progress.js';

// For determinate progress
<ProgressBar current={50} total={100} label="Processing files" />

// For indeterminate operations
<Spinner label="Analyzing configuration..." />
```

#### User Feedback

Provide clear feedback for all actions:

```typescript
import { Feedback } from './components/Feedback.js';

<Feedback
  type="success"  // or "error", "warning", "info"
  message="Configuration merged successfully!"
/>
```

### TUI Testing

#### Testing with ink-testing-library

```typescript
import { render } from 'ink-testing-library';

describe('MyView', () => {
  it('should render correctly', () => {
    const { lastFrame } = render(<MyView config={testConfig} onBack={jest.fn()} />);

    expect(lastFrame()).toMatchSnapshot();
    expect(lastFrame()).toContain('My View Title');
  });

  it('should handle keyboard navigation', () => {
    const { stdin, lastFrame } = render(<MyView config={testConfig} onBack={jest.fn()} />);

    // Simulate down arrow
    stdin.write('\x1B[B');

    expect(lastFrame()).toContain('> Item 2');
  });

  it('should call onBack when escape is pressed', () => {
    const onBack = jest.fn();
    const { stdin } = render(<MyView config={testConfig} onBack={onBack} />);

    // Simulate escape key
    stdin.write('\x1B');

    expect(onBack).toHaveBeenCalled();
  });
});
```

#### Testing Async Operations

```typescript
it('should show progress during operation', async () => {
  const { lastFrame, waitUntilExit } = render(<MyView {...props} />);

  // Initial state
  expect(lastFrame()).toContain('Processing...');

  // Wait for async operation
  await waitUntilExit();

  // Final state
  expect(lastFrame()).toContain('Complete!');
});
```

### TUI Best Practices

1. **Keyboard Shortcuts**
   - Always support arrow keys for navigation
   - Support vim keys (h, j, k, l) where appropriate
   - Use escape for back/cancel consistently
   - Use q for quit in main views

2. **Visual Feedback**
   - Show loading states for all async operations
   - Use color coding consistently (red=error, green=success, yellow=warning)
   - Provide clear selection indicators (>, arrows, highlights)
   - Show keyboard shortcuts in headers/footers

3. **Error Handling**
   - Catch and display all errors gracefully
   - Provide actionable error messages
   - Allow retry or back navigation on errors
   - Log errors for debugging

4. **Accessibility**
   - Use clear, descriptive labels
   - Provide keyboard alternatives for all actions
   - Test with screen readers when possible
   - Support high-contrast mode

5. **Performance**
   - Debounce rapid input
   - Virtualize long lists
   - Lazy load data when possible
   - Minimize re-renders

## Code Style Guidelines

### TypeScript

- **Strict Mode**: Always enabled
- **No `any` Type**: Use proper types or `unknown`
- **Index Access**: Check for `undefined` (enforced by `noUncheckedIndexedAccess`)
- **Optional Properties**: Use explicit `undefined` if needed

### Naming Conventions

```typescript
// Interfaces and Types - PascalCase
interface MergeConfig { }
type NodeType = 'source' | 'test';

// Functions and Variables - camelCase
function detectConflicts() { }
const mergeResult = await merge();

// Constants - UPPER_SNAKE_CASE
const DEFAULT_COMPRESSION_LEVEL = 9;

// Private/Internal Functions - prefix with underscore
function _internalHelper() { }
```

### File Organization

```
src/
├── module-name/
│   ├── index.ts          # Public exports
│   ├── types.ts          # Type definitions
│   ├── function-name.ts  # Implementation
│   └── helpers.ts        # Internal helpers
```

### Linting and Formatting

```bash
# Run ESLint
npm run lint

# Auto-fix linting issues
npm run lint:fix

# Check formatting
npm run format:check

# Auto-format code
npm run format
```

### Type Checking

```bash
# Run TypeScript compiler without emitting files
npm run typecheck
```

## Pull Request Process

### 1. Prepare Your PR

Before submitting:

```bash
# Ensure all tests pass
npm test

# Check test coverage
npm run test:coverage

# Run linting
npm run lint

# Check types
npm run typecheck

# Build successfully
npm run build
```

### 2. Create Pull Request

1. Push your branch to your fork:
   ```bash
   git push origin feature/your-feature-name
   ```

2. Go to the [CCEM repository](https://github.com/peguesj/ccem) and create a pull request

3. Fill out the PR template:

```markdown
## Description

Brief description of changes

## Type of Change

- [ ] Bug fix (non-breaking change which fixes an issue)
- [ ] New feature (non-breaking change which adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] Documentation update

## Testing

- [ ] Tests added/updated
- [ ] All tests pass locally
- [ ] Test coverage maintained at 95%+

## Checklist

- [ ] Code follows project style guidelines
- [ ] Self-review completed
- [ ] Documentation updated
- [ ] No new warnings
- [ ] Tests added for new functionality
- [ ] All CI checks pass
```

### 3. Code Review Process

- Maintainers will review your PR
- Address feedback by pushing new commits
- Once approved, your PR will be merged

### 4. After Merge

- Delete your feature branch
- Sync your fork with upstream
- Celebrate your contribution!

## Documentation Standards

All public APIs must include TSDoc documentation:

```typescript
/**
 * Brief one-line description.
 *
 * Detailed description with information about behavior,
 * edge cases, and important considerations.
 *
 * @param paramName - Description of parameter
 * @param optionalParam - Description of optional parameter (optional)
 * @returns Description of return value
 * @throws {ErrorType} When this error occurs
 *
 * @example
 * ```typescript
 * const result = myFunction('input', { option: true });
 * console.log(result);
 * ```
 *
 * @version 1.0.0
 * @since 1.0.0
 */
export function myFunction(
  paramName: string,
  optionalParam?: Options
): Result {
  // Implementation
}
```

### Documentation Requirements

- **Every public function** must have TSDoc
- **Every interface/type** must be documented
- **Include examples** for complex functions
- **Document edge cases** and error conditions
- **Version tags** for API stability tracking

## Release Process

CCEM follows [Semantic Versioning](https://semver.org/) and [SemVer for TypeScript](https://www.semver-ts.org/).

### Version Bumps

- **MAJOR (x.0.0)**: Breaking changes
  - Narrowing function parameters (accepting fewer types)
  - Widening return types (returning more possible types)
  - Removing exports

- **MINOR (0.x.0)**: New features (backward compatible)
  - Widening function parameters (accepting more types)
  - Narrowing return types (returning fewer possible types)
  - Adding new exports

- **PATCH (0.0.x)**: Bug fixes
  - No public API changes
  - Internal fixes and improvements

### Release Checklist

1. Update `CHANGELOG.md` with changes
2. Bump version in `package.json`
3. Run full test suite
4. Build and verify
5. Tag release: `git tag v1.0.0`
6. Push tag: `git push origin v1.0.0`
7. CI/CD will publish to npm

## Getting Help

- **Issues**: [GitHub Issues](https://github.com/peguesj/ccem/issues)
- **Discussions**: [GitHub Discussions](https://github.com/peguesj/ccem/discussions)
- **Documentation**: [README.md](README.md)

## Recognition

Contributors will be recognized in:
- `CHANGELOG.md` for their contributions
- GitHub contributors page
- Release notes

Thank you for contributing to CCEM!

---

**Last Updated**: 2025-10-17
**Version**: 1.0.0
