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

test('TS.3.5-02 XSS in Address Field', async ({ page }) => {
  // Setup: Login
  const email = process.env.MS_EMAIL_17NJ5D_MEGAN_BOWEN!;
  const password = process.env.MS_PASSWORD!;
  await microsoftLogin(page, email, password);
  await handleERSDDialog(page);

  // Navigate to Account page
  await test.step('Navigate to Account page', async () => {
    await page.getByRole('button', { name: 'Menu' }).click();
    await page.getByRole('link', { name: 'Account' }).click();
    await expect(page).toHaveURL(/.*\/account/);
  });

  // Test Step 1: Edit address
  await test.step('Edit address', async () => {
    await page.getByRole('button', { name: 'Edit' }).first().click();
    await expect(page.getByLabel('Address')).toBeVisible();
  });

  // Test Step 2: Enter script tags with JavaScript alert
  const xssPayload = '<script>alert("XSS Test")</script>';
  await test.step('Enter script tags with JavaScript alert', async () => {
    await page.getByLabel('Address').clear();
    await page.getByLabel('Address').fill(xssPayload);
  });

  // Test Step 3: Save changes
  await test.step('Save changes', async () => {
    await page.getByRole('button', { name: 'Save' }).click();
    await expect(page.getByText('Account information updated successfully')).toBeVisible();
  });

  // Test Step 4: Verify script shows as plain text (SC)
  await test.step('Verify script shows as plain text (SC)', async () => {
    await expect(page.getByText(xssPayload)).toBeVisible();
    
    // Verify no alert dialog appeared
    await expect(page.locator('.MuiDialog-root')).not.toBeVisible();
    
    const timestamp = formatTimestamp(new Date());
    await page.screenshot({ 
      path: getScreenshotPath(`TS.3.5-02-4-${timestamp}.png`) 
    });
  });

  // Test Step 5: Reload page (F5/refresh)
  await test.step('Reload page (F5/refresh)', async () => {
    await page.reload();
    await expect(page).toHaveURL(/.*\/account/);
  });

  // Test Step 6: Verify script still shows as text, no execution (SC)
  await test.step('Verify script still shows as text, no execution (SC)', async () => {
    await expect(page.getByText(xssPayload)).toBeVisible();
    
    // Verify no alert dialog appeared after reload
    await expect(page.locator('.MuiDialog-root')).not.toBeVisible();
    
    const timestamp = formatTimestamp(new Date());
    await page.screenshot({ 
      path: getScreenshotPath(`TS.3.5-02-6-${timestamp}.png`) 
    });
  });

  // Expected Results:
  // 1. Input accepted ✓
  // 2. Save successful ✓
  // 3. Script displays as text ✓
  // 4. No JavaScript execution ✓
  // 5. Page reloads ✓
  // 6. Script remains as plain text ✓
});