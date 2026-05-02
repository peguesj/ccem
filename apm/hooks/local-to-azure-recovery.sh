#!/bin/bash
# Local to Azure Recovery Hook
# Triggered: periodic check (every 60s) after fallback activation
# Purpose: Attempt to re-sync with Azure when service recovers

set -euo pipefail

FORMATION_ID="fmt-azure-ai-deployment-orchestration-20260330022223"
AZURE_API_BASE="${AZURE_API_BASE:-https://claude-code-proxy-aoai.openai.azure.com/}"
RECOVERY_CHECK_TIMEOUT=5
MAX_RECOVERY_ATTEMPTS=3

# Check if we're currently in fallback mode
is_in_fallback_mode() {
  [[ -f /tmp/formation-routing-decisions.log ]] && grep -q "fallback" /tmp/formation-routing-decisions.log
}

# Test Azure deployment connectivity
test_azure_recovery() {
  local deployment=$1
  
  response=$(timeout $RECOVERY_CHECK_TIMEOUT curl -s -w "\n%{http_code}" \
    -X POST "${AZURE_API_BASE}openai/deployments/${deployment}/chat/completions?api-version=2025-04-01-preview" \
    -H "api-key: ${AZURE_API_KEY}" \
    -H "Content-Type: application/json" \
    -d '{"messages":[{"role":"system","content":"connectivity test"}],"model":"'"${deployment}"'"}' 2>/dev/null || echo -e "\n000")
  
  http_code=$(echo "$response" | tail -1)
  [[ "$http_code" =~ ^(200|201|400)$ ]]
}

# Recover routing back to Azure
recover_to_azure() {
  local deployment=$1
  timestamp=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
  echo "[${timestamp}] Recovery: ${deployment} responding - restoring Azure routing"
  
  # Log recovery decision
  echo "${deployment}:azure:recovered" >> /tmp/formation-routing-decisions.log
}

if is_in_fallback_mode; then
  echo "[$(date -u +"%Y-%m-%dT%H:%M:%SZ")] Checking Azure recovery status (fallback currently active)"
  
  recovered_count=0
  
  # Check each deployment
  for deployment in gpt-4o gpt-4-1 o3-mini claude-sonnet-4.6; do
    if test_azure_recovery "$deployment"; then
      recover_to_azure "$deployment"
      ((recovered_count++))
    fi
  done
  
  # If all deployments recovered, clear fallback mode
  if [[ $recovered_count -eq 4 ]]; then
    echo "[$(date -u +"%Y-%m-%dT%H:%M:%SZ")] All deployments recovered - clearing fallback mode"
    rm -f /tmp/formation-routing-decisions.log
    
    curl -s -X POST http://localhost:3032/api/heartbeat \
      -H "Content-Type: application/json" \
      -d "{
        \"agent_id\": \"local-to-azure-recovery-hook\",
        \"status\": \"completed\",
        \"message\": \"All Azure deployments recovered - fallback cleared\",
        \"formation_id\": \"${FORMATION_ID}\"
      }" >/dev/null 2>&1 || true
  else
    echo "[$(date -u +"%Y-%m-%dT%H:%M:%SZ")] Partial recovery: ${recovered_count}/4 deployments healthy"
  fi
else
  echo "[$(date -u +"%Y-%m-%dT%H:%M:%SZ")] Not in fallback mode - no recovery action needed"
fi

exit 0
