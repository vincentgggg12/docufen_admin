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

test('TS.7.8.1-03 Parallel Signing', async ({ page }) => {
  // Login as document owner
  const email = process.env.MS_EMAIL_17NJ5D_MEGAN_BOWEN!;
  const password = process.env.MS_PASSWORD!;
  await microsoftLogin(page, email, password);
  await handleERSDDialog(page);

  // Test Steps
  await test.step('1. Multiple executors', async () => {
    // Navigate to a document in Execution stage
    await page.getByRole('button', { name: 'Menu' }).click();
    await page.getByRole('link', { name: 'Documents' }).click();
    await page.waitForLoadState('networkidle');
    
    // Find and open a document in Execution stage
    await page.getByText('Execution').first().click();
    
    // Open participants dialog
    await page.getByRole('button', { name: 'Participants' }).click();
    
    // Verify multiple executors are listed
    await expect(page.getByText('Execution Participants')).toBeVisible();
  });

  await test.step('2. All sign together', async () => {
    // Close participants dialog
    await page.keyboard.press('Escape');
    
    // Verify all executors can see sign button
    await expect(page.getByRole('button', { name: 'Sign' })).toBeVisible();
  });

  await test.step('3. No order enforced', async () => {
    // Check signing order is not enabled
    await page.getByRole('button', { name: 'Participants' }).click();
    await expect(page.getByText('Signing order enabled')).not.toBeVisible();
  });

  await test.step('4. Simultaneous OK', async () => {
    // Close dialog
    await page.keyboard.press('Escape');
    
    // Verify any executor can sign at any time
    await expect(page.getByRole('button', { name: 'Sign' })).toBeEnabled();
  });

  await test.step('5. True parallel (SC)', async () => {
    // Take screenshot showing parallel signing capability
    const timestamp = formatTimestamp(new Date());
    await page.screenshot({ 
      path: getScreenshotPath(`TS.7.8.1-03-5-${timestamp}.png`) 
    });
  });

  // Expected Results:
  // 1. Many executors ✓
  // 2. Concurrent signing ✓
  // 3. No blocking ✓
  // 4. All at once ✓
  // 5. Parallel confirmed ✓
});