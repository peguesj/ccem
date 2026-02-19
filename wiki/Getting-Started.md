# Getting Started

## Prerequisites

| Component | Required For | Version |
|-----------|-------------|---------|
| Node.js | CCEM core (CLI, TUI, merge, fork discovery) | >= 18.0.0 |
| Elixir + OTP | APM v4 Phoenix server | >= 1.14 / OTP >= 25 |
| jq | Session hook (JSON manipulation) | any |
| Python 3 | APM v3 fallback (optional) | >= 3.8 |

## Installation

### 1. Clone the Repository

```bash
git clone --recurse-submodules https://github.com/peguesj/ccem.git
cd ccem
```

The `--recurse-submodules` flag pulls the APM v4 Phoenix submodule at `apm-v4/`.

### 2. Install CCEM Core

```bash
npm install
npm run build
```

This installs TypeScript dependencies and compiles the CLI/TUI tools.

### 3. Install APM v4

```bash
cd apm-v4
mix deps.get
mix compile
cd ..
```

### 4. Verify Installation

```bash
# Run TypeScript tests
npm test

# Run Elixir tests
cd apm-v4 && mix test && cd ..
```

Expected: 867+ TypeScript tests passing, 233 Elixir tests passing.

## Starting the APM Dashboard

### Option A: Manual Start

```bash
cd apm-v4
mix phx.server
```

Open `http://localhost:3031` in your browser.

### Option B: Automatic via Claude Code Hooks

If you have the SessionStart hook configured (as described in the [Configuration Reference](../docs/configuration.md)), the APM server starts automatically when you open a Claude Code session. The hook script at `~/Developer/ccem/apm/hooks/session_init.sh` handles startup, session registration, and config reloading.

## Using the CLI

After building, the `ccem` CLI provides 7 commands:

```bash
# Launch the interactive TUI
npx ccem tui

# Merge configurations
npx ccem merge --strategy recommended --config ./proj1/.claude ./proj2/.claude

# Create a backup
npx ccem backup --source ~/.claude --compress 9

# Restore from backup
npx ccem restore backup-file.tar.gz --target ~/.claude --force

# Security audit
npx ccem audit --config ~/.claude --severity high

# Validate schema
npx ccem validate ~/.claude/config.json

# Fork discovery
npx ccem fork-discover --chat conversation.json
```

## Configuring the Hook System

To enable automatic APM startup and session tracking, configure the Claude Code SessionStart hook to call `session_init.sh`. This is typically done via the `~/.claude/CLAUDE.md` modular configuration system. The hook receives a JSON payload with `session_id` and `cwd`, then:

1. Starts the APM v4 Phoenix server if not already running
2. Registers the session in `~/Developer/ccem/apm/sessions/`
3. Upserts the project into `~/Developer/ccem/apm/apm_config.json`
4. Notifies the running server to reload its configuration

See [Configuration Reference](../docs/configuration.md) for full details on the hook system.

## Next Steps

- [APM Dashboard](APM-Dashboard.md) -- Learn how to use the monitoring dashboard
- [Multi-Project Support](Multi-Project-Support.md) -- Set up monitoring across multiple projects
- [Ralph Methodology](Ralph-Methodology.md) -- Use Ralph for autonomous development
