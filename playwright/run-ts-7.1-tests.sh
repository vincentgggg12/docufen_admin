#!/bin/bash

# Script to run all TS.7.1 tests consecutively with custom reporter

echo "🧪 Running all TS.7.1 Create New Document tests..."
echo "=================================================="

# Clean up previous results
echo "Cleaning up previous results..."
rm -f playwright/playwright-results/ts-test-report.html
rm -f playwright/playwright-results/TS.*

# Run all TS.7.1 tests
echo ""
echo "Running TS.7.1-01, TS.7.1-02, TS.7.1-03, TS.7.1-04, and TS.7.1-05 tests..."
npx playwright test \
  "playwright/tests/7_DocumentCompletion/7.1.CreateNewDocument/TS.7.1-01*.spec.ts" \
  "playwright/tests/7_DocumentCompletion/7.1.CreateNewDocument/TS.7.1-02*.spec.ts" \
  "playwright/tests/7_DocumentCompletion/7.1.CreateNewDocument/TS.7.1-03*.spec.ts" \
  "playwright/tests/7_DocumentCompletion/7.1.CreateNewDocument/TS.7.1-04*.spec.ts" \
  "playwright/tests/7_DocumentCompletion/7.1.CreateNewDocument/TS.7.1-05*.spec.ts" \
  --reporter=./playwright/reporter/custom-reporter.ts

# Check if test completed
if [ $? -eq 0 ]; then
    echo ""
    echo "✅ All tests completed successfully!"
    echo ""
    echo "📊 Opening test report..."
    
    # Check if report was generated
    if [ -f "playwright/playwright-results/ts-test-report.html" ]; then
        # Open the report in default browser
        if [[ "$OSTYPE" == "darwin"* ]]; then
            # macOS
            open playwright/playwright-results/ts-test-report.html
        elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
            # Linux
            xdg-open playwright/playwright-results/ts-test-report.html
        elif [[ "$OSTYPE" == "msys" || "$OSTYPE" == "cygwin" ]]; then
            # Windows
            start playwright/playwright-results/ts-test-report.html
        fi
        
        echo "📍 Report location: playwright/playwright-results/ts-test-report.html"
    else
        echo "❌ Report not found. Check test output for errors."
    fi
else
    echo ""
    echo "❌ One or more tests failed. Check the output above for errors."
    echo "📍 Screenshots may still be available in: playwright/playwright-results/"
fi

echo ""
echo "=================================================="