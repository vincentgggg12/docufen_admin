#!/bin/bash

# Run Playwright tests using Chrome instead of Chromium
echo "Running Playwright tests with Chrome browser..."

# Set BASE_URL if not already set
export BASE_URL=${BASE_URL:-"https://app.docufen.com"}

# Run specific test or all tests
if [ -n "$1" ]; then
    echo "Running test: $1"
    npx playwright test "$1" --config=playwright.chrome.config.ts
else
    echo "Running all tests"
    npx playwright test --config=playwright.chrome.config.ts
fi