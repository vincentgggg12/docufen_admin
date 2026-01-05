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

test('TS.7.8.9-04 Correction Marker', async ({ page }) => {
  // Login as David Seagal (initials DS)
  const email = process.env.MS_EMAIL_17NJ5D_DAVID_SEAGAL!;
  const password = process.env.MS_PASSWORD!;
  await microsoftLogin(page, email, password);
  await handleERSDDialog(page);

  // Test Steps
  await test.step('1. Make correction', async () => {
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
    
    // Enter correction
    await page.getByPlaceholder('Enter corrected text').fill('First correction');
    await page.getByPlaceholder('Enter reason').fill('Test correction 1');
    await page.getByRole('button', { name: 'Apply Correction' }).click();
  });

  await test.step('2. Superscript added', async () => {
    // Look for superscript marker
    const superscript = page.locator('sup').filter({ hasText: /\*\d+DS/ });
    await expect(superscript).toBeVisible();
  });

  await test.step('3. Shows "*1DS"', async () => {
    // Verify first correction shows *1DS
    await expect(page.locator('sup').filter({ hasText: '*1DS' })).toBeVisible();
  });

  await test.step('4. Counter increments', async () => {
    // Make another correction
    const secondText = page.locator('td').filter({ hasText: /\w+/ }).nth(1);
    await secondText.dblclick();
    
    await page.mouse.click(0, 0, { button: 'right' });
    await page.getByText('Make Correction').click();
    
    await page.getByPlaceholder('Enter corrected text').fill('Second correction');
    await page.getByPlaceholder('Enter reason').fill('Test correction 2');
    await page.getByRole('button', { name: 'Apply Correction' }).click();
    
    // Verify second correction shows *2DS
    await expect(page.locator('sup').filter({ hasText: '*2DS' })).toBeVisible();
  });

  await test.step('5. Traceable (SC)', async () => {
    // Take screenshot showing numbered correction markers
    const timestamp = formatTimestamp(new Date());
    await page.screenshot({ 
      path: getScreenshotPath(`TS.7.8.9-04-5-${timestamp}.png`) 
    });
  });

  // Expected Results:
  // 1. Corrected ✓
  // 2. Marker appears ✓
  // 3. *1DS shown ✓
  // 4. Next is *2DS ✓
  // 5. Numbered tracking ✓
});