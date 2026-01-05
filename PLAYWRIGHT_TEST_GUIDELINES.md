# Docufen Playwright Test Development Guidelines

This guide provides comprehensive instructions for developing and maintaining Playwright tests for the Docufen application, with specific focus on the custom HTML reporting system and the 7 Themes (Login, Setup Wizard, Account, Users, Documents, DocumentCompletion) test suite.

## Table of Contents
1. [Project Structure](#project-structure)
2. [Environment Setup](#environment-setup)
3. [Authentication and Login](#authentication-and-login)
4. [Test Development Standards](#test-development-standards)
5. [Custom HTML Report System](#custom-html-report-system)
6. [Document Upload Process](#document-upload-process)
7. [Running Tests](#running-tests)
8. [Adding New Tests](#adding-new-tests)
9. [Best Practices](#best-practices)

## Project Structure

```
playwright/
├── configs/                      # Configuration files for different test scenarios
├── tests/                       # Test specifications
│   ├── 1.Login/  # Theme 1 tests
│   ├── 2.SetupWizard/  # Theme 2 tests
│   ├── 3.Account/ # Theme 3 tests
│   ├── 4.Users/  # Theme 4 tests
│   ├── 5.Documents/ # Theme 5 tests
│   ├── 6.Documents/  # Theme 6 tests
│   ├── 7.DocumentCompletion/    # Theme 7 tests
│   │   └── 7.1.CreateNewDocument/
│   │       ├── TS.7.1-01-CreateDocumentDialogDisplay.spec.ts
│   │       └── TS.7.1-02-DocumentNameInputValidation.spec.ts
│   ├── utils/                   # Shared utilities
│   │   ├── msLogin.ts          # Microsoft login helper
│   │   ├── ersd-handler.ts     # ERSD dialog handler
│   │   ├── paths.ts            # Path utilities
│   │   └── ts-custom-reporter-fixed.ts
│   └── WordDocuments/          # Test documents for upload
```

## Environment Setup

### 1. Environment Variables (.playwright.env)

The project uses a `.playwright.env` file containing test account credentials:

```env
# Password for all test users
MS_PASSWORD='NoMorePaper88'

# Organisation: Pharma 17NJ5D
MS_EMAIL_17NJ5D_PATTI_FERNANDEZ='pattif@17nj5d.onmicrosoft.com'
MS_EMAIL_17NJ5D_GRADY_ARCHIE='GradyA@17nj5d.onmicrosoft.com'
MS_EMAIL_17NJ5D_MEGAN_BOWEN='MeganB@17nj5d.onmicrosoft.com'
# ... more users

# Organisation: Biotech XMWKB
MS_EMAIL_XMWKB_AMELIA_CHEN='amelia@xmwkb.onmicrosoft.com'
MS_EMAIL_XMWKB_JULIA_SMITH='julia@xmwkb.onmicrosoft.com'
# ... more users
```

### 2. Base URL Configuration

The base URL is configured in `playwright.config.ts`:
- Local development: `https://localhost:3030`
- Production: `https://app.docufen.com`

## Authentication and Login

### Microsoft Login Utility (msLogin.ts)

The project includes a robust Microsoft login helper that handles:
- Microsoft SSO authentication flow
- Optional "Stay signed in?" prompts
- Microsoft permissions dialogs
- ERSD (Electronic Records and Signature Disclosure) consent
- Invitation acceptance for new users

#### Basic Usage:
```typescript
import { microsoftLogin } from './utils/msLogin';
import { handleERSDDialog } from './utils/ersd-handler';

// In your test
await microsoftLogin(page, process.env.MS_EMAIL_17NJ5D_GRADY_ARCHIE!, process.env.MS_PASSWORD!);
await handleERSDDialog(page);
```

#### Key Features:
1. **Automatic navigation** to Microsoft login
2. **Error handling** for various Microsoft UI variations
3. **Screenshot capture** at key points for debugging
4. **Permissions handling** for first-time users
5. **Flexible URL matching** for post-login redirects

### ERSD Handler

The ERSD dialog appears for users who haven't accepted the electronic signature terms:

```typescript
await handleERSDDialog(page);
```

This function:
- Checks if the dialog is present
- Checks the consent checkbox
- Clicks "I Agree"
- Verifies the dialog dismissal

## Test Development Standards

### Test File Naming Convention

```
TS.[Section].[Subsection]-[TestNumber]-[TestName].spec.ts
```

Example: `TS.7.1-01-CreateDocumentDialogDisplay.spec.ts`

### Test Structure Template

```typescript
import { test, expect } from '@playwright/test';
import { getScreenshotPath } from '../../utils/paths';
import { microsoftLogin } from '../../utils/msLogin';
import { handleERSDDialog } from '../../utils/ersd-handler';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.playwright.env' });

test.use({
  viewport: { height: 1080, width: 1920 },
  ignoreHTTPSErrors: true
});

test('TS.7.1-01 Create Document Dialog Display', async ({ page }) => {
    // Setup: Login (not reported as test step)
    const email = process.env.MS_EMAIL_17NJ5D_GRADY_ARCHIE!;
    const password = process.env.MS_PASSWORD!;
    await microsoftLogin(page, email, password);
    await handleERSDDialog(page);

    // Test Step 1
    await test.step('Step description here (SC)', async () => {
        // Test implementation
        
        // Take screenshot for steps marked with (SC)
        const timestamp = formatTimestamp(new Date());
        await page.screenshot({ 
            path: getScreenshotPath(`TS.7.1-01-01-${timestamp}.png`) 
        });
    });

    // Additional steps...
});

function formatTimestamp(date: Date): string {
    return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}-${String(date.getHours()).padStart(2, '0')}.${String(date.getMinutes()).padStart(2, '0')}.${String(date.getSeconds()).padStart(2, '0')}`;
}
```

### Key Conventions:

1. **Test Steps**: Use `test.step()` for each procedural step
2. **Screenshots**: Mark screenshot steps with `(SC)` in the step description
3. **Screenshot Naming**: `TS.[TestID]-[StepNumber]-[Timestamp].png`
4. **Assertions**: Use expect() for all verifications
5. **Timeouts**: Set appropriate timeouts for operations



## Document Upload Process

### Bypassing System File Dialogs

The tests bypass system file dialogs to avoid OS-specific issues:

```typescript
// Make file input visible
await page.evaluate(() => {
    const inputs = document.querySelectorAll('input[type="file"]');
    for (const input of inputs) {
        (input as HTMLElement).style.opacity = '1';
        (input as HTMLElement).style.visibility = 'visible';
        (input as HTMLElement).style.display = 'block';
        (input as HTMLElement).style.position = 'relative';
    }
});

// Set file directly
const filePath = path.join(process.cwd(), 'playwright/tests/WordDocuments/Docufen Testing Document v0._EN.docx');
await page.setInputFiles('input[type="file"]', filePath);

// Wait for upload processing
await page.waitForTimeout(3000);
```

### Available Test Documents

Test documents are stored in `playwright/tests/WordDocuments/`:
- `Demo Doc v8.5_EN_Any GxP Doc_.docx`
- `Docufen Testing Document v0._EN.docx`
- `Docufen Testing Document v0.1_EN.docx`

## Running Tests

### Individual Test Execution

```bash
# Run a specific test
npx playwright test playwright/tests/6_DocumentCompletion/7.1.CreateNewDocument/TS.7.1-01*.spec.ts

# Run with custom reporter
npx playwright test --reporter=./playwright/tests/utils/ts-custom-reporter-fixed.ts

# Run in headed mode
npx playwright test --headed

# Run in UI mode
npx playwright test --ui
```



## Adding New Tests

### Step-by-Step Process

1. **Create Test Specification**
   ```bash
   # Create new test file following naming convention
   touch playwright/tests/7_DocumentCompletion/7.2.CreatePracticeDocument/TS.7.2-01-PracticeDocumentCreation.spec.ts
   ```


## Best Practices

### 1. Reliable Selectors

Prioritise selectors in this order:
1. `data-testid` attributes (most reliable)
2. ARIA roles with specific names
3. Text content (for user-visible elements)
4. CSS selectors (last resort)

Example:
```typescript
// Good
await page.getByTestId('createDocumentDialog.documentNameInput').fill('Test');

// Acceptable
await page.getByRole('button', { name: 'Create Document' }).click();

// Avoid if possible
await page.locator('.document-name-input').fill('Test');
```

### 2. Wait Strategies

```typescript
// Wait for specific elements
await page.waitForSelector('[data-testid="documents-table"]', { state: 'visible' });

// Wait for network idle after navigation
await page.waitForLoadState('networkidle');

// Use explicit waits for async operations
await page.waitForTimeout(3000); // Only when necessary
```

### 3. Error Handling

```typescript
try {
    await page.getByRole('button', { name: 'Submit' }).click();
} catch (error) {
    // Take debug screenshot
    await page.screenshot({ path: getScreenshotPath('error-state.png') });
    throw error; // Re-throw to fail test
}
```

### 4. Test Data Management

- Use environment variables for credentials
- Create unique test data for each run
- Clean up test data after execution
- Use meaningful names for test documents/users

### 5. Screenshot Best Practices

- Take screenshots at key verification points
- Use descriptive filenames with timestamps
- Include element state in screenshots
- Capture error states for debugging

### 6. Maintenance


- Review and update selectors when UI changes
- Document any workarounds or special cases
- Maintain the extraction patterns for proper reporting

## Troubleshooting

### Common Issues and Solutions

1. **Login Failures**
   - Verify credentials in `.playwright.env`
   - Check for Microsoft UI changes
   - Review screenshots in `results/` folder

2. **File Upload Issues**
   - Ensure file paths are correct
   - Verify file input is made visible
   - Check for upload size limits

3. **Report Generation**
   - Verify test metadata files exist
   - Check extraction patterns match step descriptions
   - Ensure proper test ID format

4. **Flaky Tests**
   - Add appropriate wait conditions
   - Use more specific selectors
   - Increase timeouts for slow operations

## Future Enhancements

1. **Parallel Execution** - Configure test sharding for faster runs
2. **CI/CD Integration** - Add GitHub Actions workflows
3. **Visual Testing** - Implement screenshot comparison
4. **Performance Metrics** - Add timing measurements to reports
5. **Test Data Factory** - Create utilities for dynamic test data generation

---

For questions or improvements to this guide, please contact the QA team or submit a pull request with your suggestions.