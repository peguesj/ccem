# Backlog: Expand security-guidance plugin to support all native Claude Code tool types

**Created**: 2026-04-11
**Priority**: Medium
**Category**: security / plugin-infrastructure
**Status**: open

---

## Summary

The `security-guidance` plugin (installed as both `security-guidance@claude-plugins-official` v1.0.0 and `security-guidance@claude-code-plugins` v1.0.0) ships a `PreToolUse` hook (`security_reminder_hook.py`) that currently only matches against `Edit|Write|MultiEdit` tool calls. Native Claude Code has a broader set of tool types that are not covered by any security scanning today.

A path allowlist patch was recently applied to `~/.claude/plugins/cache/claude-code-plugins/security-guidance/1.0.0/hooks/security_reminder_hook.py` to exempt `~/.claude/skills/**`, `~/.claude/commands/**`, and `~/.claude/plugins/**` from write warnings, but this did not expand coverage to additional tool types.

---

## Gap Analysis: Uncovered Native Tool Types

| Tool | Risk Class | Attack Vector | Current Coverage |
|------|-----------|---------------|-----------------|
| `Bash` | Command injection | Shell metachar injection, PATH manipulation, pipe abuse | None |
| `WebFetch` | SSRF / data exfil | Internal network URLs (169.254.x, 10.x, localhost), dangerous schemes | None |
| `WebSearch` | Prompt injection via results | Malicious search results injecting instructions | None |
| `Agent` | Prompt injection, scope escalation | Injected instructions in agent `prompt` field | None |
| `Skill` | Scope escalation | Invoking privileged skills outside intended context | None |
| `Read` | Path traversal | Reads of `.env`, credentials, private keys | None (low priority) |
| `Glob` | Path traversal (indirect) | Glob patterns targeting secrets dirs | None (low priority) |
| `Task*` | Unconstrained sub-agent | Sub-tasks inheriting ambient auth without restriction | None |

---

## Proposed Work

### 1. Expand security_reminder_hook.py for Bash tool type
- Parse `tool_input.command` field from hook stdin JSON
- Flag patterns: `curl | sh`, `eval $(...)`, `$()` subshell chaining, `rm -rf /`, `sudo` with untrusted input, `python -c`, `node -e`, `base64 -d | bash`
- Emit block-level warning for critical patterns; advisory for medium patterns

### 2. Add WebFetch security check
- Parse `tool_input.url` from hook stdin
- Flag SSRF targets: `169.254.169.254` (IMDS), `10.*`, `172.16-31.*`, `192.168.*`, `localhost`, `127.*`, `file://`, `data:` schemes
- Emit block on confirmed SSRF targets; advisory on private-range IPs

### 3. Add Agent/Skill prompt injection detection
- Parse `tool_input.prompt` (Agent) and `tool_input.args` (Skill) fields
- Flag embedded instruction patterns: `ignore previous instructions`, `disregard`, `new task:`, `system:`, repeated Unicode overrides
- Emit advisory warning; do not hard-block (false-positive risk is high)

### 4. Register security-guidance as a first-class CCEM security plugin category

**Current CCEM plugin categorization state:**
- CCEM APM `installed_plugins.json` at `~/.claude/plugins/installed_plugins.json` tracks plugins by `name@marketplace` key only — no category field exists in the schema
- The APM v4 `PluginBehaviour` pattern (established in `prd-skill-plugins.json`) supports `plugin_scope/0` callbacks returning atoms like `:ccem`, `:security`, `:workflow`
- There is no current `security` plugin scope category in the APM v4 plugin registry; existing scopes appear to be `:ccem` (internal) and tool-class scopes
- The `/api/plugins` endpoint returns 404 — the APM server has no plugin registry API surface yet

**Recommended actions:**
- Add `:security` as a first-class `plugin_scope` atom in `ApmV5.Plugins.PluginBehaviour`
- Create `ApmV5.Plugins.SecurityGuidancePlugin` implementing `SkillPluginBridge` with scope `:security`
- Expose plugin metadata (covered tool types, pattern counts, last-triggered) to the APM dashboard
- Add a `plugin_category` field to the `installed_plugins.json` schema (or a sidecar `plugin_metadata.json`) so the APM can surface categorized plugin health per session

### 5. Hook matcher expansion

Current `hooks.json` matcher:
```json
"matcher": "Edit|Write|MultiEdit"
```

Target matcher after expansion:
```json
"matcher": "Edit|Write|MultiEdit|Bash|WebFetch|WebSearch|Agent|Skill"
```

The hook script must branch on `tool_name` to apply the correct scan logic per type.

---

## Implementation Notes

- The hook is run via `python3 ${CLAUDE_PLUGIN_ROOT}/hooks/security_reminder_hook.py` — all expansion stays in that single file
- Hook stdin schema: `{"tool_name": "...", "tool_input": {...}, "session_id": "..."}`
- A non-zero exit code from the hook blocks the tool call; stdout becomes the warning message shown to the user
- The path allowlist patch (`~/.claude/skills/**`, etc.) must be preserved in the expanded hook
- Test coverage: add test cases for each new tool type against known-bad and known-safe inputs before shipping

---

## References

- Hook manifest: `~/.claude/plugins/cache/claude-code-plugins/security-guidance/1.0.0/hooks/hooks.json`
- Plugin manifest: `~/.claude/plugins/cache/claude-code-plugins/security-guidance/1.0.0/.claude-plugin/plugin.json`
- CCEM plugin bridge PRD: `/Users/jeremiah/Developer/ccem/apm-v4/prd-skill-plugins.json`
- CCEM plugin registry: `~/.claude/plugins/installed_plugins.json`
- APM v4 schema: `/Users/jeremiah/Developer/ccem/apm/apm_config_v4.schema.json`
