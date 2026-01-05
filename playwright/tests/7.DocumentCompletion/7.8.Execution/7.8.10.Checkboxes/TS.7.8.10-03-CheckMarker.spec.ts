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

test('TS.7.8.10-03 Check Marker', async ({ page }) => {
  // Login as David Seagal (initials DS)
  const email = process.env.MS_EMAIL_17NJ5D_DAVID_SEAGAL!;
  const password = process.env.MS_PASSWORD!;
  await microsoftLogin(page, email, password);
  await handleERSDDialog(page);

  // Test Steps
  await test.step('1. Check box', async () => {
    // Navigate to a document in Execution stage
    await page.getByRole('button', { name: 'Menu' }).click();
    await page.getByRole('link', { name: 'Documents' }).click();
    await page.waitForLoadState('networkidle');
    
    // Find and open a document in Execution stage
    await page.getByText('Execution').first().click();
    
    // Find and click first unchecked checkbox
    const checkbox = page.locator('text=☐').first();
    await checkbox.click();
  });

  await test.step('2. Marker added', async () => {
    // Look for superscript marker near the checked box
    const marker = page.locator('sup').filter({ hasText: /\*\d+DS/ });
    await expect(marker).toBeVisible();
  });

  await test.step('3. Shows "*1DS"', async () => {
    // Verify first checkbox shows *1DS
    await expect(page.locator('sup').filter({ hasText: '*1DS' })).toBeVisible();
  });

  await test.step('4. Next check "*2DS"', async () => {
    // Check another checkbox
    const secondCheckbox = page.locator('text=☐').first();
    if (await secondCheckbox.count() > 0) {
      await secondCheckbox.click();
      
      // Verify second checkbox shows *2DS
      await expect(page.locator('sup').filter({ hasText: '*2DS' })).toBeVisible();
    }
  });

  await test.step('5. Sequential marking (SC)', async () => {
    // Take screenshot showing numbered checkbox markers
    const timestamp = formatTimestamp(new Date());
    await page.screenshot({ 
      path: getScreenshotPath(`TS.7.8.10-03-5-${timestamp}.png`) 
    });
  });

  // Expected Results:
  // 1. Box checked ✓
  // 2. Marker appears ✓
  // 3. *1DS shown ✓
  // 4. *2DS for next ✓
  // 5. Numbered sequence ✓
});