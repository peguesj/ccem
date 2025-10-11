# USER MEMORY DIRECTIVE
## Slash Command Creation, Modification, and Augmentation

**Status**: ACTIVE
**Priority**: HIGH
**Scope**: All operations related to slash command definitions
**Created**: 2025-10-11
**Version**: 2.0.0

---

## Core Directive

**ALWAYS apply logical and typecast argument nesting syntax when creating, modifying, or augmenting slash command definitions.**

This system enables:
1. **Explicit agent prioritization** - User can specify which agent handles execution
2. **Execution strategy control** - User can define execution flow (ccem, claude, hybrid, etc.)
3. **Type-safe arguments** - Strong typing with validation and constraints
4. **Conditional logic** - If/then/else patterns within commands
5. **Multi-agent coordination** - Parallel/sequential/pipeline agent strategies
6. **Callback specification** - On-complete, on-error, on-progress handlers

---

## Syntax Specification

### Basic Patterns

```bash
# Agent specification
/command <args> --agent <agent-name|agent-type>

# Execution strategy
/command <args> --execution <ccem|claude|ccem>claude|claude>ccem|claude>ccem>claude|CCEMAgent>

# Type-safe arguments
/command <arg:type> <optional:type?> <required:type!> <with-default:type=value>

# Nested configuration
/command --config {key: value, nested: {key: value}}

# Array arguments
/command --items [item1, item2, item3]

# Conditional logic
/command --if <condition> --then <action> --else <action>

# Multi-agent coordination
/command --agents [agent1, agent2] --strategy <parallel|sequential|pipeline|hierarchical>

# Callbacks
/command --on-complete <callback> --on-error <callback> --on-progress <callback>
```

### Type System

- `string` - Any text value
- `number` - Numeric value, optionally with range: `number(min-max)`
- `boolean` - true/false, yes/no, 1/0
- `enum(opt1|opt2|opt3)` - Must be one of specified options
- `array[type]` - Comma-separated values of specified type
- `object{schema}` - Key-value pairs matching schema
- `path` - Valid filesystem path
- `regex(pattern)` - Must match regex pattern

### Type Constraints

- **Required**: `arg:type!` - Must be provided
- **Optional**: `arg:type?` - Can be omitted
- **Default**: `arg:type=value` - Has default value
- **Range**: `number(1-10)` - Numeric range
- **Length**: `string(5-100)` - String length
- **Pattern**: `string(/regex/)` - Must match pattern

---

## Use Cases

### UC-001: Prioritize Specific Agent
**Scenario**: User wants a specific agent to handle command execution
**Before**: `/fix build --target typescript`
**After**: `/fix build --target typescript --agent fix-agent`

### UC-002: Override Execution Strategy
**Scenario**: User wants pure CCEM instead of Claude-assisted
**Before**: `/ccem merge recommended`
**After**: `/ccem merge recommended --execution ccem`

### UC-003: Add Conditional Logic
**Scenario**: Command should behave differently based on conditions
**Before**: `/deploy staging`
**After**: `/deploy <env:enum(staging|production)> --if(env=production) --then(run-tests)`

### UC-004: Multi-Agent Coordination
**Scenario**: Multiple specialized agents work together
**Before**: `/quality-check`
**After**: `/quality-check --agents [fix-agent, test-agent, monitor-agent] --strategy pipeline`

### UC-005: Add Callbacks
**Scenario**: Automatic actions after command completes
**Before**: `/ccem merge`
**After**: `/ccem merge --on-complete '/ccem inspect' --on-error '/ccem rollback'`

### UC-006: Agent Configuration
**Scenario**: Pass configuration to executing agent
**Before**: `/ccem optimize`
**After**: `/ccem optimize --agent orchestrator --agent-config {parallel: true, max_concurrent: 8}`

### UC-007: Delegate to Orchestrator
**Scenario**: Use main orchestrator for coordination
**Before**: `/my-command <args>`
**After**: `/my-command <args> --orchestrator main`

### UC-008: Type Validation
**Scenario**: Strict type checking on arguments
**Before**: `/ccem backup --compression 15` (accepts invalid value)
**After**: `/ccem backup --compression <level:number(1-9)!>` (validates range)

### UC-009: Command Chaining
**Scenario**: Run multiple commands with dependencies
**Before**: Manual execution
**After**: `/workflow --chain [/build, /test, /deploy] --stop-on-error`

### UC-010: Dynamic Agent Selection
**Scenario**: Context-aware agent selection
**Before**: `/fix <target>`
**After**: `/fix <target> --agent-selector(type=error-based, mapping={build:fix-agent, test:test-agent})`

---

## Modification Operations

### Create Command
```bash
/ccem create-command <name> --description <desc> --agent <agent> --execution <strategy>
```

### Modify Command
```bash
/ccem modify-command <name> --add-arg <arg-spec> --change-agent <agent> --add-condition <condition>
```

### Augment Command
```bash
/ccem augment-command <name> --agents [list] --strategy <type> --orchestrator <orchestrator-type>
```

### Inspect Command
```bash
/ccem inspect-command <name>
```

### Delete Command
```bash
/ccem delete-command <name> --backup
```

---

## Best Practices

### Agent Selection
1. Use **specialized agents** for domain-specific tasks
2. Use **orchestrator** for complex multi-step operations
3. Use **general-purpose** for simple, straightforward tasks
4. **Specify agent explicitly** for predictable behavior

### Execution Strategy
1. Use **ccem** for deterministic operations
2. Use **claude** for nuanced decision-making
3. Use **claude>ccem** for analysis then execution
4. Use **claude>ccem>claude** for validation loops

### Argument Design
1. Use **enums** for limited choice sets
2. Add **type constraints** for safety
3. Provide **sensible defaults**
4. Make **critical args required** (!)
5. **Document** arg purpose in description

### Error Handling
1. Always provide **--on-error** callback for critical operations
2. Use **--rollback** for destructive operations
3. Add **--dry-run** for preview
4. Include **--verbose** for debugging

---

## Implementation Requirements

When implementing slash commands with this system:

1. **Parse nested syntax** - Support parentheses, brackets, braces for nesting
2. **Validate types** - Check arguments against type specifications
3. **Resolve agents** - Look up agent by name or type
4. **Execute strategy** - Follow specified execution flow
5. **Handle callbacks** - Execute on-complete/on-error/on-progress
6. **Evaluate conditions** - Process if/then/else logic
7. **Coordinate agents** - Manage parallel/sequential/pipeline execution
8. **Provide help** - Generate contextual help from type specifications

---

## Training Data Location

Comprehensive training data for this system is stored at:
- **Syntax System**: `~/.claude/ccem/training-data/slash-command-syntax-system.json`
- **Examples**: `~/.claude/ccem/training-data/slash-command-examples.json`
- **Test Cases**: 8 test cases covering various scenarios
- **Error Scenarios**: 4 error scenarios with recovery strategies
- **Migration Patterns**: 3 patterns for upgrading existing commands

---

## Integration Points

This system integrates with:
1. **CCEM Core** - Command creation and management
2. **Agent System** - Agent selection and coordination
3. **Execution Engine** - Strategy execution (ccem/claude/hybrid)
4. **Validation Engine** - Type checking and constraint validation
5. **Help System** - Contextual help generation
6. **Error Handling** - Callback execution and error recovery

---

## Future Enhancements

Planned enhancements include:
1. **Permission profiles** - Context-aware permission sets
2. **Command templates** - Reusable command patterns
3. **Visual command builder** - GUI for complex commands
4. **Command analytics** - Usage tracking and optimization
5. **Auto-completion** - Smart suggestions based on context
6. **Command composition** - Build complex workflows from simple commands

---

**REMEMBER**: This syntax system is foundational for all slash command operations. Always apply these patterns when creating, modifying, or augmenting commands to ensure consistency, type safety, and powerful agent coordination capabilities.
