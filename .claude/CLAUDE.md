# CCEM Project Memory

## Authorship & Identifiers

- **Author**: Jeremiah Pegues
- **Organization Domain**: `pegues.io`
- **Reverse-DNS Identifier Prefix**: `io.pegues.agent-j.labs`
- **launchd Labels**:
  - APM Server: `io.pegues.agent-j.labs.ccem.apm-server`
  - CCEMHelper: `io.pegues.agent-j.labs.ccem.helper`
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

Both serve the full 56-path OpenAPI 3.0.3 spec:
- `GET http://localhost:3032/api/v2/openapi.json` (canonical)
- `GET http://localhost:3032/api/openapi.json` (v1 alias)

## Current Version: v9.0.0


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
