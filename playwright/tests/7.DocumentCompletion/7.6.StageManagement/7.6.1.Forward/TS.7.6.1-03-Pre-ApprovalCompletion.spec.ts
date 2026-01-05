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

test('TS.7.6.1-03 Pre-Approval Completion', async ({ page }) => {
  // Setup: Login
  const email = process.env.MS_EMAIL_MSPM36_DIEGO_SICILIANI!;
  const password = process.env.MS_PASSWORD!;
  await microsoftLogin(page, email, password);
  await handleERSDDialog(page);

  // Navigate to documents and create/open a test document
  await page.goto('/documents');
  await page.waitForLoadState('networkidle');
  
  
  // Step 1: Missing signatures
  await test.step('Missing signatures', async () => {
    // Check missing signatures
const missingCount = await page.getByTestId("missing-signatures").count();
  });
  // Step 2: Try to advance
  await test.step('Try to advance', async () => {
    // Try advance
const advanceBtn = page.getByRole("button", { name: "Advance" });
await advanceBtn.click();
  });
  // Step 3: Blocked with message
  await test.step('Blocked with message', async () => {
    // Verify blocked
const blockMsg = page.getByText("Signatures required");
await expect(blockMsg).toBeVisible();
  });

  // Final step: Screenshot (SC)
  await test.step('Take screenshot (SC)', async () => {
    const timestamp = new Date();
    const formattedTimestamp = `${timestamp.getFullYear()}.${String(timestamp.getMonth() + 1).padStart(2, '0')}.${String(timestamp.getDate()).padStart(2, '0')}-${String(timestamp.getHours()).padStart(2, '0')}.${String(timestamp.getMinutes()).padStart(2, '0')}.${String(timestamp.getSeconds()).padStart(2, '0')}`;
    await page.screenshot({ 
      path: getScreenshotPath(`TS.7.6.1-03-final-${formattedTimestamp}.png`) 
    });
  });

  // Expected Results: Pre-Approval Completion functionality verified
});