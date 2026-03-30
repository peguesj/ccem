#!/bin/bash
# Azure Deployment Health Check Hook
# Triggered: every 30 seconds
# Purpose: Monitor health of Azure OpenAI deployments for CCP fallback routing

set -euo pipefail

FORMATION_ID="fmt-azure-ai-deployment-orchestration-20260330022223"
AZURE_API_BASE="${AZURE_API_BASE:-https://claude-code-proxy-aoai.openai.azure.com/}"
HEALTH_CHECK_TIMEOUT=5

# Deployments to monitor
declare -a DEPLOYMENTS=("gpt-4o" "gpt-4-1" "o3-mini" "claude-sonnet-4.6")

HEALTH_REPORT=()
ALL_HEALTHY=true

for deployment in "${DEPLOYMENTS[@]}"; do
  # Try a lightweight health check to each deployment
  response=$(timeout $HEALTH_CHECK_TIMEOUT curl -s -w "\n%{http_code}" \
    -X POST "${AZURE_API_BASE}openai/deployments/${deployment}/chat/completions?api-version=2025-04-01-preview" \
    -H "api-key: ${AZURE_API_KEY}" \
    -H "Content-Type: application/json" \
    -d '{"messages":[{"role":"system","content":"respond with ok"}],"model":"'"${deployment}"'"}' 2>/dev/null || echo -e "\n000")
  
  http_code=$(echo "$response" | tail -1)
  
  if [[ "$http_code" =~ ^(200|201|400|401)$ ]]; then
    status="healthy"
  else
    status="unhealthy"
    ALL_HEALTHY=false
  fi
  
  HEALTH_REPORT+=("deployment=${deployment},status=${status},http_code=${http_code}")
done

# Log health status
timestamp=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
echo "[${timestamp}] Azure Deployment Health Check - Formation: ${FORMATION_ID}"
for report in "${HEALTH_REPORT[@]}"; do
  echo "  $report"
done

# Signal to APM via heartbeat if any are unhealthy
if [ "$ALL_HEALTHY" = false ]; then
  curl -s -X POST http://localhost:3032/api/heartbeat \
    -H "Content-Type: application/json" \
    -d "{
      \"agent_id\": \"azure-deployment-health-check-hook\",
      \"status\": \"warning\",
      \"message\": \"One or more Azure deployments unhealthy\",
      \"formation_id\": \"${FORMATION_ID}\"
    }" >/dev/null 2>&1 || true
fi

exit 0
