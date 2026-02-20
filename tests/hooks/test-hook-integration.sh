#!/bin/bash

###############################################################################
# CCEM Hook System Integration Test
# Tests end-to-end hook functionality with actual API endpoints
###############################################################################

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test counters
TESTS_RUN=0
TESTS_PASSED=0
TESTS_FAILED=0

# Base directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$( cd "$SCRIPT_DIR/../.." && pwd )"
ENV_FILE="$PROJECT_ROOT/.env"

###############################################################################
# Helper Functions
###############################################################################

print_header() {
    echo -e "\n${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
}

print_test() {
    echo -e "\n${YELLOW}TEST:${NC} $1"
}

print_success() {
    echo -e "${GREEN}✓ PASS:${NC} $1"
    ((TESTS_PASSED++))
}

print_failure() {
    echo -e "${RED}✗ FAIL:${NC} $1"
    ((TESTS_FAILED++))
}

print_info() {
    echo -e "${BLUE}ℹ INFO:${NC} $1"
}

run_test() {
    ((TESTS_RUN++))
}

###############################################################################
# Pre-flight Checks
###############################################################################

print_header "CCEM Hook System Integration Tests"

print_test "Checking .env file exists"
run_test
if [ -f "$ENV_FILE" ]; then
    print_success ".env file found at $ENV_FILE"
else
    print_failure ".env file not found at $ENV_FILE"
    echo -e "${RED}Please create .env file from .env.example${NC}"
    exit 1
fi

print_test "Loading environment variables"
run_test
if [ -f "$ENV_FILE" ]; then
    set -a
    source "$ENV_FILE"
    set +a
    print_success "Environment variables loaded"
else
    print_failure "Could not load environment variables"
    exit 1
fi

print_test "Verifying required environment variables"
run_test
REQUIRED_VARS=("VIKI_URL" "VIKI_API_TOKEN")
MISSING_VARS=()

for var in "${REQUIRED_VARS[@]}"; do
    if [ -z "${!var}" ]; then
        MISSING_VARS+=("$var")
    fi
done

if [ ${#MISSING_VARS[@]} -eq 0 ]; then
    print_success "All required environment variables are set"
else
    print_failure "Missing environment variables: ${MISSING_VARS[*]}"
    echo -e "${YELLOW}Please set the following in .env:${NC}"
    for var in "${MISSING_VARS[@]}"; do
        echo "  - $var"
    done
    exit 1
fi

print_test "Checking curl is installed"
run_test
if command -v curl &> /dev/null; then
    print_success "curl is installed: $(curl --version | head -n 1)"
else
    print_failure "curl is not installed"
    exit 1
fi

print_test "Checking jq is installed (for JSON parsing)"
run_test
if command -v jq &> /dev/null; then
    print_success "jq is installed: $(jq --version)"
else
    print_failure "jq is not installed"
    echo -e "${YELLOW}Install jq with: brew install jq${NC}"
    exit 1
fi

###############################################################################
# API Endpoint Tests
###############################################################################

print_header "Testing API Endpoints"

# Test 1: Health Check
print_test "GET /api/v1/hooks/health"
run_test
HEALTH_RESPONSE=$(curl -s -w "\n%{http_code}" \
    -X GET \
    "$VIKI_URL/api/v1/hooks/health" \
    -H "Content-Type: application/json")

HTTP_CODE=$(echo "$HEALTH_RESPONSE" | tail -n 1)
RESPONSE_BODY=$(echo "$HEALTH_RESPONSE" | sed '$d')

if [ "$HTTP_CODE" = "200" ]; then
    if echo "$RESPONSE_BODY" | jq . > /dev/null 2>&1; then
        print_success "Health check endpoint returned 200 with valid JSON"
        print_info "Response: $RESPONSE_BODY"
    else
        print_failure "Health check returned 200 but invalid JSON"
        echo "Response: $RESPONSE_BODY"
    fi
else
    print_failure "Health check endpoint returned HTTP $HTTP_CODE"
    echo "Response: $RESPONSE_BODY"
fi

# Test 2: Message Analysis Endpoint
print_test "POST /api/v1/hooks/messages/analyze"
run_test

MESSAGE_PAYLOAD=$(cat <<EOF
{
  "message_id": "msg_test_$(date +%s)",
  "project": "ccem-integration-test",
  "user_message": "I need to implement vector search with pgvector and deploy to Azure using Terraform",
  "detected_categories": ["data", "search", "database", "infrastructure"],
  "detected_keywords": ["vector", "search", "pgvector", "deploy", "azure", "terraform"],
  "is_code_query": true,
  "suggested_files": ["src/search.py", "terraform/main.tf"],
  "suggested_commands": ["terraform plan", "python scripts/search.py"],
  "timestamp": "$(date -u +"%Y-%m-%dT%H:%M:%S.000Z")"
}
EOF
)

ANALYZE_RESPONSE=$(curl -s -w "\n%{http_code}" \
    -X POST \
    "$VIKI_URL/api/v1/hooks/messages/analyze" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $VIKI_API_TOKEN" \
    -d "$MESSAGE_PAYLOAD")

HTTP_CODE=$(echo "$ANALYZE_RESPONSE" | tail -n 1)
RESPONSE_BODY=$(echo "$ANALYZE_RESPONSE" | sed '$d')

if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "201" ]; then
    if echo "$RESPONSE_BODY" | jq . > /dev/null 2>&1; then
        print_success "Message analysis endpoint returned $HTTP_CODE with valid JSON"
        print_info "Response: $RESPONSE_BODY"
    else
        print_failure "Message analysis returned $HTTP_CODE but invalid JSON"
        echo "Response: $RESPONSE_BODY"
    fi
else
    print_failure "Message analysis endpoint returned HTTP $HTTP_CODE"
    echo "Response: $RESPONSE_BODY"
fi

# Test 3: Conversation Storage Endpoint
print_test "POST /api/v1/hooks/conversations"
run_test

CONVERSATION_PAYLOAD=$(cat <<EOF
{
  "conversation_id": "conv_test_$(date +%s)",
  "project": "ccem-integration-test",
  "user_message": "How do I implement vector search with pgvector?",
  "assistant_response": "To implement vector search with pgvector, you need to: 1. Install pgvector extension, 2. Create a table with vector columns, 3. Insert embeddings, 4. Query using similarity search.",
  "tools_used": ["Grep", "Read", "Edit", "Bash"],
  "timestamp": "$(date -u +"%Y-%m-%dT%H:%M:%S.000Z")"
}
EOF
)

CONVERSATION_RESPONSE=$(curl -s -w "\n%{http_code}" \
    -X POST \
    "$VIKI_URL/api/v1/hooks/conversations" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $VIKI_API_TOKEN" \
    -d "$CONVERSATION_PAYLOAD")

HTTP_CODE=$(echo "$CONVERSATION_RESPONSE" | tail -n 1)
RESPONSE_BODY=$(echo "$CONVERSATION_RESPONSE" | sed '$d')

if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "201" ]; then
    if echo "$RESPONSE_BODY" | jq . > /dev/null 2>&1; then
        print_success "Conversation storage endpoint returned $HTTP_CODE with valid JSON"
        print_info "Response: $RESPONSE_BODY"
    else
        print_failure "Conversation storage returned $HTTP_CODE but invalid JSON"
        echo "Response: $RESPONSE_BODY"
    fi
else
    print_failure "Conversation storage endpoint returned HTTP $HTTP_CODE"
    echo "Response: $RESPONSE_BODY"
fi

# Test 4: Authentication Failure
print_test "POST /api/v1/hooks/messages/analyze (invalid auth)"
run_test

INVALID_AUTH_RESPONSE=$(curl -s -w "\n%{http_code}" \
    -X POST \
    "$VIKI_URL/api/v1/hooks/messages/analyze" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer invalid-token-12345" \
    -d "$MESSAGE_PAYLOAD")

HTTP_CODE=$(echo "$INVALID_AUTH_RESPONSE" | tail -n 1)
RESPONSE_BODY=$(echo "$INVALID_AUTH_RESPONSE" | sed '$d')

if [ "$HTTP_CODE" = "401" ] || [ "$HTTP_CODE" = "403" ]; then
    print_success "Invalid auth correctly returned HTTP $HTTP_CODE"
else
    print_failure "Invalid auth should return 401/403, got HTTP $HTTP_CODE"
    echo "Response: $RESPONSE_BODY"
fi

# Test 5: Missing Content-Type Header
print_test "POST /api/v1/hooks/messages/analyze (missing Content-Type)"
run_test

MISSING_HEADER_RESPONSE=$(curl -s -w "\n%{http_code}" \
    -X POST \
    "$VIKI_URL/api/v1/hooks/messages/analyze" \
    -H "Authorization: Bearer $VIKI_API_TOKEN" \
    -d "$MESSAGE_PAYLOAD")

HTTP_CODE=$(echo "$MISSING_HEADER_RESPONSE" | tail -n 1)
RESPONSE_BODY=$(echo "$MISSING_HEADER_RESPONSE" | sed '$d')

if [ "$HTTP_CODE" = "400" ] || [ "$HTTP_CODE" = "415" ] || [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "201" ]; then
    print_success "Missing Content-Type handled correctly (HTTP $HTTP_CODE)"
else
    print_failure "Unexpected response for missing Content-Type: HTTP $HTTP_CODE"
    echo "Response: $RESPONSE_BODY"
fi

# Test 6: Invalid JSON Payload
print_test "POST /api/v1/hooks/messages/analyze (invalid JSON)"
run_test

INVALID_JSON_RESPONSE=$(curl -s -w "\n%{http_code}" \
    -X POST \
    "$VIKI_URL/api/v1/hooks/messages/analyze" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $VIKI_API_TOKEN" \
    -d "{ invalid json }")

HTTP_CODE=$(echo "$INVALID_JSON_RESPONSE" | tail -n 1)
RESPONSE_BODY=$(echo "$INVALID_JSON_RESPONSE" | sed '$d')

if [ "$HTTP_CODE" = "400" ] || [ "$HTTP_CODE" = "422" ]; then
    print_success "Invalid JSON correctly returned HTTP $HTTP_CODE"
else
    print_failure "Invalid JSON should return 400/422, got HTTP $HTTP_CODE"
    echo "Response: $RESPONSE_BODY"
fi

# Test 7: Empty Request Body
print_test "POST /api/v1/hooks/conversations (empty body)"
run_test

EMPTY_BODY_RESPONSE=$(curl -s -w "\n%{http_code}" \
    -X POST \
    "$VIKI_URL/api/v1/hooks/conversations" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $VIKI_API_TOKEN" \
    -d "{}")

HTTP_CODE=$(echo "$EMPTY_BODY_RESPONSE" | tail -n 1)
RESPONSE_BODY=$(echo "$EMPTY_BODY_RESPONSE" | sed '$d')

if [ "$HTTP_CODE" = "400" ] || [ "$HTTP_CODE" = "422" ]; then
    print_success "Empty body correctly returned HTTP $HTTP_CODE"
else
    print_failure "Empty body should return 400/422, got HTTP $HTTP_CODE"
    echo "Response: $RESPONSE_BODY"
fi

###############################################################################
# Summary
###############################################################################

print_header "Test Summary"

echo -e "Tests Run:    ${BLUE}$TESTS_RUN${NC}"
echo -e "Tests Passed: ${GREEN}$TESTS_PASSED${NC}"
echo -e "Tests Failed: ${RED}$TESTS_FAILED${NC}"

if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "\n${GREEN}✓ All tests passed!${NC}"
    exit 0
else
    echo -e "\n${RED}✗ Some tests failed!${NC}"
    exit 1
fi
