#!/usr/bin/env bash
# Fires on PostToolUse when mix.exs or CHANGELOG.md is edited.
# Surfaces the version-update skill checklist via APM notification.
# Fire-and-forget — never blocks.

TOOL_INPUT="${CLAUDE_TOOL_INPUT:-}"

# Only fire on Write/Edit touching mix.exs or CHANGELOG
case "$TOOL_INPUT" in
  *mix.exs*|*CHANGELOG*)
    ;;
  *)
    exit 0
    ;;
esac

APM_URL="${APM_URL:-http://localhost:3032}"

# Check if this looks like a version bump (version: "x.y.z" pattern)
if echo "$TOOL_INPUT" | grep -qE '"version".*"[0-9]+\.[0-9]+\.[0-9]+"'; then
  MESSAGE="Version bump detected. Run these skills: /ship \u2192 /upm \u2192 /plane-pm \u2192 /showcase \u2192 /opsdoc \u2192 /ccem-apm restart \u2192 /double-verify"
  TITLE="Version Update Checklist"
else
  MESSAGE="mix.exs or CHANGELOG modified. If bumping version: /ship /upm /plane-pm /showcase /opsdoc /double-verify"
  TITLE="Release Artifact Changed"
fi

curl -s -X POST "$APM_URL/api/notify" \
  -H "Content-Type: application/json" \
  -d "{\"type\":\"info\",\"title\":\"$TITLE\",\"message\":\"$MESSAGE\",\"category\":\"dev\"}" \
  >/dev/null 2>&1 &

exit 0
