#!/bin/bash
# SubagentStop hook - fires when a subagent spawned by this session finishes
# Max-payload v9.0.0: session_id, project, working_dir, git_branch, timestamp.
# Always exits 0 to never block Claude Code.

source "$HOME/Developer/ccem/apm/hooks/hook_common.sh"

INPUT=$(cat)
SESSION_ID=$(echo "$INPUT" | jq -r '.session_id // "unknown"' 2>/dev/null || echo "unknown")
CHILD_SESSION_ID=$(echo "$INPUT" | jq -r '.agent_id // "unknown"' 2>/dev/null || echo "unknown")
CWD=$(echo "$INPUT" | jq -r '.cwd // ""' 2>/dev/null || echo "")
PROJECT_NAME=$(basename "$CWD" 2>/dev/null || echo "unknown")
NOW_ISO=$(now_iso)
GIT_BRANCH=$(git -C "$CWD" rev-parse --abbrev-ref HEAD 2>/dev/null || echo "")

load_state "$SESSION_ID"

PAYLOAD=$(jq -n \
  --arg agent_id "session-${SESSION_ID}" \
  --arg session_id "$SESSION_ID" \
  --arg status "working" \
  --arg message "Subagent completed: ${CHILD_SESSION_ID}" \
  --arg formation_id "$FORMATION_ID" \
  --arg child_session_id "$CHILD_SESSION_ID" \
  --arg project "$PROJECT_NAME" \
  --arg working_dir "$CWD" \
  --arg git_branch "$GIT_BRANCH" \
  --arg timestamp "$NOW_ISO" \
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
      child_session_id: $child_session_id
    }
  }' 2>/dev/null)

curl -s -X POST "$APM_URL/api/heartbeat" \
  -H "Content-Type: application/json" \
  -d "$PAYLOAD" >> "$LOG" 2>&1 &

exit 0
