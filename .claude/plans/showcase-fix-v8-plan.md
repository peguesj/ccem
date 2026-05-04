# Showcase Fix Plan — v8.0.0
**Formation**: fmt-showcase-fix-20260324
**Orchestrator**: orchestrator-showcase-fix
**Date**: 2026-03-24
**Status**: Active

---

## Issues Addressed

| # | Issue | Worktree / Location |
|---|-------|---------------------|
| 1 | Showcase header duplication — container header + showcase header are separate | apm-v4: fix-showcase-header |
| 2 | Project dropdown doesn't update content area | apm-v4: fix-showcase-header |
| 3 | Only yjmosaic project renders correctly | apm-v4: fix-showcase-header |
| 4 | Standalone showcase ccem-apm rename to "ccem" + pull-tab logic | ccem repo (main) |
| 5 | Roadmap + Architectural view toolbar buttons broken | apm-v4: fix-showcase-roadmap |

---

## Wave 0: Plan + Registration
- [x] Write this plan file
- [x] Register orchestrator with APM at http://localhost:3032

---

## Wave 1: Investigation (Parallel Agents)

### Agent 1a — ShowcaseLive LiveView
- File: ~/Developer/ccem/apm-v4/lib/apm_v5_web/live/showcase_live.ex
- Goal: Understand project dropdown data flow, assigns, handle_event for project switching

### Agent 1b — showcase-engine.js
- File: ~/Developer/ccem/apm-v4/priv/static/showcase/showcase-engine.js
- Goal: Find header rendering, project switching handlers, roadmap/arch view button handlers

### Agent 1c — Standalone index.html
- File: ~/Developer/ccem/showcase/client/index.html
- Goal: Current project entry point, where pull-tab structure must be added

### Agent 1d — API Response
- Endpoint: GET http://localhost:3032/api/showcase
- Goal: What projects are registered, data shape

---

## Wave 2: Worktrees + Plane Issues

```bash
cd ~/Developer/ccem/apm-v4
git worktree add ~/worktrees/apm-v4/fix-showcase-header worktree/fix-showcase-header
git worktree add ~/worktrees/apm-v4/fix-showcase-roadmap worktree/fix-showcase-roadmap
```

Plane Issues:
- CCEM-FIX-A: Showcase — merge duplicate headers + fix project dropdown content sync
- CCEM-FIX-B: Showcase — fix roadmap and architectural view toolbar buttons
- CCEM-FIX-C: Standalone showcase — rename ccem-apm to "ccem" + add pull-tab sections

---

## Wave 3: Fix Implementation

### Fix A (worktree: fix-showcase-header)
Files:
- priv/static/showcase/showcase-engine.js
- lib/apm_v5_web/live/showcase_live.ex

Acceptance Criteria:
- [ ] Single unified header — no duplicate project selector container
- [ ] Project dropdown selection loads correct project features/data in content area
- [ ] All registered projects render without errors
- [ ] WCAG AA keyboard nav preserved

### Fix B (worktree: fix-showcase-roadmap)
Files:
- priv/static/showcase/showcase-engine.js

Acceptance Criteria:
- [ ] Roadmap toolbar button switches center panel to roadmap view
- [ ] Architecture toolbar button switches center panel to architectural view
- [ ] No console errors on click

### Fix C (main ccem repo)
Files:
- showcase/data/projects.json
- showcase/client/index.html
- showcase/data/projects/ccem-apm/features.json

Acceptance Criteria:
- [ ] ccem-apm renamed/aliased to "ccem" in standalone showcase
- [ ] Pull-tab UI: CCEM / APM / Both / Last Version
- [ ] Each tab shows appropriate subset

---

## Wave 4: Compile + Test
```bash
cd ~/worktrees/apm-v4/fix-showcase-header && mix compile --warnings-as-errors
cd ~/worktrees/apm-v4/fix-showcase-roadmap && mix compile --warnings-as-errors
```

---

## Wave 5: Commit + Ship
- Commit each fix atomically
- Update Plane issues to Done
- Send APM toast notification

---

## Wave 6: Version Bump + Docs
- mix.exs: bump to v8.0.0
- CHANGELOG.md: add v8.0.0 section
- /docs LiveView update
- showcase features.json updates

---

## File Reference Index

| File | Purpose |
|------|---------|
| apm-v4/lib/apm_v5_web/live/showcase_live.ex | LiveView — project data, dropdown events |
| apm-v4/priv/static/showcase/showcase-engine.js | Client engine — header, views, toolbar |
| showcase/client/index.html | Standalone entry point |
| showcase/data/projects.json | Standalone project registry |
| showcase/data/projects/ccem-apm/features.json | Feature data |
| apm-v4/mix.exs | Version |
| apm-v4/CHANGELOG.md | Release history |
