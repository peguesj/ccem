# CCEM - Claude Code Environment Manager

> Configuration management + real-time agent monitoring platform for Claude Code

[![CI](https://github.com/peguesj/ccem/workflows/CI/badge.svg)](https://github.com/peguesj/ccem/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## What is CCEM?

CCEM is two things:

1. **A configuration management CLI/TUI** for Claude Code -- merge configs across projects, audit for security issues, back up and restore settings, and analyze conversation history to map code forks.

2. **An Agentic Performance Monitor (APM)** -- a real-time dashboard that tracks Claude Code agent activity across multiple projects simultaneously, showing token usage, dependency graphs, task progress, and Ralph methodology status.

## Quick Start

```bash
# Clone with submodules
git clone --recurse-submodules https://github.com/peguesj/ccem.git
cd ccem

# Install TypeScript core
npm install && npm run build

# Install APM v4 (Elixir/Phoenix)
cd apm-v4 && mix deps.get && mix compile && cd ..

# Start the APM dashboard
cd apm-v4 && mix phx.server
# Open http://localhost:3031
```

The APM server also starts automatically when Claude Code sessions begin, via the `session_init.sh` hook.

## Architecture

```
CCEM Core (TypeScript)          APM v4 (Elixir/Phoenix)
  CLI: 7 commands                 GenServers: ConfigLoader, AgentRegistry,
  TUI: React/Ink                    AgentDiscovery, NotificationServer,
  Merge: 5 strategies               ProjectStore, EnvironmentScanner,
  Fork discovery                     CommandRunner
  Security audit                  ETS: in-memory agent/session/task storage
  Backup/restore                  LiveView: real-time dashboard
  Schema validation (Zod)         REST API: 40+ endpoints
       |                                |
       +------------ Hooks -------------+
                session_init.sh
           (auto-start, register, reload)
```

See [docs/architecture.md](docs/architecture.md) for the full system design.

## Current Status

### CCEM Core v1.0.0
- 7 CLI commands (merge, backup, restore, audit, fork-discover, validate, tui)
- 867 tests at 96.89% coverage
- TypeScript 5.3+, Node.js 18+, React 18 + Ink 4

### APM v4
- 19/19 user stories complete (built autonomously by Ralph agents)
- 233 Elixir tests passing
- Phoenix LiveView dashboard with multi-project support
- Full v3 backward-compatibility (all 19 legacy endpoints preserved)
- Environment scanning, command execution, session management

### APM v3 (Python fallback)
- Single-file Python HTTP server at `apm/monitor.py`
- Same API surface as v4, usable when Elixir is not available

## CLI Commands

```bash
ccem merge --strategy recommended --config ./proj1/.claude ./proj2/.claude
ccem backup --source ~/.claude --compress 9
ccem restore backup.tar.gz --target ~/.claude --force
ccem audit --config ~/.claude --severity high
ccem validate ~/.claude/config.json
ccem fork-discover --chat conversation.json
ccem tui
```

## APM Dashboard

The dashboard at `http://localhost:3031` provides:

- **Project selector** with cards showing session counts, agent activity, and Ralph progress
- **Agent fleet** table with real-time token usage, tool calls, and status
- **D3.js dependency graph** showing agent relationships by tier
- **Ralph methodology** panel with story progress and flowchart visualization
- **Notification system** with browser notifications for agent completion events
- **Slash command** reference panel
- **Input request** queue for human-in-the-loop decisions

## Multi-Project Support

APM v4 monitors all your Claude Code projects through a single server instance. Projects register automatically when sessions start. Data is isolated per project, and the API supports `?project=<name>` scoping.

See [wiki/Multi-Project-Support.md](wiki/Multi-Project-Support.md) for details.

## Documentation

| Document | Description |
|----------|-------------|
| [docs/architecture.md](docs/architecture.md) | System architecture overview |
| [docs/apm-v4-api.md](docs/apm-v4-api.md) | Complete REST API reference (40+ endpoints) |
| [docs/development-history.md](docs/development-history.md) | Project evolution from initial commit to APM v4 |
| [docs/configuration.md](docs/configuration.md) | Configuration files, schemas, hooks, and environment variables |
| [docs/deployment.md](docs/deployment.md) | How to run, manage, and troubleshoot the system |
| [wiki/](wiki/Home.md) | Wiki with getting started guide, dashboard usage, and Ralph methodology |

## Development

```bash
npm test                # TypeScript tests (867)
npm run test:coverage   # With coverage report
npm run typecheck       # Type checking
npm run lint            # Linting

cd apm-v4 && mix test   # Elixir tests (233)
```

## License

MIT - [Jeremiah Pegues](https://github.com/peguesj)
