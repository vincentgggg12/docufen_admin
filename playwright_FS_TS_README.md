# Playwright Test Development Guide: From FS to TS to Implementation

This guide provides a structured approach for creating Playwright tests based on Functional Specifications (FS) and Test Scripts (TS) for the Docufen application.

## Table of Contents
1. [Overview](#overview)
2. [Document Hierarchy](#document-hierarchy)
3. [Numbering Conventions](#numbering-conventions)
4. [File Organization](#file-organization)
5. [Test Development Process](#test-development-process)
6. [Configuration System](#configuration-system)
7. [Implementation Patterns](#implementation-patterns)
8. [Best Practices](#best-practices)
9. [Complete Example: TS.7.1-01](#complete-example-ts61-01)
10. [Step-by-Step Guide for New Tests](#step-by-step-guide-for-new-tests)

## Overview

The Docufen validation framework follows a traceable path from requirements to automated tests:

```
Requirements Specification (RS) → Functional Specification (FS) → Test Script (TS) → Playwright Implementation
```

## Document Hierarchy

### 1. Functional Specification (FS)
Located in: `/Documentation/Validation/02_RS_RequirementsSpecification.md`

**Structure:**
| FS ID | RS ID(s) | Function | Description | C |
|-------|----------|----------|-------------|---|
| FS.X.Y-ZZ | RS.X.Y | Function Name | Detailed description of functionality | Q/E/D |

**Key:**
- **C (Classification)**: Q = Quality Critical, E = Essential, D = Desirable
- **X**: Major section (e.g., 7 = Document Completion)
- **Y**: Sub-section (e.g., 1 = Create New Document)
- **ZZ**: Sequential number (01, 02, 03...)

### 2. Test Script (TS)
Located in: `/Documentation/Validation/08_OQ_OperationalQualification.md`

**Expected Structure:**
```markdown
## TS.X.Y-ZZ: Test Name

**Objective:** What this test validates
**Prerequisites:** 
- User role requirements
- System state requirements
**Test Steps:**
1. Action to perform
   - Expected Result: What should happen
2. Next action
   - Expected Result: What should happen
**Pass Criteria:** Overall success criteria
```




## Test Development Process

### Step 1: Review the Functional Specification
1. Locate the FS in the Requirements Specification document
2. Understand:
   - What functionality is being specified
   - The classification (Q/E/D)
   - Any linked requirements (RS IDs)

### Step 2: Create/Review the Test Script
1. Define clear test objectives based on the FS
2. Identify prerequisites (user roles, system state)
3. Write numbered test steps with expected results
4. Define pass/fail criteria
5. Identify where screenshots are needed (mark with SC)
6. When a test requires updating a value (e.g. company name), take screenshot, then add step to reload, and another step to confirm value persists and take another screenshot.



## Best Practices

### 1. Test Independence
- Each test should be able to run independently
- Use setup steps to ensure consistent starting state

### 2. Element Identification
- **Always** use data-testid attributes
- Follow naming convention: `component.subcomponent.element`
- Examples:
  ```
  loginPage.loginButton
  createDocumentDialog.documentNameInput
  lsb.nav-main.documents-newDocument
  documentEditor.toolbar.saveButton
  ```

### 3. Screenshot Guidelines
- Only take screenshots where marked with (SC) in test script
- Add delays before dialog/modal screenshots for animations
- Use consistent timestamp format
- Store in playwright-results directory

### 4. Error Handling
```typescript
// Handle optional elements
const categoryDropdown = dialog.getByTestId('createDocumentDialog.categoryDropdown');
const hasCategoryDropdown = await categoryDropdown.count() > 0;
if (hasCategoryDropdown) {
  await expect(categoryDropdown).toBeVisible();
}

// Handle authentication variations
try {
  const dontShowCheckbox = page.getByRole('checkbox', { name: 'Don\'t show this again' });
  await dontShowCheckbox.waitFor({ state: 'visible', timeout: 5000 });
  await dontShowCheckbox.check();
} catch (e) {
  console.log('No "Don\'t show this again" checkbox appeared');
}
```

### 5. Custom Reporter Integration
The custom reporter expects specific patterns:
- Test step titles matching the extraction pattern
- Screenshots with proper naming convention
- Test structure with test.step() blocks

### 6. Expected Results Mapping
In the custom reporter, map test procedures to expected results:
```typescript
const expectedResults: { [key: string]: string } = {
  'TS.7.1-01': 'Documents page loads.',
  'TS.7.1-02': '"Create New Document" button is visible.',
  'TS.7.1-03': 'Dialog window opens with document name field, external reference field, category dropdown, and file upload area',
  // Also map by procedure text for flexibility
  'With a User Manager role, navigate to Documents page': 'Documents page loads.',
  'Click "Create New Document" button': '"Create New Document" button is visible.',
  'Verify dialog appears': 'Dialog window opens with document name field, external reference field, category dropdown, and file upload area',
};
```

## Examples

### Example 1: Simple Navigation Test
**FS.5.1-01**: Navigate to Documents page
**TS.5.1-01**: Verify Documents page loads correctly

```typescript
await test.step('TS.5.1-01: Navigate to Documents page. (SC)', async () => {
  await page.goto('https://localhost:3030/documents');
  await page.waitForLoadState('networkidle');
  await expect(page).toHaveURL(/.*\/documents/);
  
  const timestamp = formatTimestamp(new Date());
  await page.screenshot({ 
    path: getScreenshotPath(`TS.5.1-01.SC.${timestamp}.png`) 
  });
});
```

### Example 2: Form Validation Test
**FS.6.1-02**: Document name validation
**TS.7.1-02**: Verify Create button enables only with valid document name

```typescript
await test.step('TS.7.1-02: Enter document name and verify button state.', async () => {
  const nameInput = page.getByTestId('createDocumentDialog.documentNameInput');
  const createButton = page.getByTestId('createDocumentDialog.createButton');
  
  // Verify initial state
  await expect(createButton).toBeDisabled();
  
  // Enter document name
  await nameInput.fill('Test Document');
  
  // Verify button enables
  await expect(createButton).toBeEnabled();
});
```

### Example 3: Complex Workflow Test
**FS.6.8-01**: Document signing workflow
**TS.6.8-01**: Complete document signing process

```typescript
await test.step('TS.6.8-01: Navigate to signature location.', async () => {
  await page.getByTestId('documentEditor.signatureField').click();
  await expect(page.getByTestId('signatureDialog')).toBeVisible();
});

await test.step('TS.6.8-02: Apply signature. (SC)', async () => {
  await page.getByTestId('signatureDialog.signButton').click();
  await page.waitForTimeout(1000); // Wait for signature to apply
  
  const timestamp = formatTimestamp(new Date());
  await page.screenshot({ 
    path: getScreenshotPath(`TS.6.8-02.SC.${timestamp}.png`) 
  });
});
```

## Configuration System

### Test Configuration Structure
Each test is defined in a JSON configuration file located in `/playwright/test-metadata/`. For example, `7-document-completion/7.1-create-new-document.json`:

```json
{
  "sectionId": "7.1",
  "sectionName": "Create New Document",
  "tests": [
    {
      "testId": "TS.7.1-01",
      "testName": "Create Document Dialog Display",
      "description": "Verify that the Create Document dialog opens correctly",
      "prerequisites": {
        "role": "User Manager",
        "state": ["Logged in", "On Documents page"]
      },
      "steps": [
        {
          "stepNumber": "01",
          "procedure": "With a User Manager role, navigate to Documents page. (SC)",
          "expectedResult": "Documents page loads.",
          "requiresScreenshot": true,
          "extractionPatterns": [
            "navigate to Documents page",
            "With a User Manager role, navigate to Documents page"
          ]
        }
      ]
    }
  ]
}
```

### Key Configuration Elements

1. **extractionPatterns**: Array of patterns to match test steps in Playwright output
2. **requiresScreenshot**: Boolean indicating if screenshot evidence is needed
3. **expectedResult**: What should happen (displayed in report)
4. **procedure**: The action to perform (must match test.step title)

## Complete Example: TS.7.1-01

### 1. Functional Specification (FS)
From `/Documentation/Validation/02_RS_RequirementsSpecification.md`:
```
| FS.6.1-01 | | Create Document button | Opens a dialog window containing document name, external reference, category selection, and file upload fields. | Q |
```

### 2. Test Script Definition
Based on the FS, we define 3 test steps:
1. Navigate to Documents page (with screenshot)
2. Click Create New Document button
3. Verify dialog appears (with screenshot)

### 3. Configuration File
Created `/playwright/test-metadata/7-document-completion/7.1-create-new-document.json` with the test definition

### 4. Playwright Implementation
Created `/playwright/tests/7_DocumentCompletion/7.1.CreateNewDocument/TS.7.1-01-CreateDocumentDialogDisplay.spec.ts`:

```typescript
test.describe('TS.7.1: Create New Document', () => {
  test('Create new document - button state validation', async ({ page }) => {
    // Setup steps (not reported)
    
    await test.step('With a User Manager role, navigate to Documents page. (SC)', async () => {
      // Implementation
      await page.screenshot({ 
        path: getScreenshotPath(`TS.7.1-01-01-${timestamp}.png`) 
      });
    });
  });
});
```

### 5. Screenshot Naming
Format: `TS.7.1-01-01-2025.06.12-04.08.39.png`
- `TS.7.1-01` - Test ID
- `01` - Step number
- `2025.06.12-04.08.39` - Timestamp

## Step-by-Step Guide for New Tests

### For TS.7.1-02 or Any New Test:

1. **Check the Functional Specification**
   - Find the FS in `/Documentation/Validation/02_RS_RequirementsSpecification.md`
   - Understand what functionality needs testing

2. **Update or Create Configuration File**
   - Open `/playwright/test-metadata/7-document-completion/7.1-create-new-document.json`
   - Add new test object to the `tests` array:
   ```json
   {
     "testId": "TS.7.1-02",
     "testName": "Document Name Validation",
     "description": "Verify Create button enables only with document name",
     "prerequisites": {
       "role": "User Manager",
       "state": ["Create Document dialog open"]
     },
     "steps": [
       {
         "stepNumber": "01",
         "procedure": "Verify Create Document button is initially disabled",
         "expectedResult": "Create Document button is disabled",
         "requiresScreenshot": false,
         "extractionPatterns": ["Verify Create Document button is initially disabled"]
       },
       {
         "stepNumber": "02",
         "procedure": "Enter document name",
         "expectedResult": "Create Document button becomes enabled",
         "requiresScreenshot": true,
         "extractionPatterns": ["Enter document name"]
       }
     ]
   }
   ```

3. **Create Playwright Test File**
   - Create file: `/playwright/tests/7_DocumentCompletion/7.1.CreateNewDocument/TS.7.1-02-DocumentNameValidation.spec.ts`
   - Use this structure:
   ```typescript
   import { test, expect } from '@playwright/test';
   import { getScreenshotPath } from '../../utils/paths';

   test.use({
     viewport: { height: 1080, width: 1920 },
     ignoreHTTPSErrors: true
   });

   test.describe('TS.7.1: Create New Document', () => {
     test('Document name validation', async ({ page }) => {
       // Setup: Login and navigate (not reported)
       // ... login code ...
       
       // Open Create Document dialog
       await page.getByTestId('lsb.nav-main.documents-newDocument').click();
       
       await test.step('Verify Create Document button is initially disabled', async () => {
         const createButton = page.getByTestId('createDocumentDialog.createDocumentButton');
         await expect(createButton).toBeDisabled();
       });
       
       await test.step('Enter document name', async () => {
         await page.getByTestId('createDocumentDialog.documentNameInput').fill('Test Document');
         const createButton = page.getByTestId('createDocumentDialog.createDocumentButton');
         await expect(createButton).toBeEnabled();
         
         const timestamp = formatTimestamp(new Date());
         await page.screenshot({ 
           path: getScreenshotPath(`TS.7.1-02-02-${timestamp}.png`) 
         });
       });
     });
   });
   ```

4. **Key Implementation Rules**
   - Use `test.describe('TS.7.1: Create New Document')` - the reporter extracts test ID from this
   - Each step must use `await test.step('exact procedure text from config', async () => {`
   - Screenshots only where `requiresScreenshot: true` in config
   - Screenshot naming: `TS.7.1-02-02-${timestamp}.png` (TestID-StepNum-Timestamp)
   - Use data-testid for element selection

5. **Run and Verify**
   ```bash
   npm run test -- tests/7_DocumentCompletion/7.1.CreateNewDocument/TS.7.1-02-DocumentNameValidation.spec.ts --reporter=./playwright/tests/utils/ts-custom-reporter-fixed.ts
   ```

## Checklist for New Test Development

- [ ] Review and understand the Functional Specification
- [ ] Add test definition to appropriate JSON config file
- [ ] Create test file with naming: `TS.X.Y-ZZ-DescriptiveName.spec.ts`
- [ ] Use `test.describe('TS.X.Y: Section Name')`
- [ ] Copy setup/login code from existing test
- [ ] Implement each step with `test.step()` matching config procedure
- [ ] Add screenshots with format: `TS.X.Y-ZZ-SS-timestamp.png`
- [ ] Use data-testid attributes for elements
- [ ] Run test and verify report shows correctly
- [ ] **Update run-all-7.DocumentCompletion-tests.sh** to include new test file
- [ ] Commit config file, test file, and updated script

## Important Notes for Current System

### Reporter Version
We are now using **ts-custom-reporter-v3.ts** which:
- Reads from JSON configuration files
- Groups test steps by test ID (TS.7.1-01, TS.7.1-02, etc.)
- Generates separate tables for each test
- Displays test names and descriptions from metadata

### Test ID Extraction
The reporter extracts the test ID from the `test.describe()` block, NOT from individual test names. Always use:
```typescript
test.describe('TS.X.Y: Section Name', () => {
```

### Screenshot Requirements
- Screenshots are taken only where marked with (SC) in the procedure or where `requiresScreenshot: true` in config
- Format: `TS.X.Y-ZZ-SS-timestamp.png` where:
  - X.Y = Section (e.g., 6.1)
  - ZZ = Test number (e.g., 01)
  - SS = Step number (e.g., 01)
  - timestamp = yyyy.mm.dd-hh.mm.ss

### Configuration Updates
When adding new tests, you must update the JSON configuration file BEFORE writing the Playwright test. The reporter relies on this configuration to:
- Match test steps
- Display expected results
- Determine screenshot requirements

## Running Tests

### Individual Test Execution
```bash
# Run specific test with custom reporter
npx playwright test tests/7_DocumentCompletion/7.1.CreateNewDocument/TS.7.1-01-CreateDocumentDialogDisplay.spec.ts --reporter=./playwright/tests/utils/ts-custom-reporter-v3.ts

# Run using npm script (if configured)
npm run test:ts:6.1
```

### Running Multiple Tests

#### Using the Script (Recommended)
```bash
# Run all 6.DocumentCompletion tests using the script
./run-all-7.DocumentCompletion-tests.sh
```

**Important**: When adding new tests, update the script's TEST_FILES array:
```bash
# Edit run-all-7.DocumentCompletion-tests.sh
TEST_FILES=(
    "playwright/tests/7_DocumentCompletion/7.1.CreateNewDocument/TS.7.1-01-CreateDocumentDialogDisplay.spec.ts"
    "playwright/tests/7_DocumentCompletion/7.1.CreateNewDocument/TS.7.1-02-DocumentNameInputValidation.spec.ts"
    # Add your new test here:
    "playwright/tests/7_DocumentCompletion/7.1.CreateNewDocument/TS.7.1-03-YourNewTest.spec.ts"
)
```

#### Manual Execution
```bash
# Run multiple specific tests
npx playwright test \
  playwright/tests/7_DocumentCompletion/7.1.CreateNewDocument/TS.7.1-01-CreateDocumentDialogDisplay.spec.ts \
  playwright/tests/7_DocumentCompletion/7.1.CreateNewDocument/TS.7.1-02-DocumentNameInputValidation.spec.ts \
  --reporter=./playwright/tests/utils/ts-custom-reporter-v3.ts

# Run all tests in a directory
npx playwright test playwright/tests/7_DocumentCompletion/7.1.CreateNewDocument/ --reporter=./playwright/tests/utils/ts-custom-reporter-v3.ts
```

### Debugging Tests
```bash
# Run with UI mode for debugging
npx playwright test --ui

# Run in headed mode to see browser
npx playwright test --headed
```

## Test Report Organization

### Report Structure
The custom reporter (ts-custom-reporter-v3.ts) generates an HTML report with the following structure:

```
Test Execution Report
├── Summary Statistics (Passed/Failed/Skipped/Total)
└── 7. Document Completion
    └── 7.1. Create New Document
        ├── TS.7.1-01 Create Document Dialog Display
        │   └── [Table with test steps 01, 02, 03]
        ├── TS.7.1-02 Document Name Input Validation
        │   └── [Table with test steps 01, 02, 03, 04, 05]
        └── TS.7.1-03 [Next Test]
            └── [Table with test steps]
```

Each test gets its own:
- **Header** with test ID and name (e.g., "TS.7.1-02 Document Name Input Validation")
- **Description** from the JSON metadata
- **Table** containing only that test's steps

### Report Location
The HTML report is generated at: `playwright/playwright-results/ts-test-report.html`

## Common Issues and Solutions

1. **"Coming soon..." appears instead of test results**
   - Check that test ID is properly extracted from `test.describe()`
   - Verify JSON configuration exists for the test
   - Ensure test ID in config matches the describe block

2. **Screenshots not appearing**
   - Check screenshot naming matches pattern: `TS.X.Y-ZZ-SS-timestamp.png`
   - Verify `requiresScreenshot: true` in config
   - Ensure screenshots are saved to `/playwright/playwright-results/`

3. **Expected results not showing correctly**
   - Verify procedure text in `test.step()` matches config exactly
   - Check extraction patterns in JSON configuration

4. **Tests mixed in one table instead of separate tables**
   - Ensure you're using ts-custom-reporter-v3.ts (not v2)
   - Check that test IDs are correctly extracted from test titles
   - Verify JSON metadata includes all tests

## Conclusion

This guide provides a structured approach to developing Playwright tests that maintain traceability from requirements through implementation. The configuration-driven approach allows for easy maintenance and scaling to hundreds of tests without modifying reporter code.