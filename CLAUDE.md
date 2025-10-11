# CCEM Project Instructions

## Project Overview

**Name**: Claude Code Environment Manager (CCEM)
**Purpose**: Comprehensive TUI-based configuration management system for Claude Code v2.0.10
**Status**: Active Development
**Version**: 1.0.0

## Context

This project was forked from a 2.5-hour conversation that created the entire CCEM system from scratch. The conversation history, all artifacts, training data, and implementation decisions are preserved in this repository.

## Development Philosophy

1. **Training-Driven Development**: Every interaction should generate training observations
2. **Context Preservation**: Maintain complete conversation-to-code mapping
3. **Schema-First Design**: Define schemas before implementation
4. **Test-Driven**: Create test cases alongside features
5. **Relational Thinking**: Use UUID-based relationships for all data structures

## Key Directives

### Training Data Collection
**CRITICAL**: Always generate training observations, even when not explicitly requested.

Every response should append training observations covering:
- What worked well in the interaction
- What could be improved
- Patterns that emerged
- Edge cases discovered
- User preferences revealed
- Decision rationale
- Alternative approaches considered

### Slash Command Syntax
**ALWAYS** use logical and typecast argument nesting syntax when creating, modifying, or augmenting slash command definitions.

See: `training-data/USER_MEMORY_DIRECTIVE.md`

Syntax patterns:
```bash
--agent <agent-name>
--execution <ccem|claude|claude>ccem>
--if(condition) --then(action)
--config {key: value}
--array [item1, item2]
```

### Fork Point Discovery
When working with project migration, always analyze:
1. **Chat history** for context extraction
2. **Git worktrees** for parallel development detection
3. **File relationships** for dependency mapping
4. **Conversation phases** for logical boundaries

See: `training-data/fork-point-discovery-system.json`

## Project Structure

### Core Files
- `tui-structure.json` - Complete menu hierarchy with UUID relations
- `preferences.json` - User preferences (backup, execution, UI)
- `execution-strategy.json` - 5-level nested operation tree
- `snapshot-system.json` - State tracking with incremental updates

### Merge System
- `merge-analysis.json` - Multi-project analysis
- `custom-merge-plan.json` - Merge strategy definition
- `merge-consolidated-permissions.json` - Deduplicated permissions
- `merge-complete.json` - Execution report

### Recommendation System
- `recommendations.json` - AI-powered analysis
- `custom-patterns-selection.json` - User pattern selections

### Training Data (218 KB)
- `slash-command-syntax-system.json` (14.5 KB) - Comprehensive syntax
- `slash-command-examples.json` - 5 examples, 8 tests, 4 errors
- `USER_MEMORY_DIRECTIVE.md` - Formal syntax directive
- `fork-point-discovery-system.json` - Fork discovery capabilities
- `simulations/*` (203 KB) - 5 simulations, 22 tests, 17 schemas

## Development Guidelines

### Creating New Features
1. Read relevant conversation history
2. Review related training data
3. Define schema first
4. Create test cases
5. Implement feature
6. Generate training observations
7. Update documentation

### Modifying Existing Features
1. Review original conversation context
2. Check for related training data
3. Validate schema compatibility
4. Run existing tests
5. Implement changes
6. Add new test cases
7. Document decisions
8. Generate training observations

### Testing Requirements
- Unit tests for all core functions
- Integration tests for workflows
- Schema validation tests
- User journey tests
- Edge case coverage

## Tech Stack (Proposed)

- **Language**: TypeScript
- **Runtime**: Node.js
- **TUI**: ink or blessed
- **Testing**: Jest
- **Data**: JSON with UUID relations
- **Hooks**: Python/Bash
- **Build**: esbuild or tsup

## Commands

### /ccem
User-level command with actions:
- `inspect` - View configuration
- `merge` - Merge settings
- `migrate` - Fork/migrate project
- `optimize` - Generate recommendations
- `backup` - Create snapshot
- `config` - Manage preferences
- `status` - View system state
- `help` - Show documentation

## Integration Points

### Linear
- Project: (to be created)
- Team: (to be determined)
- Issue tracking for CCEM development

### Git
- Repository: (to be initialized)
- Workflow: Feature branches → main
- Commit format: Conventional commits

### Claude Code
- Hooks: post_merge_security_audit, config_reporter
- Commands: /ccem with full functionality
- MCP: Consider CCEM MCP server

## Next Development Steps

See [DEVELOPMENT_ROADMAP.md](DEVELOPMENT_ROADMAP.md) for complete roadmap.

### Phase 1: Core Implementation (Week 1-2)
1. Set up TypeScript project structure
2. Implement TUI rendering engine
3. Build menu navigation system
4. Create state management
5. Implement file operations

### Phase 2: Merge System (Week 3-4)
1. Implement merge strategies
2. Build conflict detection
3. Create backup system
4. Add security hooks
5. Test with real projects

### Phase 3: Migration System (Week 5-6)
1. Implement fork point detection
2. Build chat history analysis
3. Add git worktree support
4. Create context extraction
5. Test migration workflows

### Phase 4: Polish & Testing (Week 7-8)
1. Comprehensive test suite
2. Documentation
3. Performance optimization
4. Error handling
5. User feedback integration

## Important Notes

- This project originated from conversation, preserving that context is critical
- Training data is as important as implementation code
- Every feature should have schema, tests, examples, and training observations
- Fork point discovery is a key differentiator
- Chat history analysis enables powerful context-aware operations

## Resources

- [Conversation History](CONVERSATION_HISTORY.md) - Full transcript
- [Development Roadmap](DEVELOPMENT_ROADMAP.md) - Future plans
- [Training Data](training-data/) - All schemas and examples
- [Conversation-to-Code Mapping](docs/CONVERSATION_TO_CODE_MAPPING.md) - Implementation trace

---

**Remember**: Always generate training observations with each interaction!
