# CCEM Architecture

## System Overview

CCEM (Claude Code Environment Manager) is a multi-component system that provides configuration management, real-time agent monitoring, and environment orchestration for Claude Code sessions. The system consists of four layers that communicate through hooks, REST APIs, and shared configuration files.

```
+-------------------------------------------------------------------+
|                        Browser / Dashboard                         |
|   Phoenix LiveView (port 3031)    |    Python v3 fallback          |
+-----------------------------------+-------------------------------+
|                          REST API Layer                             |
|   /health  /api/data  /api/agents  /api/ralph  /api/environments   |
+-------------------------------------------------------------------+
|                       APM Server (v4 Phoenix)                      |
|   GenServers: ConfigLoader, AgentRegistry, AgentDiscovery,         |
|               NotificationServer, ProjectStore, EnvironmentScanner,|
|               CommandRunner                                        |
|   ETS: apm_agents, apm_sessions, apm_tasks, apm_commands,         |
|        apm_notifications, apm_environments                         |
+-------------------------------------------------------------------+
|                        Hooks & Integration                         |
|   session_init.sh -> start server -> register session -> reload    |
|   Bridge orchestrator (LFG <-> yj-devdrive change detection)      |
+-------------------------------------------------------------------+
|                      CCEM Core (TypeScript)                        |
|   CLI commands | TUI (Ink/React) | Merge engine | Fork discovery   |
|   Backup/restore | Security audit | Schema validation (Zod)       |
+-------------------------------------------------------------------+
```

## Component Details

### 1. CCEM Core (TypeScript)

The original CCEM v1.0.0 is a TypeScript library and CLI tool for managing Claude Code configuration files.

**Location**: `/src/`, `/dist/`

**Stack**: TypeScript 5.3+, Node.js 18+, React 18 + Ink 4, Commander.js, Zod 3.x

**Modules**:

- **CLI** (`src/cli/`) -- 7 commands: `merge`, `backup`, `restore`, `audit`, `fork-discover`, `validate`, `tui`
- **TUI** (`src/tui/`) -- React/Ink terminal interface with 6 views (ConfigManager, MergeView, AuditView, BackupView, ForkDiscoveryView, SettingsView)
- **Merge Engine** (`src/merge/`) -- 5 strategies: recommended, default, conservative, hybrid, custom. Deep conflict detection and resolution.
- **Fork Discovery** (`src/fork/`) -- Conversation history parsing, worktree detection, dependency graph building, parallel development pattern recognition.
- **Backup System** (`src/backup/`) -- tar.gz compression, integrity validation, snapshot system.
- **Security Audit** (`src/security/`) -- Credential scanning, severity classification (low/medium/high/critical), risk assessment.
- **Schema Validation** (`src/schema/`) -- Zod-based runtime validation for all configuration types.

**Test Coverage**: 867 tests at 96.89% coverage (including UI integration tests).

### 2. APM v3 (Python)

The original Agentic Performance Monitor, a single-file Python HTTP server that served the dashboard and API.

**Location**: `/apm/monitor.py`

**Stack**: Python 3, `http.server` stdlib, embedded HTML/CSS/JS dashboard

**Features**:
- Agent fleet monitoring with token usage tracking
- D3.js dependency graph visualization
- Browser notification system
- Ralph methodology flowchart display
- Slash command panel
- TODO tracking
- User input request/response queue
- Notification system with categories (info, success, warning, error, input, system)
- Multi-project support via v4 config format (backward compatible with v3 flat config)
- Per-project data isolation via `PROJECTS_DATA` dict
- Project-scoped dashboard at `/project/{name}/`
- Landing page with project selector at `/`

**Runtime**: Standalone HTTP server on port 3031.

### 3. APM v4 (Elixir/Phoenix)

The production replacement for the Python v3 monitor. A full Phoenix LiveView application with GenServer-based architecture, ETS storage, and PubSub real-time updates.

**Location**: `/apm-v4/` (git submodule from `peguesj/ccem-apm-v4`)

**Stack**: Elixir, Phoenix 1.7+, Phoenix LiveView, Bandit, Jason, daisyUI/Tailwind

**GenServers** (supervised):

| GenServer | Purpose |
|-----------|---------|
| `ConfigLoader` | Reads `apm_config.json`, exposes project config, `reload/0` |
| `AgentRegistry` | ETS-backed agent/session registration, multi-project filtering |
| `AgentDiscovery` | Polls `tasks_dir/*.output` every 5s, auto-registers agents |
| `NotificationServer` | In-memory notification queue with categories and read state |
| `ProjectStore` | ETS tables for tasks, commands, plane context, input requests per project |
| `EnvironmentScanner` | Discovers `.claude/` directories, reads CLAUDE.md, hooks, sessions |
| `CommandRunner` | Executes shell commands in project directories with timeout and streaming |

**LiveView Pages**:
- `/` -- Main dashboard with agent fleet, dependency graph, Ralph, commands, TODOs
- `/apm-all` -- All-projects overview
- `/ralph` -- Ralph flowchart view
- `/skills` -- Skills tracking
- `/timeline` -- Session timeline

**API**: 40+ REST endpoints (see [apm-v4-api.md](./apm-v4-api.md))

**Tests**: 233 passing (including v3 backward-compatibility test suite).

### 4. Bridge Orchestrator

A bash-based cross-session monitoring daemon that watches for file changes between related projects.

**Location**: `/apm/bridges/orchestrator.sh`

**Purpose**: Monitors shared resources between LFG (Local File Guardian) and yj-devdrive sessions. When source files change (btau CLI, btau core, DTF categories), it logs drift and sends APM notifications so downstream consumers know to update their integrations.

**Operations**: `start` (background), `stop`, `status`, `check` (single sync).

### 5. Hooks System

**Location**: `/apm/hooks/session_init.sh`

The SessionStart hook is the glue that connects Claude Code sessions to the APM infrastructure:

1. Claude Code starts a new session
2. `session_init.sh` receives hook payload (JSON with `session_id`, `cwd`)
3. Derives project name from `cwd` basename
4. Checks if APM v4 Phoenix is running on port 3031; starts it if not (`mix phx.server`)
5. Writes session file to `/apm/sessions/{session_id}.json`
6. Upserts project into `apm_config.json` (v4 multi-project format): adds new projects, appends sessions to existing ones, never overwrites
7. POSTs `/api/config/reload` to notify the running APM server
8. Returns JSON success payload to Claude Code hook system

### 6. Planned: SwiftUI Agent

A macOS menubar application for monitoring agent activity without a browser window. Currently at the specification stage within the APM v4 submodule (`apm-v4/swift-wrapper/`).

## Data Flow

```
Claude Code Session
        |
        | (SessionStart hook)
        v
session_init.sh
        |
        |-- writes --> apm/sessions/{id}.json
        |-- upserts --> apm/apm_config.json
        |-- starts --> APM v4 Phoenix (if not running)
        |-- POST --> /api/config/reload
        v
APM v4 Phoenix Server (port 3031)
        |
        |-- ConfigLoader reads apm_config.json
        |-- AgentDiscovery polls tasks_dir/*.output
        |-- EnvironmentScanner discovers .claude/ dirs
        |-- PubSub broadcasts state changes
        v
LiveView Dashboard (browser)
        |
        |-- WebSocket (Phoenix channels)
        |-- Real-time agent status, tokens, Ralph progress
```

## Configuration Files

| File | Format | Purpose |
|------|--------|---------|
| `apm/apm_config.json` | JSON (v4 schema) | Multi-project config: projects array, sessions, active project |
| `apm/apm_config_v4.schema.json` | JSON Schema | Validates apm_config.json structure |
| `apm/sessions/{id}.json` | JSON | Per-session metadata (project, paths, timestamps) |
| `apm-v4/prd.json` | JSON | Ralph PRD with user stories and pass/fail status |
| `~/.claude/CLAUDE.md` | Markdown | User-level Claude Code instructions |
| `.claude/CLAUDE.md` | Markdown | Project-level Claude Code instructions |
