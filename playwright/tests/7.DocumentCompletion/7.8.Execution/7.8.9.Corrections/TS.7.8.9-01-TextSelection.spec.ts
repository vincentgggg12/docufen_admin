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

test('TS.7.8.9-01 Text Selection', async ({ page }) => {
  // Login as an executor
  const email = process.env.MS_EMAIL_17NJ5D_DAVID_SEAGAL!;
  const password = process.env.MS_PASSWORD!;
  await microsoftLogin(page, email, password);
  await handleERSDDialog(page);

  // Test Steps
  await test.step('1. Select wrong text', async () => {
    // Navigate to a document in Execution stage
    await page.getByRole('button', { name: 'Menu' }).click();
    await page.getByRole('link', { name: 'Documents' }).click();
    await page.waitForLoadState('networkidle');
    
    // Find and open a document in Execution stage
    await page.getByText('Execution').first().click();
    
    // Find text that needs correction and select it
    const textToCorrect = page.locator('td').filter({ hasText: /\w+/ }).first();
    await textToCorrect.dblclick(); // Double-click to select text
  });

  await test.step('2. Highlight works', async () => {
    // Verify text is highlighted
    const selection = await page.evaluate(() => window.getSelection()?.toString());
    expect(selection).toBeTruthy();
  });

  await test.step('3. Right-click menu', async () => {
    // Right-click on selected text
    await page.mouse.click(0, 0, { button: 'right' });
    
    // Wait for context menu
    await page.waitForTimeout(500);
  });

  await test.step('4. Correction option', async () => {
    // Look for correction option in context menu
    await expect(page.getByText('Make Correction')).toBeVisible();
  });

  await test.step('5. Can select text (SC)', async () => {
    // Take screenshot showing correction option
    const timestamp = formatTimestamp(new Date());
    await page.screenshot({ 
      path: getScreenshotPath(`TS.7.8.9-01-5-${timestamp}.png`) 
    });
  });

  // Expected Results:
  // 1. Text selected ✓
  // 2. Highlighted ✓
  // 3. Menu appears ✓
  // 4. Option shown ✓
  // 5. Selection works ✓
});