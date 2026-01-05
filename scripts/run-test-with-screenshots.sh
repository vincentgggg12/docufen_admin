#!/bin/bash

# Colors for pretty output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Running test-002-usermanager.spec.ts with screenshot capture...${NC}"

# Make sure the test-results directory exists
mkdir -p playwright/results/test-reports
mkdir -p playwright/results/test-results

# Run the test with screenshots
echo -e "${YELLOW}Running tests...${NC}"
npx playwright test 01-setup/test-002-usermanager.spec.ts --project=chromium

# Check if test ran successfully
if [ $? -eq 0 ]; then
  echo -e "${GREEN}Test completed successfully!${NC}"
else
  echo -e "${YELLOW}Test completed with some failures, but report will still be generated.${NC}"
fi

# Run the script to make sure screenshots are in the report
echo -e "${YELLOW}Adding screenshots to the report...${NC}"
node scripts/add-screenshots-to-report.js

# Check if script failed with module error
if [ $? -ne 0 ]; then
  echo -e "${YELLOW}First attempt failed, trying with CommonJS extension...${NC}"
  # Copy the script to a .cjs file as an alternative
  cp scripts/add-screenshots-to-report.js scripts/add-screenshots-to-report.cjs
  # Run with .cjs extension
  node scripts/add-screenshots-to-report.cjs
fi

echo -e "${GREEN}Done! Report is available at playwright/results/test-reports/detailed-test-report.html${NC}"
echo -e "${YELLOW}You can open it with: open playwright/results/test-reports/detailed-test-report.html${NC}" 