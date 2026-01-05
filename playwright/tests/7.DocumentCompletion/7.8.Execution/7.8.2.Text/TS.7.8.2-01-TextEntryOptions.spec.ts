import { test, expect } from '@playwright/test';
import * as dotenv from 'dotenv';
import { microsoftLogin, handleERSDDialog } from '../../../src/utils/microsoftLogin';
import { getScreenshotPath, formatTimestamp } from '../../../src/utils/screenshotUtils';

dotenv.config({ path: '.playwright.env' });

test.use({
  viewport: { height: 1080, width: 1920 },
  ignoreHTTPSErrors: true
});

test.setTimeout(120000); // 2 minutes

test('TS.7.8.2-01 Text Entry Options', async ({ page }) => {
  // Login as an executor
  const email = process.env.MS_EMAIL_17NJ5D_DAVID_SEAGAL!;
  const password = process.env.MS_PASSWORD!;
  await microsoftLogin(page, email, password);
  await handleERSDDialog(page);

  // Test Steps
  await test.step('1. Click in cell', async () => {
    // Navigate to a document in Execution stage
    await page.getByRole('button', { name: 'Menu' }).click();
    await page.getByRole('link', { name: 'Documents' }).click();
    await page.waitForLoadState('networkidle');
    
    // Find and open a document in Execution stage
    await page.getByText('Execution').first().click();
    
    // Click on an editable cell in the document
    await page.locator('td[contenteditable="true"]').first().click();
  });

  await test.step('2. Popup shows', async () => {
    // Wait for text entry popup to appear
    await expect(page.getByRole('dialog', { name: 'Text Entry' })).toBeVisible();
  });

  await test.step('3. Quick buttons visible', async () => {
    // Verify quick entry buttons are visible
    await expect(page.getByRole('button', { name: 'Initials' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Current Date' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Current Time' })).toBeVisible();
  });

  await test.step('4. Custom text option', async () => {
    // Verify custom text input field is available
    await expect(page.getByPlaceholder('Enter custom text')).toBeVisible();
  });

  await test.step('5. Multiple choices (SC)', async () => {
    // Take screenshot showing all text entry options
    const timestamp = formatTimestamp(new Date());
    await page.screenshot({ 
      path: getScreenshotPath(`TS.7.8.2-01-5-${timestamp}.png`) 
    });
  });

  // Expected Results:
  // 1. Cell clicked ✓
  // 2. Popup appears ✓
  // 3. Buttons shown ✓
  // 4. Text field available ✓
  // 5. Options provided ✓
});