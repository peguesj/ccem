#!/bin/bash
# SessionEnd hook - fires when a Claude Code session terminates
# Marks the agent as done in APM and cleans up session state.
# Max-payload v9.0.0: session_id, project, working_dir, git_branch, timestamp, pattern cleanup.
# Always exits 0 to never block Claude Code.

source "$HOME/Developer/ccem/apm/hooks/hook_common.sh"

INPUT=$(cat)
SESSION_ID=$(echo "$INPUT" | jq -r '.session_id // "unknown"' 2>/dev/null || echo "unknown")
REASON=$(echo "$INPUT" | jq -r '.reason // "unknown"' 2>/dev/null || echo "unknown")
CWD=$(echo "$INPUT" | jq -r '.cwd // ""' 2>/dev/null || echo "")
PROJECT_NAME=$(basename "$CWD" 2>/dev/null || echo "unknown")
NOW_ISO=$(now_iso)
GIT_BRANCH=$(git -C "$CWD" rev-parse --abbrev-ref HEAD 2>/dev/null || echo "")

load_state "$SESSION_ID"

# Retrieve final pattern count for session summary
PATTERN_COUNTER_FILE="$STATE_DIR/pattern_count_${SESSION_ID}"
FINAL_TOOL_COUNT=0
if [ -f "$PATTERN_COUNTER_FILE" ]; then
  FINAL_TOOL_COUNT=$(cat "$PATTERN_COUNTER_FILE" 2>/dev/null || echo "0")
  rm -f "$PATTERN_COUNTER_FILE"
fi

PAYLOAD=$(jq -n \
  --arg agent_id "session-${SESSION_ID}" \
  --arg session_id "$SESSION_ID" \
  --arg status "done" \
  --arg message "Session ended: ${REASON} | tools_called=${FINAL_TOOL_COUNT}" \
  --arg formation_id "$FORMATION_ID" \
  --arg project "$PROJECT_NAME" \
  --arg working_dir "$CWD" \
  --arg git_branch "$GIT_BRANCH" \
  --arg timestamp "$NOW_ISO" \
  --arg tool_count "$FINAL_TOOL_COUNT" \
  '{
    agent_id: $agent_id,
    session_id: $session_id,
    status: $status,
    message: $message,
    formation_id: $formation_id,
    context: {
      project: $project,
      working_dir: $working_dir,
      git_branch: (if $git_branch != "" then $git_branch else null end),
      timestamp: $timestamp,
      session_summary: {
        total_tool_calls: ($tool_count | tonumber),
        reason: "'"$REASON"'"
      }
    }
  }' 2>/dev/null)

curl -s -X POST "$APM_URL/api/heartbeat" \
  -H "Content-Type: application/json" \
  -d "$PAYLOAD" >> "$LOG" 2>&1 &

# Clean up session state; leave pending handoff files for child sessions
rm -f "$STATE_DIR/${SESSION_ID}.json"

exit 0
