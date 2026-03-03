#!/bin/bash
# SubagentStart hook - fires when a subagent is spawned by this session
# Writes a pending handoff file that the child session's SessionStart will consume.
# Always exits 0 to never block Claude Code.

source "$HOME/Developer/ccem/apm/hooks/hook_common.sh"

INPUT=$(cat)
SESSION_ID=$(echo "$INPUT" | jq -r '.session_id // "unknown"' 2>/dev/null || echo "unknown")
CHILD_SESSION_ID=$(echo "$INPUT" | jq -r '.agent_id // "unknown"' 2>/dev/null || echo "unknown")
CWD=$(echo "$INPUT" | jq -r '.cwd // ""' 2>/dev/null || echo "")
PROJECT_NAME=$(basename "$CWD")

load_state "$SESSION_ID"

# Generate child context: same trace, incremented level, new parent span
CHILD_PARENT_SPAN=$(new_span_id)
CHILD_LEVEL=$((AGENT_LEVEL + 1))

# Write pending handoff that child session_init.sh will consume
cat > "$STATE_DIR/pending_${CHILD_SESSION_ID}.json" << HANDOFF
{
  "trace_id": "$TRACE_ID",
  "formation_id": "$FORMATION_ID",
  "parent_span_id": "$CHILD_PARENT_SPAN",
  "formation_role": "agent",
  "agent_level": $CHILD_LEVEL,
  "parent_session_id": "$SESSION_ID"
}
HANDOFF

PAYLOAD=$(jq -n \
  --arg agent_id "session-${SESSION_ID}" \
  --arg status "working" \
  --arg message "Spawned subagent: ${CHILD_SESSION_ID} (level ${CHILD_LEVEL})" \
  --arg formation_id "$FORMATION_ID" \
  '{
    agent_id: $agent_id,
    status: $status,
    message: $message,
    formation_id: $formation_id
  }' 2>/dev/null)

curl -s -X POST "$APM_URL/api/heartbeat" \
  -H "Content-Type: application/json" \
  -d "$PAYLOAD" >> "$LOG" 2>&1 &

exit 0
