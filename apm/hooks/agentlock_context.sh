#!/bin/bash
# AgentLock Context Tracking Hook — CCEM APM v7.0.0
# Records context writes for trust degradation tracking.
# Triggered as PostToolUse for Write/Edit/WebFetch tools.
# Fire-and-forget: always exits 0, never blocks.

source "$HOME/Developer/ccem/apm/hooks/hook_common.sh"

INPUT=$(cat)
SESSION_ID=$(echo "$INPUT" | _jq "unknown" -r '.session_id // "unknown"')
TOOL_NAME=$(echo "$INPUT" | _jq "unknown" -r '.tool_name // "unknown"')

# Map tool name to context source
SOURCE="tool_output"
case "$TOOL_NAME" in
  Write|Edit|NotebookEdit) SOURCE="file_content" ;;
  WebFetch|WebSearch) SOURCE="web_content" ;;
  Read|Grep|Glob) SOURCE="file_content" ;;
  Agent) SOURCE="peer_agent" ;;
esac

# Generate content hash from tool_use_id (lightweight, no file reading)
TOOL_USE_ID=$(echo "$INPUT" | _jq "" -r '.tool_use_id // ""')
CONTENT_HASH=$(echo -n "$TOOL_USE_ID" | shasum -a 256 | cut -d' ' -f1)

# Record context write (fire-and-forget)
curl -s --max-time 3 -X POST "$APM_URL/api/v2/auth/context/write" \
  -H "Content-Type: application/json" \
  -d "{
    \"session_id\": \"auth_sess_$SESSION_ID\",
    \"agent_id\": \"$SESSION_ID\",
    \"source\": \"$SOURCE\",
    \"content_hash\": \"$CONTENT_HASH\"
  }" >/dev/null 2>&1 &

exit 0
