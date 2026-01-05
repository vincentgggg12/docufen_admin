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

test('TS.7.8.12-01 Automatic Cell Expansion', async ({ page }) => {
  // Login as an executor
  const email = process.env.MS_EMAIL_17NJ5D_DAVID_SEAGAL!;
  const password = process.env.MS_PASSWORD!;
  await microsoftLogin(page, email, password);
  await handleERSDDialog(page);

  const longText = 'This is a very long text entry that should cause the cell to expand automatically to accommodate all the content without truncation. The cell should grow in height to display all of this text clearly and completely.';

  // Test Steps
  await test.step('1. Enter long text', async () => {
    // Navigate to a document in Execution stage
    await page.getByRole('button', { name: 'Menu' }).click();
    await page.getByRole('link', { name: 'Documents' }).click();
    await page.waitForLoadState('networkidle');
    
    // Find and open a document in Execution stage
    await page.getByText('Execution').first().click();
    
    // Click on an editable cell
    const cell = page.locator('td[contenteditable="true"]').first();
    await cell.click();
    
    // Enter long text
    await page.getByPlaceholder('Enter custom text').fill(longText);
    await page.getByRole('button', { name: 'Insert' }).click();
  });

  await test.step('2. Cell expands', async () => {
    // Get cell height after text entry
    const cell = page.locator('td[contenteditable="true"]').first();
    const height = await cell.evaluate(el => el.offsetHeight);
    
    // Verify cell has expanded (typical cell height is around 30-40px)
    expect(height).toBeGreaterThan(50);
  });

  await test.step('3. All text visible', async () => {
    // Verify all text is visible in the cell
    const cell = page.locator('td[contenteditable="true"]').first();
    const cellText = await cell.textContent();
    expect(cellText).toContain(longText);
  });

  await test.step('4. No truncation', async () => {
    // Check for text-overflow style
    const cell = page.locator('td[contenteditable="true"]').first();
    const overflow = await cell.evaluate(el => 
      window.getComputedStyle(el).textOverflow
    );
    expect(overflow).not.toBe('ellipsis');
  });

  await test.step('5. Auto-sizing works (SC)', async () => {
    // Take screenshot showing expanded cell with all text visible
    const timestamp = formatTimestamp(new Date());
    await page.screenshot({ 
      path: getScreenshotPath(`TS.7.8.12-01-5-${timestamp}.png`) 
    });
  });

  // Expected Results:
  // 1. Long text entered ✓
  // 2. Cell grows ✓
  // 3. Fully visible ✓
  // 4. Nothing cut off ✓
  // 5. Dynamic sizing ✓
});