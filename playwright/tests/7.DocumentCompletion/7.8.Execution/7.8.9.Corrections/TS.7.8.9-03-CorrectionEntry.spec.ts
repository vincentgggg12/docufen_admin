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

test('TS.7.8.9-03 Correction Entry', async ({ page }) => {
  // Login as an executor
  const email = process.env.MS_EMAIL_17NJ5D_DAVID_SEAGAL!;
  const password = process.env.MS_PASSWORD!;
  await microsoftLogin(page, email, password);
  await handleERSDDialog(page);

  // Test Steps
  await test.step('1. Enter corrected text', async () => {
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
    
    // Enter corrected text
    await page.getByPlaceholder('Enter corrected text').fill('Corrected value');
    await page.getByPlaceholder('Enter reason').fill('Error in original');
    await page.getByRole('button', { name: 'Apply Correction' }).click();
  });

  await test.step('2. Shows in brackets', async () => {
    // Look for corrected text in brackets
    const correctedText = page.locator('text=/\\[Corrected value\\]/');
    await expect(correctedText).toBeVisible();
  });

  await test.step('3. After strikethrough', async () => {
    // Verify corrected text appears after strikethrough
    const correctionElement = page.locator('del + span, del + [class*="correction"]');
    await expect(correctionElement).toBeVisible();
  });

  await test.step('4. Blue color', async () => {
    // Verify corrected text is blue
    const correctedText = page.locator('text=/\\[Corrected value\\]/');
    const color = await correctedText.evaluate(el => 
      window.getComputedStyle(el).color
    );
    expect(color).toMatch(/blue|rgb\(0,\s*0,\s*255\)/i);
  });

  await test.step('5. Clear correction (SC)', async () => {
    // Take screenshot showing correction with brackets and blue color
    const timestamp = formatTimestamp(new Date());
    await page.screenshot({ 
      path: getScreenshotPath(`TS.7.8.9-03-5-${timestamp}.png`) 
    });
  });

  // Expected Results:
  // 1. Text entered ✓
  // 2. [corrected text] ✓
  // 3. Positioned after ✓
  // 4. Blue font ✓
  // 5. Visible correction ✓
});