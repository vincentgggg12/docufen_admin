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

test('TS.7.8.11-01 Late Entry Toggle', async ({ page }) => {
  // Login as an executor
  const email = process.env.MS_EMAIL_17NJ5D_DAVID_SEAGAL!;
  const password = process.env.MS_PASSWORD!;
  await microsoftLogin(page, email, password);
  await handleERSDDialog(page);

  // Test Steps
  await test.step('1. Find late entry checkbox', async () => {
    // Navigate to a document in Execution stage
    await page.getByRole('button', { name: 'Menu' }).click();
    await page.getByRole('link', { name: 'Documents' }).click();
    await page.waitForLoadState('networkidle');
    
    // Find and open a document in Execution stage
    await page.getByText('Execution').first().click();
    
    // Look for late entry checkbox
    await expect(page.getByLabel('Late Entry')).toBeVisible();
  });

  await test.step('2. Check to enable', async () => {
    // Check the late entry checkbox
    await page.getByLabel('Late Entry').check();
  });

  await test.step('3. Date picker appears', async () => {
    // Verify date picker is shown
    await expect(page.getByLabel('Select date and time')).toBeVisible();
  });

  await test.step('4. Reason field shown', async () => {
    // Verify reason field is displayed
    await expect(page.getByPlaceholder('Enter reason for late entry')).toBeVisible();
  });

  await test.step('5. Mode activated (SC)', async () => {
    // Take screenshot showing late entry mode activated
    const timestamp = formatTimestamp(new Date());
    await page.screenshot({ 
      path: getScreenshotPath(`TS.7.8.11-01-5-${timestamp}.png`) 
    });
  });

  // Expected Results:
  // 1. Checkbox found ✓
  // 2. Checked ✓
  // 3. Calendar shown ✓
  // 4. Reason required ✓
  // 5. Late mode on ✓
});