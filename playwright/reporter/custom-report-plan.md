# Custom Playwright HTML Reporter Implementation Plan

This document outlines a plan to create a custom HTML reporter for Playwright tests that displays information in a structured table format.

## Requirements

The custom report should display a table with the following columns:
1. Test Number
2. Step Number
3. Test Description
4. Acceptance Criteria
5. Test Results
6. Pass/Fail Status
7. Screenshots

## Step 1: Create a Custom Reporter Class

Create a new file called `custom-html-reporter.ts` in a `playwright-reporter` directory:

```typescript
import type {
  FullConfig, FullResult, Reporter, Suite, TestCase, TestResult, TestStep
} from '@playwright/test/reporter';
import fs from 'fs';
import path from 'path';

class CustomHtmlReporter implements Reporter {
  private config: FullConfig;
  private suite: Suite;
  private results: any[] = [];
  private reportPath: string = 'playwright-results/test-reports/custom-report.html';
  
  constructor(options: { outputFile?: string } = {}) {
    if (options.outputFile) {
      this.reportPath = options.outputFile;
    }
  }

  onBegin(config: FullConfig, suite: Suite) {
    this.config = config;
    this.suite = suite;
    console.log(`Starting test run with ${suite.allTests().length} tests`);
  }

  onTestBegin(test: TestCase) {
    // Initialize test data
    const testInfo = {
      testNumber: this.getTestNumber(test.title),
      stepNumber: this.getStepNumber(test.title),
      description: test.title,
      acceptanceCriteria: this.getAcceptanceCriteria(test),
      results: [],
      status: 'running',
      screenshots: []
    };
    
    this.results.push(testInfo);
  }

  onStepBegin(test: TestCase, result: TestResult, step: TestStep) {
    // Track steps to include in results
    if (step.category === 'test.step') {
      const testInfo = this.findTest(test);
      if (testInfo) {
        testInfo.results.push({
          step: step.title,
          status: 'running'
        });
      }
    }
  }

  onStepEnd(test: TestCase, result: TestResult, step: TestStep) {
    // Update step status
    if (step.category === 'test.step') {
      const testInfo = this.findTest(test);
      if (testInfo) {
        const stepResult = testInfo.results.find((s: any) => s.step === step.title);
        if (stepResult) {
          stepResult.status = step.error ? 'failed' : 'passed';
        }
      }
    }
  }

  onTestEnd(test: TestCase, result: TestResult) {
    // Update test status and add screenshots
    const testInfo = this.findTest(test);
    if (testInfo) {
      testInfo.status = result.status;
      
      // Add screenshots
      for (const attachment of result.attachments) {
        if (attachment.contentType.includes('image/')) {
          testInfo.screenshots.push({
            name: attachment.name,
            path: attachment.path
          });
        }
      }
    }
  }

  onEnd(result: FullResult) {
    // Generate HTML report
    this.generateHtmlReport();
    console.log(`Tests finished with status: ${result.status}`);
    console.log(`Custom HTML report generated at: ${this.reportPath}`);
  }

  // Helper methods
  private findTest(test: TestCase) {
    return this.results.find(t => 
      t.testNumber === this.getTestNumber(test.title) && 
      t.stepNumber === this.getStepNumber(test.title));
  }

  private getTestNumber(title: string): string {
    // Extract test number format like "Test001" from title
    const match = title.match(/Test\s*(\d+)/i);
    return match ? match[0] : 'Unknown';
  }

  private getStepNumber(title: string): string {
    // Extract step number format like "Step 1" from title
    const match = title.match(/Step\s*(\d+)/i);
    return match ? match[0] : '';
  }

  private getAcceptanceCriteria(test: TestCase): string[] {
    // This would typically come from test annotations, tags, or metadata
    // For now, we'll return a placeholder based on test title
    return [`Criteria for ${test.title}`];
  }

  private generateHtmlReport() {
    // Create directory if it doesn't exist
    const dir = path.dirname(this.reportPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    // Generate HTML content
    const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Playwright Test Report</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        table { border-collapse: collapse; width: 100%; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; }
        .passed { color: green; }
        .failed { color: red; }
        .skipped { color: orange; }
        .screenshots { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 10px; }
        .screenshot img { max-width: 200px; border: 1px solid #ddd; }
      </style>
    </head>
    <body>
      <h1>Test Execution Report</h1>
      <table>
        <thead>
          <tr>
            <th>Test Number</th>
            <th>Step Number</th>
            <th>Description</th>
            <th>Acceptance Criteria</th>
            <th>Test Results</th>
            <th>Status</th>
            <th>Screenshots</th>
          </tr>
        </thead>
        <tbody>
          ${this.results.map(test => `
            <tr>
              <td>${test.testNumber}</td>
              <td>${test.stepNumber}</td>
              <td>${test.description}</td>
              <td>
                <ul>
                  ${test.acceptanceCriteria.map(criteria => `<li>${criteria}</li>`).join('')}
                </ul>
              </td>
              <td>
                <ul>
                  ${test.results.map(step => `
                    <li class="${step.status}">${step.step}: ${step.status}</li>
                  `).join('')}
                </ul>
              </td>
              <td class="${test.status}">${test.status}</td>
              <td>
                <div class="screenshots">
                  ${test.screenshots.map(screenshot => `
                    <div class="screenshot">
                      <p>${screenshot.name}</p>
                      <img src="${this.getRelativePath(screenshot.path)}" alt="${screenshot.name}">
                    </div>
                  `).join('')}
                </div>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </body>
    </html>
    `;

    // Write HTML file
    fs.writeFileSync(this.reportPath, html);
  }

  private getRelativePath(absPath: string | undefined): string {
    if (!absPath) return '';
    // Convert absolute paths to relative for the HTML report
    // This will depend on your project structure
    return path.relative(path.dirname(this.reportPath), absPath);
  }
}

export default CustomHtmlReporter;
```

## Step 2: Update the Test Script with Step Information

Enhance your test with explicit test steps using Playwright's `test.step` API:

```typescript
// Add this to 001-setup-17nj5d.spec.ts
test('Step 1: First user (Megan Bowen) completes Setup Wizard', async ({ page }, testInfo) => {
  // Store testId for test results collection
  const testId = testInfo.testId;
  
  // Allow this first step up to 2 minutes because the setup wizard and network can be slow
  testInfo.setTimeout(120000);

  await test.step('Login with Megan Bowen', async () => {
    // Implementation
  });

  await test.step('Complete setup wizard', async () => {
    await runSetupTest(page, config17NJ5D);
  });

  await test.step('Navigate to Users page', async () => {
    // Implementation
  });

  // More steps...
});
```

## Step 3: Add Screenshot Attachments to Test Steps

Make sure screenshots are properly attached to the test results:

```typescript
// Example of attaching screenshots
await test.step('Verify user statuses', async () => {
  await page.screenshot({ path: 'playwright-results/test-results/user-statuses.png' });
  testInfo.attachments.push({
    name: 'User Statuses',
    contentType: 'image/png',
    path: 'playwright-results/test-results/user-statuses.png'
  });
  
  // Implementation
});
```

## Step 4: Configure Playwright to Use the Custom Reporter

Update your `playwright.config.ts` file:

```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './playwright-tests',
  timeout: 30000,
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ['./playwright-reporter/custom-html-reporter.ts', { 
      outputFile: 'playwright-results/test-reports/detailed-test-report.html' 
    }],
    ['html'] // Keep the built-in HTML reporter as well
  ],
  use: {
    baseURL: process.env.BASE_URL || 'https://beta.docufen.com',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { 
        ...devices['Desktop Chrome'],
      },
    },
  ],
});
```

## Step 5: Add Acceptance Criteria and Metadata

Create a system to provide acceptance criteria for your tests:

1. Define a structure to store acceptance criteria for each test
2. Update your test cases with explicit acceptance criteria

```typescript
// Create this file: playwright-tests/test-metadata.ts
export const testMetadata = {
  'Test001': {
    'Step 1': {
      acceptanceCriteria: [
        'User can log in with Microsoft credentials',
        'User can complete setup wizard',
        'User can add a User Manager',
        'Admin account shows as "Active" in Users list'
      ]
    },
    'Step 2': {
      acceptanceCriteria: [
        'User Manager can log in with Microsoft credentials',
        'User Manager status changes to "Active"',
        'Microsoft User ID field is populated',
        'Type field shows "Internal"'
      ]
    }
  }
};
```

Then modify the custom reporter to use this metadata:

```typescript
// In custom-html-reporter.ts
import { testMetadata } from '../playwright-tests/test-metadata';

// Then update the getAcceptanceCriteria method
private getAcceptanceCriteria(test: TestCase): string[] {
  const testNum = this.getTestNumber(test.title);
  const stepNum = this.getStepNumber(test.title);
  
  if (testMetadata[testNum] && testMetadata[testNum][stepNum]) {
    return testMetadata[testNum][stepNum].acceptanceCriteria;
  }
  
  return [`Criteria for ${test.title}`];
}
```

## Implementation Timeline

1. **Day 1**: Create the custom reporter class and basic HTML template
2. **Day 2**: Update Test001 to use explicit test steps and attach screenshots
3. **Day 3**: Add acceptance criteria metadata and enhance the HTML report styling
4. **Day 4**: Test the implementation and make refinements to the report format
5. **Day 5**: Document the reporter usage and extend to additional tests

## Benefits

1. **Structured Reporting**: Clear tabular format showing all test details
2. **Visual Evidence**: Screenshots embedded directly in the report
3. **Traceability**: Direct mapping between test number, steps, and acceptance criteria
4. **Extensibility**: Can be expanded to include more tests and additional metadata
5. **Parallel Use**: Works alongside built-in reporters for maximum flexibility
