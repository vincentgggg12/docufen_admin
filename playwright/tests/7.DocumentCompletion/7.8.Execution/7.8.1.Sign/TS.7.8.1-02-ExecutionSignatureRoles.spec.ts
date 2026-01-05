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

test('TS.7.8.1-02 Execution Signature Roles', async ({ page }) => {
  // Login as an executor
  const email = process.env.MS_EMAIL_17NJ5D_DAVID_SEAGAL!;
  const password = process.env.MS_PASSWORD!;
  await microsoftLogin(page, email, password);
  await handleERSDDialog(page);

  // Test Steps
  await test.step('1. Click sign', async () => {
    // Navigate to a document in Execution stage
    await page.getByRole('button', { name: 'Menu' }).click();
    await page.getByRole('link', { name: 'Documents' }).click();
    await page.waitForLoadState('networkidle');
    
    // Find and open a document in Execution stage
    await page.getByText('Execution').first().click();
    
    // Click sign button
    await page.getByRole('button', { name: 'Sign' }).click();
  });

  await test.step('2. See execution roles', async () => {
    // Wait for sign dialog to appear
    await expect(page.getByRole('dialog', { name: 'Sign Document' })).toBeVisible();
  });

  await test.step('3. "Performed By" shown', async () => {
    // Verify Performed By option is available
    await expect(page.getByLabel('Performed By')).toBeVisible();
  });

  await test.step('4. "Verified By" available', async () => {
    // Verify Verified By option is available
    await expect(page.getByLabel('Verified By')).toBeVisible();
  });

  await test.step('5. Execution specific (SC)', async () => {
    // Take screenshot showing execution-specific roles
    const timestamp = formatTimestamp(new Date());
    await page.screenshot({ 
      path: getScreenshotPath(`TS.7.8.1-02-5-${timestamp}.png`) 
    });
  });

  // Expected Results:
  // 1. Sign clicked ✓
  // 2. Roles displayed ✓
  // 3. Performed option ✓
  // 4. Verified option ✓
  // 5. Stage appropriate ✓
});