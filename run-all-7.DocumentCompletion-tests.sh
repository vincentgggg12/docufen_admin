#!/bin/bash

# Script to run all 7.DocumentCompletion tests with custom reporter

echo "🧪 Running all 7.DocumentCompletion tests..."
echo "=================================================="

# Clean up previous results
echo "Cleaning up previous results..."
rm -f playwright/playwright-results/ts-test-report.html
rm -f playwright/playwright-results/TS.*

# List of all test files to run
# Add new test files here as they are created
TEST_FILES=(
    "playwright/tests/7_DocumentCompletion/7.1.CreateNewDocument/TS.7.1-01-CreateDocumentDialogDisplay.spec.ts"
    "playwright/tests/7_DocumentCompletion/7.1.CreateNewDocument/TS.7.1-02-DocumentNameInputValidation.spec.ts"
    "playwright/tests/7_DocumentCompletion/7.1.CreateNewDocument/TS.7.1-03-ExternalReferenceField.spec.ts"
    "playwright/tests/7_DocumentCompletion/7.1.CreateNewDocument/TS.7.1-04-CategoryDropdownSelection.spec.ts"
    "playwright/tests/7_DocumentCompletion/7.1.CreateNewDocument/TS.7.1-05-CustomCategoryInput.spec.ts"
    "playwright/tests/7_DocumentCompletion/7.1.CreateNewDocument/TS.7.1-06-FileBrowseAndFormatValidation.spec.ts"
    "playwright/tests/7_DocumentCompletion/7.1.CreateNewDocument/TS.7.1-07-DragAndDropFileUpload.spec.ts"
    "playwright/tests/7_DocumentCompletion/7.1.CreateNewDocument/TS.7.1-08-FileTypeAndSizeValidation.spec.ts"
    # Add more test files here as they are created:
    # "playwright/tests/7_DocumentCompletion/7.2.xxx/TS.7.2-01-xxx.spec.ts"
)

# Build the command with all test files
echo ""
echo "Running the following tests:"
for test in "${TEST_FILES[@]}"; do
    echo "  - $(basename "$test")"
done
echo ""

# Run all tests with the TS custom reporter that generates ts-test-report.html
npx playwright test "${TEST_FILES[@]}" --reporter=./playwright/tests/utils/ts-custom-reporter-fixed.ts

# Check if test completed
if [ $? -eq 0 ]; then
    echo ""
    echo "✅ All tests completed successfully!"
else
    echo ""
    echo "❌ One or more tests failed. Check the output above for errors."
fi

echo ""
echo "📊 Test report available at:"
echo "  - playwright/playwright-results/ts-test-report.html"
echo ""

# Ask if user wants to open the report
read -p "Open test report in browser? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    if [ -f "playwright/playwright-results/ts-test-report.html" ]; then
        open "playwright/playwright-results/ts-test-report.html"
    else
        echo "❌ Report not found at playwright/playwright-results/ts-test-report.html"
    fi
fi

echo "=================================================="