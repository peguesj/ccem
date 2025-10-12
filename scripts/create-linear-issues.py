#!/usr/bin/env python3
"""
CCEM Linear Issue Creation Script
Creates Epic and all sub-issues in Linear IDFWU project with proper hierarchy.
"""

import json
import subprocess
import sys
from pathlib import Path

# Linear project configuration
PROJECT_ID = "4d649a6501f7"
TEAM_ID = "d96155e4-faea-4ccf-b8bc-36e53dc7f23f"

# Read epic description
epic_description = Path("linear-epic-ccem.md").read_text()

# Issue definitions
ISSUES = {
    "epic": {
        "title": "CCEM - Claude Code Environment Manager",
        "description": epic_description,
        "priority": 1,  # Urgent
        "labels": ["epic", "ccem-core", "feature"]
    },
    "phases": [
        {
            "name": "Phase 1: Foundation - TDD Setup (4-6 hours)",
            "issues": [
                {
                    "title": "Project Setup & Test Infrastructure",
                    "priority": 1,
                    "labels": ["phase-1", "testing", "infrastructure", "tdd"],
                    "description": """# Project Setup & Test Infrastructure

## Overview
Initialize TypeScript project with comprehensive test infrastructure using Jest, ts-jest, and ink-testing-library.

## TDD Approach
**RED**: Write failing tests for:
- TypeScript configuration loading
- Jest configuration validation
- Test runner execution

**GREEN**: Implement:
- `package.json` with all dependencies
- `tsconfig.json` with strict mode
- `jest.config.js` with ts-jest preset
- Coverage thresholds (95%)

**REFACTOR**: Optimize configuration settings

## Acceptance Criteria
- [ ] TypeScript 5.3+ configured with strict mode
- [ ] Jest 29+ with ts-jest preset configured
- [ ] ink-testing-library installed and configured
- [ ] Test coverage thresholds set to 95%
- [ ] All tests passing
- [ ] NPM scripts for test, test:watch, test:coverage

## Dependencies
```json
{
  "devDependencies": {
    "typescript": "^5.3.3",
    "jest": "^29.7.0",
    "ts-jest": "^29.1.1",
    "@types/jest": "^29.5.11",
    "ink-testing-library": "^3.0.0",
    "@types/node": "^20.10.0"
  },
  "dependencies": {
    "ink": "^4.4.1",
    "react": "^18.2.0",
    "zod": "^3.22.4"
  }
}
```

## Test Files
- `tests/setup.test.ts` - Project setup validation
- `tests/config.test.ts` - Configuration validation

## Estimated Time
4-5 hours

🤖 Generated with [Claude Code](https://claude.com/claude-code)
Co-Authored-By: Claude <noreply@anthropic.com>"""
                },
                {
                    "title": "Schema Validation System (TDD)",
                    "priority": 1,
                    "labels": ["phase-1", "schema", "tdd", "zod"],
                    "description": """# Schema Validation System (TDD)

## Overview
Implement schema validation system using Zod with comprehensive test coverage for all CCEM schemas.

## TDD Approach
**RED**: Write failing tests for:
- TUI structure schema validation
- UUID format validation
- Required field validation
- Type checking

**GREEN**: Implement:
- Schema definitions with Zod
- Validator functions
- Error handling and reporting

**REFACTOR**: Extract common patterns, improve error messages

## Acceptance Criteria
- [ ] All schemas defined with Zod (TUI, Config, Merge, etc.)
- [ ] Validator functions with comprehensive error messages
- [ ] 95%+ test coverage
- [ ] Round-trip validation tests
- [ ] Edge case coverage

## Test Files
- `tests/schema/validator.test.ts`
- `tests/schema/tui-structure.test.ts`
- `tests/schema/config.test.ts`

## Implementation Files
- `src/schema/validator.ts`
- `src/schema/definitions.ts`
- `src/schema/types.ts`

## Estimated Time
5-6 hours

🤖 Generated with [Claude Code](https://claude.com/claude-code)
Co-Authored-By: Claude <noreply@anthropic.com>"""
                },
                {
                    "title": "TypeScript Configuration & Linting",
                    "priority": 2,
                    "labels": ["phase-1", "typescript", "tooling", "eslint"],
                    "description": """# TypeScript Configuration & Linting

## Overview
Configure TypeScript compiler with strict mode and ESLint for code quality enforcement.

## Configuration Requirements
- TypeScript strict mode enabled
- `noUncheckedIndexedAccess: true`
- `exactOptionalPropertyTypes: true`
- ESLint with TypeScript parser
- Prettier integration

## Acceptance Criteria
- [ ] `tsconfig.json` configured for strict typing
- [ ] ESLint configured with @typescript-eslint
- [ ] Prettier configured and integrated
- [ ] Pre-commit hooks with lint-staged
- [ ] All files pass linting
- [ ] NPM scripts for lint, format

## Estimated Time
2-3 hours

🤖 Generated with [Claude Code](https://claude.com/claude-code)
Co-Authored-By: Claude <noreply@anthropic.com>"""
                },
                {
                    "title": "Documentation Standards Setup (TSDoc)",
                    "priority": 2,
                    "labels": ["phase-1", "documentation", "tsdoc", "typedoc"],
                    "description": """# Documentation Standards Setup (TSDoc)

## Overview
Establish TSDoc documentation standards and configure TypeDoc for API documentation generation.

## Requirements
- TSDoc syntax for all public APIs
- Required tags: @param, @returns, @throws, @example, @version, @since
- TypeDoc configuration for HTML/Markdown output
- Documentation linting

## Acceptance Criteria
- [ ] TypeDoc configured and working
- [ ] TSDoc linting integrated with ESLint
- [ ] Documentation templates created
- [ ] Example documentation written
- [ ] NPM scripts for doc generation

## Estimated Time
2-3 hours

🤖 Generated with [Claude Code](https://claude.com/claude-code)
Co-Authored-By: Claude <noreply@anthropic.com>"""
                }
            ]
        },
        {
            "name": "Phase 2: Core TUI - TDD Implementation (8-10 hours)",
            "issues": [
                {
                    "title": "Menu Navigation System (TDD with Ink)",
                    "priority": 1,
                    "labels": ["phase-2", "tui", "ink", "tdd", "react"],
                    "description": """# Menu Navigation System (TDD with Ink)

## Overview
Build interactive menu navigation system using Ink and React with comprehensive testing using ink-testing-library.

## TDD Approach
**RED**: Write failing tests for:
- Menu rendering with 10 items
- Navigation between menus
- Keyboard input handling
- Menu state management

**GREEN**: Implement:
- Menu component with Ink
- Navigation hooks
- Keyboard event handlers
- State management for current menu

**REFACTOR**: Extract reusable components, optimize rendering

## Acceptance Criteria
- [ ] Main menu with 10 items renders correctly
- [ ] Submenu navigation functional
- [ ] Keyboard input (arrow keys, enter, escape) works
- [ ] Menu state persists correctly
- [ ] 95%+ test coverage with ink-testing-library
- [ ] All tests using lastFrame(), rerender(), stdin patterns

## Test Files
- `tests/tui/menu.test.tsx`
- `tests/tui/navigation.test.tsx`

## Implementation Files
- `src/tui/Menu.tsx`
- `src/tui/Navigation.tsx`
- `src/tui/hooks/useKeyboard.ts`

## Estimated Time
8-10 hours

🤖 Generated with [Claude Code](https://claude.com/claude-code)
Co-Authored-By: Claude <noreply@anthropic.com>"""
                },
                {
                    "title": "Configuration File Parser (TDD)",
                    "priority": 1,
                    "labels": ["phase-2", "config", "parser", "tdd"],
                    "description": """# Configuration File Parser (TDD)

## Overview
Implement configuration file parser for Claude Code settings with schema validation.

## TDD Approach
**RED**: Write tests for parsing various config formats
**GREEN**: Implement parser with error handling
**REFACTOR**: Optimize and extract common patterns

## Acceptance Criteria
- [ ] Parse user-level settings.json
- [ ] Parse project-level CLAUDE.md
- [ ] Parse claude_code_config.json for MCP
- [ ] Handle malformed JSON gracefully
- [ ] Schema validation integration
- [ ] 95%+ test coverage

## Estimated Time
6-7 hours

🤖 Generated with [Claude Code](https://claude.com/claude-code)
Co-Authored-By: Claude <noreply@anthropic.com>"""
                },
                {
                    "title": "State Management System (TDD)",
                    "priority": 1,
                    "labels": ["phase-2", "state", "tdd"],
                    "description": """# State Management System (TDD)

## Overview
Build state management system for application-wide state with persistence.

## TDD Approach
Test state updates, subscriptions, and persistence before implementation.

## Acceptance Criteria
- [ ] State store with TypeScript types
- [ ] State subscription system
- [ ] State persistence to disk
- [ ] Undo/redo functionality
- [ ] 95%+ test coverage

## Estimated Time
7-8 hours

🤖 Generated with [Claude Code](https://claude.com/claude-code)
Co-Authored-By: Claude <noreply@anthropic.com>"""
                },
                {
                    "title": "File Operations Manager (TDD)",
                    "priority": 2,
                    "labels": ["phase-2", "files", "io", "tdd"],
                    "description": """# File Operations Manager (TDD)

## Overview
Implement safe file operations with atomic writes, backups, and rollback.

## TDD Approach
Test all file operations including failure scenarios before implementation.

## Acceptance Criteria
- [ ] Atomic file writes
- [ ] Backup before modify
- [ ] Rollback on failure
- [ ] Permission checks
- [ ] 95%+ test coverage with edge cases

## Estimated Time
5-6 hours

🤖 Generated with [Claude Code](https://claude.com/claude-code)
Co-Authored-By: Claude <noreply@anthropic.com>"""
                }
            ]
        },
        {
            "name": "Phase 3: Merge System - TDD + Integration (6-8 hours)",
            "issues": [
                {
                    "title": "Merge Strategy Engine (TDD)",
                    "priority": 1,
                    "labels": ["phase-3", "merge", "strategies", "tdd"],
                    "description": """# Merge Strategy Engine (TDD)

## Overview
Implement 5 merge strategies (recommended, default, conservative, hybrid, custom) with comprehensive testing.

## TDD Approach
Test each strategy with various input configurations before implementation.

## Acceptance Criteria
- [ ] 5 merge strategies implemented
- [ ] Strategy selection logic
- [ ] Merge preview functionality
- [ ] Round-trip validation tests
- [ ] 95%+ test coverage

## Estimated Time
7-8 hours

🤖 Generated with [Claude Code](https://claude.com/claude-code)
Co-Authored-By: Claude <noreply@anthropic.com>"""
                },
                {
                    "title": "Conflict Detection System (TDD)",
                    "priority": 1,
                    "labels": ["phase-3", "merge", "conflicts", "tdd"],
                    "description": """# Conflict Detection System (TDD)

## Overview
Build conflict detection and resolution system for merge operations.

## TDD Approach
Test conflict scenarios before implementing detection logic.

## Acceptance Criteria
- [ ] Detect permission conflicts
- [ ] Detect MCP server conflicts
- [ ] Interactive conflict resolution
- [ ] Conflict reporting
- [ ] 95%+ test coverage

## Estimated Time
6-7 hours

🤖 Generated with [Claude Code](https://claude.com/claude-code)
Co-Authored-By: Claude <noreply@anthropic.com>"""
                },
                {
                    "title": "Backup & Restore System (TDD)",
                    "priority": 2,
                    "labels": ["phase-3", "backup", "restore", "tdd"],
                    "description": """# Backup & Restore System (TDD)

## Overview
Implement backup and restore system with tar.gz compression.

## TDD Approach
Test backup creation, validation, and restoration before implementation.

## Acceptance Criteria
- [ ] Create tar.gz backups (level 9 compression)
- [ ] Backup validation
- [ ] Restore functionality
- [ ] Incremental backups
- [ ] 95%+ test coverage

## Estimated Time
5-6 hours

🤖 Generated with [Claude Code](https://claude.com/claude-code)
Co-Authored-By: Claude <noreply@anthropic.com>"""
                },
                {
                    "title": "Security Audit Hooks",
                    "priority": 2,
                    "labels": ["phase-3", "security", "hooks"],
                    "description": """# Security Audit Hooks

## Overview
Implement post-merge security audit hooks for validation.

## Acceptance Criteria
- [ ] Post-merge security hook
- [ ] Permission validation
- [ ] Security reporting
- [ ] Hook execution testing

## Estimated Time
3-4 hours

🤖 Generated with [Claude Code](https://claude.com/claude-code)
Co-Authored-By: Claude <noreply@anthropic.com>"""
                }
            ]
        },
        {
            "name": "Phase 4: Fork Discovery - Advanced TDD (8-10 hours)",
            "issues": [
                {
                    "title": "Chat History Analyzer (TDD)",
                    "priority": 1,
                    "labels": ["phase-4", "fork-discovery", "chat-analysis", "tdd"],
                    "description": """# Chat History Analyzer (TDD)

## Overview
Build chat history analysis system for fork point discovery.

## TDD Approach
Test with sample conversation data before implementing analysis logic.

## Acceptance Criteria
- [ ] Parse conversation history
- [ ] Identify fork-worthy contexts
- [ ] Extract file references
- [ ] Topic clustering
- [ ] 95%+ test coverage

## Estimated Time
8-9 hours

🤖 Generated with [Claude Code](https://claude.com/claude-code)
Co-Authored-By: Claude <noreply@anthropic.com>"""
                },
                {
                    "title": "Git Worktree Detector (TDD)",
                    "priority": 1,
                    "labels": ["phase-4", "fork-discovery", "git", "tdd"],
                    "description": """# Git Worktree Detector (TDD)

## Overview
Implement git worktree detection and analysis system.

## TDD Approach
Test with mock git repositories before implementing detection.

## Acceptance Criteria
- [ ] Detect git worktrees
- [ ] Analyze worktree structure
- [ ] Extract branch information
- [ ] Recommend fork strategies
- [ ] 95%+ test coverage

## Estimated Time
6-7 hours

🤖 Generated with [Claude Code](https://claude.com/claude-code)
Co-Authored-By: Claude <noreply@anthropic.com>"""
                },
                {
                    "title": "Context Extraction Engine (TDD)",
                    "priority": 2,
                    "labels": ["phase-4", "fork-discovery", "context", "tdd"],
                    "description": """# Context Extraction Engine (TDD)

## Overview
Build context extraction engine for conversation and file analysis.

## TDD Approach
Test extraction with sample data before implementation.

## Acceptance Criteria
- [ ] Extract conversation contexts
- [ ] Filter by topic/file/time
- [ ] Build minimal complete context
- [ ] Handle dependencies
- [ ] 95%+ test coverage

## Estimated Time
7-8 hours

🤖 Generated with [Claude Code](https://claude.com/claude-code)
Co-Authored-By: Claude <noreply@anthropic.com>"""
                },
                {
                    "title": "Conversation-to-Code Mapper (TDD)",
                    "priority": 2,
                    "labels": ["phase-4", "fork-discovery", "mapping", "tdd"],
                    "description": """# Conversation-to-Code Mapper (TDD)

## Overview
Implement mapper between conversation history and generated code artifacts.

## TDD Approach
Test mapping logic with known conversation-code pairs.

## Acceptance Criteria
- [ ] Map conversations to files
- [ ] Track file creation/modification
- [ ] Build dependency graph
- [ ] Export mappings
- [ ] 95%+ test coverage

## Estimated Time
6-7 hours

🤖 Generated with [Claude Code](https://claude.com/claude-code)
Co-Authored-By: Claude <noreply@anthropic.com>"""
                }
            ]
        },
        {
            "name": "Phase 5: Quality & Deployment (4-6 hours)",
            "issues": [
                {
                    "title": "Comprehensive Test Suite (95%+ Coverage)",
                    "priority": 1,
                    "labels": ["phase-5", "testing", "coverage", "quality"],
                    "description": """# Comprehensive Test Suite (95%+ Coverage)

## Overview
Ensure comprehensive test coverage across all modules.

## Acceptance Criteria
- [ ] 95%+ overall coverage
- [ ] Integration tests for all workflows
- [ ] Edge case coverage
- [ ] Performance tests
- [ ] Coverage reports in CI

## Estimated Time
6-7 hours

🤖 Generated with [Claude Code](https://claude.com/claude-code)
Co-Authored-By: Claude <noreply@anthropic.com>"""
                },
                {
                    "title": "TSDoc Documentation Complete",
                    "priority": 1,
                    "labels": ["phase-5", "documentation", "tsdoc"],
                    "description": """# TSDoc Documentation Complete

## Overview
Complete TSDoc documentation for all public APIs.

## Acceptance Criteria
- [ ] All public APIs documented
- [ ] Examples for complex functions
- [ ] Version tags on all exports
- [ ] API reference generated
- [ ] Documentation site deployed

## Estimated Time
5-6 hours

🤖 Generated with [Claude Code](https://claude.com/claude-code)
Co-Authored-By: Claude <noreply@anthropic.com>"""
                },
                {
                    "title": "CI/CD Pipeline (GitHub Actions)",
                    "priority": 1,
                    "labels": ["phase-5", "cicd", "github-actions"],
                    "description": """# CI/CD Pipeline (GitHub Actions)

## Overview
Set up comprehensive CI/CD pipeline with GitHub Actions.

## Acceptance Criteria
- [ ] Automated testing on PR
- [ ] Coverage reporting
- [ ] TypeScript compilation check
- [ ] Linting and formatting checks
- [ ] Automated releases

## Estimated Time
4-5 hours

🤖 Generated with [Claude Code](https://claude.com/claude-code)
Co-Authored-By: Claude <noreply@anthropic.com>"""
                },
                {
                    "title": "NPM Package Publishing",
                    "priority": 2,
                    "labels": ["phase-5", "npm", "publishing"],
                    "description": """# NPM Package Publishing

## Overview
Prepare and publish CCEM as NPM package.

## Acceptance Criteria
- [ ] Package configuration complete
- [ ] README and documentation
- [ ] Semantic versioning setup
- [ ] Published to NPM
- [ ] Installation verified

## Estimated Time
3-4 hours

🤖 Generated with [Claude Code](https://claude.com/claude-code)
Co-Authored-By: Claude <noreply@anthropic.com>"""
                }
            ]
        }
    ]
}

def main():
    """Create all Linear issues with proper hierarchy."""
    print("CCEM Linear Issue Creation")
    print("=" * 50)
    print(f"Project ID: {PROJECT_ID}")
    print(f"Team ID: {TEAM_ID}")
    print()

    # Calculate totals
    total_issues = 1  # Epic
    for phase in ISSUES["phases"]:
        total_issues += len(phase["issues"])

    print(f"Total issues to create: {total_issues}")
    print(f"  - 1 Epic")
    print(f"  - {total_issues - 1} Sub-issues across 5 phases")
    print()

    # Save full issue structure
    output_file = Path("linear-issues-created.json")
    output_data = {
        "project_id": PROJECT_ID,
        "team_id": TEAM_ID,
        "total_issues": total_issues,
        "epic": ISSUES["epic"],
        "phases": ISSUES["phases"],
        "instructions": {
            "method": "Use Linear MCP server or GraphQL API",
            "order": [
                "1. Create Epic first and save its ID",
                "2. Create Phase 1 issues with parentId = epic_id",
                "3. Create Phase 2 issues with parentId = epic_id",
                "4. Create Phase 3 issues with parentId = epic_id",
                "5. Create Phase 4 issues with parentId = epic_id",
                "6. Create Phase 5 issues with parentId = epic_id"
            ],
            "validation": [
                "Verify all issues created successfully",
                "Verify parent-child relationships correct",
                "Verify all labels applied",
                "Verify project assignment correct"
            ]
        }
    }

    output_file.write_text(json.dumps(output_data, indent=2))
    print(f"✅ Issue structure saved to: {output_file}")
    print()
    print("Next steps:")
    print("1. Create Epic in Linear and note its ID")
    print("2. Create sub-issues in each phase with parentId set to Epic ID")
    print("3. Verify hierarchy in Linear project view")
    print()
    print("Use Linear MCP server or visit:")
    print("https://linear.app/pegues-innovations/project/idfwu-idea-framework-unified-4d649a6501f7")

if __name__ == "__main__":
    main()
