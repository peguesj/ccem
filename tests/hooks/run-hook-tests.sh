#!/bin/bash

###############################################################################
# CCEM Hook Test Runner
# Runs all hook tests (unit, integration, and bash integration tests)
###############################################################################

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Base directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$( cd "$SCRIPT_DIR/../.." && pwd )"

# Test results
OVERALL_SUCCESS=true

###############################################################################
# Helper Functions
###############################################################################

print_header() {
    echo -e "\n${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
}

print_section() {
    echo -e "\n${YELLOW}═══════════════════════════════════════════════════════════════════${NC}"
    echo -e "${YELLOW}$1${NC}"
    echo -e "${YELLOW}═══════════════════════════════════════════════════════════════════${NC}"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_failure() {
    echo -e "${RED}✗ $1${NC}"
    OVERALL_SUCCESS=false
}

print_info() {
    echo -e "${BLUE}ℹ $1${NC}"
}

###############################################################################
# Main Test Execution
###############################################################################

print_header "CCEM Hook System Test Suite"
print_info "Project Root: $PROJECT_ROOT"
print_info "Test Directory: $SCRIPT_DIR"

# Change to project root
cd "$PROJECT_ROOT"

###############################################################################
# 1. Unit Tests (Jest)
###############################################################################

print_section "Running Unit Tests (Jest)"

if npm test -- tests/hooks/test-message-analysis.ts tests/hooks/test-conversation-storage.ts tests/hooks/test-server-submission.ts; then
    print_success "Unit tests passed"
else
    print_failure "Unit tests failed"
    OVERALL_SUCCESS=false
fi

###############################################################################
# 2. Integration Tests (Bash)
###############################################################################

print_section "Running Integration Tests (Bash)"

# Check if .env file exists
if [ ! -f "$PROJECT_ROOT/.env" ]; then
    print_failure ".env file not found"
    echo -e "${YELLOW}Skipping integration tests. Create .env from .env.example to run integration tests.${NC}"
else
    if bash "$SCRIPT_DIR/test-hook-integration.sh"; then
        print_success "Integration tests passed"
    else
        print_failure "Integration tests failed"
        OVERALL_SUCCESS=false
    fi
fi

###############################################################################
# 3. Test Coverage Report
###############################################################################

print_section "Generating Test Coverage Report"

if npm test -- --coverage tests/hooks/; then
    print_success "Coverage report generated"
    echo -e "\n${BLUE}Coverage Summary:${NC}"
    cat coverage/lcov-report/index.html 2>/dev/null || echo "Coverage HTML report: coverage/lcov-report/index.html"
else
    print_failure "Coverage report generation failed"
    OVERALL_SUCCESS=false
fi

###############################################################################
# 4. TypeScript Type Checking
###############################################################################

print_section "Running TypeScript Type Checking"

if npx tsc --noEmit; then
    print_success "TypeScript type checking passed"
else
    print_failure "TypeScript type checking failed"
    OVERALL_SUCCESS=false
fi

###############################################################################
# 5. Linting
###############################################################################

print_section "Running ESLint"

if npm run lint -- tests/hooks/; then
    print_success "Linting passed"
else
    print_failure "Linting failed"
    OVERALL_SUCCESS=false
fi

###############################################################################
# Summary
###############################################################################

print_header "Test Suite Summary"

if [ "$OVERALL_SUCCESS" = true ]; then
    echo -e "\n${GREEN}✓✓✓ ALL TESTS PASSED ✓✓✓${NC}\n"
    echo -e "${GREEN}The CCEM Hook System is working correctly!${NC}"
    exit 0
else
    echo -e "\n${RED}✗✗✗ SOME TESTS FAILED ✗✗✗${NC}\n"
    echo -e "${RED}Please review the failures above and fix the issues.${NC}"
    exit 1
fi
