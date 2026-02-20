# Multi-Project Support

CCEM APM v4 monitors multiple Claude Code projects through a single server instance. Each project maintains its own namespace for agents, sessions, tasks, commands, and notifications.

## How It Works

### Single Server, Many Projects

One APM server runs on port 3031. All Claude Code sessions across all projects connect to this same server. The `apm_config.json` file maintains a `projects` array where each project has its own configuration and session list.

### Automatic Registration

When you open a Claude Code session in any directory, the `session_init.sh` hook automatically:

1. Derives the project name from the directory basename (e.g., `/Users/jeremiah/Developer/ccem` becomes `ccem`)
2. Checks if this project already exists in `apm_config.json`
3. If new: adds the project with its root path, tasks directory, and the current session
4. If existing: appends the new session to the project's sessions array
5. Sets `active_project` to the current project
6. Sends a config reload to the APM server

No manual configuration is needed. Projects appear automatically as you work across different codebases.

### Data Isolation

Each project has its own namespace for runtime data:

| Data Type | Scope | Storage (v4) |
|-----------|-------|------------|
| Agents | Per-project | ETS `apm_agents` with project key |
| Sessions | Per-project | `apm_config.json` projects[].sessions |
| Tasks | Per-project | ETS `apm_tasks` |
| Commands | Per-project | ETS `apm_commands` |
| Plane PM | Per-project | ETS `apm_plane` |
| Notifications | Global | In-memory list |
| Input Requests | Global | In-memory list |

### The active_project Field

The `active_project` field in `apm_config.json` determines which project is shown by default when API endpoints are called without a `?project=` parameter. It is automatically updated to the most recently started session's project.

## Viewing Multiple Projects

### Landing Page

Navigate to `http://localhost:3031` to see the project selector. Each project is shown as a card with:
- Project name and status badge
- Active/total session counts
- Discovered agent count
- Ralph progress (if prd.json is configured)

Click any card to view that project's full dashboard.

### Project-Scoped Dashboard

The URL `http://localhost:3031/project/{name}/` shows the full dashboard filtered to a single project. All API calls from this view are automatically scoped to the selected project.

### All-Projects Overview

The LiveView page at `http://localhost:3031/apm-all` shows a grid overview of all projects simultaneously.

## API Project Scoping

Most API endpoints support the `?project=<name>` query parameter:

```bash
# Data for the active project (default)
curl http://localhost:3031/api/data

# Data for a specific project
curl http://localhost:3031/api/data?project=lfg

# Discover agents in a specific project
curl http://localhost:3031/api/agents/discover?project=viki

# Ralph data for a specific project
curl http://localhost:3031/api/ralph?project=ccem
```

When `?project=` is omitted, the `active_project` from config is used.

## Configuration Example

A typical `apm_config.json` with multiple projects:

```json
{
  "version": "4.0.0",
  "port": 3031,
  "active_project": "ccem",
  "projects": [
    {
      "name": "ccem",
      "root": "/Users/jeremiah/Developer/ccem",
      "status": "active",
      "sessions": [
        {"session_id": "abc-123", "status": "active", "start_time": "2026-02-19T14:58:02Z"}
      ]
    },
    {
      "name": "lfg",
      "root": "/Users/jeremiah/tools/@yj/lfg",
      "status": "active",
      "stack": "Bash, Swift, Python3, HTML/CSS/JS",
      "sessions": [
        {"session_id": "def-456", "status": "active", "start_time": "2026-02-19T15:01:45Z"}
      ]
    },
    {
      "name": "viki",
      "root": "/Users/jeremiah/Developer/viki",
      "status": "active",
      "sessions": [
        {"session_id": "ghi-789", "status": "active", "start_time": "2026-02-18T03:23:47Z"},
        {"session_id": "jkl-012", "status": "active", "start_time": "2026-02-19T14:07:24Z"}
      ]
    }
  ]
}
```

## Cross-Project Monitoring

The Bridge Orchestrator (`apm/bridges/orchestrator.sh`) provides cross-project change detection. It monitors shared resources between related projects (e.g., LFG and yj-devdrive) and sends APM notifications when source files change, alerting downstream consumers to potential compatibility issues.

Start the orchestrator:
```bash
~/Developer/ccem/apm/bridges/orchestrator.sh start
```

It runs in the background, checking for changes every 30 seconds and posting notifications to the APM dashboard when drift is detected.
