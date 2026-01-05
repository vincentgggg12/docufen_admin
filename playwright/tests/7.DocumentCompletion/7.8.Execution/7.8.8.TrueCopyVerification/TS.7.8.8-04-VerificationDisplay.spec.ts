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

test('TS.7.8.8-04 Verification Display', async ({ page }) => {
  // Login as an executor
  const email = process.env.MS_EMAIL_17NJ5D_DAVID_SEAGAL!;
  const password = process.env.MS_PASSWORD!;
  await microsoftLogin(page, email, password);
  await handleERSDDialog(page);

  // Test Steps
  await test.step('1. View verified attachment', async () => {
    // Navigate to a document in Execution stage
    await page.getByRole('button', { name: 'Menu' }).click();
    await page.getByRole('link', { name: 'Documents' }).click();
    await page.waitForLoadState('networkidle');
    
    // Find and open a document in Execution stage
    await page.getByText('Execution').first().click();
    
    // Open attachments panel
    await page.getByRole('button', { name: 'Attachments' }).click();
    
    // Look for a verified attachment
    const verifiedAttachment = page.locator('[data-verified="true"], .verified-attachment').first();
    
    if (await verifiedAttachment.count() > 0) {
      await verifiedAttachment.click();
    } else {
      // Look for any attachment with verification indicators
      await page.getByRole('listitem').filter({ hasText: /verified|✓/i }).first().click();
    }
  });

  await test.step('2. Stamp icon shown', async () => {
    // Look for verification stamp or icon
    const stampIcon = page.locator('[data-testid="verification-stamp"], .stamp-icon, [aria-label*="verified"]');
    await expect(stampIcon).toBeVisible();
  });

  await test.step('3. Verifier names', async () => {
    // Check for verifier names
    const verificationInfo = page.locator('.verification-info, [data-testid="verifiers"]');
    await expect(verificationInfo).toBeVisible();
    
    // Should contain at least one name
    const hasName = await verificationInfo.getByText(/\w+\s+\w+/).isVisible();
    expect(hasName).toBe(true);
  });

  await test.step('4. Verification dates', async () => {
    // Check for verification dates
    const datePattern = /\d{1,2}-\w{3}-\d{4}/;
    const verificationDates = page.locator('text=' + datePattern);
    await expect(verificationDates.first()).toBeVisible();
  });

  await test.step('5. Status clear (SC)', async () => {
    // Take screenshot showing verification display
    const timestamp = formatTimestamp(new Date());
    await page.screenshot({ 
      path: getScreenshotPath(`TS.7.8.8-04-5-${timestamp}.png`) 
    });
  });

  // Expected Results:
  // 1. Attachment viewed ✓
  // 2. Stamp visible ✓
  // 3. Names listed ✓
  // 4. Dates shown ✓
  // 5. Verified status ✓
});