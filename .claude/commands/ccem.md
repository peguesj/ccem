---
description: Claude Code Environment Manager - Manage configurations, merge settings, migrate projects
argument-hint: <action> [options]
---

# Claude Code Environment Manager (CCEM)

Comprehensive tool for managing Claude Code configurations across user/project scopes.

## Usage

```bash
/ccem <action> [scope] [options]
```

## Actions

### `inspect` - View Configuration
Inspect Claude Code configurations at different scopes.

```bash
/ccem inspect [user|project|all]
/ccem inspect user              # View user-level settings
/ccem inspect project           # View project-level settings (current project)
/ccem inspect all               # View hierarchical configuration tree
```

**Options:**
- `--effective` - Show resolved configuration after scope precedence
- `--validate` - Run validation checks
- `--format json` - Output as JSON

**Example:**
```bash
/ccem inspect all --effective --validate
```

---

### `merge` - Merge Project Settings
Consolidate settings from multiple projects to user-level.

```bash
/ccem merge [strategy]
/ccem merge recommended         # Smart consolidation (default)
/ccem merge maximum             # Move everything to user-level
/ccem merge conservative        # Only merge identical settings
/ccem merge custom              # Interactive custom merge
```

**Options:**
- `--projects <list>` - Specific projects to merge (comma-separated)
- `--backup` - Create backup before merge (default: true)
- `--dry-run` - Preview changes without executing
- `--parallel` - Enable parallel execution (default: true)

**Example:**
```bash
/ccem merge recommended --projects lcc,strategic-thinking --dry-run
```

---

### `migrate` - Fork/Migrate Project
Initialize Claude Code configuration in a new directory, optionally migrating from current project.

```bash
/ccem migrate <target-dir>
/ccem migrate ~/myproject       # Create new project at ~/myproject
/ccem migrate new-feature       # Create in default projects dir
```

**Options:**
- `--from <source>` - Source project to migrate from (default: current)
- `--include-history` - Include chat history (default: false)
- `--include-settings` - Include project settings (default: true)
- `--analyze` - Analyze files related to project (default: true)
- `--fork` - Create independent fork (vs migration)

**Example:**
```bash
/ccem migrate ~/my-new-project --from ~/Developer/lcc --include-history --fork
```

**Workflow:**
1. Request target directory (absolute or relative to default projects dir)
2. Analyze current project files and dependencies
3. Copy relevant Claude Code configurations
4. Optionally include chat history
5. Set up new project structure
6. Report what was migrated

---

### `optimize` - Optimize Configuration
Analyze and optimize Claude Code configuration for better performance.

```bash
/ccem optimize [scope]
/ccem optimize user             # Optimize user-level settings
/ccem optimize project          # Optimize current project
/ccem optimize all              # Full optimization
```

**Optimizations:**
- Remove unused permissions
- Consolidate duplicate settings
- Optimize hook execution order
- Clean up obsolete configurations

**Options:**
- `--auto-apply` - Apply optimizations without confirmation
- `--report-only` - Generate report without changes

**Example:**
```bash
/ccem optimize all --report-only
```

---

### `backup` - Create Configuration Backup
Create compressed backup of Claude Code configurations.

```bash
/ccem backup [scope]
/ccem backup user               # Backup user-level settings
/ccem backup project            # Backup current project
/ccem backup all                # Backup everything
```

**Options:**
- `--format [tar.gz|zip]` - Archive format (default: tar.gz)
- `--compression [1-9]` - Compression level (default: from preferences)
- `--encrypt` - Encrypt backup with GPG
- `--output <path>` - Custom backup location

**Example:**
```bash
/ccem backup all --format tar.gz --compression 9 --output ~/backups/
```

---

### `config` - Configure CCEM
Configure CCEM preferences and behavior.

```bash
/ccem config [setting]
/ccem config backup             # Configure backup preferences
/ccem config execution          # Configure execution strategy
/ccem config ui                 # Configure UI preferences
```

**Settings:**
- `backup.format` - Default backup format (tar.gz, zip, tar)
- `backup.compression` - Default compression level (1-9)
- `backup.encrypt` - Enable encryption by default
- `execution.parallel` - Enable parallel execution
- `execution.max_concurrent` - Max concurrent operations
- `ui.show_defaults` - Show default values in prompts

**Example:**
```bash
/ccem config backup --format tar.gz --compression 9
```

---

### `status` - Show CCEM Status
Display current CCEM status and recent operations.

```bash
/ccem status
```

Shows:
- Last merge operation
- Active configurations
- Backup status
- Recent changes

---

### `help` - Show Help
Display detailed help for specific actions.

```bash
/ccem help [action]
/ccem help migrate              # Show detailed help for migrate action
/ccem --help                    # Show this help message
```

---

## Examples for Current Project (lcc)

```bash
# View current project configuration
/ccem inspect project

# Migrate current project to new directory
/ccem migrate ~/my-lcc-feature --include-history --fork

# Create backup before major changes
/ccem backup all --format tar.gz --compression 9

# Optimize configuration
/ccem optimize project --report-only

# Merge settings from multiple projects
/ccem merge recommended --dry-run
```

---

## Configuration Hierarchy

```
Directory-specific (./.claude/settings.local.json)
    ↓ (overrides)
Project (.claude/settings.json)
    ↓ (overrides)
User (~/.claude/settings.json)
    ↓ (overrides)
System Defaults
```

---

## Files Managed by CCEM

- `~/.claude/settings.json` - User-level settings
- `~/.claude/claude_code_config.json` - MCP servers
- `~/.claude/commands/` - User-level commands
- `~/.claude/agents/` - User-level agents
- `~/.claude/hooks/` - User-level hooks
- `~/.claude/ccem/` - CCEM data and preferences
- `.claude/settings.local.json` - Project-level settings
- `.claude/commands/` - Project-level commands

---

## Tips

- Use `--dry-run` to preview changes before executing
- CCEM creates backups automatically for destructive operations
- Preferences are saved in `~/.claude/ccem/preferences.json`
- Use `migrate` to quickly set up new projects with existing configs
- Check `/ccem status` after merge operations

---

## Version

CCEM v1.0.0 | Claude Code v2.0.10

For issues or suggestions: https://github.com/anthropics/claude-code/issues
