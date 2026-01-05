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

test('TS.7.8.10-01 Checkbox Detection', async ({ page }) => {
  // Login as an executor
  const email = process.env.MS_EMAIL_17NJ5D_DAVID_SEAGAL!;
  const password = process.env.MS_PASSWORD!;
  await microsoftLogin(page, email, password);
  await handleERSDDialog(page);

  // Test Steps
  await test.step('1. Find ☐ in document', async () => {
    // Navigate to a document in Execution stage
    await page.getByRole('button', { name: 'Menu' }).click();
    await page.getByRole('link', { name: 'Documents' }).click();
    await page.waitForLoadState('networkidle');
    
    // Find and open a document in Execution stage
    await page.getByText('Execution').first().click();
    
    // Look for checkbox symbols in document
    const checkbox = page.locator('text=☐').first();
    await expect(checkbox).toBeVisible();
  });

  await test.step('2. Hover shows hand', async () => {
    // Hover over checkbox
    const checkbox = page.locator('text=☐').first();
    await checkbox.hover();
    
    // Check cursor style
    const cursor = await checkbox.evaluate(el => 
      window.getComputedStyle(el).cursor
    );
    expect(cursor).toBe('pointer');
  });

  await test.step('3. Clickable state', async () => {
    // Verify checkbox is interactive
    const checkbox = page.locator('text=☐').first();
    const isClickable = await checkbox.evaluate(el => {
      const styles = window.getComputedStyle(el);
      return styles.cursor === 'pointer' && !el.hasAttribute('disabled');
    });
    expect(isClickable).toBe(true);
  });

  await test.step('4. Ready to check', async () => {
    // Verify checkbox is not already checked
    const checkboxText = await page.locator('text=☐').first().textContent();
    expect(checkboxText).toBe('☐');
  });

  await test.step('5. Detected properly (SC)', async () => {
    // Take screenshot showing checkbox with hover state
    const checkbox = page.locator('text=☐').first();
    await checkbox.hover();
    
    const timestamp = formatTimestamp(new Date());
    await page.screenshot({ 
      path: getScreenshotPath(`TS.7.8.10-01-5-${timestamp}.png`) 
    });
  });

  // Expected Results:
  // 1. Checkbox found ✓
  // 2. Cursor changes ✓
  // 3. Interactive ✓
  // 4. Can click ✓
  // 5. Recognition works ✓
});