#!/bin/bash
#
# Quick Start Guide for Showcase-Fleet Formation Agents
# Project: lily-ai-phx
# Updated: 2026-03-30
#
# This script provides one-command verification and testing for formation agents
#

set -e

PROJECT_ID="lily-ai-phx"
OUTPUT_BASE="/Users/jeremiah/Developer/ccem/showcase/data/projects/lily-ai-phx"
DIAGRAMS_PATH="${OUTPUT_BASE}/diagrams"
APM_BASE_URL="http://localhost:3032"
WEB_HOST="http://localhost:3001"
WEB_CLIENT_URL="${WEB_HOST}/client/index.html?project=${PROJECT_ID}"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}=== Showcase-Fleet Formation Quick Start ===${NC}\n"

# ─────────────────────────────────────────────────────────────────────────────
# VERIFICATION CHECKS
# ─────────────────────────────────────────────────────────────────────────────

echo -e "${YELLOW}[CHECK] Web Server Status${NC}"
if lsof -ti:3001 > /dev/null 2>&1; then
    echo -e "${GREEN}✓ HTTP server running on port 3001${NC}"
else
    echo -e "${RED}✗ HTTP server NOT running on port 3001${NC}"
    echo "  Start with: cd /Users/jeremiah/Developer/ccem/showcase && python3 -m http.server 3001"
    exit 1
fi

echo -e "\n${YELLOW}[CHECK] APM Server Status${NC}"
APM_RESPONSE=$(curl -s -w "\n%{http_code}" http://localhost:3032/api/status 2>/dev/null || echo "0")
APM_CODE=$(echo "$APM_RESPONSE" | tail -n1)
if [ "$APM_CODE" = "200" ]; then
    echo -e "${GREEN}✓ APM server running at http://localhost:3032${NC}"
else
    echo -e "${YELLOW}⚠ APM server may not be responding (HTTP ${APM_CODE})${NC}"
fi

echo -e "\n${YELLOW}[CHECK] Project Data Directory${NC}"
if [ -d "$OUTPUT_BASE" ]; then
    echo -e "${GREEN}✓ Output directory exists: ${OUTPUT_BASE}${NC}"
else
    echo -e "${RED}✗ Output directory NOT found${NC}"
    exit 1
fi

echo -e "\n${YELLOW}[CHECK] Directory Writability${NC}"
if touch "${OUTPUT_BASE}/.write-test" 2>/dev/null; then
    rm "${OUTPUT_BASE}/.write-test"
    echo -e "${GREEN}✓ Output directory is writable${NC}"
else
    echo -e "${RED}✗ Output directory is NOT writable${NC}"
    exit 1
fi

echo -e "\n${YELLOW}[CHECK] Web Symlink${NC}"
if [ -L "/Users/jeremiah/Developer/ccem/showcase/client/data" ]; then
    LINK_TARGET=$(readlink "/Users/jeremiah/Developer/ccem/showcase/client/data")
    echo -e "${GREEN}✓ Symlink exists: client/data -> ${LINK_TARGET}${NC}"
else
    echo -e "${YELLOW}⚠ Symlink may not exist${NC}"
fi

echo -e "\n${YELLOW}[CHECK] APM Showcase Endpoint${NC}"
APM_DATA=$(curl -s http://localhost:3032/api/showcase/lily-ai-phx 2>/dev/null | python3 -c "import sys, json; print(json.load(sys.stdin).get('project', 'error'))" 2>/dev/null || echo "error")
if [ "$APM_DATA" = "lily-ai-phx" ]; then
    echo -e "${GREEN}✓ APM /api/showcase/lily-ai-phx endpoint is working${NC}"
else
    echo -e "${YELLOW}⚠ APM endpoint may not be returning expected data${NC}"
fi

# ─────────────────────────────────────────────────────────────────────────────
# ENVIRONMENT VARIABLES FOR AGENTS
# ─────────────────────────────────────────────────────────────────────────────

echo -e "\n${YELLOW}=== Agent Environment Variables ===${NC}\n"

cat << AGENTS
Copy these environment variables to your agent execution environment:

export PROJECT_ID="${PROJECT_ID}"
export OUTPUT_BASE="${OUTPUT_BASE}"
export DIAGRAMS_PATH="${DIAGRAMS_PATH}"
export APM_BASE_URL="${APM_BASE_URL}"
export WEB_PORT="3001"
export WEB_HOST="${WEB_HOST}"
export PROJECT_REPO="/Users/jeremiah/Developer/lily-ai-phx"
export PROJECT_VERSION="1.15.1"

AGENTS

# ─────────────────────────────────────────────────────────────────────────────
# OUTPUT FILE PATHS
# ─────────────────────────────────────────────────────────────────────────────

echo -e "${YELLOW}=== Agent Output File Paths ===${NC}\n"

cat << PATHS
Wave 1 (Discovery):
  ✓ ${OUTPUT_BASE}/architecture-report.json
  ✓ ${OUTPUT_BASE}/narrative-arcs.json

Wave 2 (Generation):
  ✓ ${DIAGRAMS_PATH}/architecture-c4-context.mmd
  ✓ ${DIAGRAMS_PATH}/architecture-c4-container.mmd
  ✓ ${DIAGRAMS_PATH}/process-flow.mmd
  ✓ ${DIAGRAMS_PATH}/deployment-topology.mmd
  ✓ ${DIAGRAMS_PATH}/user-journey.mmd
  ✓ ${OUTPUT_BASE}/narrative-content.json
  ✓ ${OUTPUT_BASE}/content-blocks.json
  ✓ ${OUTPUT_BASE}/speaker-notes.json
  ✓ ${OUTPUT_BASE}/slides.json

Wave 3 (Assembly):
  ✓ ${OUTPUT_BASE}/validation-report.json
  ✓ ${OUTPUT_BASE}/showcase.html (optional)
  ✓ ${OUTPUT_BASE}/presenter.html (optional)

PATHS

# ─────────────────────────────────────────────────────────────────────────────
# URL ACCESS PATTERNS
# ─────────────────────────────────────────────────────────────────────────────

echo -e "${YELLOW}=== URL Access Patterns ===${NC}\n"

cat << URLS
Once agents write files, they are immediately accessible at:

Showcase Client:
  ${WEB_CLIENT_URL}

Direct File Access (via HTTP):
  ${WEB_HOST}/client/data/projects/lily-ai-phx/features.json
  ${WEB_HOST}/client/data/projects/lily-ai-phx/diagrams/architecture-c4-context.mmd

APM JSON API:
  ${APM_BASE_URL}/api/showcase/lily-ai-phx

URLS

# ─────────────────────────────────────────────────────────────────────────────
# QUICK TESTS
# ─────────────────────────────────────────────────────────────────────────────

echo -e "${YELLOW}=== Quick Test Commands ===${NC}\n"

cat << TESTS
Test 1: Verify project data is loadable
  curl -s ${APM_BASE_URL}/api/showcase/lily-ai-phx | python3 -m json.tool | head -20

Test 2: Check HTTP access to project data
  curl -s ${WEB_HOST}/client/data/projects/lily-ai-phx/features.json | python3 -m json.tool | head -20

Test 3: Check diagrams directory exists
  ls -la "${DIAGRAMS_PATH}" 2>/dev/null || echo "Directory will be created by agents"

Test 4: Create test diagram file (for testing agent output)
  mkdir -p "${DIAGRAMS_PATH}" && echo "Test diagram" > "${DIAGRAMS_PATH}/test.mmd"

Test 5: Verify test file is accessible via HTTP
  curl -s ${WEB_HOST}/client/data/projects/lily-ai-phx/diagrams/test.mmd

Test 6: Open showcase client in browser
  open "${WEB_CLIENT_URL}"

TESTS

# ─────────────────────────────────────────────────────────────────────────────
# TROUBLESHOOTING
# ─────────────────────────────────────────────────────────────────────────────

echo -e "${YELLOW}=== Troubleshooting ===${NC}\n"

cat << TROUBLESHOOT
If files don't appear at URLs:
  1. Verify agent wrote to correct path:
     ls -la "${OUTPUT_BASE}/"

  2. Verify HTTP server is serving files:
     curl -I ${WEB_HOST}/client/data/projects/lily-ai-phx/

  3. Check web server is running:
     lsof -ti:3001

  4. Verify symlink:
     ls -la /Users/jeremiah/Developer/ccem/showcase/client/data

If APM endpoint returns empty:
  1. Check APM is running:
     curl http://localhost:3032/api/status

  2. Verify agents populated APM intake or wrote local files

  3. Try APM refresh:
     curl -X POST http://localhost:3032/api/refresh

If port conflicts:
  • Port 3001 in use: kill \$(lsof -ti:3001) && restart server
  • Port 3032 in use: check CCEM APM status
  • Never use port 3031 (zombie processes)

TROUBLESHOOT

echo -e "\n${GREEN}=== Ready for Formation Deployment ===${NC}\n"
echo "Next step: /formation deploy fmt-20260330-showcase-fleet"
