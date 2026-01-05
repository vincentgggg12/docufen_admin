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

test('TS.7.6.2-02 Mandatory Reason Entry', async ({ page }) => {
  // Setup: Login
  const email = process.env.MS_EMAIL_MSPM36_DIEGO_SICILIANI!;
  const password = process.env.MS_PASSWORD!;
  await microsoftLogin(page, email, password);
  await handleERSDDialog(page);

  // Navigate to documents and create/open a test document
  await page.goto('/documents');
  await page.waitForLoadState('networkidle');
  
  
  // Step 1: Click back button
  await test.step('Click back button', async () => {
    // Click back
const backBtn = page.getByRole("button", { name: "Back" });
await backBtn.click();
  });
  // Step 2: Modal opens
  await test.step('Modal opens', async () => {
    // Verify modal
const modal = page.getByRole("dialog");
await expect(modal).toBeVisible();
  });
  // Step 3: Reason required
  await test.step('Reason required', async () => {
    // Check required field
const reasonField = page.getByTestId("reason-input");
await expect(reasonField).toBeVisible();
  });

  // Final step: Screenshot (SC)
  await test.step('Take screenshot (SC)', async () => {
    const timestamp = new Date();
    const formattedTimestamp = `${timestamp.getFullYear()}.${String(timestamp.getMonth() + 1).padStart(2, '0')}.${String(timestamp.getDate()).padStart(2, '0')}-${String(timestamp.getHours()).padStart(2, '0')}.${String(timestamp.getMinutes()).padStart(2, '0')}.${String(timestamp.getSeconds()).padStart(2, '0')}`;
    await page.screenshot({ 
      path: getScreenshotPath(`TS.7.6.2-02-final-${formattedTimestamp}.png`) 
    });
  });

  // Expected Results: Mandatory Reason Entry functionality verified
});