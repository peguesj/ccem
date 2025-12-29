#!/bin/bash

###############################################################################
# CCEM Hook Test Setup Validation
# Validates that the test environment is properly configured
###############################################################################

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Base directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$( cd "$SCRIPT_DIR/../.." && pwd )"

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}CCEM Hook Test Setup Validation${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"

ISSUES=0

# Check Node.js
echo -e "${YELLOW}Checking Node.js...${NC}"
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    echo -e "${GREEN}✓${NC} Node.js installed: $NODE_VERSION"

    # Check version >= 18
    NODE_MAJOR=$(echo "$NODE_VERSION" | cut -d. -f1 | tr -d 'v')
    if [ "$NODE_MAJOR" -ge 18 ]; then
        echo -e "${GREEN}✓${NC} Node.js version is sufficient (>= 18)"
    else
        echo -e "${RED}✗${NC} Node.js version is too old (need >= 18, have $NODE_VERSION)"
        ((ISSUES++))
    fi
else
    echo -e "${RED}✗${NC} Node.js is not installed"
    ((ISSUES++))
fi

# Check npm
echo -e "\n${YELLOW}Checking npm...${NC}"
if command -v npm &> /dev/null; then
    echo -e "${GREEN}✓${NC} npm installed: $(npm --version)"
else
    echo -e "${RED}✗${NC} npm is not installed"
    ((ISSUES++))
fi

# Check curl
echo -e "\n${YELLOW}Checking curl...${NC}"
if command -v curl &> /dev/null; then
    echo -e "${GREEN}✓${NC} curl installed: $(curl --version | head -n 1)"
else
    echo -e "${RED}✗${NC} curl is not installed"
    ((ISSUES++))
fi

# Check jq
echo -e "\n${YELLOW}Checking jq...${NC}"
if command -v jq &> /dev/null; then
    echo -e "${GREEN}✓${NC} jq installed: $(jq --version)"
else
    echo -e "${RED}✗${NC} jq is not installed"
    echo -e "${YELLOW}  Install with: brew install jq${NC}"
    ((ISSUES++))
fi

# Check project structure
echo -e "\n${YELLOW}Checking project structure...${NC}"
cd "$PROJECT_ROOT"

if [ -f "package.json" ]; then
    echo -e "${GREEN}✓${NC} package.json found"
else
    echo -e "${RED}✗${NC} package.json not found"
    ((ISSUES++))
fi

if [ -d "node_modules" ]; then
    echo -e "${GREEN}✓${NC} node_modules directory exists"
else
    echo -e "${YELLOW}⚠${NC} node_modules not found - run 'npm install'"
    ((ISSUES++))
fi

if [ -f "tsconfig.json" ]; then
    echo -e "${GREEN}✓${NC} tsconfig.json found"
else
    echo -e "${RED}✗${NC} tsconfig.json not found"
    ((ISSUES++))
fi

if [ -f "jest.config.js" ]; then
    echo -e "${GREEN}✓${NC} jest.config.js found"
else
    echo -e "${RED}✗${NC} jest.config.js not found"
    ((ISSUES++))
fi

# Check source files exist
echo -e "\n${YELLOW}Checking hook source files...${NC}"

if [ -f "src/hooks/types.ts" ]; then
    echo -e "${GREEN}✓${NC} src/hooks/types.ts found"
else
    echo -e "${RED}✗${NC} src/hooks/types.ts not found"
    ((ISSUES++))
fi

if [ -f "src/hooks/templates/handlers/analyze-message.ts" ]; then
    echo -e "${GREEN}✓${NC} src/hooks/templates/handlers/analyze-message.ts found"
else
    echo -e "${RED}✗${NC} src/hooks/templates/handlers/analyze-message.ts not found"
    ((ISSUES++))
fi

if [ -f "src/hooks/templates/handlers/store-conversation.ts" ]; then
    echo -e "${GREEN}✓${NC} src/hooks/templates/handlers/store-conversation.ts found"
else
    echo -e "${RED}✗${NC} src/hooks/templates/handlers/store-conversation.ts not found"
    ((ISSUES++))
fi

if [ -f "src/hooks/utils/submit.ts" ]; then
    echo -e "${GREEN}✓${NC} src/hooks/utils/submit.ts found"
else
    echo -e "${RED}✗${NC} src/hooks/utils/submit.ts not found"
    ((ISSUES++))
fi

if [ -f "src/hooks/utils/retry.ts" ]; then
    echo -e "${GREEN}✓${NC} src/hooks/utils/retry.ts found"
else
    echo -e "${RED}✗${NC} src/hooks/utils/retry.ts not found"
    ((ISSUES++))
fi

# Check test files
echo -e "\n${YELLOW}Checking test files...${NC}"

TEST_FILES=(
    "tests/hooks/test-message-analysis.ts"
    "tests/hooks/test-conversation-storage.ts"
    "tests/hooks/test-server-submission.ts"
    "tests/hooks/test-hook-integration.sh"
    "tests/hooks/run-hook-tests.sh"
)

for file in "${TEST_FILES[@]}"; do
    if [ -f "$file" ]; then
        echo -e "${GREEN}✓${NC} $file found"
    else
        echo -e "${RED}✗${NC} $file not found"
        ((ISSUES++))
    fi
done

# Check test scripts are executable
echo -e "\n${YELLOW}Checking test script permissions...${NC}"

if [ -x "tests/hooks/test-hook-integration.sh" ]; then
    echo -e "${GREEN}✓${NC} test-hook-integration.sh is executable"
else
    echo -e "${RED}✗${NC} test-hook-integration.sh is not executable"
    echo -e "${YELLOW}  Run: chmod +x tests/hooks/test-hook-integration.sh${NC}"
    ((ISSUES++))
fi

if [ -x "tests/hooks/run-hook-tests.sh" ]; then
    echo -e "${GREEN}✓${NC} run-hook-tests.sh is executable"
else
    echo -e "${RED}✗${NC} run-hook-tests.sh is not executable"
    echo -e "${YELLOW}  Run: chmod +x tests/hooks/run-hook-tests.sh${NC}"
    ((ISSUES++))
fi

# Check .env file
echo -e "\n${YELLOW}Checking environment configuration...${NC}"

if [ -f ".env" ]; then
    echo -e "${GREEN}✓${NC} .env file found"

    # Check for required variables
    if grep -q "VIKI_URL=" .env && grep -q "VIKI_API_TOKEN=" .env; then
        echo -e "${GREEN}✓${NC} Required environment variables defined in .env"

        # Check if values are set (not empty or placeholder)
        if grep -q "VIKI_URL=https://" .env; then
            echo -e "${GREEN}✓${NC} VIKI_URL appears to be configured"
        else
            echo -e "${YELLOW}⚠${NC} VIKI_URL may not be properly configured"
        fi

        if grep -q "VIKI_API_TOKEN=your-viki-api-token-here" .env; then
            echo -e "${YELLOW}⚠${NC} VIKI_API_TOKEN still has placeholder value"
        else
            echo -e "${GREEN}✓${NC} VIKI_API_TOKEN appears to be configured"
        fi
    else
        echo -e "${RED}✗${NC} Required environment variables missing in .env"
        ((ISSUES++))
    fi
else
    echo -e "${YELLOW}⚠${NC} .env file not found"
    echo -e "${YELLOW}  Copy .env.example to .env and configure for integration tests${NC}"
fi

# Summary
echo -e "\n${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}Validation Summary${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"

if [ $ISSUES -eq 0 ]; then
    echo -e "${GREEN}✓ Setup validation passed!${NC}"
    echo -e "${GREEN}You are ready to run the hook tests.${NC}\n"
    echo -e "Run tests with:"
    echo -e "  ${BLUE}./tests/hooks/run-hook-tests.sh${NC}\n"
    exit 0
else
    echo -e "${RED}✗ Found $ISSUES issue(s)${NC}"
    echo -e "${YELLOW}Please fix the issues above before running tests.${NC}\n"
    exit 1
fi
