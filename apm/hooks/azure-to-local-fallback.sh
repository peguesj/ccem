#!/bin/bash
# Azure to Local Fallback Hook
# Triggered: when Azure health check detects unhealthy status
# Purpose: Route inference requests to Ollama/local LLMs when Azure unavailable

set -euo pipefail

FORMATION_ID="fmt-azure-ai-deployment-orchestration-20260330022223"
OLLAMA_BASE="${OLLAMA_BASE:-http://localhost:11434}"
LOCAL_MODELS=("llama3.1:70b" "mistral:latest" "neural-chat:latest")

# Verify Ollama is reachable
check_ollama_health() {
  timeout 3 curl -s "${OLLAMA_BASE}/api/tags" >/dev/null 2>&1
  return $?
}

# Create fallback routing rule
create_fallback_rule() {
  local azure_model=$1
  local local_model=$2
  
  timestamp=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
  echo "[${timestamp}] Routing ${azure_model} → ${local_model} (Ollama fallback)"
  
  # Log routing decision to formation state
  echo "${azure_model}:${local_model}:fallback" >> /tmp/formation-routing-decisions.log
}

# Check Ollama availability
if check_ollama_health; then
  echo "[$(date -u +"%Y-%m-%dT%H:%M:%SZ")] Ollama health check passed - fallback available"
  
  # Create fallback mappings
  create_fallback_rule "gpt-4o" "llama3.1:70b"
  create_fallback_rule "gpt-4-1" "llama3.1:70b"
  create_fallback_rule "o3-mini" "mistral:latest"
  create_fallback_rule "claude-sonnet-4.6" "llama3.1:70b"
  
  # Signal APM that fallback is active
  curl -s -X POST http://localhost:3032/api/heartbeat \
    -H "Content-Type: application/json" \
    -d "{
      \"agent_id\": \"azure-to-local-fallback-router\",
      \"status\": \"active\",
      \"message\": \"Fallback routing to local Ollama models enabled\",
      \"formation_id\": \"${FORMATION_ID}\"
    }" >/dev/null 2>&1 || true
else
  echo "[$(date -u +"%Y-%m-%dT%H:%M:%SZ")] ERROR: Ollama not reachable - fallback unavailable"
  
  curl -s -X POST http://localhost:3032/api/heartbeat \
    -H "Content-Type: application/json" \
    -d "{
      \"agent_id\": \"azure-to-local-fallback-router\",
      \"status\": \"error\",
      \"message\": \"Fallback route unavailable: Ollama not responding\",
      \"formation_id\": \"${FORMATION_ID}\"
    }" >/dev/null 2>&1 || true
  exit 1
fi

exit 0
