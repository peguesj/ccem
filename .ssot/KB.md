# CCEM / CCEM APM — Knowledge Base Summary

**Generated**: 2026-05-14
**Source**: `ccem.sqlite` (242 chunks, 384-dim MiniLM-L6-v2 embeddings, ~1.2 MB)
**Mode**: BLOB + brute-force cosine (Apple Python 3.9 lacks SQLite extension loading; identical semantics, ~1ms search for 242 rows)
**Builder**: `build_kb.py`  |  **Query**: `python3 search_kb.py "<query>" [top_k]`

## What CCEM is

**CCEM (Claude Code Environment Manager)** is a configuration management tool and real-time agent monitoring platform for Claude Code. Repository: `github.com/peguesj/ccem`. Author: Jeremiah Pegues (`pegues.io`). It is a multi-component system that lives under `~/Developer/ccem`:

- `apm-v4/` — Phoenix/Elixir LiveView server (the "CCEM APM" runtime)
- `CCEMHelper/` — Swift/AppKit native macOS helper (approval modals, system tray)
- `apm/` — hooks, session_init, config (`apm_config.json`), scripts
- `packages/apm/` — published TypeScript SDK (`@ccem/apm` on npm)
- `packages/core/` — published TypeScript core types (`@ccem/core` on npm)
- `ag-ui-elixir/` (sibling) — community Elixir SDK for AG-UI protocol
- `wiki/` — public documentation
- `showcase/` — interactive product gallery served via the APM dashboard
- `.claude/` — project memory, fleet/orchestration architecture, agent specs

CCEM provides:
1. **Environment management** — merge/migrate Claude Code configs across projects
2. **Hook orchestration** — pre/post tool hooks, session_init, audit logging
3. **Agentic monitoring** — Phoenix LiveView dashboard at `http://localhost:3032`
4. **Token hygiene** — usage tracking, claude-mem integration, KB search
5. **Formation orchestration** — squadron/swarm/cluster agent hierarchies
6. **Skill library** — `~/.claude/skills/` with auto-discovery

## What CCEM APM is

**CCEM APM (Agentic Performance Monitor)** is the Phoenix/Elixir server inside CCEM that provides:

- **Real-time agent dashboard** at `http://localhost:3032` showing every active Claude Code agent, their token usage, tool calls, status, and parent/child formation hierarchy
- **REST API** with 124 operations across 29 tag groups (OpenAPI 3.0.3 spec at `/api/v2/openapi.json`)
- **WebSocket / LiveView** for sub-second push updates of formation graphs, notifications, approval modals
- **AgentLock authorization (v9)** — 3-layer authorization protocol with PolicyEngine, TokenStore, RateLimiter, trust ceiling, redaction
- **D3.js dependency graphs** of agent formations
- **Ralph methodology display** for autonomous fix loops
- **Multi-project context** via subdirectory-namespaced sessions sharing one server
- **Plugin system** with 10 first-class plugins (Memory, Orchestration, Security, Harness, Ralph, AG-UI, OpenDesign, ClaudeCodeDiscovery, Composio, Builder) across 5 plugin scopes (`:apm`, `:memory`, `:orchestration`, `:security`, `:ccem`)
- **Hook telemetry** — v9 max-payload hooks emit identity, context, memory writes, skill invocations, pattern heartbeats every 10 tool calls

### Architecture

- **Runtime**: Phoenix 1.7 / LiveView 1.0 / Elixir / Bandit
- **Storage**: ETS tables + per-session JSON at `~/Developer/ccem/apm/sessions/{session_id}.json`
- **Stylesheet**: TailwindCSS + daisyUI + custom CSS design tokens
- **Process model**: single persistent server (port 3032) launched by `SessionStart` hook, started via `mix phx.server`
- **Helpers**: native macOS app (`CCEMHelper`) for approval modals + tray icon
- **AG-UI integration**: subscribes to AG-UI events from agent processes for tool call streaming

### Version history

| Major | Theme |
|---|---|
| v4.x | initial Phoenix/LiveView dashboard |
| v5.x | AG-UI integration (CCEM5 project) |
| v6.x – v7.x | refinement, Plane PM integration |
| v8.x | hook telemetry v7, multi-project support |
| v9.0 | AgentLock authorization, max-payload hooks |
| v9.1.0 | security native types (ccem_security_native_types) |
| v9.1.1 | coalesce skill sync |
| v9.1.2 | Claude Code Harness plugin + hook filesystem repair |
| v9.1.3 | full CCEM APM redesign (Claude Design handoff, 9 waves, 198 stories) |
| v9.1.4 | testmaxxing formation v2, dashboard widgetization, orchestration system, claude-mem APM plugin, repair_hooks action |
| v9.2.0 | (this sprint) SSOT confluence — feature graph, page_layout structural fix, hook propagation, skill drift sweep |

## Coverage of the KB index

| Kind | Chunks | What it captures |
|---|---|---|
| `claudemd` | ~50 | Project rules, version markers, plane project IDs |
| `readme` | ~40 | README content for apm-v4, packages/apm, root |
| `wiki` | ~30 | Public docs: getting started, APM dashboard, configuration |
| `moduledoc` | ~100 | LiveView module @moduledoc strings (52 LiveViews) |
| `openapi` | ~5 | OpenAPI snapshot chunks for API discovery |
| `showcase-data` | ~10 | features.json, projects, screenshots |
| `prd` | ~5 | apm-v4 prd.json snapshot |
| `release` | ~2 | RELEASE_NOTES.md entries |

## Example queries

```bash
python3 search_kb.py "what is CCEM APM" 5
# Top hit: wiki/Home.md cont 1 (dist 0.41)

python3 search_kb.py "AgentLock authorization protocol" 3
# Top hit: packages/apm/README.md (dist 0.49)

python3 search_kb.py "Agentic Performance Monitor architecture" 3
# Top hit: wiki/APM-Dashboard.md (dist 0.49)
```

## How this fits into v9.2.0 SSOT Confluence

This KB is the W1.1 deliverable. It serves as:
1. **Ground truth for skill rewrites** (W2.1, W4.1) — agents grep the KB for canonical facts before regenerating skill content
2. **Reference for showcase + docs sync** (W4.2) — the showcase JSON cross-links chunk IDs
3. **Future SSOT source** — re-runnable, the KB becomes a versioned snapshot of project state at ship time

The fallback BLOB-mode is *intentional* — it requires zero native dependencies and any Python 3 can query it. If sqlite-vec extension loading is available (e.g. via Homebrew Python or `pip install pysqlite3-binary`), `build_kb.py` automatically promotes to vec mode without code changes.
