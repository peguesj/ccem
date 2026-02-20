# CCEM Deployment Guide

## Prerequisites

- **Node.js** >= 18.0.0 (for CCEM core TypeScript components)
- **Elixir** >= 1.14 with OTP >= 25 (for APM v4 Phoenix server)
- **Python** 3.x (for APM v3 fallback, optional)
- **jq** (used by session_init.sh for JSON manipulation)

## APM v4 Phoenix Server

### First-Time Setup

```bash
cd ~/Developer/ccem/apm-v4
mix deps.get
mix compile
```

### Starting the Server

```bash
cd ~/Developer/ccem/apm-v4
mix phx.server
```

The server starts on port 3031. Open `http://localhost:3031` to access the dashboard.

### Automatic Startup via Hooks

In normal operation, you do not need to start the server manually. The `session_init.sh` hook automatically starts it when a Claude Code session begins:

1. Claude Code fires the SessionStart hook
2. `session_init.sh` checks if port 3031 is occupied
3. If not, it runs `mix phx.server` in the background with output redirected to `~/Developer/ccem/apm/hooks/apm_server.log`
4. PID is written to `~/Developer/ccem/apm-v4/.apm.pid`
5. The hook waits 3 seconds for the server to initialize, then confirms via port check

### Stopping the Server

```bash
# Via PID file
kill $(cat ~/Developer/ccem/apm-v4/.apm.pid)

# Or find the process
lsof -ti:3031 | xargs kill
```

### Running Tests

```bash
cd ~/Developer/ccem/apm-v4
mix test
```

Expected output: 233 tests, 0 failures.

---

## Session Registration Flow

When a new Claude Code session starts:

```
1. Claude Code fires SessionStart hook
         |
2. session_init.sh receives JSON payload (session_id, cwd)
         |
3. Derives project_name from basename of cwd
         |
4. Checks if APM server is running (PID file + port check)
   |                    |
   | (not running)      | (running)
   v                    v
5a. Starts Phoenix    5b. Skip
         |
6. Writes ~/Developer/ccem/apm/sessions/{session_id}.json
         |
7. Upserts project into apm_config.json:
   - If project exists: append session to sessions array
   - If new project: add to projects array with session
   - Updates active_project to current project name
         |
8. POST http://localhost:3031/api/config/reload
         |
9. APM server re-reads config, discovers new session
         |
10. Dashboard updates in real-time via PubSub/LiveView
```

---

## Multi-Project Setup

APM v4 supports monitoring multiple projects simultaneously through a single server instance.

### How Projects Get Registered

Projects are registered automatically when a Claude Code session starts in their directory. No manual configuration is needed. The `session_init.sh` hook handles everything:

- Opening a Claude Code session in `/Users/jeremiah/Developer/ccem` registers a project named `ccem`
- Opening a session in `/Users/jeremiah/tools/@yj/lfg` registers a project named `lfg`
- Each subsequent session in the same directory appends to the existing project's sessions array

### Viewing Projects

- **Landing page** (`http://localhost:3031`): Shows a card grid of all registered projects with session counts, agent counts, and Ralph progress.
- **Project dashboard** (`http://localhost:3031/project/{name}/`): Shows the full dashboard scoped to a single project (v3 Python server route).
- **All Projects LiveView** (`http://localhost:3031/apm-all`): Phoenix LiveView overview of all projects (v4).

### Switching Active Project

The `active_project` field in `apm_config.json` determines which project is shown by default. It is automatically updated when a new session starts. You can also switch manually:

```bash
# Via API
curl -X POST http://localhost:3031/api/config/reload

# Or edit apm_config.json directly and reload
jq '.active_project = "my-project"' ~/Developer/ccem/apm/apm_config.json > /tmp/cfg.json && \
  mv /tmp/cfg.json ~/Developer/ccem/apm/apm_config.json && \
  curl -X POST http://localhost:3031/api/config/reload
```

### Project Scoping in API Calls

Most API endpoints accept `?project=<name>` to scope data to a specific project:

```bash
# Get data for a specific project
curl http://localhost:3031/api/data?project=ccem

# Discover agents for a specific project
curl http://localhost:3031/api/agents/discover?project=lfg
```

---

## CCEM Core (TypeScript)

### Installation

```bash
cd ~/Developer/ccem
npm install
```

### Building

```bash
npm run build
```

### Running the CLI

```bash
# Via npm script
npx ccem tui

# Or after global install
npm install -g .
ccem merge --strategy recommended --config ./proj1/.claude ./proj2/.claude
```

### Running Tests

```bash
npm test                # Run all tests
npm run test:coverage   # With coverage report
npm run typecheck       # Type checking only
npm run lint            # Linting
```

---

## APM v3 Python Server (Fallback)

The Python v3 server can be used as a fallback if Elixir is not available:

```bash
cd ~/Developer/ccem/apm
python3 monitor.py
```

This serves the same dashboard on port 3031 with identical API endpoints. The v3 server reads the same `apm_config.json` and supports the v4 multi-project format with backward compatibility for the v3 flat format.

---

## Web UI

```bash
cd ~/Developer/ccem
npm run ui:dev      # Development server
npm run ui:build    # Production build
npm run ui:test     # Run UI tests
```

---

## SwiftUI Agent (Planned)

A macOS menubar application for monitoring agent activity. Specification files are in `~/Developer/ccem/apm-v4/swift-wrapper/`. This component is not yet implemented.

Planned features:
- Menubar icon with agent status indicators
- Dropdown showing active agents and their status
- Notification forwarding from APM server
- Quick actions (open dashboard, start/stop sessions)

---

## Troubleshooting

### Server won't start

```bash
# Check if port is in use
lsof -ti:3031

# Check the log
tail -50 ~/Developer/ccem/apm/hooks/apm_server.log

# Check Elixir deps
cd ~/Developer/ccem/apm-v4 && mix deps.get
```

### Sessions not appearing in dashboard

```bash
# Check hook log
tail -20 ~/Developer/ccem/apm/hooks/apm_hook.log

# Check config was updated
cat ~/Developer/ccem/apm/apm_config.json | jq '.projects | length'

# Manually trigger reload
curl -X POST http://localhost:3031/api/config/reload
```

### APM commands

The `/ccem apm` slash command provides management operations:

| Command | Description |
|---------|-------------|
| `/ccem apm init` | Initialize/re-register current session |
| `/ccem apm start` | Start APM server |
| `/ccem apm stop` | Stop APM server |
| `/ccem apm open` | Open dashboard in browser |
| `/ccem apm restart` | Restart APM server |
| `/ccem apm refresh` | Reload config |
| `/ccem apm status` | Show server status |
| `/ccem apm manage all` | Show all management info |
| `/ccem apm manage sessions` | List sessions |
| `/ccem apm manage cleanup` | Clean stale sessions |
