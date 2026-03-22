#!/bin/bash
# AgentLock PreToolUse Authorization Hook — CCEM APM v7.0.0
# Checks tool authorization via AuthorizationGate before execution.
# Stores token_id for PostToolUse consumption.
# Fail-open: exits 0 on APM unavailability, exit 2 on explicit deny.

source "$HOME/Developer/ccem/apm/hooks/hook_common.sh"

INPUT=$(cat)
SESSION_ID=$(echo "$INPUT" | _jq "unknown" -r '.session_id // "unknown"')
TOOL_NAME=$(echo "$INPUT" | _jq "unknown" -r '.tool_name // "unknown"')
TOOL_USE_ID=$(echo "$INPUT" | _jq "" -r '.tool_use_id // ""')
CWD=$(echo "$INPUT" | _jq "" -r '.cwd // ""')
PROJECT_NAME=$(basename "$CWD" 2>/dev/null || echo "unknown")

# Extract tool input for param hashing
TOOL_INPUT=$(echo "$INPUT" | _jq "{}" '.tool_input // {}')

# Request authorization from AgentLock gate
AUTH_RESULT=$(curl -s --max-time 3 -X POST "$APM_URL/api/v2/auth/authorize" \
  -H "Content-Type: application/json" \
  -d "{
    \"agent_id\": \"$SESSION_ID\",
    \"session_id\": \"auth_sess_$SESSION_ID\",
    \"tool_name\": \"$TOOL_NAME\",
    \"role\": \"agent\",
    \"params\": {\"cwd\": \"$CWD\", \"project\": \"$PROJECT_NAME\"}
  }" 2>/dev/null)

# Parse result
ALLOWED=$(echo "$AUTH_RESULT" | _jq "true" -r '.allowed // "true"')
TOKEN_ID=$(echo "$AUTH_RESULT" | _jq "" -r '.token_id // ""')
REASON=$(echo "$AUTH_RESULT" | _jq "" -r '.reason // ""')
DETAIL=$(echo "$AUTH_RESULT" | _jq "" -r '.detail // ""')

# Store token for PostToolUse consumption
if [ -n "$TOKEN_ID" ]; then
  mkdir -p "$STATE_DIR"
  echo "$TOKEN_ID" > "$STATE_DIR/${TOOL_USE_ID}.atk"
fi

# If explicitly denied, block the tool call
if [ "$ALLOWED" = "false" ]; then
  echo "[AgentLock] Authorization denied for $TOOL_NAME: $DETAIL ($REASON)" >&2
  exit 2
fi

# Default: allow (fail-open)
exit 0
