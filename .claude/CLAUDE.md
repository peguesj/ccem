# CCEM Project Memory

## Authorship & Identifiers

- **Author**: Jeremiah Pegues
- **Organization Domain**: `pegues.io`
- **Reverse-DNS Identifier Prefix**: `io.pegues.agent-j.labs`
- **launchd Labels**:
  - APM Server: `io.pegues.agent-j.labs.ccem.apm-server`
  - CCEMAgent: `io.pegues.agent-j.labs.ccem.agent`
- **Use this prefix** for all launchd plists, bundle identifiers, and reverse-DNS identifiers across CCEM and related projects.

## APM Server Lifecycle Rules

**ALWAYS start CCEMAgent alongside the APM server.** When running `mix phx.server`, ALWAYS also launch CCEMAgent immediately after:
```bash
# Start APM
cd ~/Developer/ccem/apm-v4
nohup mix phx.server > ~/Developer/ccem/apm/hooks/apm_server.log 2>&1 &
echo $! > .apm.pid

# Start CCEMAgent immediately after - MANDATORY
open -a CCEMAgent
```

**When rebuilding CCEMAgent**, ALWAYS run `swift build` from `~/Developer/ccem/CCEMAgent/` and then relaunch:
```bash
cd ~/Developer/ccem/CCEMAgent
swift build -c release
open -a CCEMAgent
```

**When updating CCEM or CCEM APM source:**
1. Rebuild CCEMAgent: `cd ~/Developer/ccem/CCEMAgent && swift build -c release`
2. Relaunch: `open -a CCEMAgent`
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
| APM log | `~/Developer/ccem/apm/hooks/apm_server.log` |
| APM config | `~/Developer/ccem/apm/apm_config.json` |
| CCEMAgent source | `~/Developer/ccem/CCEMAgent/` |
| ccem-apm skill | `~/.claude/skills/ccem-apm/SKILL.md` |
| ccem-apm command | `~/.claude/commands/ccem-apm.md` |

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

## OpenAPI Endpoints

Both serve the full 56-path OpenAPI 3.0.3 spec:
- `GET http://localhost:3032/api/v2/openapi.json` (canonical)
- `GET http://localhost:3032/api/openapi.json` (v1 alias)

## Current Version: v5.0.0

## Implementation Checkpoints — ralph/upm-module-ccem-apm

### Wave 1: Foundation (Independent)
- [x] **CP-35**: UPM.ProjectRegistry GenServer + ETS + scan_and_sync (US-001)
- [x] **CP-36**: UPM.PMIntegrationStore + adapter_for/1 test_connection delegation (US-002)
- [x] **CP-37**: UPM.VCSIntegrationStore + sync_type enum (US-003)
- [x] **CP-38**: UPM.WorkItemStore + detect_drift/1 + detect_drift_all/0 (US-004)
- After Wave 1: `mix compile --warnings-as-errors` ✓ PASS

### Wave 2: Adapters + Sync (depends on Wave 1)
- [x] **CP-39**: PM Adapters — PMAdapter behaviour + Plane/Linear/Jira/Monday/MSProject (US-005, US-006)
- [x] **CP-40**: VCS Adapters — VCSAdapter behaviour + GitHub/AzureDevOps (US-007)
- [x] **CP-41**: UPM.SyncEngine GenServer — 5-min scheduled sync + drift detection (US-008)
- After Wave 2: `mix compile --warnings-as-errors` ✓ PASS

### Wave 3: REST + LiveView + CCEMAgent (depends on Wave 2)
- [x] **CP-42**: UpmController — 22 REST endpoints at /api/upm/* (US-009)
- [x] **CP-43**: Router — browser + API routes for UPM (US-009)
- [x] **CP-44**: UpmLive — /upm, /upm/:id, /upm/:id/board + Kanban board (US-010)
- [x] **CP-45**: UPM nav item added to all 19 LiveViews (US-010)
- [x] **CP-46**: CCEMAgent UPMMonitor + UPMModels + MenuBar UPM section (US-011)
- [x] **CP-47**: v4.1.0 CHANGELOG + mix.exs version bump (US-012)
- After Wave 3: `mix compile --warnings-as-errors` ✓ PASS | `swift build -c release` ✓ PASS

## Implementation Checkpoints — ralph/apm-v4-formation-ux-integration

### Wave 1: Foundation (Independent)
- [x] **CP-01**: Add live-integration-testing MCPs to CCEM project scope (US-001)
- [x] **CP-02**: SkillHookDeployer GenServer + hook deployment endpoint (US-002)
- [x] **CP-03**: WorkflowSchemaStore — unified ship/upm/ralph integration layer (US-003)
- [x] **CP-04**: AgentRegistry upgrade — explicit squadron/swarm/cluster hierarchy (US-004)
- [x] **CP-05**: FormationStore GenServer + /api/v2/formations REST endpoints (US-005)
- After Wave 1: `mix compile` must pass with 0 warnings ✓ PASS (EXIT:0)

### Wave 2: Integration (depends on Wave 1)
- [x] **CP-06**: OpenAPI spec update — formation endpoints + workflow schema components (US-006)
- [x] **CP-07**: dependency_graph.js — formation grouping + orthogonal elbow connectors (US-007)
- [x] **CP-08**: FormationLive fix — persist completed formations + deep-link from notifications (US-008)
- [x] **CP-09**: ShipIntegration API endpoints via WorkflowSchemaStore (US-009)
- [x] **CP-10**: Auto-start APM + hook deployment on agentic skill launch (US-010)
- After Wave 2: `mix compile` must pass; verify /formation?id=<id> deep-link works ✓ PASS (EXIT:0)

### Wave 3: UX + Integration Layer (depends on Wave 2)
- [x] **CP-11**: formation_graph.js redesign — squadron/swarm swim lanes (US-011)
- [x] **CP-12**: Dashboard layout refactor — sidebar nav + quadrant panels (US-012)
- [x] **CP-13**: Notification panel — tabbed categories + richer cards (US-013)
- [x] **CP-14**: double-verify endpoint — POST /api/v2/verify/double (US-014)
- [x] **CP-15**: deploy:agents-v2 APM hook support — wave tracking + toasts (US-015)
- [x] **CP-16**: Update ccem-apm SKILL.md + command reference (US-016)
- [x] **CP-17**: Bump to v2.4.0 — mix.exs, CHANGELOG, CCEMAgent rebuild (US-017)
- After Wave 3: `/upm verify` — integration tests against http://localhost:3032 ✓ PASS (compile EXIT:0)

## DRTW — Don't Reinvent The Wheel

This project enforces the DRTW principle via `~/.claude/skills/drtw/SKILL.md`.

Before implementing any new feature or utility in CCEM:
1. Check `package.json` (Node packages already installed)
2. Check `mix.exs` in `apm-v4/` (Elixir deps already installed)
3. Run `/drtw <description>` to discover existing solutions
4. Check https://www.aitmpl.com/skills for community skills
5. Only build custom after exhausting L1–L4

**For CCEM-specific patterns**:
- APM notifications: use existing `POST /api/notify` endpoint
- Agent heartbeats: use existing `POST /api/heartbeat` endpoint
- Formation tracking: use existing `POST /api/upm/register` endpoint
- Background tasks: use existing `BackgroundTasksStore` GenServer
- Project scanning: use existing `ProjectScanner` GenServer

**Hook integration**: DRTW discovery hook fires on Write/Edit operations
automatically from user-scope settings.json.

## Implementation Checkpoints — ralph/ccem-v2-5-expanded-features

### Wave 1: Foundation (Independent — 4 worktrees parallel)
- [x] **CP-18**: APMServerManager Swift service — start/stop APM (US-001) [WT: ccem-agent-ui]
- [x] **CP-19**: CCEMAgent telemetry models + APMClient.fetchTelemetry() (US-004) [WT: ccem-agent-ui]
- [x] **CP-20**: APM v4 GET /api/telemetry endpoint (US-006) [WT: ccem-agent-ui]
- [x] **CP-21**: APM v4 BackgroundTasksStore GenServer (US-007) [WT: ccem-claude-native]
- [x] **CP-22**: APM v4 ProjectScanner GenServer (US-011) [WT: apm-project-scanner]
- [x] **CP-23**: APM v4 ActionEngine GenServer (US-014) [WT: apm-actions]
- After Wave 1: `mix compile` must pass; `swift build` in CCEMAgent must pass

### Wave 2: Integration (depends on Wave 1)
- [x] **CP-24**: CCEMAgent MenuBarView — start APM button in disconnected state (US-002) [WT: ccem-agent-ui]
- [x] **CP-25**: CCEMAgent MenuBarView — telemetry usage chart (US-005) [WT: ccem-agent-ui]
- [x] **CP-26**: CCEMAgent background tasks section in MenuBarView (US-010) [WT: ccem-claude-native]
- [x] **CP-27**: APM v4 background tasks REST API endpoints (US-008) [WT: ccem-claude-native]
- [x] **CP-28**: APM v4 project scanner REST API endpoints (US-012) [WT: apm-project-scanner]
- [x] **CP-29**: APM v4 actions REST API endpoints (US-015) [WT: apm-actions]
- After Wave 2: `mix compile` must pass; `swift build` must pass

### Wave 3: UX + LiveViews (depends on Wave 2)
- [x] **CP-30**: CCEMAgent MenuBarView — consistent sections + Start/Stop APM (US-003) [WT: ccem-agent-ui]
- [x] **CP-31**: APM v4 TasksLive LiveView (US-009) [WT: ccem-claude-native]
- [x] **CP-32**: APM v4 ScannerLive LiveView (US-013) [WT: apm-project-scanner]
- [x] **CP-33**: APM v4 ActionsLive LiveView (US-016) [WT: apm-actions]
- After Wave 3: `mix compile` must pass; `swift build` must pass

### Wave 4: Release (depends on Wave 3)
- [x] **CP-34**: APM v4 bump to v2.5.0, CHANGELOG, OpenAPI spec (US-017) [WT: apm-actions]
- After Wave 4: merge all worktrees → main; `mix compile`; `swift build`

## Implementation Checkpoints — ralph/upm-module-ccem-apm

### Wave 1: GenServers (Independent — 4 worktrees parallel)
- [ ] **CP-35**: UPM ProjectRegistry GenServer (US-001) [CCEM-35]
- [ ] **CP-36**: UPM PMIntegrationStore GenServer (US-002) [CCEM-36]
- [ ] **CP-37**: UPM VCSIntegrationStore GenServer (US-003) [CCEM-37]
- [ ] **CP-38**: UPM WorkItemStore GenServer (US-004) [CCEM-38]
- After Wave 1: `mix compile --warnings-as-errors` must pass (0 warnings)

### Wave 2: Adapters + SyncEngine (depends on Wave 1)
- [ ] **CP-39**: Plane + Linear PM adapters (US-005) [CCEM-39]
- [ ] **CP-40**: Jira + Monday + MSProject stub adapters (US-006) [CCEM-40]
- [ ] **CP-41**: GitHub + AzureDevOps VCS adapters (US-007) [CCEM-41]
- [ ] **CP-42**: UPM SyncEngine GenServer (US-008) [CCEM-42]
- After Wave 2: `mix compile --warnings-as-errors` must pass

### Wave 3: API + LiveView + CCEMAgent (depends on Wave 2)
- [ ] **CP-43**: UPM REST API 22 endpoints in UpmController (US-009) [CCEM-43]
- [ ] **CP-44**: UPMLive LiveView /upm dashboard (US-010) [CCEM-44]
- [ ] **CP-45**: CCEMAgent UPMMonitor.swift + UPMModels.swift (US-011) [CCEM-45]
- [ ] **CP-46**: UPM nav wiring + v2.6.0 bump (US-012) [CCEM-46]
- After Wave 3: `mix compile` + `swift build -c release` must pass; verify /upm loads in browser

## Implementation Checkpoints — ralph/ccem-dynamic-apm-v4-2

### Wave 1: Foundation (Independent)
- [x] **CP-48**: SkillsRegistryStore GenServer — health scoring, ETS cache, list_skills/health_score (US-001)
- [x] **CP-49**: BackgroundTasksStore enhanced — agent_name/definition/invoking_process/log_path/runtime_ms + PubSub (US-002)
- [x] **CP-50**: ProjectScanner scan_claude_native/1 — hooks, MCPs, active ports, CLAUDE.md sections (US-003)
- After Wave 1: `mix compile --warnings-as-errors` ✓ PASS

### Wave 2: API (depends on Wave 1)
- [x] **CP-51**: SkillsController REST API — GET /api/skills/registry, /:name, /:name/health, POST /api/skills/audit (US-004)
- [x] **CP-52**: Enhanced Tasks API — GET /tasks/:id/logs, POST /tasks/:id/stop, PATCH /tasks/:id (US-005)
- [x] **CP-53**: ActionEngine skill-audit — fix_skill_frontmatter, complete_skill_description, add_skill_triggers, backfill_project_memory, update_hooks (US-006)
- After Wave 2: `mix compile --warnings-as-errors` ✓ PASS

### Wave 3: UI + Release (depends on Wave 2)
- [x] **CP-54**: SkillsLive health dashboard — three-tier health view, Audit All, Fix buttons, detail panel (US-007)
- [x] **CP-55**: CCEMAgent UI consistency pass — telemetry chart, task runtime/logs, Start/Stop APM (US-008)
- [x] **CP-56**: v4.2.0 CHANGELOG + mix.exs bump (US-009)
- After Wave 3: `mix compile --warnings-as-errors` ✓ PASS | `swift build -c release` ✓ PASS

## CCEM APM Integration

- **APM Dashboard**: http://localhost:3032
- **APM Config**: /Users/jeremiah/Developer/ccem/apm/apm_config.json
- **APM Port**: 3032
- **Skills Path**: ~/.claude/skills/
- **APM Log**: ~/Developer/ccem/apm/hooks/apm_server.log
