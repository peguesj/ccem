# Hook Propagation Report (v9.2.0)

**Date**: 2026-05-14
**Tool**: `~/Developer/ccem/apm/hooks/propagate_hooks.sh`
**Canonical source**: `~/Developer/ccem/apm/hooks/` (v9.1.4)

## Summary

| Metric | Count |
|---|---|
| Total `.claude` dirs scanned | 142 |
| With `hooks/` subdirectory | 115 |
| Skipped (no hooks dir, opted-out) | 27 |
| Drift detected pre-fix | 116 (115 project + 1 user-scope) |
| Updated by --fix | 116 |
| In-sync post-fix | 116 |
| Errors | 0 |

## Propagated hooks (v9.1.4 max-payload)

1. `session_init.sh` — registers session with APM, ensures server running
2. `session_end.sh` — final summary, tool count, cleanup
3. `pre_tool_use.sh` — pre-tool telemetry (memory writes, skill invocations)
4. `post_tool_use.sh` — post-tool telemetry, pattern heartbeats every 10 calls
5. `subagent_start.sh` — subagent lifecycle start
6. `subagent_stop.sh` — subagent lifecycle stop
7. `agentlock_context.sh` — agent identity resolution + execution context
8. `agentlock_pre_tool.sh` — AgentLock authorization pre-tool gate
9. `agentlock_post_tool.sh` — AgentLock notification audit trail

## Scope coverage

- **Developer projects**: `~/Developer/**/.claude/hooks/` — 113 projects
- **Tool projects**: `~/tools/**/.claude/hooks/` — 2 projects
- **User scope**: `~/.claude/hooks/` — 1 location

## Skipped (no `.claude/hooks/` directory)

These 27 projects have a `.claude/` dir (typically just `CLAUDE.md`) but no `hooks/` subdirectory — they haven't opted into CCEM hook telemetry. They are left untouched per the propagation rule (only propagate to projects that already have a `hooks/` dir).

## Verification

```bash
$ ~/Developer/ccem/apm/hooks/propagate_hooks.sh --verify --json
{"mode":"verify","scanned":142,"updated_or_drift":0,"already_synced":116,"skipped_no_hooks_dir":27,"errors":0}
```

All 116 sync'd projects pass SHA-256 checksum match against canonical.

## Versions before/after

Pre-fix: hook bodies were mostly v7 / v8 / v9.0 / v9.1.0–v9.1.3 (mixed).
Post-fix: all hooks now match v9.1.4 canonical bodies byte-for-byte.

## Companion artifacts

- `repair_hooks.sh` — verifies `.remember/{logs,tmp}` filesystem health (separate concern, see `repair-hooks` skill)
- `propagate_hooks.sh` — this tool, syncs hook BODIES across projects

## How to re-run

```bash
# verify drift (read-only)
~/Developer/ccem/apm/hooks/propagate_hooks.sh --verify

# fix drift
~/Developer/ccem/apm/hooks/propagate_hooks.sh --fix

# JSON output (CI-friendly)
~/Developer/ccem/apm/hooks/propagate_hooks.sh --verify --json
```

Recommended cadence: re-run after every APM hook bump (e.g. v9.1.4 → v9.2.0 hooks update). Can be wired into `repair_hooks` action via APM ActionEngine for one-click in-dashboard propagation.
