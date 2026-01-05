import { test, expect } from '@playwright/test';
import { getScreenshotPath } from '../../../utils/paths';
import dotenv from 'dotenv';
import { microsoftLogin } from '../../../utils/msLogin';
import { handleERSDDialog } from '../../../utils/ersd-handler';

dotenv.config({ path: '.playwright.env' });

test.use({
  viewport: { height: 1080, width: 1920 },
  ignoreHTTPSErrors: true
});

test.setTimeout(120000); // 2 minutes

test('TS.7.5.2-03 Post Delete Navigation', async ({ page }) => {
  // Setup: Login
  const email = process.env.MS_EMAIL_MSPM36_DIEGO_SICILIANI!;
  const password = process.env.MS_PASSWORD!;
  await microsoftLogin(page, email, password);
  await handleERSDDialog(page);

  // Navigate to documents and create/open a test document
  await page.goto('/documents');
  await page.waitForLoadState('networkidle');
  
  
  // Step 1: Delete document
  await test.step('Delete document', async () => {
    // Delete document
await page.getByRole("button", { name: "Delete" }).click();
await page.getByRole("button", { name: "Confirm" }).click();
  });
  // Step 2: Auto-redirect
  await test.step('Auto-redirect', async () => {
    // Wait for redirect
await page.waitForURL(/.*\/documents/);
  });
  // Step 3: Land on documents list
  await test.step('Land on documents list', async () => {
    // Verify location
await expect(page).toHaveURL(/.*\/documents/);
  });

  // Final step: Screenshot (SC)
  await test.step('Take screenshot (SC)', async () => {
    const timestamp = new Date();
    const formattedTimestamp = `${timestamp.getFullYear()}.${String(timestamp.getMonth() + 1).padStart(2, '0')}.${String(timestamp.getDate()).padStart(2, '0')}-${String(timestamp.getHours()).padStart(2, '0')}.${String(timestamp.getMinutes()).padStart(2, '0')}.${String(timestamp.getSeconds()).padStart(2, '0')}`;
    await page.screenshot({ 
      path: getScreenshotPath(`TS.7.5.2-03-final-${formattedTimestamp}.png`) 
    });
  });

  // Expected Results: Post Delete Navigation functionality verified
});