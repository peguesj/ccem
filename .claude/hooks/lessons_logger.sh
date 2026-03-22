#!/bin/bash
# CCEM Lessons Logger — PostToolUse hook
# Appends tool-level entries to session-log.json (fire-and-forget)
# Only logs significant actions: Write, Edit, Bash (git commit only)

LESSONS_FILE="/Users/jeremiah/Developer/ccem/.force/lessons/session-log.json"
TOOL_NAME="${CLAUDE_TOOL_NAME:-unknown}"
TOOL_INPUT="${CLAUDE_TOOL_INPUT:-}"

# Gate: only log significant tools
case "$TOOL_NAME" in
  Write|Edit)
    # Extract file path from tool input
    FILE_PATH=$(echo "$TOOL_INPUT" | jq -r '.file_path // .path // "unknown"' 2>/dev/null)
    DESCRIPTION="$TOOL_NAME: $FILE_PATH"
    ;;
  Bash)
    # Only log git commit commands
    COMMAND=$(echo "$TOOL_INPUT" | jq -r '.command // ""' 2>/dev/null)
    if echo "$COMMAND" | grep -q "git commit"; then
      DESCRIPTION="git commit executed"
    else
      exit 0
    fi
    ;;
  *)
    exit 0
    ;;
esac

# Ensure lessons directory and file exist
mkdir -p "$(dirname "$LESSONS_FILE")"
if [ ! -f "$LESSONS_FILE" ] || [ ! -s "$LESSONS_FILE" ]; then
  echo '[]' > "$LESSONS_FILE"
fi

# Generate next lesson ID
LAST_ID=$(jq -r '.[-1].id // "lesson-000"' "$LESSONS_FILE" 2>/dev/null)
NEXT_NUM=$(printf "%03d" $(( $(echo "$LAST_ID" | grep -o '[0-9]*$') + 1 )))
LESSON_ID="lesson-${NEXT_NUM}"

# Generate ISO-8601 timestamp
TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

# Build the new entry
NEW_ENTRY=$(jq -n \
  --arg id "$LESSON_ID" \
  --arg ts "$TIMESTAMP" \
  --arg action "$DESCRIPTION" \
  --arg tool "$TOOL_NAME" \
  '{
    id: $id,
    timestamp: $ts,
    scope: "ccem",
    namespace: "io.pegues.agent-j.labs.ccem",
    action: $action,
    result: ("tool-logged: " + $tool),
    category: "implementation",
    artifacts: [],
    plane_project: null,
    formation_id: null,
    status: "completed"
  }')

# Append to the JSON array atomically
TMPFILE=$(mktemp)
if jq --argjson entry "$NEW_ENTRY" '. + [$entry]' "$LESSONS_FILE" > "$TMPFILE" 2>/dev/null; then
  mv "$TMPFILE" "$LESSONS_FILE"
else
  rm -f "$TMPFILE"
fi
