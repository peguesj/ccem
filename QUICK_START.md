# CCEM Quick Start Guide

## Project Status

**Status**: Planning Complete, Ready for Implementation
**Approach**: Test-Driven Development (TDD) with 95% coverage target
**Framework**: TypeScript + Jest + Ink + React

## Immediate Next Steps

### 1. Create Linear Epic Issue (5 minutes)

```bash
# Visit Linear and create Epic manually, or use script:
# linear-epic-ccem.md contains the description
# Project: IDFWU (4d649a6501f7)
# Team: Pegues Innovations
# Labels: epic, ccem-core, feature
# Priority: Urgent (1)
```

**Linear URL**: https://linear.app/pegues-innovations/project/idfwu-idea-framework-unified-4d649a6501f7

### 2. Create GitHub Repository (2 minutes)

```bash
cd /Users/jeremiah/Developer
gh repo create ccem --public \
  --description "Claude Code Environment Manager - TUI-based config management" \
  --clone

cd ccem
```

### 3. Initialize Git and Link to Existing Work (3 minutes)

```bash
# Copy existing CCEM files to new repo
cp -r /Users/jeremiah/Developer/ccem/* .

# Initialize git
git add .
git commit -m "feat: initial CCEM project setup with TDD planning

- Comprehensive TDD implementation guide
- Linear project structure (1 Epic + 20 sub-issues)
- Training data (218 KB)
- Schema definitions and examples
- Agent-based agile methodology documentation

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"

git push -u origin main
```

### 4. Initialize TypeScript Project (10 minutes)

```bash
# Initialize package.json
npm init -y

# Install dependencies
npm install --save ink react zod commander

# Install dev dependencies
npm install --save-dev \
  typescript \
  jest \
  ts-jest \
  @types/jest \
  ink-testing-library \
  @types/node \
  @types/react \
  eslint \
  @typescript-eslint/eslint-plugin \
  @typescript-eslint/parser \
  prettier \
  typedoc \
  lint-staged \
  husky
```

### 5. Create Configuration Files (15 minutes)

#### tsconfig.json
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

#### jest.config.js
```javascript
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
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1'
  }
};
```

#### .eslintrc.js
```javascript
module.exports = {
  parser: '@typescript-eslint/parser',
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended'
  ],
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
    ecmaFeatures: {
      jsx: true
    }
  },
  rules: {
    '@typescript-eslint/no-explicit-any': 'error',
    '@typescript-eslint/explicit-function-return-type': 'warn'
  }
};
```

#### .prettierrc
```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 80,
  "tabWidth": 2
}
```

#### package.json scripts
```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "lint": "eslint src tests --ext .ts,.tsx",
    "lint:fix": "eslint src tests --ext .ts,.tsx --fix",
    "format": "prettier --write \"src/**/*.{ts,tsx}\" \"tests/**/*.{ts,tsx}\"",
    "typecheck": "tsc --noEmit",
    "build": "tsc",
    "docs": "typedoc --out docs src",
    "prepublishOnly": "npm run lint && npm run test:coverage && npm run build"
  }
}
```

### 6. Create Project Structure (5 minutes)

```bash
mkdir -p src/{schema,tui,config,merge,fork}
mkdir -p tests/{schema,tui,config,merge,fork}
mkdir -p .github/workflows

# Create placeholder files
touch tests/setup.ts
touch tests/setup.test.ts
touch src/index.ts
```

### 7. Begin Phase 1 - TDD Cycle (Start Implementation)

#### RED: Write First Failing Test

```bash
# Create tests/setup.test.ts
cat > tests/setup.test.ts << 'EOTEST'
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
EOTEST

# Run test (should pass since configs exist)
npm test
```

## TDD Workflow

```
RED    → Write failing test
  ↓
GREEN  → Write minimum code to pass
  ↓
REFACTOR → Optimize while maintaining tests
  ↓
REPEAT
```

## Key Commands

```bash
# Development
npm run test:watch     # Continuous testing
npm run lint           # Check code quality
npm run typecheck      # TypeScript validation
npm run build          # Compile TypeScript

# Quality
npm run test:coverage  # Generate coverage report
npm run lint:fix       # Auto-fix linting issues
npm run format         # Format code with Prettier
npm run docs           # Generate API documentation
```

## Documentation Resources

- [TDD Implementation Guide](TDD_IMPLEMENTATION_GUIDE.md) - Complete TDD reference
- [Implementation Status](IMPLEMENTATION_STATUS.md) - Current progress
- [CLAUDE.md](CLAUDE.md) - Project instructions
- [README.md](README.md) - Project overview

## Linear Project

**Project**: IDFWU - IDEA Framework Unified
**Project ID**: 4d649a6501f7
**URL**: https://linear.app/pegues-innovations/project/idfwu-idea-framework-unified-4d649a6501f7

**Epic**: CCEM - Claude Code Environment Manager
**Sub-Issues**: 20 across 5 phases

## Success Criteria

- ✅ 95% test coverage (enforced by CI)
- ✅ All public APIs documented with TSDoc
- ✅ SemVer compliance
- ✅ Functional TUI via `/ccem` command
- ✅ Fork point discovery operational

## Estimated Timeline

**Total**: 30-40 hours with parallel agent execution
**Phases**: 5 phases, 4 hours each average

---

**Ready to Start**: YES ✅
**Next Action**: Create Linear Epic Issue

🤖 Generated with [Claude Code](https://claude.com/claude-code)
Co-Authored-By: Claude <noreply@anthropic.com>
