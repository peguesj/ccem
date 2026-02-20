# CCEM v2.2.1 - Claude Code Environment Manager

[![CI](https://github.com/peguesj/ccem/workflows/CI/badge.svg)](https://github.com/peguesj/ccem/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Version](https://img.shields.io/badge/version-2.2.1-blue.svg)](https://github.com/peguesj/ccem/blob/main/CHANGELOG.md)
[![Elixir](https://img.shields.io/badge/elixir-1.15+-purple.svg)](https://elixir-lang.org)
[![Node](https://img.shields.io/badge/node-18+-green.svg)](https://nodejs.org)

> Configuration management and real-time agent monitoring platform for Claude Code

---

## What is CCEM?

CCEM is a three-component system for managing Claude Code environments at scale:

1. **TypeScript CLI/TUI** (`@ccem/core`) - Merge configurations across projects, audit for security issues, back up and restore settings, discover forks in conversation history, and validate schemas. Includes a full interactive terminal UI.

2. **APM v4** (Phoenix/Elixir) - A persistent real-time dashboard server running on port 3031 that tracks Claude Code agent activity across multiple projects simultaneously. Provides token usage tracking, D3.js dependency graphs, Ralph methodology visualization, toast notifications, UPM execution tracking, port management, and a built-in documentation wiki.

3. **CCEM Agent** (SwiftUI/macOS) - A native macOS menubar application that surfaces APM data at a glance: project count, active sessions, UPM wave progress, story pass rates, and quick links to the dashboard and docs.

---

## Feature Matrix

| Feature | Component | Status |
|---|---|---|
| Config merge (5 strategies: recommended, default, conservative, hybrid, custom) | CLI/TUI | Stable |
| Fork discovery from conversation history | CLI/TUI | Stable |
| Security audit with severity filtering | CLI/TUI | Stable |
| Backup and restore (compressed tar.gz) | CLI/TUI | Stable |
| Schema validation (Zod) | CLI/TUI | Stable |
| Interactive TUI (6 views, keyboard navigation) | CLI/TUI | Stable |
| Real-time APM dashboard (Phoenix LiveView) | APM v4 | Stable |
| Agent fleet monitoring (token usage, tool calls, status) | APM v4 | Stable |
| Multi-project tenancy (`?project=<name>` scoping) | APM v4 | Stable |
| UPM execution tracking (waves, stories, pass rates) | APM v4 | Stable |
| D3.js dependency graph (agent relationships by tier) | APM v4 | Stable |
| Ralph methodology display (flowchart + story progress) | APM v4 | Stable |
| Toast notification system (browser + in-app) | APM v4 | Stable |
| Documentation wiki at `/docs` | APM v4 | Stable |
| Formation system (`/formation`) | APM v4 | Stable |
| Port manager (clash detection, assignment) | APM v4 | Stable |
| Skills tracking (`/skills`) | APM v4 | Stable |
| Session timeline (`/timeline`) | APM v4 | Stable |
| AG-UI SSE event stream | APM v4 | Stable |
| v2 REST API (SLOs, alerts, audit log, OpenAPI spec) | APM v4 | Stable |
| v3 backward-compatible API endpoints (19 legacy routes) | APM v4 | Stable |
| SwiftUI macOS menubar agent | CCEM Agent | Stable |
| Launch at login (ServiceManagement) | CCEM Agent | Stable |

---

## Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                        Developer Machine                          │
│                                                                   │
│  ┌─────────────────────┐     ┌──────────────────────────────┐   │
│  │  CCEM CLI/TUI        │     │  CCEM Agent (SwiftUI)         │   │
│  │  @ccem/core v2.2.1   │     │  macOS menubar               │   │
│  │  TypeScript/Node 18  │     │  polling :3031/api/...        │   │
│  │                      │     │  - project count              │   │
│  │  ccem merge          │     │  - active sessions            │   │
│  │  ccem backup         │     │  - UPM wave/story progress    │   │
│  │  ccem restore        │     │  - open dashboard             │   │
│  │  ccem audit          │     │  - open /docs                 │   │
│  │  ccem validate       │     └──────────────┬───────────────┘   │
│  │  ccem fork-discover  │                    │ HTTP               │
│  │  ccem tui            │                    │                   │
│  └──────────┬───────────┘                    │                   │
│             │ apm_config.json                │                   │
│             │ session_init.sh hook           │                   │
│             ▼                                ▼                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                   APM v4  :3031                           │   │
│  │              Phoenix 1.8 / Elixir 1.15                    │   │
│  │                                                           │   │
│  │  OTP Supervision Tree                                     │   │
│  │  ├── ConfigLoader       ├── AgentRegistry                 │   │
│  │  ├── DashboardStore     ├── UpmStore                      │   │
│  │  ├── ApiKeyStore        ├── SkillTracker                  │   │
│  │  ├── AuditLog           ├── AlertRulesEngine              │   │
│  │  ├── ProjectStore       ├── MetricsCollector              │   │
│  │  ├── SloEngine          ├── EventStream                   │   │
│  │  ├── AgentDiscovery     ├── EnvironmentScanner            │   │
│  │  ├── CommandRunner      ├── DocsStore                     │   │
│  │  └── PortManager                                          │   │
│  │                                                           │   │
│  │  LiveViews: Dashboard, AllProjects, RalphFlowchart,       │   │
│  │            Skills, SessionTimeline, Docs, Formation,      │   │
│  │            Ports                                          │   │
│  │                                                           │   │
│  │  REST API: /api (v3-compat + v4), /api/v2 (SLO/alerts)   │   │
│  │  ETS tables: agents, sessions, tasks, notifications       │   │
│  │  PubSub: real-time LiveView updates                       │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                   │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  Claude Code Sessions (multiple projects)                  │  │
│  │  session_init.sh → POST /api/register                      │  │
│  │  Heartbeats → POST /api/heartbeat                          │  │
│  │  Notifications → POST /api/notify                          │  │
│  │  UPM events → POST /api/upm/event                          │  │
│  └───────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────┘
```

---

## Quick Start

```bash
# Clone with submodules
git clone --recurse-submodules https://github.com/peguesj/ccem.git
cd ccem

# Install and build the TypeScript CLI
npm install
npm run build

# Set up and start APM v4
cd apm-v4
mix setup
mix phx.server
# Dashboard available at http://localhost:3031
```

The APM server also starts automatically when Claude Code sessions begin, via the `~/Developer/ccem/apm/hooks/session_init.sh` hook. The hook starts the server on port 3031 if it is not already running, then registers the current session.

### CLI Usage

```bash
# Merge configs across projects (5 strategies)
ccem merge --strategy recommended --config ./proj1/.claude ./proj2/.claude

# Create a compressed backup
ccem backup --source ~/.claude --compress 9

# Restore from backup
ccem restore backup.tar.gz --target ~/.claude --force

# Security audit (filter by severity)
ccem audit --config ~/.claude --severity high

# Validate a config file
ccem validate ~/.claude/config.json

# Analyze conversation history for fork points
ccem fork-discover --chat conversation.json

# Launch the interactive TUI
ccem tui
```

### APM Management

```bash
# From inside a Claude Code session, use the /ccem slash command:
/ccem apm init      # re-register current project
/ccem apm start     # start server
/ccem apm stop      # stop server
/ccem apm restart   # restart server
/ccem apm status    # check server health
/ccem apm open      # open dashboard in browser
```

---

## APM v4 Routes

### Browser (LiveView)

| Route | Description |
|---|---|
| `GET /` | Main dashboard - agent fleet, token usage, project selector |
| `GET /apm-all` | All-projects overview |
| `GET /ralph` | Ralph methodology flowchart and story progress |
| `GET /skills` | Skills tracking view |
| `GET /timeline` | Session timeline |
| `GET /docs` | Documentation wiki (root) |
| `GET /docs/*path` | Documentation wiki (nested pages) |
| `GET /formation` | Formation system view |
| `GET /ports` | Port manager view |
| `GET /dev/dashboard` | Phoenix LiveDashboard (development only) |

### REST API

| Route | Description |
|---|---|
| `GET /health` | Health check (v3-compatible) |
| `GET /api/status` | Server status and uptime |
| `GET /api/agents` | List registered agents |
| `POST /api/register` | Register a new session/agent |
| `POST /api/heartbeat` | Agent heartbeat |
| `POST /api/notify` | Send a notification |
| `GET /api/projects` | List all projects |
| `PATCH /api/projects` | Update project metadata |
| `GET /api/data` | Dashboard data snapshot (v3-compat) |
| `GET /api/notifications` | List notifications |
| `GET /api/ralph` | Ralph story data |
| `GET /api/ralph/flowchart` | Ralph flowchart data |
| `GET /api/commands` | Registered slash commands |
| `GET /api/agents/discover` | Discover agents |
| `POST /api/upm/register` | Register a UPM execution |
| `POST /api/upm/agent` | Register UPM agent |
| `POST /api/upm/event` | Post a UPM event |
| `GET /api/upm/status` | Current UPM execution status |
| `GET /api/ports` | List tracked ports |
| `POST /api/ports/scan` | Scan for active ports |
| `POST /api/ports/assign` | Assign a port to a project |
| `GET /api/ports/clashes` | Detect port conflicts |
| `GET /api/skills` | List tracked skills |
| `POST /api/skills/track` | Track a skill invocation |
| `GET /api/environments` | List CCEM environments |
| `GET /api/ag-ui/events` | AG-UI SSE event stream |
| `GET /api/v2/agents` | v2 agent list |
| `GET /api/v2/metrics` | Fleet metrics |
| `GET /api/v2/slos` | SLO definitions |
| `GET /api/v2/alerts` | Active alerts |
| `GET /api/v2/audit` | Audit log |
| `GET /api/v2/openapi.json` | OpenAPI specification |

---

## SwiftUI Menubar Agent

The CCEM Agent is a native macOS application (Swift/SwiftUI) that lives in the menu bar and polls the APM server.

**Location**: `CCEMAgent/` (Xcode project)

**Features**:
- Connection state indicator (connected / connecting / disconnected)
- Project count and active session count displayed in the header
- UPM wave progress bar with story pass rate when a UPM execution is active
- All/Active filter for environment rows
- Per-environment status rows with session details
- "Open Dashboard" button linking to `http://localhost:3031`
- "Help & Docs" button linking to `http://localhost:3031/docs`
- Manual refresh
- "Launch at Login" toggle (ServiceManagement framework)
- Graceful degraded view when the APM server is unreachable

**Build**:
```bash
cd CCEMAgent
xcodebuild -scheme CCEMAgent -configuration Release build
```

---

## Documentation Wiki

The APM v4 server hosts a built-in documentation wiki at `http://localhost:3031/docs`.

The wiki content is served from `apm-v4/priv/docs/` and rendered via the `DocsStore` GenServer and `DocsLive` LiveView. Markdown files are parsed with Earmark at startup.

Key wiki sections available in the browser:
- Getting started guide
- Dashboard usage
- Ralph methodology reference
- API reference
- Multi-project support

Static docs are also available in the `docs/` and `wiki/` directories of this repository.

| Document | Description |
|---|---|
| [docs/architecture.md](docs/architecture.md) | System architecture overview |
| [docs/apm-v4-api.md](docs/apm-v4-api.md) | Complete REST API reference |
| [docs/configuration.md](docs/configuration.md) | Config files, schemas, hooks, environment variables |
| [docs/deployment.md](docs/deployment.md) | Running, managing, and troubleshooting |
| [docs/development-history.md](docs/development-history.md) | Project evolution from initial commit to APM v4 |
| [wiki/Home.md](wiki/Home.md) | Wiki index |

---

## UPM Integration

CCEM APM provides first-class tracking for UPM (Universal Project Manager) executions. When `/upm` is invoked in a Claude Code session, the execution lifecycle is reported to APM v4 via dedicated endpoints.

**What is tracked**:
- UPM session registration (`POST /api/upm/register`)
- Individual agent registrations within the wave (`POST /api/upm/agent`)
- Story-level events: started, passed, failed (`POST /api/upm/event`)
- Current wave number, total waves, and aggregate pass rate (`GET /api/upm/status`)

**Dashboard surfaces**:
- Main dashboard header shows active UPM wave and story progress bar
- SwiftUI menubar agent mirrors the same data for at-a-glance visibility
- Ralph flowchart view (`/ralph`) shows methodology step and story statuses

---

## Multi-Project Support

APM v4 runs as a single persistent server and monitors all Claude Code projects on the machine simultaneously. Projects self-register when sessions start via the `session_init.sh` hook.

- Data is namespaced per project in ETS and `ProjectStore`
- All REST API endpoints accept an optional `?project=<name>` query parameter for scoped queries
- The dashboard project selector switches the active project view without reloading
- `apm_config.json` at `~/Developer/ccem/apm/apm_config.json` tracks the current project for hook-based registration

See [wiki/Multi-Project-Support.md](wiki/Multi-Project-Support.md) for details.

---

## Development

### Requirements

| Tool | Version |
|---|---|
| Node.js | 18+ |
| TypeScript | 5.3+ |
| Elixir | 1.15+ |
| Erlang/OTP | 26+ |
| Phoenix | 1.8+ |
| Xcode (optional, for CCEM Agent) | 15+ |

### TypeScript (CLI/TUI)

```bash
npm install
npm run build         # compile TypeScript
npm run typecheck     # tsc --noEmit
npm run lint          # ESLint
npm test              # Jest test suite (867 tests, 96.89% coverage)
npm run test:coverage # with coverage report
```

### Elixir/Phoenix (APM v4)

```bash
cd apm-v4
mix setup             # deps.get + assets.setup + assets.build
mix compile --warnings-as-errors
mix test              # 233 tests
mix phx.server        # start dev server on :3031
```

**Pre-commit hook** (runs automatically):
```bash
mix precommit         # compile --warnings-as-errors + deps.unlock --unused + format + test
```

### Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feat/my-feature`
3. TypeScript changes: ensure `npm test` and `npm run typecheck` pass
4. Elixir changes: ensure `mix precommit` passes
5. Open a pull request against `main`

See [CONTRIBUTING.md](CONTRIBUTING.md) for detailed guidelines.

---

## Version History

| Version | Notes |
|---|---|
| 2.2.1 | Multi-project awareness, port manager, formation system, docs wiki, AG-UI SSE, v2 API (SLOs, alerts, audit, OpenAPI) |
| 2.x | APM v4 (Phoenix/Elixir) with LiveView dashboard, UPM tracking, SwiftUI menubar agent |
| 1.0.0 | Initial CLI/TUI release - 7 commands, 867 tests, 96.89% coverage |

Full changelog: [CHANGELOG.md](CHANGELOG.md)

---

## License

MIT - [Jeremiah Pegues](https://github.com/peguesj)
