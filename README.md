# Claude Code Environment Manager (CCEM)

**Version**: 1.0.0
**Created**: 2025-10-11
**Status**: Active Development

## Overview

CCEM (Claude Code Environment Manager) is a comprehensive TUI-based system for managing Claude Code v2.0.10 configurations across user, project, and directory scopes. It provides contextual information, search/filter capabilities, AI-powered recommendations, and powerful migration/fork functionality.

## Origin

This project was created through an intensive 2.5-hour collaborative conversation that resulted in:
- **17 files created** (~320 KB)
- **218 KB of training data** with schemas, examples, and test cases
- **83 permissions consolidated** from 6 projects
- **7 development phases** documented
- **4 major user directives** guiding development

The complete conversation history and all artifacts are preserved in this repository.

## Features

### 1. Configuration Inspector
- View and analyze Claude Code configurations
- User settings, permissions, hooks, MCP servers
- Project settings and overrides
- Directory-specific configurations

### 2. Search & Filter
- Search across all configuration elements
- Advanced filters and regex support
- Permission pattern matching

### 3. Recommendations & Optimization
- AI-powered configuration analysis
- Security recommendations
- Performance optimizations
- Quick wins for immediate improvements

### 4. Agent & Command Manager
- Manage subagents and slash commands
- Refine agent definitions
- Test agent configurations
- Nested argument syntax system

### 5. Settings & Scopes Manager
- Merge project settings across scopes
- Move objects between scopes
- Bulk operations
- Custom merge strategies

### 6. Migration & Version Manager
- Initialize Claude in new directories
- Fork projects with chat history
- Migrate existing projects
- Version compatibility checks
- **Chat history-based fork point discovery**
- **Git worktree analysis and migration**

### 7. Backup & Restore
- Create snapshots (tar.gz level 9)
- Restore from backups
- Scheduled backups
- Incremental updates

### 8. Security & Compliance
- Permission audits
- Security recommendations
- Compliance reports
- Post-merge security hooks

## Directory Structure

```
~/Developer/ccem/
├── README.md                          # This file
├── CLAUDE.md                          # Project instructions for Claude
├── CONVERSATION_HISTORY.md            # Complete conversation transcript
├── DEVELOPMENT_ROADMAP.md             # Development phases and future work
├── .claude/
│   ├── commands/
│   │   └── ccem.md                    # /ccem slash command
│   └── hooks/
│       ├── post_merge_security_audit.py
│       └── config_reporter.sh
├── tui-structure.json                 # Complete TUI menu system
├── preferences.json                   # User preferences
├── execution-strategy.json            # Operation tree with parallelization
├── snapshot-system.json               # State tracking
├── merge-analysis.json                # Project merge analysis
├── custom-merge-plan.json             # Custom merge strategy
├── merge-consolidated-permissions.json
├── merge-complete.json
├── recommendations.json               # AI recommendations
├── custom-patterns-selection.json     # Pattern selections
├── migration-analysis-lcc.json        # LCC fork analysis example
├── conversation-fork-ccem-001.json    # This fork's analysis
├── training-data/
│   ├── slash-command-syntax-system.json  # 14.5 KB syntax system
│   ├── slash-command-examples.json       # Examples and test cases
│   ├── USER_MEMORY_DIRECTIVE.md          # Slash command directive
│   ├── fork-point-discovery-system.json  # Fork discovery capabilities
│   └── simulations/                      # 203 KB training data
│       ├── modify-strategy-simulation.json
│       ├── view-operation-simulation.json
│       ├── parallelization-simulation.json
│       ├── dry-run-simulation.json
│       ├── save-strategy-simulation.json
│       ├── schemas/
│       │   └── unified-schemas.json      # 17 schemas
│       ├── SUMMARY.md
│       ├── INDEX.json
│       └── REPORT.md
├── handlers/
│   └── migrate-project.sh             # Migration handler
├── backups/
│   └── project-settings-backup-*.tar.gz
└── docs/
    └── (to be created)
```

## Key Components

### TUI System
- **10 main menu items** with hierarchical structure
- **UUID-based relational schema** for menu navigation
- **Context-aware displays** based on current state
- **Interactive workflows** with recursive refinement

### Merge System
- **Multiple merge strategies**: recommended, default, conservative, hybrid, custom
- **Before/after preview** with conflict detection
- **Backup with compression** (tar.gz level 9)
- **Dry-run mode** for safe testing
- **Security audit hooks** post-merge

### Training Data
- **Slash command syntax system** with nested arguments
- **10 use cases** with before/after examples
- **3 complete user journeys**
- **22 test cases** across 8 categories
- **17 schema definitions** with constraints
- **4 error scenarios** with recovery strategies

### Fork Point Discovery
- **Chat history analysis** for context extraction
- **Git worktree detection** and migration
- **Conversation-based forks** with full context
- **Context extraction** for specific features
- **Training data forks** for reusability

## Statistics

- **Total Files**: 17 core + 10 simulation files
- **Total Data**: ~320 KB + conversation metadata
- **Training Data**: 218 KB
- **Schema Definitions**: 17
- **Test Cases**: 22
- **Use Cases**: 10
- **User Journeys**: 3
- **Permissions Consolidated**: 83
- **MCP Servers**: 4
- **Hooks Created**: 2
- **Commands Created**: 7

## Development Phases

1. **Phase 1**: TUI specification and menu design
2. **Phase 2**: Custom merge specification & backup configuration
3. **Phase 3**: Execution strategy & parallel simulations
4. **Phase 4**: Merge execution & file cleanup
5. **Phase 5**: Recommendations & pattern refinement
6. **Phase 6**: Slash command syntax training data
7. **Phase 7**: Migration system & fork point discovery

## Usage

### Launch CCEM TUI
```bash
# From Claude Code (when implemented)
/ccem

# Or directly (when CLI tool is built)
ccem
```

### Common Operations
```bash
# Inspect current configuration
/ccem inspect

# Merge project settings
/ccem merge

# Migrate/fork project
/ccem migrate <target-dir>

# Generate recommendations
/ccem optimize

# Create backup
/ccem backup

# View status
/ccem status
```

## Next Steps

See [DEVELOPMENT_ROADMAP.md](DEVELOPMENT_ROADMAP.md) for detailed future plans.

### Immediate Priorities
1. Implement TUI rendering and navigation
2. Build menu system with state management
3. Implement merge functionality
4. Create test suite
5. Build CLI interface

### Future Enhancements
1. Web-based TUI interface
2. Team collaboration features
3. Cloud backup integration
4. AI-powered config generation
5. Plugin system
6. Linear/GitHub integration
7. Real-time collaboration

## Technology Stack

- **Runtime**: Node.js / TypeScript
- **TUI Framework**: (TBD - ink, blessed, or custom)
- **Data Storage**: JSON with UUID relations
- **Backup**: tar.gz with configurable compression
- **Hooks**: Python/Bash scripts
- **Testing**: Jest + custom validation

## Contributing

See [CONTRIBUTING.md](docs/CONTRIBUTING.md) (to be created)

## License

(To be determined)

## Credits

Created through collaborative AI-assisted development with Claude Code.

All artifacts, training data, and conversation history preserved for learning and reference.

---

**For more information**:
- [CONVERSATION_HISTORY.md](CONVERSATION_HISTORY.md) - Complete conversation transcript
- [DEVELOPMENT_ROADMAP.md](DEVELOPMENT_ROADMAP.md) - Future development plans
- [docs/CONVERSATION_TO_CODE_MAPPING.md](docs/CONVERSATION_TO_CODE_MAPPING.md) - How conversation led to implementation
