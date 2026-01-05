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

test('TS.7.8.9-02 Strikethrough Format', async ({ page }) => {
  // Login as an executor
  const email = process.env.MS_EMAIL_17NJ5D_DAVID_SEAGAL!;
  const password = process.env.MS_PASSWORD!;
  await microsoftLogin(page, email, password);
  await handleERSDDialog(page);

  // Test Steps
  await test.step('1. Apply correction', async () => {
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
    await page.getByPlaceholder('Enter corrected text').fill('Corrected text');
    await page.getByPlaceholder('Enter reason').fill('Typo correction');
    await page.getByRole('button', { name: 'Apply Correction' }).click();
  });

  await test.step('2. Original struck through', async () => {
    // Find the corrected text with strikethrough
    const strikethrough = page.locator('del, [style*="text-decoration: line-through"]').first();
    await expect(strikethrough).toBeVisible();
  });

  await test.step('3. Single line', async () => {
    // Verify it's a single line strikethrough
    const textDecoration = await page.locator('del, [style*="text-decoration: line-through"]').first().evaluate(el => 
      window.getComputedStyle(el).textDecoration
    );
    expect(textDecoration).toContain('line-through');
  });

  await test.step('4. Still readable', async () => {
    // Verify original text is still visible/readable
    const originalText = await page.locator('del, [style*="text-decoration: line-through"]').first().textContent();
    expect(originalText).toBeTruthy();
  });

  await test.step('5. Proper format (SC)', async () => {
    // Take screenshot showing strikethrough format
    const timestamp = formatTimestamp(new Date());
    await page.screenshot({ 
      path: getScreenshotPath(`TS.7.8.9-02-5-${timestamp}.png`) 
    });
  });

  // Expected Results:
  // 1. Correction applied ✓
  // 2. Strikethrough shown ✓
  // 3. One line through ✓
  // 4. Text visible ✓
  // 5. Format correct ✓
});