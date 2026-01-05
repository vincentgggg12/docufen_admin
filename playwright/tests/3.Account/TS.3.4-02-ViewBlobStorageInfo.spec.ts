import { test, expect } from '@playwright/test';
import * as dotenv from 'dotenv';
import { microsoftLogin, handleERSDDialog } from '../../src/utils/microsoftLogin';
import { getScreenshotPath, formatTimestamp } from '../../src/utils/screenshotUtils';

dotenv.config({ path: '.playwright.env' });

test.use({
  viewport: { height: 1080, width: 1920 },
  ignoreHTTPSErrors: true
});

test.setTimeout(120000); // 2 minutes

test('TS.3.4-02 View Blob Storage Info', async ({ page }) => {
  // Login as Megan (Admin)
  const email = process.env.MS_EMAIL_17NJ5D_MEGAN_BOWEN!;
  const password = process.env.MS_PASSWORD!;
  await microsoftLogin(page, email, password);
  await handleERSDDialog(page);

  // Test Step 1: Navigate to Account page
  await test.step('Navigate to Account page', async () => {
    await page.getByRole('button', { name: 'Menu' }).click();
    await page.getByRole('link', { name: 'Account' }).click();
  });

  // Test Step 2: Scroll to Blob Storage section
  await test.step('Scroll to Blob Storage section', async () => {
    // Wait for the page to load
    await page.waitForLoadState('networkidle');
    
    // Scroll to find Blob Storage section
    await page.locator('text=/Blob Storage/i').first().scrollIntoViewIfNeeded();
  });

  // Test Step 3: Check container name (SC)
  await test.step('Check container name (SC)', async () => {
    // Ensure the Blob Storage section is visible
    await expect(page.locator('text=/Blob Storage/i').first()).toBeVisible();
    
    // Take screenshot
    const timestamp = formatTimestamp(new Date());
    await page.screenshot({ 
      path: getScreenshotPath(`TS.3.4-02-3-${timestamp}.png`) 
    });
  });

  // Expected Results:
  // 1. Blob Storage section visible ✓
  await expect(page.locator('text=/Blob Storage/i').first()).toBeVisible();

  // 2. Container name shown (<tenant name>-MS-Azure-blob = 17nj5d-MS-Azure-blob) ✓
  await expect(page.getByText('17nj5d-MS-Azure-blob')).toBeVisible();
});