# CCEM Project Memory

## Authorship & Identifiers

- **Author**: Jeremiah Pegues
- **Organization Domain**: `pegues.io`
- **Reverse-DNS Identifier Prefix**: `io.pegues.agent-j.labs`
- **launchd Labels**:
  - APM Server: `io.pegues.agent-j.labs.ccem.apm-server`
  - CCEMHelper: `io.pegues.agent-j.labs.apm.helper`
- **Use this prefix** for all launchd plists, bundle identifiers, and reverse-DNS identifiers across CCEM and related projects.

## APM Server Lifecycle Rules

**ALWAYS start CCEMHelper alongside the APM server.** When running `mix phx.server`, ALWAYS also launch CCEMHelper immediately after:
```bash
# Start APM
cd ~/Developer/ccem/apm-v4
nohup mix phx.server > /Volumes/DDRV902/logs/apm_server.log 2>&1 &
echo $! > .apm.pid

# Start CCEMHelper immediately after - MANDATORY
open -a CCEMHelper
```

**When rebuilding CCEMHelper**, ALWAYS run `swift build` from `~/Developer/ccem/CCEMHelper/` and then relaunch:
```bash
cd ~/Developer/ccem/CCEMHelper
swift build -c release
open -a CCEMHelper
```

**When updating CCEM or CCEM APM source:**
1. Rebuild CCEMHelper: `cd ~/Developer/ccem/CCEMHelper && swift build -c release`
2. Relaunch: `open -a CCEMHelper`
3. Restart APM if server-side changes: kill + restart `mix phx.server`

**Formation agent registration rule:** Every formation agent MUST register with APM on spawn using fire-and-forget curl to `/api/register` with full `upm_context` metadata. No exceptions -- this applies to orchestrators, squadron leads, swarm agents, cluster agents, and individual leaf agents. Pattern:
```bash
curl -s -X POST http://localhost:3032/api/register \
  -H "Content-Type: application/json" \
  -d '{
    "agent_id": "<agent_id>",
    "project": "<project>",
    "role": "<formation_role>",
    "status": "active",
    "formation_id": "<formation_id>",
    "formation_role": "<orchestrator|squadron_lead|swarm_agent|cluster_agent|individual>",
    "parent_agent_id": "<parent_agent_id>",
    "wave": <wave_number>,
    "task_subject": "<task description>",
    "session_id": "<session_id>"
  }' >/dev/null 2>&1 &
```

**Force kill APM when stalled:**
```bash
lsof -ti:3032 | xargs kill -9 2>/dev/null
pkill -9 -f "mix phx.server"
```

## Key Paths

| Resource | Path |
|----------|------|
| APM server | `~/Developer/ccem/apm-v4/` |
| APM PID | `~/Developer/ccem/apm-v4/.apm.pid` |
| APM log | `/Volumes/DDRV902/logs/apm_server.log` |
| APM config | `~/Developer/ccem/apm/apm_config.json` |
| CCEMHelper source | `~/Developer/ccem/CCEMHelper/` |
| ccem-apm skill | `~/.claude/skills/ccem-apm/SKILL.md` |
| ccem-apm command | `~/.claude/commands/ccem-apm.md` |
| Showcase skill | `~/.claude/skills/showcase/` |
| Showcase viewer | `~/.claude/skills/showcase/client/index.html` |

## Plane Project

- **Project Name**: CCEM - Claude Code Environment Manager
- **Project ID**: `a20e1d2e-3139-406e-ae03-dc6d1d8cb995`
- **Identifier**: `CCEM`
- **Workspace**: `lgtm`
- **URL**: `https://plane.lgtm.build/lgtm/projects/a20e1d2e-3139-406e-ae03-dc6d1d8cb995/`
- **API Base**: `https://plane.lgtm.build/api/v1/workspaces/lgtm/projects/a20e1d2e-3139-406e-ae03-dc6d1d8cb995/`
- **API Key**: `~/Developer/plane/.claude/claude-code-helper-remote-plane-api-pat.csv`
- **Auth Header**: `X-Api-Key: plane_api_73588ec6f1c34e09b389b8565b7b63c9`
- **States**:
  - Backlog: `111ce4ff-eef9-4622-93e5-ff65d95dc77e`
  - Todo: `8904905c-0b3f-4f97-ab5c-e22747134d77`
  - In Progress: `0d7e0c82-f974-4678-856b-64fd6e993fab`
  - Done: `9bab16dd-4834-4a2a-a00c-3f25516535e1`
  - Cancelled: `80645a72-1150-4fc1-af9c-b1e85c30cd86`

## Related Plane Projects

### AG-UI Elixir SDK (AGUI)
- **Project ID**: `3e16b3ea-6aa8-46c2-8517-b130f6743236`
- **URL**: `https://plane.lgtm.build/lgtm/projects/3e16b3ea-6aa8-46c2-8517-b130f6743236/`
- **Path**: `~/Developer/ag-ui-elixir/ag_ui/`
- **Description**: Port of AG-UI protocol to Phoenix/Elixir (community SDK)

### CCEM APM v5 — AG-UI Integration (CCEM5)
- **Project ID**: `a898419a-b097-496f-994a-c4a8ea54904c`
- **URL**: `https://plane.lgtm.build/lgtm/projects/a898419a-b097-496f-994a-c4a8ea54904c/`
- **Description**: Major version upgrade integrating AG-UI protocol into CCEM APM
- **Status**: 86 issues, all Done. Archival/read-only — no new issues should be created here.
- **Scope boundary**: CCEM5 tracks AG-UI v5 protocol design (EventBus, A2A, Generative UI, State Sync, ToolCallTracker, npm @ccem packages). Features that landed in production are tracked in CCEM main. CCEM5 remains as the design-phase record.
- **Cross-references**: CCEM5 EP-01/EventBus -> CCEM-159/161/213/289; CCEM5 EP-07/ApprovalGate -> CCEM-290/300/306/334; CCEM5 EP-02/Lifecycle -> CCEM-289/293; CCEM5 v5.1.0 -> CCEM-157.
- **Authoritative tracker**: CCEM main (a20e1d2e) is the single source of truth for all active work. CCEM5 is historical reference only.

## OpenAPI Endpoints

Both serve the full 103+ path OpenAPI 3.0.3 spec:
- `GET http://localhost:3032/api/v2/openapi.json` (canonical)
- `GET http://localhost:3032/api/openapi.json` (v1 alias)

## Current Version: v9.2.0


## Implementation Checkpoints

### Wave 1: Descriptors & Context Foundation (Independent — 2 worktrees parallel)
- [x] **CP-56**: Agent descriptor mapping in AgentLockConfig (US-321)
- [x] **CP-57**: Execution context payload schema and integration (US-322)
- After Wave 1: `mix compile --warnings-as-errors` required

### Wave 2: Modal Grouping & UX (depends on Wave 1)
- [x] **CP-58**: Notification grouping with ApprovalQueue debouncing (US-323)
- [x] **CP-59**: ApprovalModal titlebar, keyboard shortcuts, dismiss control (US-324)
- After Wave 2: `mix compile --warnings-as-errors` required

### Wave 3: CCEMHelper, Audit, Docs & Tests (depends on Wave 2)
- [x] **CP-60**: CCEMHelper grouped approval UI with focus management (US-325)
- [x] **CP-61**: ApprovalAuditLog GenServer and APM dashboard audit view (US-326)
- [x] **CP-62**: OpenAPI spec update and AgentLock documentation (US-327)
- [x] **CP-63**: Integration tests for full approval workflow (US-328)
- After Wave 3: `mix compile --warnings-as-errors` ✓ AND `swift build -c release` ✓ required

**Previous checkpoint records (v4.1.0–v8.10.0)** are stored in [checkpoints.md](checkpoints.md) for historical reference.

---

## Security Native Types Feature (v9.1.0) — ccem_security_native_types

### Wave 1: Hook expansion (Python, standalone)
- [x] **CP-64**: Expand `security_reminder_hook.py` — Bash command injection + advisory patterns (US-329)
- [x] **CP-65**: Add WebFetch/WebSearch SSRF detection — block on IMDS/schemes, advisory on private ranges (US-330)
- [x] **CP-66**: Add Agent/Skill prompt injection advisory detection (US-331)
- [x] **CP-67**: Update `hooks.json` matcher to `Edit|Write|MultiEdit|Bash|WebFetch|WebSearch|Agent|Skill` (US-331)
- All copies synced: `claude-code-plugins/1.0.0`, `claude-plugins-official/104d39be10b7`, `claude-plugins-official/unknown`

### Wave 2: Elixir APM backend (depends on Wave 1)
- [x] **CP-68**: Add `:security` as first-class `plugin_scope` atom to `PluginBehaviour` (US-332)
- [x] **CP-69**: Create `ApmV5.Plugins.Security.SecurityGuidancePlugin` with 4 actions + dashboard widget (US-332)
- After Wave 2: `mix compile --warnings-as-errors` ✓

### Wave 3: Tests (depends on Wave 2)
- [x] **CP-70**: 41-test suite for `SecurityGuidancePlugin` — contract, endpoints, all actions, nav, widgets (US-333)
- After Wave 3: `mix test test/apm_v5/plugins/security/` ✓ (41/41)

---

## Hooks Max-Payload Upgrade v9.0.0 — apm_hooks_max_payload

### Wave 1: Identity & Base Payload (4 stories, independent)
- [x] **CP-71**: Hook version headers v7→v9 across all 9 hooks (US-334)
- [x] **CP-72**: Max-payload: session_id + project + working_dir in all hook payloads (US-335)
- [x] **CP-73**: Max-payload: git_branch resolution in pre/post tool hooks (US-336)
- [x] **CP-74**: Agent identity resolution chain in agentlock hooks (US-337)
- After Wave 1: all hooks emit v9 payloads with identity + context fields ✓

### Wave 2: Detection & Enrichment (4 stories, depends on Wave 1)
- [x] **CP-75**: Memory write detection in pre/post tool hooks (US-338)
- [x] **CP-76**: Skill invocation tracking in pre/post tool hooks (US-339)
- [x] **CP-77**: Pattern heartbeat emission every 10 tool calls (US-340)
- [x] **CP-78**: Expanded tool mapping + context enrichment in agentlock_context (US-341)
- After Wave 2: memory writes, skill invocations, and patterns tracked in APM ✓

### Wave 3: Audit & Cleanup (2 stories, depends on Wave 2)
- [x] **CP-79**: Notification audit trail in agentlock_post_tool (US-342)
- [x] **CP-80**: Session end summary with tool count and cleanup (US-343)
- After Wave 3: full audit trail and session lifecycle complete ✓

---

## Coalesce v9.1.1 Skill Sync — coalesce_v911_skill_sync

### Wave 1: Core APM Skills (4 stories, independent)
- [x] **CP-81**: Coalesce: ccem-apm + apm — version refs + endpoint table (US-344)
- [x] **CP-82**: Coalesce: apm-api-reference — OpenAPI alignment (US-345)
- [x] **CP-83**: Coalesce: apm-auth + apm-telemetry — agent identity + telemetry (US-346)
- [x] **CP-84**: Coalesce: formation + orchestrator — telemetry enrichment (US-347)
- After Wave 1: core APM skills reference v9.1.1 max-payload ✓

### Wave 2: Dependent Skills (5 stories, depends on Wave 1)
- [x] **CP-85**: Coalesce: upm — hook telemetry alignment (US-348)
- [x] **CP-86**: Coalesce: ralph + ship — pipeline awareness (US-349)
- [x] **CP-87**: Coalesce: coalesce + doctor + elixir-architect — meta sync (US-350)
- [x] **CP-88**: Coalesce: conversation-mgmt + live-all — notification pipeline (US-351)
- [x] **CP-89**: Coalesce: showcase + idea + dev-vs-prod — peripheral sync (US-352)
- After Wave 2: all dependent skills aligned to v9.1.1 ✓

### Wave 3: Validation & Finalize (3 stories, depends on Wave 2)
- [x] **CP-90**: Coalesce: safesecret + apm-usage — security + usage (US-353)
- [x] **CP-91**: Coalesce: double-verify — regression + frontmatter validation (US-354)
- [x] **CP-92**: Coalesce: CLAUDE.md + SkillsRegistry cache refresh (US-355)
- After Wave 3: all skills validated, cache refreshed, coalesce_applied emitted ✓

---

## Dashboard Widgetization Engine — dashboard_widgetization_engine

### Wave 1: Schema & Backend GenServers (4 stories, independent)
- [x] **CP-93**: Widget config schema — add editable, pinnable, supported_scopes, default_config, display_order to WidgetRegistry (US-356)
- [x] **CP-94**: LayoutStore — add save_widget_config, get_widget_config, set_pinned_widget, get_pinned_widget with PubSub broadcasts (US-357)
- [x] **CP-95**: WidgetConfigStore GenServer — ETS-backed per-session widget config and pinned state (US-358)
- [x] **CP-96**: DashboardScopeEngine GenServer — pin/unpin scope source, broadcast scope to dashboard:scope PubSub topic (US-359)
- After Wave 1: `mix compile --warnings-as-errors` ✓

### Wave 2: LiveView Components & DashboardLive Scope Wiring (4 stories, depends on Wave 1)
- [x] **CP-97**: DashboardLive — subscribe to dashboard:scope PubSub, handle :scope_changed, wire scope assigns (US-360)
- [x] **CP-98**: WidgetEditPanelComponent LiveComponent — inline config editor with dynamic config_schema fields (US-361)
- [x] **CP-99**: WidgetContainerComponent LiveComponent — title bar with edit/pin controls, WidgetResize integration (US-362)
- [x] **CP-100**: DashboardGridComponent LiveComponent — CSS Grid 12-col layout from LayoutStore placements, drag handle affordance (US-363)
- After Wave 2: `mix compile --warnings-as-errors` ✓

### Wave 3: Frontend, Context Pin, Projects Widget, API & DashboardLive Wiring (5 stories, parallel where independent)
- [x] **CP-101**: ContextPinDrillDownComponent — collapsible user/project split panel, subscribes to scope PubSub (US-364)
- [x] **CP-102**: ProjectsWidget LiveComponent — projects list with Select-to-scope, pinnable=true, registered in WidgetRegistry (US-365)
- [x] **CP-103**: DashboardGrid JS hook — native HTML5 drag-reorder, pushEvent layout_reorder, registered in app.js (US-366)
- [x] **CP-104**: DashboardLive — wire WidgetContainerComponent, DashboardGridComponent, all edit/pin/layout event handlers (US-367)
- [x] **CP-105**: API endpoints — GET /api/v2/widgets, PATCH config, GET/POST /api/v2/dashboard/layout, POST /api/v2/dashboard/pin (US-368)
- After Wave 3: `mix compile --warnings-as-errors` ✓

### Wave 4: Integration Tests (depends on Wave 3)
- [x] **CP-106**: Integration tests — WidgetConfigStore, DashboardScopeEngine PubSub, LayoutStore, WidgetRegistry, DashboardLive LiveView, API (US-369)
- After Wave 4: `mix test --only widgetization` ✓ (43/43)

---

## @ccem/apm v3.0.0 Backfill — ccem_npm_backfill_v3

### Wave 1: New Types (4 stories, independent)
- [x] **CP-107**: Add auth types — AuthDecision, AuthSession, AuthTool Zod schemas (US-371)
- [x] **CP-108**: Add coalesce types — CoalesceRunSummary, Gate, GateDecision Zod schemas (US-372)
- [x] **CP-109**: Add agent-context and execution-context Zod schemas (US-373)
- [x] **CP-110**: Add widget types and expand approval types with v9.0.0 fields (US-374)
- After Wave 1: `npx tsc --noEmit` ✓

### Wave 2: New Client API Classes (4 stories, depend on Wave 1)
- [x] **CP-111**: Add AuthAPI class with 18 authorization endpoints (US-375)
- [x] **CP-112**: Add CoalesceAPI class with 8 coalesce endpoints (US-376)
- [x] **CP-113**: Add AgentContextAPI class with 3 context endpoints (US-377)
- [x] **CP-114**: Extend UpmAPI with 5 gate endpoints and ApprovalsAPI with history/audit (US-378)
- After Wave 2: `npx tsc --noEmit` ✓

### Wave 3: Integration, Tests, Version Bump (3 stories, depend on Wave 2)
- [x] **CP-115**: Update index.ts exports and client constructor for new API classes (US-379)
- [x] **CP-116**: Add vitest tests — 51 tests covering all new types and API methods (US-380)
- [x] **CP-117**: Version bump to 3.0.0, update package.json description (US-381)
- After Wave 3: `npm test` ✓ (128/128), `npm run build` ✓

### Wave 4: @ccem/core alignment (1 story)
- [x] **CP-118**: Update @ccem/core version to 5.0.0, align src/index.ts version tag (US-382)
- After Wave 4: `npx tsc --noEmit` ✓

---

## Orchestration System Type — orchestration_system_type

### Wave 1: Core Engine (4 stories, independent)
- [x] **CP-119**: Add :orchestration plugin_scope (US-389)
- [x] **CP-120**: OrchestrationManager GenServer with DAG engine (US-390)
- [x] **CP-121**: OrchestrationRunStore — run history + replay (US-391)
- [x] **CP-122**: Skill topology declaration protocol (US-392)
- After Wave 1: `mix compile --warnings-as-errors` ✓

### Wave 2: LiveView + API + Plugin (4 stories, depends on Wave 1)
- [x] **CP-123**: OrchestrationLive — /orchestration page with D3.js DAG (US-393)
- [x] **CP-124**: API endpoints — /api/v2/orchestrations CRUD + replay (US-394)
- [x] **CP-125**: Sidebar nav + orchestration widget (US-395)
- [x] **CP-126**: OrchestrationPlugin — PluginBehaviour implementation (US-396)
- After Wave 2: `mix compile --warnings-as-errors` ✓

### Wave 3: Skill Integrations (7 stories, parallel)
- [x] **CP-127**: formation topology declaration (US-397)
- [x] **CP-128**: upm topology declaration (US-398)
- [x] **CP-129**: ralph topology declaration (US-399)
- [x] **CP-130**: orchestrator topology declaration (US-400)
- [x] **CP-131**: feature-dev + deploy:agents + fleet topologies (US-401-403)
- After Wave 3: `mix compile --warnings-as-errors` ✓

### Wave 4: Tests + Ship (3 stories, depends on Wave 3)
- [x] **CP-132**: Integration tests (US-404)
- [x] **CP-133**: Skill topology tests (US-405)
- [x] **CP-134**: Final gate + ship (US-406)
- After Wave 4: `mix test --only orchestration` ✓ (69/69)

---

## Claude-Mem APM Plugin — claude_mem_apm_plugin

### Wave 1: Scope & Infrastructure GenServers (3 stories, independent)
- [x] **CP-135**: Add :memory plugin_scope atom to PluginBehaviour (US-410)
- [x] **CP-136**: MemoryClientBridge GenServer — claude-mem worker HTTP + SQLite fallback (US-411)
- [x] **CP-137**: ObservationCache ETS store — TTL, LRU eviction, PubSub (US-412)
- After Wave 1: `mix compile --warnings-as-errors` ✓

### Wave 2: Plugin Core, LiveView & Correlator (3 stories, depends on Wave 1)
- [x] **CP-138**: MemoryPlugin — PluginBehaviour with 5 actions, nav, widget, supervisor children (US-413)
- [x] **CP-139**: MemoryLive — /memory page with Browse, Search, Timeline tabs (US-414)
- [x] **CP-140**: ConversationMemoryCorrelator — observation-session linking (US-415)
- After Wave 2: `mix compile --warnings-as-errors` ✓

### Wave 3: Detail Panel, Dashboard Widget & API (3 stories, depends on Wave 2)
- [x] **CP-141**: MemoryLive observation detail panel with correlation (US-416)
- [x] **CP-142**: Dashboard widget — observation summary, health indicator (US-417)
- [x] **CP-143**: REST API — /api/v2/memory/* 5 endpoints (US-418)
- After Wave 3: `mix compile --warnings-as-errors` ✓

### Wave 4: Cross-Reference, Nav, Integration Upgrade (3 stories, depends on Wave 3)
- [x] **CP-144**: ConversationMonitorLive Memory tab + MemoryLive Sessions section (US-419)
- [x] **CP-145**: Sidebar nav + OpenAPI spec update (US-420)
- [x] **CP-146**: ClaudeMemIntegration delegation to MemoryPlugin (US-421)
- After Wave 4: `mix compile --warnings-as-errors` ✓

### Wave 5: Tests & Final Gate (2 stories, depends on Wave 4)
- [x] **CP-147**: Integration tests — plugin, bridge, cache, correlator, API (US-422)
- [x] **CP-148**: Final compile gate + manual verification (US-423)
- After Wave 5: `mix test --only memory` ✓ AND `mix compile --warnings-as-errors` ✓

---

## Testmaxxing Formation v2 Integration — testmaxxing_formation_v2

### Wave 1: Edge Types, Channel Schema, Agent Metadata (3 stories, independent)
- [x] **CP-149**: Add edge_type to D3 formation graph edges (US-424)
- [x] **CP-150**: Add channel field to notification schema and API (US-425)
- [x] **CP-154**: Agent registration accepts publishes/subscribes/exports/imports metadata (US-429)
- After Wave 1: `mix compile --warnings-as-errors` required

### Wave 2: Tree Builder, DOT Endpoint, Filters, Template, Legend (5 stories, depends on Wave 1)
- [x] **CP-151**: Add pub/sub channel edges to formation tree builder (US-426)
- [x] **CP-152**: DOT graph rendering endpoint and FormationLive tab (US-427)
- [x] **CP-153**: Notification panel channel filter (US-428)
- [x] **CP-155**: Testmaxxing formation template in UpmStore (US-430)
- [x] **CP-156**: FormationLive legend for edge types (US-431)
- After Wave 2: `mix compile --warnings-as-errors` required

### Wave 3: Tests & Final Gate (2 stories, depends on Wave 2)
- [x] **CP-157**: Integration tests — typed edges, channel notifications, DOT endpoint (US-432)
- [x] **CP-158**: Final compile gate and LILY-554 closure (US-433)
- After Wave 3: `mix test --only testmaxxing` ✓ AND `mix compile --warnings-as-errors` ✓

---

## CCEM APM Full Redesign — ccem_apm_redesign (shipped v9.1.3)

**Branch**: `ralph/ccem-apm-redesign` | **Input**: Claude Design handoff `CCEM APM (1).zip`
**Worktree**: `.claude/worktrees/ccem-apm-redesign`
**Formation**: `fmt-20260504-ccem-redesign` | **UPM Session**: `upm-ccem-apm-redesign-20260504`

### Wave 1: Design System Foundation — Tokens + Primitives + Scaffolding (8 stories, independent)
- [x] **CP-159**: DS: tokens.css → Phoenix CSS layer + Geist fonts (US-434)
- [x] **CP-160**: DS: Button LiveComponent (5 variants × 4 sizes) (US-435)
- [x] **CP-161**: DS: Badge + Dot primitives (7 tones, presence animation) (US-436)
- [x] **CP-162**: DS: Input + Kbd chip primitives (US-437)
- [x] **CP-163**: DS: Card + Stat tile + Table primitives (US-438)
- [x] **CP-164**: DS: Segmented control + Toggle primitives (US-439)
- [x] **CP-165**: DS: Scaffolding — Sidebar nav (10 groups, collapsible) (US-440)
- [x] **CP-166**: DS: Scaffolding — Top bar (project switcher, ⌘K trigger, presence) (US-441)
- After Wave 1: `mix compile --warnings-as-errors` required

### Wave 2: AI-Native Components + Layout Shell + DS TDD (8 stories, depends on Wave 1)
- [x] **CP-167**: DS AI: Sparkline + Bars (live 60-point window, animated trailing dot) (US-442)
- [x] **CP-168**: DS AI: StreamingText + Skeleton shimmer (US-443)
- [x] **CP-169**: DS AI: Waveform + Gauge LiveComponents (US-444)
- [x] **CP-170**: DS AI: AgentCard LiveComponent (identicon, sparkline, skill badges) (US-445)
- [x] **CP-171**: DS AI: CommandBar ⌘K (global, focus trap, groups, AI streaming) (US-446)
- [x] **CP-172**: DS AI: GraphNode + Edge (D3.js, animated live edges, PubSub 3s TTL) (US-447)
- [x] **CP-173**: DS AI: Presence stack + Right inspector panel scaffolding (US-448)
- [x] **CP-174**: DS: Motion constants, scanline, page layout shell + DS TDD suite (US-449)
- After Wave 2: `mix compile --warnings-as-errors` required AND `mix test --only design_system` ✓

### Wave 3: Observe Primary + Authorization v9 (4 stories, depends on Wave 2)
- [x] **CP-175**: Observe: Dashboard LiveView (6-up metrics, formation graph, fleet table) (US-450)
- [x] **CP-176**: Observe: Fleet LiveView (agent grid/list, AgentCard, filter rail) (US-451)
- [x] **CP-177**: Observe: Session Detail LiveView (JSONL viewer, tool call trace) (US-452)
- [x] **CP-178**: Govern: Authorization v9 LiveView (20s TTL countdown, policy rules) (US-453)
- After Wave 3: `mix compile --warnings-as-errors` required

### Wave 4: Observe Secondary + TDD (5 stories, depends on Wave 3)
- [x] **CP-179**: Observe: Formations LiveView (tree + matrix + list + dot layout modes) (US-454)
- [x] **CP-180**: Observe: Timeline LiveView (swim-lane, 15m→24h window) (US-455)
- [x] **CP-181**: Observe: Conversations LiveView (live transcript, CoWork split) (US-456)
- [x] **CP-182**: Observe: Tool Calls + A2A + Architecture LiveViews (US-457)
- [x] **CP-183**: Observe Wave 3 TDD suite (Dashboard, Fleet, Session Detail, Auth v9) (US-458)
- After Wave 4: `mix compile --warnings-as-errors` required AND `mix test --only observe_wave3` ✓

### Wave 5: Measure Section (3 stories, parallel with Wave 6, depends on Wave 2)
- [x] **CP-184**: Measure: Analytics + Usage + Health LiveViews (US-459)
- [x] **CP-185**: Measure: Ports + Tasks + Actions + Scanner LiveViews (US-460)
- [x] **CP-186**: Measure: UAT + DRTW LiveViews (US-461)
- After Wave 5: `mix compile --warnings-as-errors` required

### Wave 6: Intelligence Section (3 stories, parallel with Wave 5, depends on Wave 2)
- [x] **CP-187**: Intelligence: Skills + Skill Drift LiveViews (US-462)
- [x] **CP-188**: Intelligence: Library + Memory LiveViews (US-463)
- [x] **CP-189**: Intelligence: Orchestration + Intake + Alignment LiveViews (US-464)
- After Wave 6: `mix compile --warnings-as-errors` required

### Wave 7: Govern Remaining + TDD (2 stories, depends on Wave 3)
- [x] **CP-190**: Govern: Approvals + Routing + Coalesce + UPM LiveViews (US-465)
- [x] **CP-191**: Govern + Intelligence TDD suite (US-466)
- After Wave 7: `mix compile --warnings-as-errors` required AND `mix test --only govern_intelligence` ✓ (29/29)

### Wave 8: Extend Section (2 stories, depends on Wave 2)
- [x] **CP-192**: Extend: Plugins + Integrations + AG-UI + Notifications LiveViews (US-467)
- [x] **CP-193**: Extend: Showcase + Docs LiveViews (US-468)
- After Wave 8: `mix compile --warnings-as-errors` required

### Wave 9: Platform + AI Platform + Final Gate (5 stories, depends on all above)
- [x] **CP-194**: Platform: Architecture + DRTW + UAT LiveViews (US-469)
- [x] **CP-195**: AI Platform: LVM Integration LiveView (Claude model cards) (US-470)
- [x] **CP-196**: AI Platform: Claude Code Discovery + Ralph Plugin LiveViews (US-471)
- [x] **CP-197**: AI Platform: AG-UI Plugin + Authorization v9 deep page (US-472)
- [x] **CP-198**: Final: Extend + Platform + AI Platform TDD suite + compile gate (US-473) — shipped as v9.1.3
- After Wave 9: `mix test --only platform` ✓ (34/34) AND `mix compile --warnings-as-errors` ✓ AND version → v9.1.3 (shipped as v9.1.3, tag pushed)

---

## Claude Code Harness Plugin — claude_harness_plugin (v9.1.2)

**Branch**: `ralph/harness-plugin` | **Worktree**: main working tree
**Worktree ID**: `wt_e0fd7a08e1adf8de` | **apm-v4 commit**: `68bc331`

### Wave 1: Core GenServers + Plugin + LiveView + API (all independent, deployed in parallel)
- [x] **CP-199**: HarnessPlugin (`:ccem` scope) + HarnessMonitor GenServer (15s session.json poll, PubSub `"harness:state"`) + HookTelemetryBuffer ETS ring buffer (500 cap, subscribes `"apm:hooks"`)
- [x] **CP-200**: HarnessLive at `/plugins/harness` — 3-tab (health/hooks/session), PubSub-subscribed, graceful dead-process handling
- [x] **CP-201**: HarnessController at `/api/v2/harness/*` — 5 endpoints (health, hooks, session, plans, settings) with 503 on dead GenServer

### Wave 2: Integration Wiring (depends on Wave 1, all in single pass)
- [x] **CP-202**: plugin_registry @default_plugins + application.ex supervision + router LiveView + API routes + hook_registry harness hooks + dashboard_live.ex tone helpers fix
- After Wave 2: `mix compile --warnings-as-errors` ✓ (0 errors, 68bc331)

---

## Hook Filesystem Repair — repair_hooks (v9.1.2 maintenance)

**Branch**: main | **Formation**: `fmt-20260504-repair-hooks`
**Plane Issue**: CCEM-528 | **Root Cause**: DevDrive DDRV902 disconnect → disk fill → sudo-touch artifacts

### Wave 1: Repair Infrastructure (independent, deployed in single session)
- [x] **CP-203**: ActionEngine: add `repair_hooks` action to @catalog (category: hooks, icon: wrench) + execute_action/3 dispatch — runs repair_hooks.sh, detects root-owned .remember dirs via `find -not -user`, emits APM notification with sudo_command field (US-356 / CCEM-528)
- [x] **CP-204**: Create `~/.claude/skills/repair-hooks/SKILL.md` — native /repair-hooks Claude Code skill with check|fix|fix-sudo|status subcommands, APM action reference, self-healing hook pattern, root cause documentation (US-356 / CCEM-528)
- [x] **CP-205**: Create `~/Developer/ccem/apm/hooks/repair_hooks.sh` — idempotent scan of all ~/Developer project dirs, creates missing .remember/logs/hook-errors.log, detects root-owned paths and reports them (US-356 / CCEM-528)
- After Wave 1: `mix compile` ✓ (0 errors) | 6 root-owned .remember dirs still need: `sudo chown -R jeremiah:staff ~/Developer/.remember ~/Developer/ccem/.remember ~/Developer/Dossier/.remember ~/Developer/lily-ai-phx/.remember ~/Developer/claude-expertise/.remember ~/Developer/plane/.remember`

---

## v9.2.0 SSOT Confluence — v920_confluence (shipped 2026-05-14)

### Wave 1: Discovery (3 stories, parallel)
- [x] CP-206: sqlite-vec KB at ~/Developer/ccem/.ssot/ccem.sqlite (242 chunks, fallback BLOB cosine)
- [x] CP-207: Nav tree inventory → docs/sprint-v9.2.0/nav-tree.md
- [x] CP-208: Feature graph w/ referential integrity → docs/sprint-v9.2.0/feature-graph.{md,mmd,json}

### Wave 2: Foundation (3 stories, parallel)
- [x] CP-209: apm-api-reference SKILL.md auto-generated from OpenAPI snapshot (113 endpoints)
- [x] CP-210: page_layout.ex restructure — top-nav PARENT of row(sidebar, main, inspector)
- [x] CP-211: Version bump v9.1.4 → v9.2.0 across mix.exs + AppVersion + CLAUDE.md SSOT

### Wave 3: Hook Propagation (1 story)
- [x] CP-212: Hook sync across ~/Developer/** + ~/tools/** + user scope ~/.claude/hooks/

### Wave 4: Skill Sweep (2 stories)
- [x] CP-213: 15 APM-touching skills updated to v9.2.0 endpoints + payloads
- [x] CP-214: /coalesce + /showcase cross-sync, features.json entry added

### Wave 5: Verify & Ship (1 story)
- [x] CP-215: Compile gate + commits + tag v9.2.0 (unpushed)

---

## v9.3.0 Governance Foundation — v930_governance_foundation (shipped 2026-05-28)

Integration branch: `ralph/v9.3.0-governance-foundation` (off v9.2.1). Tag `v9.3.0` = `77cf3410ca6e593140a687a59de5d709f064ef5a`.

### Wave 1-7 (48 stories, 4 tracks, 4 parallel worktrees)
- [x] CP-216..CP-220: obs-s1 OTel SDK + obs-s2 peep + obs-s3 traceparent + obs-s4 Tracing + obs-s5 Grafana
- [x] CP-221..CP-226: audit-s3 unified schema + s4 merge + s5 logger_json + s6 retention + s7 sink + s8 cursor
- [x] CP-227..CP-236: auth-s1 PolicyDecisionStore + comp-gov3/gov4/map1/map2/ms1/ms2/mg1/mg2/mg3
- [x] CP-237..CP-243: rl-s2 hammer + rl-s3 fuse + rl-s4 plug_attack + rl-s5..s8 + rl-headers/adaptive/widget
- [x] CP-244..CP-249: wf-s1 digraph + s2 FSM + s3 WAL + s4 reactor + s5 approval + s6 timeout
- [x] CP-250..CP-254: hc-s1 RFC 8615 + s2..s4 K8s probes + s5 VM checks
- [x] CP-255..CP-259: coord-b1 TaskStore + b2 bridge + c1 FIPA + c2 FileLockRegistry + c3 ArtifactVersionStore
- [x] CP-260..CP-263: api-s3 zod + s4 ts + s5 spex + s6 contract tests

### Integration notes (2026-05-28)
- 4 merge conflicts resolved (mix.exs deps union, mix.lock regen, application.ex/router.ex supervisor and pipeline union, audit_log.ex field union, telemetry.ex moduledoc union, api_spec.ex rewrite favoring api-gov Wave 1 implementation, auth_supervisor.ex union).
- open_api_spex CastAndValidate moved from router :api pipeline INTO the 4 annotated controllers (ApiV2Controller, AuthController, AgentControlController, ApprovalController) because the plug requires :phoenix_controller in conn.private (only set after dispatch). Added `def open_api_operation(_), do: nil` catch-all to each to override OpenApiSpex.ControllerSpecs.before_compile's IO.warn default (which returns :ok and crashes the plug).
- Tests: 333 total, 3 failures (pre-existing DocsFreshness baseline — needs separate docs refresh PR). 0 net-new regressions vs v9.2.1 baseline (FormationPersistenceStore isolation test passed after restart).
- 16 new hex deps installed: opentelemetry stack (7), peep, logger_json, cloak, hammer, fuse, plug_attack, reactor, exqlite (was optional).
- Endpoints verified: /api/status (v9.3.0), /api/v2/governance/controls (13), /metrics (peep), /healthz, /.well-known/agent-card.json (v9.3.0). /api/health "fail" only due to dev-box ETS size 7.5GB threshold (not a v9.3.0 regression).
- Skills coalesced to v9.3.0: apm, apm-api-reference, apm-auth, orchestrator, ccem-apm. Formation skill keeps "Known APM v9.2.0 quirks" heading as historical (those quirks remain valid).
- mix.exs SSOT bump 9.2.1 → 9.3.0 (single source — ApmV5.AppVersion reads from app spec).
- Plane cycle 9411c1d9 description updated with shipped marker.

---

## v9.3.1 → v10.3.0 Integration — final-integration-lead (2026-05-28)

**Branch**: `ralph/v10.3.0-endpoint` | **Formation**: `formation-final-integration`
**Merged**: 14 branches (4 v9.3.1 + 6 v9.4.0 + 4 v10.x)
**Total merge conflicts**: 9 resolved

| CP | Version | Story | Tag SHA |
|----|---------|-------|---------|
| CP-264..CP-272 | v9.3.1 | 11 stories: rl-s9/s10 (rate-limit top-agents + heatmap), api-s6p..s10 (ETS fixtures, contract tests, DeprecationPlug, AsyncAPI, Schemathesis), cleanup-1/2, docfix-1, showcase-5/7 | `98a0bb82` |
| CP-273..CP-286 | v9.4.0 | 14 stories: KeyStore Ed25519, DIDProvider did:key, ArtifactAttestation, ProvExporter PROV-DM, AgentRoleIndex, LineageTracker, DelegationChain, OTel gen_ai spans, PolicyRulesStore versioning, PolicyPredicate DSL, EventStore opt-in, api-spec build_spec/0 deletion (1433 LOC) | `deb7a376` |
| CP-287..CP-291 | v10.0.0 (BREAKING) | 3 stories: RFC 7523 JWT Bearer Assertions (LINCHPIN), DelegationToken OWASP MCP02, Horde+libcluster staged | `50e1beae` |
| CP-292..CP-295 | v10.1.0 | 4 stories: OpaClient :httpc, 4 Rego policies, GET /api/v2/auth/policy/rego, PolicyPriorityResolver (deny-wins/most-specific/first-match) | `6e743a16` |
| CP-296..CP-297 | v10.2.0 | 2 stories: hammer_backend_redis swap, assent OIDC SessionStore + JWKS cache | `87af8ce3` |
| CP-298..CP-300 | v10.3.0 GOAL CLOSED | 3 stories: wax_ WebAuthn FIDO2 on /approve gate, SLSA Provenance v1.0 DSSE PAE, W3C Verifiable Credentials JWT-VC | `0eae31de` |

**Net new hex deps**: 4 (assent, req, jose, wax_) — vs DRTW research's 23-dep recommendation.
**Test baseline**: 374 (v9.3.1) → 545 (v9.4.0) → 665 (v10.0.0) → 679 (v10.2.0) → 728 (v10.3.0). All pre-existing failures only.
**Conflict resolutions**: agent_registry do_register_agent refactor (2x), policy_engine aliases union, policy_rules_store to_rego insertion, auth_controller policy_history+rego_export both kept, mix.exs dep unions (2x), mix.lock entry ordering (2x), router.ex provenance+slsa routes, provenance_controller show/2 added to existing module.
**Plane cycles updated**: v9.3.1, v9.4.0, v10.0.0, v10.1.0, v10.2.0, v10.3.0 — all marked shipped 2026-05-28.
**Skills coalesced**: apm, apm-auth, ccem-apm, orchestrator, apm-api-reference (all bumped to v10.3.0 strings). OpenAPI snapshot refreshed.

---

## v11.0.0 Design Intake + Phase 0+1+2 Implementation — v110_design_intake (2026-05-29 → 2026-06-02)

Bundle ingested from Claude Design at `~/Downloads/CCEM APM (2).zip` → staged at `~/Developer/ccem/design-intake/v11.0.0/from-designer/`. Three stacked PRs landed all Phase 0 foundations + Phase 1 stubs + Phase 2 gold-standard pages.

### Wave 1: Phase 0 Foundations (additive, additive, BREAKING, additive)
- [x] **CP-311**: Phase 0.1 — apply v11 --apm-* tokens with --ccem-* alias bridge (US-491)
- [x] **CP-312**: Phase 0.2 — canonicalize 5-tone severity vocab + Credo check (US-492)
- [x] **CP-313**: Phase 0.4 — wiring monitor LiveView at /health/wiring (US-493)
- [x] **CP-314**: Phase 0.3 — ApmV5.* → Apm.* module rename + 12 deprecation shims [BREAKING] (US-494)

### Wave 2: Phase 1 Component Library (additive)
- [x] **CP-315**: Phase 1 — 36 .proposed.exs stubs across 5 tiers (US-495)
  - Tier 1 Primitives (8): button, badge, dot, input, kbd, icon, logo, skeleton
  - Tier 2 Composites (7): field, card, stat_tile, segmented, toggle, search_box, page_header
  - Tier 3 Data (8, empty/loading/error required): data_table, sparkline, gauge, json_viewer, streaming_text, graph, timeline, loading_screen
  - Tier 4 Feedback (8): toast, modal, drawer, command_bar, countdown_ring, empty_state, error_inline, swipe_card
  - Tier 5 Templates (5): page_shell, queue_page, detail_page, split_view, dashboard_grid

### Wave 3: Phase 2 Gold-Standard Pages (additive)
- [x] **CP-316**: Phase 2 — promote 28 stubs + ApmWeb.DecidePendingLive + ApmWeb.InvestigateSessionLive (US-496)
  - 3 context facades: Apm.Decisions, Apm.Sessions, Apm.ToolCalls
  - ApmWeb.IconHelpers (inline SVG, 26 icons)
  - 3 301 redirects: /approvals → /decide/pending, /approvals-history → ?status=resolved, /sessions/:id → /investigate/sessions/:id
  - Tests: 60/60 pass for new LVs; full suite 811/1/2 (1 net-new failure in deprecation_plug_test.exs:100 — indirect cause flagged)

### Branches + PRs
- `ralph/v11.0.0-phase0+1` → PR #24 (draft, Phase 0.1+0.2+0.4 + Phase 1)
- `ralph/v11.0.0-phase0.3-module-rename` → PR #25 (draft, stacked on #24, BREAKING)
- `ralph/v11.0.0-phase2-gold-pages` → PR #26 (draft, stacked on #25)

### Wave 4: Phase 3 Foundations (2026-06-02)
- [x] **CP-317**: Skills permissive list + MCP Market repository management API (US-497, CCEM-694)
- [x] **CP-318**: Fix 14 test regressions — function_exported? load-order, JWT padding bypass, Bypass contention (US-498, CCEM-695) — 811/0
- [x] **CP-319**: 6 JS motion hooks — CountdownRing, SwipeDecide, DrawerSlide, ModalTrap, CountUp, SparklineDot (US-499, CCEM-696)
- [x] **CP-320**: Live section /live/* route aliases — 4 routes (US-500, CCEM-697)
- [x] **CP-321**: Decide + Investigate section route wiring — 7 routes (US-501, CCEM-698)

### Wave 5: Phase 4-5 Features + Section Migrations (2026-06-02)
**UPM session**: `upm-v11-p4-1780432138` | **Fleet**: `formation-83` | **Plane**: CCEM-699–707
- [x] **CP-322**: DecisionModal sticky-policy backend — PolicyRulesStore.add_rule/3 wired (US-502, CCEM-699)
- [x] **CP-323**: PageShell live pending badge count — ApmWeb.Hooks.PendingCountHook on_mount (US-503, CCEM-700)
- [x] **CP-324**: CCEMHelper bundle-id flip ccem.helper → apm.helper (US-504, CCEM-701)
- [x] **CP-325**: Tune section /tune/* route aliases — 5 routes (US-505, CCEM-702)
- [x] **CP-326**: Operate section /operate/* route aliases — 5 routes (US-506, CCEM-703)
- [x] **CP-327**: Icon sprite migration — 26+1 icons → priv/static/images/apm-sprite.svg (US-507, CCEM-704)
- [x] **CP-328**: Live section e2e drift validation — 4/4 /live/* routes pass (US-508, CCEM-705)
- [x] **CP-329**: Decide+Investigate section drift validation — 6/6 routes pass (US-509, CCEM-706)
- [x] **CP-330**: All v11 routes smoke-test post-restart — 24/24 routes pass (US-510, CCEM-707)
After Wave 5: `mix compile --warnings-as-errors` ✓ | `mix test --seed 42` 811/0 | apm-v4 HEAD: `00bcedd`

### Wave 6: F-V11.3-HOTFIX — Post-ship dashboard UI bundle (2026-06-03)
**Formation**: `formation-3909` (specialize-staged, 18 agents, 3 squadrons: alpha-diagnose / bravo-fix / charlie-verify).
**Goal**: 6 visual + data defects observed in localhost:3032 dashboard post-CP-330 ship.
- [x] **CP-331**: Doubled "CCEM APM" wordmark — sidebar_nav.ex brand header removed; top_bar.ex canonical (post-CP-210); project switcher suppresses label when name == brand (US-511, CCEM-708)
- [x] **CP-332**: Skills nav badge "red 44" — resolved transitively by CP-335 daisyUI mapping; badge is `badge-primary` (blue), always was (US-512, CCEM-709)
- [x] **CP-333**: SESSIONS=0 — `count_config_sessions/1` (counts never-hydrated `apm_config.json` array) → `live_session_count/1` → `Apm.SessionManager.list_sessions/0` (US-513, CCEM-710)
- [x] **CP-334**: Fleet table empty despite AGENTS>0 — agent_panel.ex hardened with safe map-accessors `agent[:field]`; single malformed agent no longer crashes `:for` (US-514, CCEM-711)
- [x] **CP-335**: Sidebar dim styling — apm_tokens_aliases.css adds daisyUI compat: `--color-base-content`, `--color-primary`, `--color-base-100/200/300`, `--color-success/warning/error/info` all → `--apm-*` (US-515, CCEM-712)
- [x] **CP-336**: Formation graph cramped labels — d3 tree `nodeSize` bumped `[90,200]/[170,110]` → `[120,250]/[200,140]` (LR/TD), +33% h +25-30% v (US-516, CCEM-713)
After Wave 6: `mix compile --warnings-as-errors` ✓ | `mix test --seed 42` **816/0** + 2 skipped | `mix test test/apm_web/hotfix_v11_3_test.exs` **5/5** | Headed Playwright at localhost:3032 — A:1 wordmark ✓ B:badge-primary ✓ C:SESSIONS=5289 ✓ D:fleet 4 rows ✓ E:--color-base-content resolved ✓ F:0 label overlaps ✓ | apm-v4 HEAD: `39f41f8` | ccem submodule bump: `b7204ce`

### Wave 6.1: CP-337 — CP-331 regression repair (2026-06-09)
- [x] **CP-337**: Restore sidebar brand wordmark + hide top-bar project switcher chip cleanly. CP-331 over-de-duplicated: stripped sidebar wordmark wholesale (leaving empty header zone with orphaned v11.0.0 + lone chevron) AND rendered literal "Project" placeholder text in the top-bar chip when project name matched the brand. Real fix: sidebar product identity ≠ top-bar page context (both can coexist); when project name ∈ {CCEM APM, CCEM_APM, ccem-apm, ccem, ""}, omit the entire `<details>` switcher (US-517, CCEM-714)
After Wave 6.1: `mix compile --warnings-as-errors` ✓ | Playwright headed verify ✓ | apm-v4 HEAD: `78c75b3` | ccem HEAD: `7685967` (pushed)

### Wave 6.2: CP-338 — /api/v2/formations cold-start race (2026-06-09)
- [x] **CP-338**: Cold-start race fix — three unguarded `:ets.tab2list/1` calls in the formations list path raised ArgumentError when the named ETS table did not exist (the window between Phoenix endpoint boot and supervisor children boot). DashboardLive mount → /api/v2/formations → 500. Diagnosed via parallel /quality background agent (formation-961/charlie-quality, 4min turnaround). Fixed three public read paths (AgentRegistry.get_notifications/0 + .list_agents/0, UpmStore.list_formations/0) with `rescue ArgumentError -> []`. Secondary sort_by guard on :name → Map.get(f, :name, f.id) for heterogeneous formation lists. TDD-first: 4 new tests in `test/apm/cold_start_resilience_test.exs` (RED → GREEN), full suite 820/0/2 skipped. Live verify: `curl /api/v2/formations` returns 200 on first cold request post-restart. (US-518, CCEM-715)
After Wave 6.2: `mix compile --warnings-as-errors` ✓ | `mix test --seed 42` **820/0** + 2 skipped | live cold-curl HTTP 200 ✓ | apm-v4 HEAD: `fd418e2` (pushed) | Formation `formation-961` ccem-showcase-live-team active w/ 7 leaf agents, 4 A2A channels (showcase.story, defects.diagnosis, quality.findings, agui.broadcast)

### Deferred to Phase 6+ (remaining)
- Drawer swipe gesture for mobile (requires native touch API work)
- Phases 6-7 Tune sub-page implementations (currently aliased to existing pages)
- npm scope rename @ccem/* → @agent-j/* (npm publish coordination required)

