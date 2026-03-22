# CCEM APM v6.4.0 Release Notes

**Date**: 2026-03-18
**Author**: Jeremiah Pegues <jeremiah@pegues.io>
**Repository**: https://github.com/peguesj/ccem

---

## What's New in v6.4.0

### Skills UX Overhaul

- **Card Grid Layout**: Registry tab redesigned with a responsive card grid. Each card displays a health ring (SVG arc), tier badge (healthy / needs-attention / critical), and a one-line description.
- **Slide-In Drawer**: Selecting a skill opens a detail drawer from the right with triggers, usage stats, AG-UI event mappings, hook status, and repair actions — without leaving the page.
- **Fix Wizard**: Step-by-step modal guides operators through repairing broken skills: select repairs, preview diffs, apply, and confirm with a progress indicator.
- **Tier Collapsing**: Healthy tier collapses by default to surface actionable items (needs-attention and critical) first.
- **Search & Filter**: Live search across skill name, description, and triggers; dropdown filters by tier and methodology.
- **Session Timeline Tab**: New tab showing a per-session sequence of skill activations, co-occurrence matrix, and active methodology indicator.
- **AG-UI Health Tab**: Maps skill identifiers to AG-UI event types; shows hook repair status and event routing health per skill.

### WCAG 2.1 AA Compliance

- Skip-link at top of page bypasses nav to main content.
- All interactive elements meet 4.5:1 minimum contrast ratio.
- `tablist` / `tab` / `tabpanel` ARIA roles on the main tab bar.
- `aria-live="polite"` region for search result counts and async status updates.
- Keyboard navigation: `Escape` dismisses the detail drawer; arrow keys navigate tier sections.
- No color-only indicators — every status uses both color and a text label.

### SkillsHook JS

- New `SkillsHook` Phoenix LiveView hook in `priv/static/js/hooks/skills_hook.js`.
- Handles keyboard shortcuts, drawer animation, focus trap within Fix Wizard, and ARIA state sync.

### AG-UI Health Integration

- AG-UI event types sourced from `AgUi.Core.Events.EventType` (`:ag_ui_ex` dependency).
- Health score per skill accounts for event-routing fidelity alongside file and trigger completeness.

---

## Previous Release: v6.3.0

- Formation hierarchy display: 5-level swim lanes (swarm / cluster / agent_type / wave / agent).
- Dependency graph cluster level with skill ecosystem toggle mode.
- Showcase project isolation: non-CCEM projects return empty feature lists; no cross-project data bleed.

---

## Installation

```sh
# Clone the repository
git clone --recurse-submodules https://github.com/peguesj/ccem.git ~/Developer/ccem

# Standard install
cd ~/Developer/ccem
./install.sh

# Enhanced TUI install (requires gum — brew install gum)
./install-v640.sh

# Non-interactive install
./install-v640.sh --yes --skip-cli
```

**Options**:

| Flag | Description |
|------|-------------|
| `--prefix <path>` | Override CCEM_HOME (default: `~/Developer/ccem`) |
| `--skip-service` | Do not install launchd / systemd service |
| `--skip-hooks` | Do not patch Claude Code settings.json |
| `--skip-agent` | Do not build CCEMAgent (macOS only) |
| `--skip-cli` | Do not build TypeScript CLI |
| `--dry-run` | Print what would be done without executing |
| `--yes` | Skip all confirmation prompts |

**Dashboard**: http://localhost:3032
**Config**: `~/Developer/ccem/apm/apm_config.json`
**Logs**: `~/Developer/ccem/apm/hooks/apm_server.log`

---

## Upgrade from v6.3.0

```sh
cd ~/Developer/ccem
git pull origin main
git submodule update --recursive

# Rebuild APM server
cd apm-v4
mix deps.get
mix assets.build
mix compile

# Rebuild CCEMAgent (macOS)
cd ~/Developer/ccem/CCEMAgent
swift build -c release
open -a CCEMAgent
```

---

## Checksums

SHA-256 checksums will be published to the GitHub release after CI completes.

---

## Changelog

Full changelog: `~/Developer/ccem/apm-v4/CHANGELOG.md`
