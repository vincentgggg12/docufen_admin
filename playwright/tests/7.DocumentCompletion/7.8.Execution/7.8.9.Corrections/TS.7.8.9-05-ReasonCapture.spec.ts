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

test('TS.7.8.9-05 Reason Capture', async ({ page }) => {
  // Login as an executor
  const email = process.env.MS_EMAIL_17NJ5D_DAVID_SEAGAL!;
  const password = process.env.MS_PASSWORD!;
  await microsoftLogin(page, email, password);
  await handleERSDDialog(page);

  // Test Steps
  await test.step('1. Correction dialog', async () => {
    // Navigate to a document in Execution stage
    await page.getByRole('button', { name: 'Menu' }).click();
    await page.getByRole('link', { name: 'Documents' }).click();
    await page.waitForLoadState('networkidle');
    
    // Find and open a document in Execution stage
    await page.getByText('Execution').first().click();
    
    // Select text to correct
    const textToCorrect = page.locator('td').filter({ hasText: /\w+/ }).first();
    await textToCorrect.dblclick();
    
    // Right-click and select correction
    await page.mouse.click(0, 0, { button: 'right' });
    await page.getByText('Make Correction').click();
    
    // Verify correction dialog appears
    await expect(page.getByRole('dialog', { name: 'Make Correction' })).toBeVisible();
  });

  await test.step('2. Reason required', async () => {
    // Try to submit without reason
    await page.getByPlaceholder('Enter corrected text').fill('Fixed text');
    await page.getByRole('button', { name: 'Apply Correction' }).click();
    
    // Should show validation error
    await expect(page.getByText('Reason is required')).toBeVisible();
  });

  await test.step('3. Enter "Typo fix"', async () => {
    // Enter reason
    await page.getByPlaceholder('Enter reason').fill('Typo fix');
  });

  await test.step('4. Reason saved', async () => {
    // Apply correction
    await page.getByRole('button', { name: 'Apply Correction' }).click();
    
    // Dialog should close
    await expect(page.getByRole('dialog', { name: 'Make Correction' })).not.toBeVisible();
  });

  await test.step('5. Documented (SC)', async () => {
    // Open audit log to verify reason was captured
    await page.getByRole('button', { name: 'Audit' }).click();
    
    // Look for correction entry with reason
    await expect(page.getByText('Typo fix')).toBeVisible();
    
    // Take screenshot showing reason in audit
    const timestamp = formatTimestamp(new Date());
    await page.screenshot({ 
      path: getScreenshotPath(`TS.7.8.9-05-5-${timestamp}.png`) 
    });
  });

  // Expected Results:
  // 1. Dialog shown ✓
  // 2. Field empty ✓
  // 3. Reason entered ✓
  // 4. Stored ✓
  // 5. Reason recorded ✓
});