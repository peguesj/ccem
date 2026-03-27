#!/usr/bin/env bash
# openapi_sync_reminder.sh
# PostToolUse hook — fires on Write|Edit tool calls.
# If the modified file is the router or a v2 controller, posts a reminder
# notification to APM to keep the OpenAPI spec in sync.
# Fire-and-forget: never blocks the tool call.

set -euo pipefail

# Read tool result from stdin (Claude Code passes JSON on stdin for PostToolUse)
INPUT=$(cat)

# Extract the file path from the tool result
FILE_PATH=$(echo "$INPUT" | python3 -c "
import sys, json
try:
    d = json.load(sys.stdin)
    # tool_input contains the params passed to Write/Edit
    ti = d.get('tool_input', {})
    print(ti.get('file_path', ti.get('path', '')))
except Exception:
    print('')
" 2>/dev/null || true)

# Check if the modified file is router.ex or a v2 controller
if echo "$FILE_PATH" | grep -qE "(apm_v5_web/router\.ex|apm_v5_web/controllers/v2/[^/]+\.ex)$"; then
  APM_URL="${APM_URL:-http://localhost:3032}"

  curl -s -X POST "${APM_URL}/api/notify" \
    -H "Content-Type: application/json" \
    -d "{
      \"type\": \"info\",
      \"title\": \"OpenAPI Sync Needed\",
      \"message\": \"Router or v2 controller modified — update the OpenAPI spec in api_v2_controller.ex (build_v2_paths / build_v1_paths)\",
      \"category\": \"dev\",
      \"file\": \"${FILE_PATH}\"
    }" >/dev/null 2>&1 &
fi

exit 0
