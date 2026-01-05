#!/bin/bash

# Script to run TS.7.1 test with custom reporter and open the report

echo "🧪 Running TS.7.1 Create New Document test with custom reporter..."
echo "=================================================="

# Clean up previous results
echo "Cleaning up previous results..."
rm -f playwright/playwright-results/ts-test-report.html
rm -f playwright/playwright-results/TS.*

# Run the test
npm run test:ts:7.1

# Check if test completed
if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Test completed successfully!"
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
    echo "❌ Test failed. Check the output above for errors."
    echo "📍 Screenshots may still be available in: playwright/playwright-results/"
fi

echo ""
echo "=================================================="