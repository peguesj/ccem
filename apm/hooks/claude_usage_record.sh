#!/bin/bash
# PostToolUse hook: record tool usage to CCEM APM usage tracker
# Reads JSON from stdin: {"tool_name": "...", "tool_input": {...}, "tool_response": {...}}
# Environment variables injected by Claude Code:
#   CLAUDE_MODEL         — model in use (e.g. claude-sonnet-4-6)
#   CLAUDE_INPUT_TOKENS  — input tokens consumed
#   CLAUDE_OUTPUT_TOKENS — output tokens produced
#   CLAUDE_CACHE_TOKENS  — cache tokens consumed

APM_URL="http://localhost:3032"
PROJECT=$(basename "$PWD")
MODEL="${CLAUDE_MODEL:-claude-sonnet-4-6}"
INPUT="${CLAUDE_INPUT_TOKENS:-0}"
OUTPUT="${CLAUDE_OUTPUT_TOKENS:-0}"
CACHE="${CLAUDE_CACHE_TOKENS:-0}"

# Fire-and-forget: never block Claude Code execution
curl -s -X POST "$APM_URL/api/usage/record" \
  -H "Content-Type: application/json" \
  -d "{\"project\":\"$PROJECT\",\"model\":\"$MODEL\",\"input_tokens\":$INPUT,\"output_tokens\":$OUTPUT,\"cache_tokens\":$CACHE,\"tool_calls\":1}" \
  >/dev/null 2>&1 &

exit 0
