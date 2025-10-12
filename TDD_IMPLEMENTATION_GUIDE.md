# CCEM TDD Implementation Guide

**Version**: 1.0.0
**Created**: 2025-10-11
**Status**: Ready for Implementation

## Overview

This guide documents the Test-Driven Development (TDD) approach for implementing CCEM (Claude Code Environment Manager), following 2025 best practices for TypeScript, Jest, and Ink TUI testing.

## TDD Principles

### Uncle Bob's Three Rules of TDD

1. **You cannot write production code unless it makes a failing test pass**
2. **You cannot write more of a unit test than is sufficient to fail**
3. **You cannot write more production code than is sufficient to pass one failing unit test**

### RED-GREEN-REFACTOR Cycle

```
RED    → Write a failing test
  ↓
GREEN  → Write minimum code to pass
  ↓
REFACTOR → Optimize while maintaining tests
  ↓
REPEAT
```

## Testing Stack

### Core Dependencies

```json
{
  "devDependencies": {
    "typescript": "^5.3.3",
    "jest": "^29.7.0",
    "ts-jest": "^29.1.1",
    "@types/jest": "^29.5.11",
    "ink-testing-library": "^3.0.0",
    "@types/node": "^20.10.0",
    "eslint": "^8.56.0",
    "@typescript-eslint/eslint-plugin": "^6.19.0",
    "@typescript-eslint/parser": "^6.19.0",
    "prettier": "^3.2.4",
    "typedoc": "^0.25.7",
    "lint-staged": "^15.2.0",
    "husky": "^8.0.3"
  },
  "dependencies": {
    "ink": "^4.4.1",
    "react": "^18.2.0",
    "zod": "^3.22.4",
    "commander": "^11.1.0"
  }
}
```

### Jest Configuration

```javascript
// jest.config.js
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/*.test.ts', '**/*.test.tsx'],
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.test.{ts,tsx}'
  ],
  coverageThreshold: {
    global: {
      branches: 95,
      functions: 95,
      lines: 95,
      statements: 95
    }
  },
  coveragePathIgnorePatterns: [
    '/node_modules/',
    '/dist/'
  ],
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1'
  }
};
```

### TypeScript Configuration

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "commonjs",
    "lib": ["ES2022"],
    "jsx": "react",
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "moduleResolution": "node",
    "types": ["node", "jest"],
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    }
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "**/*.test.ts", "**/*.test.tsx"]
}
```

## TDD Patterns for Ink TUI

### Pattern 1: Basic Component Rendering

```typescript
// tests/tui/menu.test.tsx
import { render } from 'ink-testing-library';
import { Menu } from '@/tui/Menu';

describe('Menu Component', () => {
  it('should render main menu with 10 items', () => {
    const { lastFrame } = render(<Menu />);
    const output = lastFrame();

    expect(output).toContain('Main Menu');
    expect(output).toContain('Inspect Configuration');
    expect(output).toContain('Slash Commands Manager');
    // ... test all 10 items
  });
});
```

### Pattern 2: User Input Simulation

```typescript
// tests/tui/navigation.test.tsx
import { render } from 'ink-testing-library';
import { Menu } from '@/tui/Menu';

describe('Menu Navigation', () => {
  it('should navigate to submenu on Enter key', () => {
    const { lastFrame, stdin } = render(<Menu />);

    // Press Enter
    stdin.write('\r');

    const output = lastFrame();
    expect(output).toContain('View All Configurations');
  });

  it('should move selection with arrow keys', () => {
    const { lastFrame, stdin } = render(<Menu />);

    // Press down arrow twice
    stdin.write('\x1B[B\x1B[B');

    // Press Enter
    stdin.write('\r');

    expect(lastFrame()).toContain('Agents & Subagents Manager');
  });
});
```

### Pattern 3: Component Rerendering

```typescript
// tests/tui/counter.test.tsx
import { render } from 'ink-testing-library';
import { Counter } from '@/tui/Counter';

describe('Counter Component', () => {
  it('should update display when props change', () => {
    const { lastFrame, rerender } = render(<Counter count={0} />);

    expect(lastFrame()).toBe('Count: 0');

    rerender(<Counter count={5} />);

    expect(lastFrame()).toBe('Count: 5');
  });
});
```

## TDD Workflow by Phase

### Phase 1: Foundation - TDD Setup

#### Step 1: Write Project Setup Tests

```typescript
// tests/setup.test.ts
describe('Project Setup', () => {
  it('should load TypeScript configuration', () => {
    const tsconfig = require('../tsconfig.json');
    expect(tsconfig).toBeDefined();
    expect(tsconfig.compilerOptions.strict).toBe(true);
  });

  it('should have Jest configured with ts-jest', () => {
    const jestConfig = require('../jest.config.js');
    expect(jestConfig.preset).toBe('ts-jest');
  });

  it('should enforce 95% coverage threshold', () => {
    const jestConfig = require('../jest.config.js');
    const threshold = jestConfig.coverageThreshold.global;

    expect(threshold.branches).toBe(95);
    expect(threshold.functions).toBe(95);
    expect(threshold.lines).toBe(95);
    expect(threshold.statements).toBe(95);
  });
});
```

#### Step 2: Schema Validation TDD

```typescript
// tests/schema/validator.test.ts
import { validateSchema } from '@/schema/validator';
import { tuiStructureSchema } from '@/schema/definitions';

describe('Schema Validator', () => {
  describe('RED Phase - Write failing tests', () => {
    it('should validate correct TUI structure schema', () => {
      const validSchema = {
        id: '00000000-0000-0000-0000-000000000000',
        title: 'Test Menu',
        type: 'root'
      };

      expect(() => validateSchema(validSchema, tuiStructureSchema))
        .not.toThrow();
    });

    it('should reject invalid UUID format', () => {
      const invalidSchema = {
        id: 'not-a-uuid',
        title: 'Test Menu',
        type: 'root'
      };

      expect(() => validateSchema(invalidSchema, tuiStructureSchema))
        .toThrow('Invalid UUID format');
    });

    it('should require mandatory fields', () => {
      const missingFields = {
        id: '00000000-0000-0000-0000-000000000000'
        // Missing title and type
      };

      expect(() => validateSchema(missingFields, tuiStructureSchema))
        .toThrow();
    });
  });
});
```

#### Step 3: Implement to Pass Tests (GREEN)

```typescript
// src/schema/validator.ts
import { z } from 'zod';

/**
 * Validates data against a Zod schema.
 *
 * @param data - The data to validate
 * @param schema - The Zod schema to validate against
 * @returns The validated data
 * @throws {z.ZodError} If validation fails
 *
 * @example
 * ```typescript
 * const result = validateSchema(data, mySchema);
 * ```
 *
 * @version 1.0.0
 * @since 1.0.0
 */
export function validateSchema<T>(
  data: unknown,
  schema: z.ZodSchema<T>
): T {
  return schema.parse(data);
}
```

```typescript
// src/schema/definitions.ts
import { z } from 'zod';

const uuidSchema = z.string().uuid();

export const tuiStructureSchema = z.object({
  id: uuidSchema,
  title: z.string().min(1),
  type: z.enum(['root', 'submenu', 'action', 'view']),
  parent_id: uuidSchema.nullable().optional(),
  icon: z.string().optional(),
  description: z.string().optional(),
  shortcut: z.string().optional(),
  order: z.number().int().min(0).optional()
});

export type TUIStructure = z.infer<typeof tuiStructureSchema>;
```

#### Step 4: Refactor for Quality

```typescript
// src/schema/validator.ts (REFACTORED)
import { z } from 'zod';

/**
 * Validates data against a Zod schema with enhanced error reporting.
 *
 * @param data - The data to validate
 * @param schema - The Zod schema to validate against
 * @param options - Validation options
 * @returns The validated data
 * @throws {ValidationError} If validation fails with detailed error info
 *
 * @example
 * ```typescript
 * const result = validateSchema(data, mySchema, {
 *   errorFormat: 'detailed'
 * });
 * ```
 *
 * @version 1.0.0
 * @since 1.0.0
 */
export function validateSchema<T>(
  data: unknown,
  schema: z.ZodSchema<T>,
  options?: { errorFormat?: 'simple' | 'detailed' }
): T {
  try {
    return schema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      if (options?.errorFormat === 'detailed') {
        throw new ValidationError(
          'Schema validation failed',
          error.errors
        );
      }
    }
    throw error;
  }
}

export class ValidationError extends Error {
  constructor(
    message: string,
    public errors: z.ZodIssue[]
  ) {
    super(message);
    this.name = 'ValidationError';
  }
}
```

### Phase 2: Core TUI - TDD Implementation

#### Menu Navigation TDD Example

```typescript
// tests/tui/menu.test.tsx (RED)
import { render } from 'ink-testing-library';
import { Menu } from '@/tui/Menu';

describe('Menu Component - RED Phase', () => {
  it('should render main menu with all 10 items', () => {
    const { lastFrame } = render(<Menu />);
    const output = lastFrame();

    const menuItems = [
      'Inspect Configuration',
      'Slash Commands Manager',
      'Agents & Subagents Manager',
      'Hooks System Manager',
      'Settings & Scopes',
      'Memory & Vector Systems',
      'MCP Servers & Plugins',
      'Migration & Upgrade Tools',
      'Documentation Browser',
      'Recommendations & Optimization'
    ];

    menuItems.forEach(item => {
      expect(output).toContain(item);
    });
  });

  it('should highlight first item by default', () => {
    const { lastFrame } = render(<Menu />);
    // This test will fail until we implement highlighting
    expect(lastFrame()).toMatch(/>\s*Inspect Configuration/);
  });
});
```

```typescript
// src/tui/Menu.tsx (GREEN - Minimal implementation)
import React from 'react';
import { Box, Text } from 'ink';

const MENU_ITEMS = [
  'Inspect Configuration',
  'Slash Commands Manager',
  'Agents & Subagents Manager',
  'Hooks System Manager',
  'Settings & Scopes',
  'Memory & Vector Systems',
  'MCP Servers & Plugins',
  'Migration & Upgrade Tools',
  'Documentation Browser',
  'Recommendations & Optimization'
];

export const Menu: React.FC = () => {
  return (
    <Box flexDirection="column">
      <Text bold>Main Menu</Text>
      {MENU_ITEMS.map((item, index) => (
        <Text key={item}>
          {index === 0 ? '> ' : '  '}{item}
        </Text>
      ))}
    </Box>
  );
};
```

```typescript
// src/tui/Menu.tsx (REFACTORED - With state management)
import React, { useState } from 'react';
import { Box, Text, useInput } from 'ink';

interface MenuItem {
  id: string;
  title: string;
  icon: string;
}

const MENU_ITEMS: MenuItem[] = [
  { id: '1', title: 'Inspect Configuration', icon: '🔍' },
  { id: '2', title: 'Slash Commands Manager', icon: '📝' },
  // ... rest of items
];

/**
 * Main menu component for CCEM TUI.
 *
 * @returns Rendered menu component
 *
 * @example
 * ```tsx
 * <Menu onSelect={(item) => console.log(item)} />
 * ```
 *
 * @version 1.0.0
 * @since 1.0.0
 */
export const Menu: React.FC<{
  onSelect?: (item: MenuItem) => void;
}> = ({ onSelect }) => {
  const [selectedIndex, setSelectedIndex] = useState(0);

  useInput((input, key) => {
    if (key.upArrow) {
      setSelectedIndex(Math.max(0, selectedIndex - 1));
    }

    if (key.downArrow) {
      setSelectedIndex(Math.min(MENU_ITEMS.length - 1, selectedIndex + 1));
    }

    if (key.return) {
      onSelect?.(MENU_ITEMS[selectedIndex]);
    }
  });

  return (
    <Box flexDirection="column">
      <Text bold>Main Menu</Text>
      {MENU_ITEMS.map((item, index) => (
        <Text
          key={item.id}
          color={index === selectedIndex ? 'blue' : 'white'}
        >
          {index === selectedIndex ? '> ' : '  '}
          {item.icon} {item.title}
        </Text>
      ))}
    </Box>
  );
};
```

## Documentation Standards (TSDoc)

### Required Documentation Elements

```typescript
/**
 * Brief one-line description.
 *
 * Longer description with details about the function's behavior,
 * edge cases, and important considerations.
 *
 * @param paramName - Description of parameter
 * @param optionalParam - Description of optional parameter
 * @returns Description of return value
 * @throws {ErrorType} Description of when this error is thrown
 *
 * @example
 * ```typescript
 * const result = myFunction(arg1, arg2);
 * ```
 *
 * @see {@link RelatedFunction}
 * @version 1.0.0
 * @since 1.0.0
 * @beta - Mark as beta if API is unstable
 * @deprecated Use {@link NewFunction} instead
 */
```

### Version Management

Follow [Semantic Versioning for TypeScript](https://www.semver-ts.org/):

- **MAJOR**: Breaking changes (types narrowed for inputs, widened for outputs, exports removed)
- **MINOR**: New features (types widened for inputs, narrowed for outputs, exports added)
- **PATCH**: Bug fixes (no public API changes)

## Semantic Versioning Guidelines

### The "No New Red Squiggles" Rule

When upgrading a library, users should not get new TypeScript type errors.

### Breaking Changes (Major Version)

- Narrowing function parameters (accepting fewer types)
- Widening return types (returning more possible types)
- Removing exports
- Dropping TypeScript compiler version support

### Non-Breaking Changes (Minor Version)

- Widening function parameters (accepting more types)
- Narrowing return types (returning fewer possible types)
- Adding new exports
- Adding supported TypeScript versions

## CI/CD Integration

### GitHub Actions Workflow

```yaml
name: CI
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        node-version: [18.x, 20.x]
        typescript-version: [5.2.x, 5.3.x]

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ matrix.node-version }}

      - name: Install dependencies
        run: npm ci

      - name: Run linting
        run: npm run lint

      - name: Run tests with coverage
        run: npm run test:coverage

      - name: Upload coverage to Codecov
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/lcov.info

      - name: Build
        run: npm run build
```

## NPM Scripts

```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "lint": "eslint src tests --ext .ts,.tsx",
    "lint:fix": "eslint src tests --ext .ts,.tsx --fix",
    "format": "prettier --write \"src/**/*.{ts,tsx}\" \"tests/**/*.{ts,tsx}\"",
    "format:check": "prettier --check \"src/**/*.{ts,tsx}\" \"tests/**/*.{ts,tsx}\"",
    "typecheck": "tsc --noEmit",
    "build": "tsc",
    "docs": "typedoc --out docs src",
    "prepublishOnly": "npm run lint && npm run test:coverage && npm run build"
  }
}
```

## Best Practices Summary

### Testing

1. **One Assert Per Test**: Makes failures easy to identify
2. **AAA Pattern**: Arrange, Act, Assert
3. **Test Naming**: `should [expected behavior] when [condition]`
4. **Coverage Target**: 95% enforced by CI
5. **Watch Mode**: Use `jest --watch` during development

### Documentation

1. **TSDoc for All Public APIs**: Required
2. **Examples in Docs**: Every function should have usage example
3. **Version Tags**: Track API stability with @since, @version, @beta
4. **Deprecation Path**: Always provide migration guidance

### Semantic Versioning

1. **Document TypeScript Version Support**: Clear support policy
2. **Follow "No Red Squiggles" Rule**: Avoid breaking type changes
3. **Automate Releases**: Use semantic-release or similar
4. **Changelog**: Maintain comprehensive changelog

## Resources

- [Jest Documentation](https://jestjs.io/)
- [Ink Documentation](https://github.com/vadimdemedes/ink)
- [ink-testing-library](https://github.com/vadimdemedes/ink-testing-library)
- [TSDoc Specification](https://tsdoc.org/)
- [SemVer for TypeScript](https://www.semver-ts.org/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html)

## Linear Project

**Project**: IDFWU - IDEA Framework Unified
**Project ID**: `4d649a6501f7`
**Team**: Pegues Innovations
**Linear URL**: https://linear.app/pegues-innovations/project/idfwu-idea-framework-unified-4d649a6501f7

## Issue Structure

- **1 Epic**: CCEM - Claude Code Environment Manager
- **20 Sub-Issues** across 5 phases:
  - Phase 1: Foundation (4 issues)
  - Phase 2: Core TUI (4 issues)
  - Phase 3: Merge System (4 issues)
  - Phase 4: Fork Discovery (4 issues)
  - Phase 5: Quality & Deployment (4 issues)

---

**Generated**: 2025-10-11
**Version**: 1.0.0
**Status**: Ready for Implementation

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>
