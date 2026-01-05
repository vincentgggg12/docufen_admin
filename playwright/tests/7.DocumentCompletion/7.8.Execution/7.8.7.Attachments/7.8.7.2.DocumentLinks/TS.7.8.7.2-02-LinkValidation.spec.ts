import { test, expect } from '@playwright/test';
import * as dotenv from 'dotenv';
import { microsoftLogin, handleERSDDialog } from '../../../../src/utils/microsoftLogin';
import { getScreenshotPath, formatTimestamp } from '../../../../src/utils/screenshotUtils';

dotenv.config({ path: '.playwright.env' });

test.use({
  viewport: { height: 1080, width: 1920 },
  ignoreHTTPSErrors: true
});

test.setTimeout(120000); // 2 minutes

test('TS.7.8.7.2-02 Link Validation', async ({ page }) => {
  // Login as an executor
  const email = process.env.MS_EMAIL_17NJ5D_DAVID_SEAGAL!;
  const password = process.env.MS_PASSWORD!;
  await microsoftLogin(page, email, password);
  await handleERSDDialog(page);

  // Test Steps
  await test.step('1. Try non-existent doc', async () => {
    // Navigate to a document in Execution stage
    await page.getByRole('button', { name: 'Menu' }).click();
    await page.getByRole('link', { name: 'Documents' }).click();
    await page.waitForLoadState('networkidle');
    
    // Find and open a document in Execution stage
    await page.getByText('Execution').first().click();
    
    // Click attachments button
    await page.getByRole('button', { name: 'Attachments' }).click();
    
    // Click link document option
    await page.getByRole('button', { name: 'Link Document' }).click();
    
    // Try to enter non-existent document ID
    await page.getByPlaceholder('Enter document ID').fill('INVALID-DOC-ID-12345');
    await page.getByRole('button', { name: 'Link' }).click();
  });

  await test.step('2. Not found error', async () => {
    // Verify error message appears
    await expect(page.getByText('Document not found')).toBeVisible();
  });

  await test.step('3. Try no-access doc', async () => {
    // Clear the field and try a document without access
    await page.getByPlaceholder('Enter document ID').clear();
    await page.getByPlaceholder('Enter document ID').fill('RESTRICTED-DOC-001');
    await page.getByRole('button', { name: 'Link' }).click();
  });

  await test.step('4. Permission denied', async () => {
    // Verify permission error message
    await expect(page.getByText(/permission|access denied/i)).toBeVisible();
  });

  await test.step('5. Validation works (SC)', async () => {
    // Take screenshot showing validation errors
    const timestamp = formatTimestamp(new Date());
    await page.screenshot({ 
      path: getScreenshotPath(`TS.7.8.7.2-02-5-${timestamp}.png`) 
    });
  });

  // Expected Results:
  // 1. Invalid ID ✓
  // 2. Error shown ✓
  // 3. No permission ✓
  // 4. Access denied ✓
  // 5. Properly validated ✓
});