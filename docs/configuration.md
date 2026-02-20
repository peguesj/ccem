# CCEM Configuration Reference

## apm_config.json (v4 Multi-Project Schema)

**Location**: `~/Developer/ccem/apm/apm_config.json`

**Schema**: `~/Developer/ccem/apm/apm_config_v4.schema.json`

This is the central configuration file that the APM server reads on startup and reloads when sessions register. It uses the v4 multi-project format.

### Top-Level Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `$schema` | string | No | JSON Schema reference |
| `version` | string | Yes | Must be `"4.0.0"` |
| `port` | integer | Yes | APM server port (default: 3031, range: 1024-65535) |
| `active_project` | string | No | Name of the currently focused project |
| `projects` | array | Yes | All registered projects |
| `api_auth` | object | No | API authentication keys |

### Project Object

Each entry in the `projects` array:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | Yes | Project identifier (derived from directory basename) |
| `root` | string | Yes | Absolute path to project root directory |
| `tasks_dir` | string | No | Path to Claude Code tasks output directory |
| `prd_json` | string | No | Path to Ralph prd.json for this project |
| `todo_md` | string | No | Path to project TODO file |
| `status` | string | No | `active`, `inactive`, or `archived` (default: `active`) |
| `registered_at` | string | No | ISO 8601 timestamp of first registration |
| `sessions` | array | No | All sessions associated with this project |
| `stack` | string | No | Technology stack description |
| `plane_project_id` | string | No | Plane PM project UUID |

### Session Object

Each entry in a project's `sessions` array:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `session_id` | string (UUID) | Yes | Claude Code session UUID |
| `session_jsonl` | string | No | Path to session JSONL transcript |
| `start_time` | string | No | ISO 8601 timestamp |
| `status` | string | No | `active`, `completed`, or `stale` |

### Example

```json
{
  "$schema": "./apm_config_v4.schema.json",
  "version": "4.0.0",
  "port": 3031,
  "active_project": "ccem",
  "projects": [
    {
      "name": "ccem",
      "root": "/Users/jeremiah/Developer/ccem",
      "tasks_dir": "/private/tmp/claude-503/-Users-jeremiah-Developer-ccem/tasks",
      "prd_json": "",
      "todo_md": "",
      "status": "active",
      "registered_at": "2026-02-19T14:58:02Z",
      "sessions": [
        {
          "session_id": "7cb282f4-d516-46b7-858a-291ad3447c8f",
          "session_jsonl": "~/.claude/projects/-Users-jeremiah-Developer-ccem/7cb282f4-....jsonl",
          "start_time": "2026-02-19T14:58:02Z",
          "status": "active"
        }
      ]
    }
  ]
}
```

---

## CLAUDE.md Integration

CCEM integrates with the Claude Code instruction system at two levels:

### User-Level (~/.claude/CLAUDE.md)

The global `CLAUDE.md` file contains:
- CCEM APM as a required background service
- SessionStart hook configuration pointing to `session_init.sh`
- APM management commands (`/ccem apm init|start|stop|open|restart|refresh|status|manage`)
- Multi-project awareness notes

### Project-Level (.claude/CLAUDE.md)

Each project can have its own `CLAUDE.md` that takes precedence over the user-level file. The APM v4 submodule has a project-level CLAUDE.md that configures the Ralph autonomous agent workflow.

---

## Hooks System

### SessionStart Hook

**Configured in**: `~/.claude/settings.json` (or equivalent Claude Code hook configuration)

**Script**: `~/Developer/ccem/apm/hooks/session_init.sh`

**Trigger**: Every time a new Claude Code session starts.

**Input**: JSON payload from Claude Code via stdin:
```json
{
  "session_id": "uuid-here",
  "cwd": "/path/to/project"
}
```

**Actions performed**:
1. Starts APM v4 Phoenix server if not running
2. Registers session in `apm/sessions/{session_id}.json`
3. Upserts project into `apm_config.json`
4. Sends `/api/config/reload` to APM server

**Output**: JSON success payload:
```json
{
  "success": true,
  "apm_running": true,
  "apm_port": 3031,
  "session_id": "uuid-here",
  "project_name": "project-name",
  "apm_url": "http://localhost:3031"
}
```

### Prehook / Posthook (Memory System)

The modular CLAUDE.md architecture references a memory system with prehook and posthook message ingestion. These are configured in `~/.claude/config/memory-system.json` and support sentiment analysis, vectorization, and RAG capabilities.

---

## Environment Variables

The APM system uses file-based configuration rather than environment variables. Key paths are hardcoded in `session_init.sh`:

| Variable (in script) | Value | Description |
|----------------------|-------|-------------|
| `APM_DIR` | `~/Developer/ccem/apm` | APM root directory |
| `APM_V4_DIR` | `~/Developer/ccem/apm-v4` | Phoenix application root |
| `APM_PORT` | `3031` | Server port |
| `SESSIONS_DIR` | `~/Developer/ccem/apm/sessions` | Per-session JSON files |
| `CONFIG_FILE` | `~/Developer/ccem/apm/apm_config.json` | Multi-project config |
| `PID_FILE` | `~/Developer/ccem/apm-v4/.apm.pid` | Server process ID |
| `LOG_FILE` | `~/Developer/ccem/apm/hooks/apm_hook.log` | Hook execution log |

The Phoenix application itself uses standard Mix/Elixir configuration in `apm-v4/config/`.

---

## Per-Session Files

Each Claude Code session generates a file at:
```
~/Developer/ccem/apm/sessions/{session_id}.json
```

Contents:
```json
{
  "session_id": "7cb282f4-...",
  "project_name": "ccem",
  "project_root": "/Users/jeremiah/Developer/ccem",
  "start_time": "2026-02-19T14:58:02Z",
  "status": "active",
  "session_jsonl": "~/.claude/projects/-Users-jeremiah-Developer-ccem/7cb282f4-....jsonl",
  "tasks_dir": "/private/tmp/claude-503/-Users-jeremiah-Developer-ccem/tasks",
  "prd_json": "",
  "todo_md": "",
  "apm_port": 3031
}
```

---

## Ralph PRD (prd.json)

Ralph is the autonomous agent methodology. When a project has a `prd.json` file (typically at `.claude/ralph/prd.json` or in the project root), it drives autonomous development:

```json
{
  "project": "CCEM APM v4",
  "branchName": "ralph/apm-v4-gap-closure",
  "description": "Feature description",
  "userStories": [
    {
      "id": "US-001",
      "title": "Story title",
      "description": "Full description",
      "acceptanceCriteria": ["criterion 1", "criterion 2"],
      "priority": 1,
      "passes": false,
      "module": "",
      "namespace": "",
      "notes": ""
    }
  ]
}
```

The APM dashboard reads this file to display Ralph progress, flowcharts, and story status.
