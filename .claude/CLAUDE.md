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
curl -s -X POST http://localhost:3031/api/register \
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
lsof -ti:3031 | xargs kill -9 2>/dev/null
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

## OpenAPI Endpoints

Both serve the full 56-path OpenAPI 3.0.3 spec:
- `GET http://localhost:3031/api/v2/openapi.json` (canonical)
- `GET http://localhost:3031/api/openapi.json` (v1 alias)

## Current Version: v4.0.0

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
- After Wave 3: `/upm verify` — integration tests against http://localhost:3031 ✓ PASS (compile EXIT:0)

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
