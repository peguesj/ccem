# Hook Audit Handoff — CCEM APM Context
**Date**: 2026-04-18
**Source session**: LFG DevDrive v2 context (~/tools/@yj/lfg)
**Target**: /upm work in ~/Developer/ccem

## Plane Project

**Project ID**: `a20e1d2e-3139-406e-ae03-dc6d1d8cb995`
**Name**: CCEM - Claude Code Environment Manager
**Workspace**: lgtm
**Prefix**: CCEM
**URL**: https://plane.lgtm.build/lgtm/projects/a20e1d2e-3139-406e-ae03-dc6d1d8cb995/

Create one Plane issue per bug below. Suggested label: `hooks`.

---

## Bugs Found (10 total)

### CRITICAL

**Bug 1 — session_init.sh APM kill race**
File: `~/Developer/ccem/apm/hooks/session_init.sh`
Problem: `start_apm()` kills any process on port 3032 before verifying it's the BEAM. `is_apm_running()` PID check races with the kill — if APM is healthy, it still gets killed and restarted, dropping live sessions.
Fix: Before killing, run `curl -sf http://localhost:3032/ > /dev/null 2>&1` (returns HTML 200). Only kill if this fails. NOTE: `/api/health` returns 404 on APM v9.0.0 — do NOT use it. Use `GET /` or `GET /api/v2/sessions`.
Priority: CRITICAL
Plane issue title: `[HOOKS] session_init.sh kills healthy APM — add HTTP health check before port kill`

**Bug 2 — pre_tool_use.sh reads wrong JSON field**
File: `~/.claude/hooks/pre_tool_use.sh`
Problem: Reads `.tool_args` to get tool arguments. Claude Code sends `.tool_input`. All security checks (dangerous command detection, path boundary enforcement) are silently bypassed because `.tool_args` is always null on real traffic.
Fix: Replace all `.tool_args` references with `.tool_input` throughout the file.
Priority: CRITICAL
Plane issue title: `[HOOKS] pre_tool_use.sh reads .tool_args — should be .tool_input; all security checks inert`

**Bug 3 — pre_compact.py calls nonexistent method**
File: `~/.claude/hooks/pre_compact.py`
Problem: Calls `MemoryManager.store_conversation_context()` which does not exist in the MemoryManager API. Raises AttributeError on every compaction → hook exits 1 every time → pre-compact hook is broken.
Fix: Replace `store_conversation_context()` calls with `store_learning()` and/or `record_event()` per the actual MemoryManager API.
Priority: CRITICAL
Plane issue title: `[HOOKS] pre_compact.py calls nonexistent MemoryManager.store_conversation_context() — exits 1 every compaction`

---

### HIGH

**Bug 4 — claude-flow post-edit hook: --format true is invalid**
File: `~/.claude/settings.json` (inline PostToolUse hook for Write/Edit events)
Problem: Uses `--format true` flag with `npx claude-flow@alpha` (which resolves to ruflo v3.5.80). `--format true` is not a valid flag for ruflo; the correct flag is `--format json`. Hook silently misbehaves.
Fix: Change `--format true` → `--format json` in the inline hook in settings.json.
Priority: HIGH
Plane issue title: `[HOOKS] claude-flow post-edit hook uses --format true; ruflo requires --format json`

**Bug 5 — apm_schema_sync.sh hits 404 endpoint, caching HTML as schema**
File: `~/Developer/ccem/apm/hooks/apm_schema_sync.sh`
Problem: Hits `/api/v2/schema` which returns 404 HTML on APM v9.0.0. Hook uses `curl -s` without `-f`, so it doesn't detect the HTTP error. Has been writing `<!DOCTYPE html>...` as schema cache since ~Apr 14.
Fix: Use `/api/v2/openapi.json` instead (verify this exists in APM v9 routes first). Add `-f` to curl. Immediate remediation: `rm ~/.claude/.apm-schema.json ~/.claude/.apm-schema-sync`.
Priority: HIGH
Plane issue title: `[HOOKS] apm_schema_sync.sh hitting /api/v2/schema (404) — caching HTML 404 as schema since Apr 14`

**Bug 6 — catalog_links.py reads wrong field, link cataloging is inert**
File: `~/.claude/hooks/catalog_links.py` (called from `run_hook.sh`)
Problem: Reads `.content` key from PostToolUse payload. Claude Code PostToolUse sends `.tool_response`. Link cataloging is a complete no-op on all real traffic.
Fix: Change `.content` → `.tool_response` in field extraction.
Priority: HIGH
Plane issue title: `[HOOKS] catalog_links.py reads .content; Claude Code sends .tool_response — link cataloging is inert`

**Bug 10 — No DevDrive mount check at session start**
File: `~/.claude/settings.json` (SessionStart hooks — missing)
Problem: No hook verifies that fleet.json APFS volumes are mounted at session start. 904MEMVT corruption caused a compact ENOENT crash after hours of silent failures — the crash happened because `~/.claude/projects` symlinked to an unmounted/corrupt volume.
Fix: Create `devdrive_mount_check.sh` that reads `~/DevDrive/fleet.json`, checks each expected mount point, and warns (does not block) if any volume is unmounted. Register in SessionStart.
Priority: HIGH
Plane issue title: `[HOOKS] Missing session-start DevDrive mount check — 904MEMVT corruption caused compact ENOENT crash`

---

### MEDIUM

**Bug 7 — subagent_stop.sh reads wrong field for child agent ID**
File: `~/Developer/ccem/apm/hooks/subagent_stop.sh`
Problem: Reads `.agent_id` to identify the stopping child agent. Claude Code's SubagentStop event sends `parent_session_id` (not `.agent_id`). All child agents recorded as "unknown" in APM lineage tracking.
Fix: Change `.agent_id` → `.parent_session_id` (verify exact field name against Claude Code SubagentStop schema first).
Priority: MEDIUM
Plane issue title: `[HOOKS] subagent_stop.sh reads .agent_id; SubagentStop sends parent_session_id — all child agents "unknown"`

**Bug 8 — upm-sync-cron.sh exists on disk but not registered in settings.json**
File: `~/.claude/settings.json` (missing registration)
Actual file: `~/.claude/hooks/upm-sync-cron.sh`
Problem: The UPM sync cron hook exists on disk but is not registered in any settings.json hook event. It never runs.
Fix: Add to settings.json under the appropriate hook event (SessionStart or a cron-compatible trigger). Verify the script works standalone before registering.
Priority: MEDIUM
Plane issue title: `[HOOKS] upm-sync-cron.sh not registered in settings.json — UPM sync automation never runs`

**Bug 9 — No Serena activity tracker hook**
File: `~/.claude/settings.json` (missing)
Problem: Serena MCP plugin is enabled and active for the LFG project (6 memory files written, project activated as "lfg"). However, no hook tracks Serena tool invocations. Zero APM telemetry for Serena activity.
Fix: Create `serena_activity_tracker.sh`. Register in PostToolUse to fire when tool name matches `serena__*` pattern. Emit APM span with tool name, symbol/path operated on, and duration.
Priority: MEDIUM
Plane issue title: `[HOOKS] Missing Serena MCP activity tracker — Serena has zero APM telemetry`

---

## APM Self-Correcting Actions to Implement

These are capabilities the APM server itself should expose to make hooks more resilient:

1. **`GET /api/health` → 200 JSON** (currently 404)
   Return `{"status":"ok","version":"9.x.x","uptime_s":N}`. This lets session_init.sh do a clean health check.

2. **Schema endpoint** — expose `GET /api/v2/schema` or `GET /api/v2/openapi.json`
   The apm_schema_sync.sh hook has been broken since this endpoint was removed. Either restore it or add a redirect.

3. **`GET /api/v2/hook-contract`** — publish the exact JSON fields Claude Code sends per event type
   Format: `{"PreToolUse":{"tool_name":"string","tool_input":{...}},"PostToolUse":{"tool_name":"string","tool_response":{...}},...}`
   This prevents future hook bugs caused by guessing field names.

4. **`GET /api/v2/volumes`** — DDRV volume mount status
   Return fleet.json volume states: `[{"name":"DDRV900","mounted":true,"mount_point":"/Volumes/DDRV900",...}]`
   Surface in dashboard as volume health widget.

5. **Hook error aggregation in dashboard**
   Collect hook exit codes (non-zero = error) and surface them per session in the APM UI.
   APM can read these from hook stderr/stdout if hooks emit structured JSON to stdout.

---

## Additional Findings (not assigned bug numbers)

- `apm_schema_sync.sh` uses `curl -s` without `-f` throughout — HTTP errors go undetected in multiple other hooks too. Audit all hook files for this pattern.
- `pre_tool_use.sh` dangerous-command regex is too narrow even after the field fix is applied. Consider expanding coverage.
- No `jq` availability guard in any hook file. If `jq` is missing, all JSON parsing silently fails.
- DDRV902 has no auto-mount equivalent to DDRV900's mount logic. Asymmetric resilience.
- `run_hook.sh` wrapper error handling is unaudited — if a hook errors, unclear whether run_hook.sh propagates the exit code correctly.

---

## Note on Plane Sync

When creating Plane issues for these bugs:
- Use project ID: `a20e1d2e-3139-406e-ae03-dc6d1d8cb995`
- State: Backlog
- Priority mapping: CRITICAL→1 (Urgent), HIGH→2 (High), MEDIUM→3 (Medium)
- Label: `hooks`
- Also cross-reference the LFG project (`6bc05edb-a2b4-44c1-9cfc-2c938edb38a3`) for Bug 10 (DevDrive mount check), since that bug originated from LFG's 904MEMVT corruption.
