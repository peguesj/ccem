#!/usr/bin/env bash
# claude_flow_capture.sh
# Finds the latest claude-flow session JSON from the CWD and posts it to VIKI.
# Called from the Stop hook after claude-flow session-end runs.

set -euo pipefail

VIKI_URL="${VIKI_INTELLIGENCE_URL:-http://localhost:4001/api/intelligence/session-summary}"
SESSION_ID="${CLAUDE_SESSION_ID:-}"
PROJECT="${CLAUDE_PROJECT:-$(basename "$PWD")}"

# Look for the latest claude-flow session JSON in the current working directory
SESSIONS_DIR="${PWD}/.claude/sessions"

if [ ! -d "$SESSIONS_DIR" ]; then
  exit 0
fi

LATEST=$(ls -t "$SESSIONS_DIR"/session-*.json 2>/dev/null | head -1)

if [ -z "$LATEST" ]; then
  exit 0
fi

# Enrich and POST — fire and forget
(
  PAYLOAD=$(cat "$LATEST" | \
    python3 -c "
import sys, json
data = json.load(sys.stdin)
import os
data['session_id'] = os.environ.get('CLAUDE_SESSION_ID', data.get('session_id', ''))
data['project'] = os.environ.get('CLAUDE_PROJECT', '$(basename "$PWD")')
data['captured_at'] = __import__('datetime').datetime.utcnow().isoformat() + 'Z'
data['source_file'] = '$(basename "$LATEST")'
print(json.dumps(data))
" 2>/dev/null)

  if [ -n "$PAYLOAD" ]; then
    curl -s -X POST "$VIKI_URL" \
      -H "Content-Type: application/json" \
      -d "$PAYLOAD" \
      --max-time 5 \
      > /dev/null 2>&1 || true

    # Also copy to cf-sessions dir for local worker access
    CF_DIR="$HOME/Developer/ccem/apm/sessions"
    mkdir -p "$CF_DIR"
    FNAME="cf-${CLAUDE_SESSION_ID:-$(basename "$LATEST" .json)}.json"
    echo "$PAYLOAD" > "$CF_DIR/$FNAME"
  fi
) &

exit 0
