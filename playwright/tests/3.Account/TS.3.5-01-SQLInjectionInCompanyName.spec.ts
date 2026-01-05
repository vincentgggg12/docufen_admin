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

test('TS.3.5-01 SQL Injection in Company Name', async ({ page }) => {
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

  // Test Step 1: Edit company name
  await test.step('Edit company name', async () => {
    await page.getByRole('button', { name: 'Edit' }).first().click();
    await expect(page.getByLabel('Company Name')).toBeVisible();
  });

  // Test Step 2: Enter SQL injection payload (DROP TABLE)
  const sqlPayload = "'; DROP TABLE users; --";
  await test.step('Enter SQL injection payload (DROP TABLE)', async () => {
    await page.getByLabel('Company Name').clear();
    await page.getByLabel('Company Name').fill(sqlPayload);
  });

  // Test Step 3: Save changes
  await test.step('Save changes', async () => {
    await page.getByRole('button', { name: 'Save' }).click();
    await expect(page.getByText('Account information updated successfully')).toBeVisible();
  });

  // Test Step 4: Verify payload saved as plain text (SC)
  await test.step('Verify payload saved as plain text (SC)', async () => {
    await expect(page.getByText(sqlPayload)).toBeVisible();
    
    const timestamp = formatTimestamp(new Date());
    await page.screenshot({ 
      path: getScreenshotPath(`TS.3.5-01-4-${timestamp}.png`) 
    });
  });

  // Test Step 5: Reload page (F5/refresh)
  await test.step('Reload page (F5/refresh)', async () => {
    await page.reload();
    await expect(page).toHaveURL(/.*\/account/);
  });

  // Test Step 6: Verify text still shows as plain text, no execution (SC)
  await test.step('Verify text still shows as plain text, no execution (SC)', async () => {
    await expect(page.getByText(sqlPayload)).toBeVisible();
    
    const timestamp = formatTimestamp(new Date());
    await page.screenshot({ 
      path: getScreenshotPath(`TS.3.5-01-6-${timestamp}.png`) 
    });
  });

  // Expected Results:
  // 1. Input accepted ✓
  // 2. Save successful ✓
  // 3. Payload displays as literal text ✓
  // 4. No database errors ✓
  // 5. Page reloads ✓
  // 6. SQL text persists without execution ✓
});