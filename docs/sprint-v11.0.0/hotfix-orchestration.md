# v11.0.0 Phase 4-5 Post-Ship Hotfix Orchestration

**Fleet ID**: `F-V11.3-HOTFIX`
**Parent UPM session**: `upm-v11-p4-1780432138` (Phase 4-5)
**New UPM session**: `upm-v11-hotfix-1780500500`
**Orchestration skills**: `/orchestrator` → `/workflows:smart-fix` (per defect) → `/skill-chaining-workflow` (post-fix sync)
**Chain reference**: `chain-1780500165-v110-p45` (preceding reconciliation chain)

## Defect → UPM ID → Checkpoint → Plane map

| Defect | Title | US | CP | Plane | Severity |
|--------|-------|------|------|-------|----------|
| A | Doubled "CCEM APM" wordmark | US-511 | CP-331 | CCEM-708 | high |
| B | Skills nav badge red "44" | US-512 | CP-332 | CCEM-709 | high |
| C | SESSIONS card = 0 | US-513 | CP-333 | CCEM-710 | high |
| D | Fleet table empty (AGENTS=5 mismatch) | US-514 | CP-334 | CCEM-711 | high |
| E | Sidebar dim styling (token bridge) | US-515 | CP-335 | CCEM-712 | medium |
| F | Formation graph cramped labels | US-516 | CP-336 | CCEM-713 | medium |

## Per-defect agent & model selection rationale

| Defect | Diagnose Agent / Model | Fix Agent / Model | Verify Agent / Model | Rationale |
|--------|------------------------|-------------------|----------------------|-----------|
| A | `elixir-expert` / opus | `frontend-developer` / sonnet | `accessibility-tester` / haiku | HEEX template composition tracing (opus); mechanical HEEX edit (sonnet); pixel snapshot (haiku) |
| B | `elixir-expert` / opus | `backend-developer` / sonnet | `qa-expert` / sonnet | GenServer state + health rule logic (opus); GenServer impl (sonnet); test design (sonnet) |
| C | `elixir-expert` / opus | `backend-developer` / sonnet | `test-automator` / sonnet | Cross-module PubSub trace + rename leak hunt (opus); module ref fix (sonnet); LiveView assigns test (sonnet) |
| D | `elixir-expert` / opus | `backend-developer` / sonnet | `test-automator` / sonnet | LiveView stream wiring (opus); stream binding (sonnet); integration test (sonnet) |
| E | `ui-designer` / sonnet | `frontend-developer` / haiku | `accessibility-tester` / haiku | Token-aliasing analysis (sonnet); pure CSS additions (haiku); contrast ratio gate (haiku) |
| F | `javascript-pro` / sonnet | `frontend-developer` / sonnet | `accessibility-tester` / haiku | D3 force-layout logic (sonnet); JS constants tune (sonnet); visual snapshot (haiku) |

## Three-level task hierarchy

```
L1 Fleet         F-V11.3-HOTFIX                                                                   [US-511..516]
└── L2 Formation  Per-defect (×6)                                                                  [US-51X]
    └── L3 Squadron Phase (Diagnose → Fix → Verify, gated)                                          [US-51X.1..3]
```

L3 squadrons are linearly gated: Diagnose `addBlocks` Fix; Fix `addBlocks` Verify.
L2 formations are mutually independent (max concurrency).
L1 fleet `addBlockedBy` ALL L2 formations.

## Cost shape

Estimated model spend per defect (rough): 1 opus diagnose call (~5k tokens) + 1 sonnet fix call (~3k tokens) + 1 haiku/sonnet verify call (~2k tokens). Reserves opus for tracing-heavy work; uses haiku for mechanical edits where there's only one valid output.

## Downstream chain (after all 6 fixes pass verify)

`/skill-chaining-workflow --scope=v11.0.0-hotfix --plane-cycle=v11.0.1`:
1. `/upm ship --commit --push --pr` (bundled hotfix PR)
2. `/showcase` — append US-511..516
3. `/docsmax sync` — update CLAUDE.md hotfix section
4. `/coalesce` — distill state
5. `/plane-pm sync` — mark CCEM-708..713 Done

## APM telemetry plan

- `orchestration_started` — emit at L1 fleet creation
- `formation_started` — emit per L2 defect when its squadron starts
- `squadron_phase` — emit per L3 phase (diagnose, fix, verify)
- `defect_resolved` — emit when L2 formation Verify passes
- `orchestration_completed` — emit when L1 fleet closes
