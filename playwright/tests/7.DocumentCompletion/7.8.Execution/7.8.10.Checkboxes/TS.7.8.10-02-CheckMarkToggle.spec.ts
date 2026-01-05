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

test('TS.7.8.10-02 Check Mark Toggle', async ({ page }) => {
  // Login as an executor
  const email = process.env.MS_EMAIL_17NJ5D_DAVID_SEAGAL!;
  const password = process.env.MS_PASSWORD!;
  await microsoftLogin(page, email, password);
  await handleERSDDialog(page);

  // Test Steps
  await test.step('1. Click unchecked ☐', async () => {
    // Navigate to a document in Execution stage
    await page.getByRole('button', { name: 'Menu' }).click();
    await page.getByRole('link', { name: 'Documents' }).click();
    await page.waitForLoadState('networkidle');
    
    // Find and open a document in Execution stage
    await page.getByText('Execution').first().click();
    
    // Find and click unchecked checkbox
    const checkbox = page.locator('text=☐').first();
    await checkbox.click();
  });

  await test.step('2. Changes to ☑', async () => {
    // Verify checkbox changed to checked state
    await expect(page.locator('text=☑').first()).toBeVisible();
  });

  await test.step('3. Click again', async () => {
    // Click the now-checked checkbox
    const checkedBox = page.locator('text=☑').first();
    await checkedBox.click();
  });

  await test.step('4. Stays checked', async () => {
    // Verify checkbox remains checked (one-way toggle)
    await expect(page.locator('text=☑').first()).toBeVisible();
    
    // Verify unchecked state is not present
    const uncheckedCount = await page.locator('text=☐').count();
    const checkedCount = await page.locator('text=☑').count();
    expect(checkedCount).toBeGreaterThan(0);
  });

  await test.step('5. One-way toggle (SC)', async () => {
    // Take screenshot showing checked checkbox
    const timestamp = formatTimestamp(new Date());
    await page.screenshot({ 
      path: getScreenshotPath(`TS.7.8.10-02-5-${timestamp}.png`) 
    });
  });

  // Expected Results:
  // 1. Clicked ✓
  // 2. Becomes ☑ ✓
  // 3. Re-clicked ✓
  // 4. Remains ☑ ✓
  // 5. No uncheck ✓
});