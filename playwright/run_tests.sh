#!/bin/bash

# Usage:
#  - ./run_tests.sh - runs tests in playwright/tests with default BASE_URL
#  - ./run_tests.sh path/to/tests - runs tests in specified directory
#  - BASE_URL=https://example.com ./run_tests.sh - override BASE_URL

# Initialize counters
PASSED=0
FAILED=0
TOTAL=0

# Directory containing test scripts (default to playwright/tests)
TEST_DIR="${1:-playwright/tests}"

# Base URL (can be overridden by environment variable)
BASE_URL="${BASE_URL:-https://beta.docufen.com}"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Running Playwright tests in directory: $TEST_DIR${NC}"
echo -e "${YELLOW}Base URL: $BASE_URL${NC}"
echo "========================================"

# Find all test spec files and sort them alphabetically
for test_script in $(find "$TEST_DIR" -maxdepth 1 -type f -name "*.spec.ts" | sort); do
    TOTAL=$((TOTAL + 1))
    echo -e "\n${YELLOW}Running test #$TOTAL: $(basename "$test_script")${NC}"
    
    # Run the playwright test
    if BASE_URL="$BASE_URL" npx playwright test "$test_script" --reporter=list --output=playwright/test-results-$(date +"%d_%H%M%S"); then
        PASSED=$((PASSED + 1))
        echo -e "${GREEN}✓ PASSED: $(basename "$test_script")${NC}"
    else
        FAILED=$((FAILED + 1))
        echo -e "${RED}✗ FAILED: $(basename "$test_script") (exit code: $?)${NC}"
    fi
done

# Summary
echo -e "\n========================================"
echo -e "${YELLOW}TEST SUMMARY${NC}"
echo -e "Total tests run: $TOTAL"
echo -e "${GREEN}Passed: $PASSED${NC}"
echo -e "${RED}Failed: $FAILED${NC}"

# Exit with failure if any tests failed
if [ $FAILED -gt 0 ]; then
    exit 1
else
    exit 0
fi
