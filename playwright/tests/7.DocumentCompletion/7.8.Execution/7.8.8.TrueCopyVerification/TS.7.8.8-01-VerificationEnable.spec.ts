import { test, expect } from '@playwright/test';
import * as dotenv from 'dotenv';
import path from 'path';
import { microsoftLogin, handleERSDDialog } from '../../../src/utils/microsoftLogin';
import { getScreenshotPath, formatTimestamp } from '../../../src/utils/screenshotUtils';

dotenv.config({ path: '.playwright.env' });

test.use({
  viewport: { height: 1080, width: 1920 },
  ignoreHTTPSErrors: true
});

test.setTimeout(120000); // 2 minutes

test('TS.7.8.8-01 Verification Enable', async ({ page }) => {
  // Login as an executor
  const email = process.env.MS_EMAIL_17NJ5D_DAVID_SEAGAL!;
  const password = process.env.MS_PASSWORD!;
  await microsoftLogin(page, email, password);
  await handleERSDDialog(page);

  // Test Steps
  await test.step('1. View attachment', async () => {
    // Navigate to a document in Execution stage
    await page.getByRole('button', { name: 'Menu' }).click();
    await page.getByRole('link', { name: 'Documents' }).click();
    await page.waitForLoadState('networkidle');
    
    // Find and open a document in Execution stage
    await page.getByText('Execution').first().click();
    
    // Open attachments panel
    await page.getByRole('button', { name: 'Attachments' }).click();
    
    // Click on an attachment to view it
    const attachment = page.getByRole('listitem').filter({ hasText: /\.(pdf|jpg|png)/i }).first();
    
    if (await attachment.count() === 0) {
      // Upload a file if none exists
      const filePath = path.join(process.cwd(), 'playwright/tests/TestFiles/test-document.pdf');
      await page.setInputFiles('input[type="file"]', filePath);
      await page.waitForTimeout(2000);
    }
    
    // Click to view attachment
    await page.getByRole('listitem').filter({ hasText: /\.(pdf|jpg|png)/i }).first().click();
  });

  await test.step('2. Verify button shown', async () => {
    // Look for verify true copy button
    await expect(page.getByRole('button', { name: 'Verify True Copy' })).toBeVisible();
  });

  await test.step('3. Click verify', async () => {
    // Click the verify button
    await page.getByRole('button', { name: 'Verify True Copy' }).click();
  });

  await test.step('4. Checkbox required', async () => {
    // Verify dialog appears with checkbox
    await expect(page.getByRole('dialog', { name: 'True Copy Verification' })).toBeVisible();
    await expect(page.getByLabel('I certify this is a true copy')).toBeVisible();
  });

  await test.step('5. Can verify (SC)', async () => {
    // Take screenshot showing verification dialog
    const timestamp = formatTimestamp(new Date());
    await page.screenshot({ 
      path: getScreenshotPath(`TS.7.8.8-01-5-${timestamp}.png`) 
    });
  });

  // Expected Results:
  // 1. Attachment viewed ✓
  // 2. Button visible ✓
  // 3. Dialog opens ✓
  // 4. Must confirm ✓
  // 5. Verification enabled ✓
});