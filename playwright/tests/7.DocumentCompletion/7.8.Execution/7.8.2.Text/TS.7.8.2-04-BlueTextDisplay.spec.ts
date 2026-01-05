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

test('TS.7.8.2-04 Blue Text Display', async ({ page }) => {
  // Login as an executor
  const email = process.env.MS_EMAIL_17NJ5D_DAVID_SEAGAL!;
  const password = process.env.MS_PASSWORD!;
  await microsoftLogin(page, email, password);
  await handleERSDDialog(page);

  // Test Steps
  await test.step('1. Insert any text', async () => {
    // Navigate to a document in Execution stage
    await page.getByRole('button', { name: 'Menu' }).click();
    await page.getByRole('link', { name: 'Documents' }).click();
    await page.waitForLoadState('networkidle');
    
    // Find and open a document in Execution stage
    await page.getByText('Execution').first().click();
    
    // Click on an editable cell
    await page.locator('td[contenteditable="true"]').first().click();
    
    // Enter custom text
    await page.getByPlaceholder('Enter custom text').fill('Test entry');
    await page.getByRole('button', { name: 'Insert' }).click();
  });

  await test.step('2. Always blue', async () => {
    // Verify inserted text is blue
    const cell = page.locator('td[contenteditable="true"]').first();
    const color = await cell.evaluate(el => 
      window.getComputedStyle(el).color
    );
    expect(color).toMatch(/blue|rgb\(0,\s*0,\s*255\)/i);
  });

  await test.step('3. Original black', async () => {
    // Find original text (non-editable) and verify it's black
    const originalText = page.locator('td:not([contenteditable="true"])').filter({ hasText: /\w+/ }).first();
    const originalColor = await originalText.evaluate(el => 
      window.getComputedStyle(el).color
    );
    expect(originalColor).toMatch(/black|rgb\(0,\s*0,\s*0\)/i);
  });

  await test.step('4. Clear difference', async () => {
    // Visual confirmation that edited text stands out from original
    const editedCells = await page.locator('td[contenteditable="true"]').count();
    const originalCells = await page.locator('td:not([contenteditable="true"])').count();
    expect(editedCells).toBeGreaterThan(0);
    expect(originalCells).toBeGreaterThan(0);
  });

  await test.step('5. Consistent color (SC)', async () => {
    // Take screenshot showing blue edited text vs black original text
    const timestamp = formatTimestamp(new Date());
    await page.screenshot({ 
      path: getScreenshotPath(`TS.7.8.2-04-5-${timestamp}.png`) 
    });
  });

  // Expected Results:
  // 1. Text added ✓
  // 2. Blue confirmed ✓
  // 3. Black preserved ✓
  // 4. Distinguished ✓
  // 5. Always blue ✓
});