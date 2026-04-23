# Widgetization Engine UX Addendum

**Supplementary requirements for the Dashboard Widgetization Engine PRD**
**Date**: 2026-04-18
**Source**: UPM planning agent (UX requirements from product owner)

---

## Dashboard Hierarchy Correction

The dashboard hierarchical logic should be: **Layout > Project** (not the current flat model). This means:

- A dashboard layout is the top-level container
- Projects are scoped under a layout
- Widgets within a layout can be project-scoped or global
- The current flat model where project and layout are peers must be refactored to this parent-child relationship

### Implications

- Layout selection determines the available project scope
- Global widgets (e.g., cross-project metrics, system health) live at the layout level
- Project-scoped widgets are nested under the active project within the layout
- Layout persistence and switching should be independent of project context

---

## Project Auto-Lock Controls

Add a checkbox input on the dashboard header row with two modes:

### 1. Auto-Lock to Project (DEFAULT: ON)

When enabled (default, preserves current behavior), the dashboard automatically scopes to whichever project context is active (determined by the session's `project_name` in `apm_config.json`).

- User can disable this to manually select a project from a dropdown
- When disabled, the project selector becomes interactive and the dashboard stays on the manually chosen project regardless of session context changes

### 2. Auto-Switch to Last Updated Project (DEFAULT: ON)

When enabled (default, preserves current implicit behavior), the dashboard automatically switches to show the project that most recently received an update:

- Agent heartbeat
- Tool call event
- Notification (approval request, agentlock event)
- Session registration

This makes the current implicit behavior explicitly toggle-able so users can opt out.

---

## UX Design Guidance

The agent building this feature should make their own determinations on the best UX patterns for these controls. Key considerations:

- **Discoverability without clutter**: The toggles should be discoverable but not clutter the header. Consider a settings gear icon that reveals these options in a popover or dropdown panel.
- **Pinning integration**: The "pinned project" concept from US-359 (DashboardScopeEngine) should integrate with these toggles -- pinning a project effectively disables auto-switch. The UI should reflect this relationship (e.g., pinning automatically unchecks auto-switch, with a visual indicator).
- **Visual indicators**: Show clear visual state when auto-lock/auto-switch is active vs manual override. Consider:
  - A subtle badge or icon next to the project name indicating the active mode
  - Color coding or icon changes when in manual override mode
  - Tooltip explanations on hover
- **State persistence**: Toggle states should persist across page reloads (localStorage or server-side user preferences)
- **Transition behavior**: When toggling from manual back to auto, the dashboard should immediately re-evaluate and switch to the appropriate project context

---

## Integration Points

| Component | Relationship |
|-----------|-------------|
| US-359 DashboardScopeEngine | Pin/unpin must coordinate with auto-switch toggle |
| US-358 WidgetConfigStore | Layout hierarchy stored in widget config |
| `apm_config.json` | Source of truth for active project context |
| APM EventBus | Source of "last updated" events for auto-switch |
| SessionStart hook | Triggers project context change for auto-lock |
