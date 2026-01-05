# OQ to Playwright Test Automation Guide

This guide explains how to convert Operational Qualification (OQ) test procedures into automated Playwright test scripts.

## Quick Reference

### Test ID Mapping
- **OQ Format**: `TS.X.Y-ZZ | Test Name`
- **File Path**: `/playwright/tests/X.SectionName/TS.X.Y-ZZ-TestName.spec.ts`
- **Test Title**: `test('TS.X.Y-ZZ Test Name', ...)`

### Step-by-Step Process

#### 1. Create Test File Structure
```typescript
import { test, expect } from '@playwright/test';
import * as dotenv from 'dotenv';
import { microsoftLogin, handleERSDDialog } from '../src/utils/microsoftLogin';
import { getScreenshotPath, formatTimestamp } from '../src/utils/screenshotUtils';

dotenv.config({ path: '.playwright.env' });

test.use({
  viewport: { height: 1080, width: 1920 },
  ignoreHTTPSErrors: true
});

test.setTimeout(120000); // 2 minutes

test('TS.X.Y-ZZ Test Description', async ({ page }) => {
  // Test implementation here
});
```

#### 2. Convert Test Procedure Steps

**OQ Format:**
```
Test Procedure:
1. Login as UserName (Role)
2. Navigate to specific page
3. Perform action (SC)
4. Verify result
```

**Playwright Implementation:**
```typescript
// Setup: Login (not counted as test step)
const email = process.env.MS_EMAIL_ORG_USERNAME!;
const password = process.env.MS_PASSWORD!;
await microsoftLogin(page, email, password);
await handleERSDDialog(page);

// Test Step 1: Navigate
await test.step('Navigate to specific page', async () => {
  await page.getByRole('button', { name: 'Menu' }).click();
  await page.getByRole('link', { name: 'Page Name' }).click();
});

// Test Step 2: Perform action with screenshot
await test.step('Perform action (SC)', async () => {
  // Action implementation
  await page.getByRole('button', { name: 'Action' }).click();
  
  // Screenshot for (SC) notation
  const timestamp = formatTimestamp(new Date());
  await page.screenshot({ 
    path: getScreenshotPath(`TS.X.Y-ZZ-2-${timestamp}.png`) 
  });
});
```

#### 3. Convert Expected Results to Assertions

**OQ Format:**
```
Expected Result:
1. Page loads successfully
2. Specific element is visible
3. Data displays correctly
```

**Playwright Implementation:**
```typescript
// Expected Results:
// 1. Page loads successfully ✓
await expect(page).toHaveURL(/.*\/expected-url/);

// 2. Specific element is visible ✓
await expect(page.getByText('Expected Text')).toBeVisible();

// 3. Data displays correctly ✓
await expect(page.getByRole('heading', { name: 'Expected Heading' })).toBeVisible();
```

## Key Patterns

### User Credentials
Environment variables follow this pattern:
- `MS_EMAIL_ORGCODE_FIRSTNAME_LASTNAME`
- `MS_PASSWORD` (shared across all users)

Example: `MS_EMAIL_17NJ5D_MEGAN_BOWEN`

### Screenshot Naming
- Format: `TS.X.Y-ZZ-StepNumber-YYYY.MM.DD-HH.MM.SS.png`
- Take screenshots where OQ shows `(SC)`
- Use `getScreenshotPath()` utility

### Element Selection Priority
1. Use `data-testid` when available
2. Use ARIA roles: `getByRole('button', { name: 'Text' })`
3. Use text content: `getByText('Exact Text')`
4. CSS selectors only as last resort

### Common Actions
```typescript
// Navigation
await page.getByRole('button', { name: 'Menu' }).click();
await page.getByRole('link', { name: 'Page Name' }).click();

// Form Input
await page.getByLabel('Field Name').fill('value');

// File Upload
const filePath = path.join(process.cwd(), 'playwright/tests/WordDocuments/filename.docx');
await page.setInputFiles('input[type="file"]', filePath);

// Waiting for Elements
await page.waitForSelector('[data-testid="element"]');
await expect(page.getByText('Loading')).not.toBeVisible();
```

## Quick Checklist

- [ ] Create test file with correct naming: `TS.X.Y-ZZ-TestName.spec.ts`
- [ ] Import required utilities and configure environment
- [ ] Map OQ test user to correct environment variable
- [ ] Convert each OQ procedure step to `test.step()`
- [ ] Add screenshots where OQ shows `(SC)`
- [ ] Convert expected results to Playwright assertions
- [ ] Run test and verify all steps pass

## Example Conversion

**OQ Test:**
```
TS.3.1-01 | View Account Details
Test Procedure:
1. Login as Megan Bowen (Trial Administrator)
2. Navigate to Account page
3. View company information (SC)
Expected Result:
- Account page displays
- Company name "Pharma 17NJ5D" is visible
```

**Playwright Test:**
```typescript
test('TS.3.1-01 View Account Details', async ({ page }) => {
  // Login
  const email = process.env.MS_EMAIL_17NJ5D_MEGAN_BOWEN!;
  const password = process.env.MS_PASSWORD!;
  await microsoftLogin(page, email, password);
  await handleERSDDialog(page);

  // Test Steps
  await test.step('Navigate to Account page', async () => {
    await page.getByRole('button', { name: 'Menu' }).click();
    await page.getByRole('link', { name: 'Account' }).click();
  });

  await test.step('View company information (SC)', async () => {
    const timestamp = formatTimestamp(new Date());
    await page.screenshot({ 
      path: getScreenshotPath(`TS.3.1-01-2-${timestamp}.png`) 
    });
  });

  // Expected Results
  await expect(page).toHaveURL(/.*\/account/);
  await expect(page.getByText('Pharma 17NJ5D')).toBeVisible();
});
```