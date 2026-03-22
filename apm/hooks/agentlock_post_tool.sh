#!/bin/bash
# AgentLock PostToolUse Execution Recording Hook — CCEM APM v7.0.0
# Consumes authorization token and records execution completion.
# Fire-and-forget: always exits 0, never blocks.

source "$HOME/Developer/ccem/apm/hooks/hook_common.sh"

INPUT=$(cat)
SESSION_ID=$(echo "$INPUT" | _jq "unknown" -r '.session_id // "unknown"')
TOOL_NAME=$(echo "$INPUT" | _jq "unknown" -r '.tool_name // "unknown"')
TOOL_USE_ID=$(echo "$INPUT" | _jq "" -r '.tool_use_id // ""')

# Read stored token from PreToolUse
ATK_FILE="$STATE_DIR/${TOOL_USE_ID}.atk"
if [ -f "$ATK_FILE" ]; then
  AUTH_TOKEN=$(cat "$ATK_FILE")

  # Record execution completion (fire-and-forget)
  curl -s --max-time 3 -X POST "$APM_URL/api/v2/auth/execute" \
    -H "Content-Type: application/json" \
    -d "{
      \"agent_id\": \"$SESSION_ID\",
      \"token_id\": \"$AUTH_TOKEN\",
      \"tool_name\": \"$TOOL_NAME\",
      \"result\": {\"status\": \"completed\"}
    }" >/dev/null 2>&1 &

  # Cleanup token file
  rm -f "$ATK_FILE"
fi

exit 0
