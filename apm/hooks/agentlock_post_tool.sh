#!/bin/bash
# AgentLock PostToolUse Execution Recording Hook — CCEM APM v9.0.0
# Consumes authorization token, records execution completion with full result
# metadata, and reports to /api/v2/notifications for audit tracing.
# Fire-and-forget: always exits 0, never blocks.

source "$HOME/Developer/ccem/apm/hooks/hook_common.sh"

INPUT=$(cat)
SESSION_ID=$(echo "$INPUT" | _jq "unknown" -r '.session_id // "unknown"')
TOOL_NAME=$(echo "$INPUT" | _jq "unknown" -r '.tool_name // "unknown"')
TOOL_USE_ID=$(echo "$INPUT" | _jq "" -r '.tool_use_id // ""')
TIMESTAMP=$(now_iso)
MODEL="claude-sonnet-4-6"
USER_ID="jeremiah"

# Extract tool result metadata
TOOL_RESULT=$(echo "$INPUT" | _jq "{}" '.tool_result // {}')
TOOL_INPUT=$(echo "$INPUT" | _jq "{}" '.tool_input // {}')
CWD=$(echo "$INPUT" | _jq "" -r '.cwd // ""')
PROJECT_NAME=$(basename "$CWD" 2>/dev/null || echo "unknown")

# Resolve agent identity (same logic as pre-tool)
AGENT_ID=$(echo "$INPUT" | _jq "" -r '.agent_id // ""')
if [ -z "$AGENT_ID" ]; then
  AGENT_ID=$(echo "$INPUT" | _jq "" -r '.parent_tool_use_id // ""')
fi
EFFECTIVE_AGENT_ID="${AGENT_ID:-$SESSION_ID}"

# Read stored token from PreToolUse
ATK_FILE="$STATE_DIR/${TOOL_USE_ID}.atk"
AUTH_TOKEN=""
if [ -f "$ATK_FILE" ]; then
  AUTH_TOKEN=$(cat "$ATK_FILE")

  # Record execution completion to /execute (fire-and-forget)
  curl -s --max-time 3 -X POST "$APM_URL/api/v2/auth/execute" \
    -H "Content-Type: application/json" \
    -d "{
      \"agent_id\": \"$EFFECTIVE_AGENT_ID\",
      \"token_id\": \"$AUTH_TOKEN\",
      \"tool_name\": \"$TOOL_NAME\",
      \"session_id\": \"auth_sess_$SESSION_ID\",
      \"result\": {
        \"status\": \"completed\",
        \"timestamp\": \"$TIMESTAMP\",
        \"cwd\": \"$CWD\",
        \"project\": \"$PROJECT_NAME\"
      }
    }" >/dev/null 2>&1 &

  # Cleanup token file
  rm -f "$ATK_FILE"
fi

# ── Full result summary to /api/v2/notifications ─────────────────────────────
# Report tool execution result with full metadata for audit trail.
# Use python3 to safely build the JSON payload (handles nested JSON in results).
NOTIFICATION_PAYLOAD=$(python3 -c "
import json, sys

try:
    tool_result = json.loads('''${TOOL_RESULT}''')
except:
    tool_result = {'raw': '${TOOL_RESULT}'[:200]}

try:
    tool_input = json.loads('''${TOOL_INPUT}''')
except:
    tool_input = {}

# Summarize result without sending full content (keep payload bounded)
result_summary = {}
if isinstance(tool_result, dict):
    result_summary = {k: str(v)[:200] for k, v in list(tool_result.items())[:5]}
elif isinstance(tool_result, list):
    result_summary = {'item_count': len(tool_result), 'preview': str(tool_result[:2])[:200]}
else:
    result_summary = {'value': str(tool_result)[:300]}

payload = {
    'type': 'agentlock_post_tool',
    'status': 'executed',
    'message': 'Tool ${TOOL_NAME} completed for agent ${EFFECTIVE_AGENT_ID}',
    'session': '${SESSION_ID}',
    'tool_name': '${TOOL_NAME}',
    'tool_use_id': '${TOOL_USE_ID}',
    'agent_id': '${EFFECTIVE_AGENT_ID}',
    'user_id': '${USER_ID}',
    'model': '${MODEL}',
    'token_id': '${AUTH_TOKEN}',
    'timestamp': '${TIMESTAMP}',
    'result_metadata': {
        'cwd': '${CWD}',
        'project': '${PROJECT_NAME}',
        'result_summary': result_summary,
        'has_token': bool('${AUTH_TOKEN}')
    }
}
print(json.dumps(payload))
" 2>/dev/null || echo "{
    \"type\": \"agentlock_post_tool\",
    \"status\": \"executed\",
    \"message\": \"Tool $TOOL_NAME completed for agent $EFFECTIVE_AGENT_ID\",
    \"session\": \"$SESSION_ID\",
    \"tool_name\": \"$TOOL_NAME\",
    \"tool_use_id\": \"$TOOL_USE_ID\",
    \"agent_id\": \"$EFFECTIVE_AGENT_ID\",
    \"user_id\": \"$USER_ID\",
    \"model\": \"$MODEL\",
    \"token_id\": \"$AUTH_TOKEN\",
    \"timestamp\": \"$TIMESTAMP\",
    \"result_metadata\": {
      \"cwd\": \"$CWD\",
      \"project\": \"$PROJECT_NAME\",
      \"has_token\": true
    }
  }")

curl -s --max-time 2 -X POST "$APM_URL/api/v2/notifications" \
  -H "Content-Type: application/json" \
  -d "$NOTIFICATION_PAYLOAD" >/dev/null 2>&1 &

# Always exit 0 — fire-and-forget, never blocks Claude Code
exit 0
