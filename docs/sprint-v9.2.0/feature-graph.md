# CCEM APM Feature Graph (v9.1.4)

**Generated**: 2026-05-14
**Stats**: 42 features, 124 endpoints, ~52 LiveViews, 10 plugins

Companion files:
- `feature-graph.json` — machine-readable, full schema with `exposes_endpoints_full` arrays for every node
- `feature-graph.mmd` — Mermaid `graph LR` diagram

## Top-level hierarchy

```
CCEM APM (root)
├── Observe        ← real-time visibility (agents, sessions, formations, timeline)
├── Govern         ← authorization, approvals, coalesce, UPM
├── Measure        ← analytics, usage, health, ports, tasks, scanner, UAT, DRTW
├── Intelligence   ← skills, library, memory, orchestration, intake, alignment
├── Extend         ← plugins, integrations, notifications, showcase, docs
└── AI Platform    ← all-projects, AG-UI, Ralph, generative UI, LVM
```

## Feature inventory (42 nodes)

Each node has the shape:
```jsonc
{
  "id": "memory",
  "name": "Memory",
  "parent_id": "intelligence",
  "children": [],
  "depends_on": [],
  "exposes_endpoints": ["* /api/v2/memory/*"],        // human-curated
  "exposes_endpoints_full": ["GET /api/v2/memory/health", ...],  // machine-derived from OpenAPI
  "related_skills": ["claude-mem", "memory"],
  "liveviews": ["MemoryLive"],
  "plugins": ["MemoryPlugin"]
}
```

## Cross-cutting dependencies (depends_on edges)

| Feature | Depends on | Why |
|---|---|---|
| sessions | fleet | sessions belong to agents |
| conversations | sessions | conversations live inside sessions |
| formations | fleet | formations group agents |
| timeline | sessions | timeline renders session events |
| tool-calls | sessions | tool calls happen in sessions |
| approvals | authorization | approval gate sits on top of auth policy |
| upm | formations | UPM dispatches formations |
| library | memory | library is curated memory view |
| orchestration | formations, upm | orchestration coordinates formations via UPM |
| alignment | actions | alignment uses action engine |
| routing | fleet | routing tables map per-agent |
| integrations | plugins | integrations are a subtype of plugins |
| ralph-plugin | upm | ralph drives UPM stories |

## Referential integrity

Every endpoint in `openapi.snapshot.json` is assigned to exactly one feature via tag-mapping:

| OpenAPI tag | Feature |
|---|---|
| Health, Manifest | health / architecture |
| Agents, Agent Context | fleet |
| Sessions | sessions |
| Approvals | approvals |
| AgentLock Authorization, Audit | authorization |
| Coalesce | coalesce |
| Memory | memory |
| Metrics, Alerts, SLOs | analytics |
| Tasks | tasks |
| Notifications | notifications |
| UPM, UPM Decision Gate | upm |
| Showcase, CCEM Management | showcase / ccem-apm |
| Ports | ports |
| Ralph | ralph-plugin |
| AG-UI, A2UI | ag-ui |
| Skills | skills |
| Environments, Commands, Config, Data, Export, Projects | ccem-apm (root) |

Every LiveView module mentioned in `router.ex` is assigned to exactly one feature via the `liveviews` array (some appear in multiple — these are documented duplicates / aliases).

Every skill that references APM (from `~/.claude/skills/`) is linked via the `related_skills` array. Audit pass scheduled in Wave 4.

## Plugin inventory

10 plugins detected (with `:apm`, `:memory`, `:orchestration`, `:security`, `:ccem` scopes):

| Plugin | Scope | LiveView | Feature |
|---|---|---|---|
| MemoryPlugin | :memory | MemoryLive | memory |
| OrchestrationPlugin | :orchestration | OrchestrationLive | orchestration |
| SecurityGuidancePlugin | :security | (widget only) | extend |
| HarnessPlugin | :ccem | HarnessLive | harness |
| RalphPlugin | :apm | RalphPluginLive | ralph-plugin |
| AgUiPlugin | :apm | AgUiPluginLive | ag-ui |
| OpenDesignPlugin | :apm | OpenDesignLive | plugins |
| ClaudeCodeDiscoveryPlugin | :apm | ClaudeCodeDiscoveryLive | plugins |
| ComposioPlugin | :apm | ComposioLive | plugins |
| BuilderPlugin | :apm | BuilderLive | plugins |

## How to read the Mermaid graph

`feature-graph.mmd` shows:
- Solid arrow (`-->`) = parent → child containment
- Dashed arrow (`-.depends.->`) = cross-cutting dependency

Render with `mmdc -i feature-graph.mmd -o feature-graph.svg` or paste into any Mermaid renderer.
