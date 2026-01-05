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

test('TS.7.6.2-03 Reason Validation', async ({ page }) => {
  // Setup: Login
  const email = process.env.MS_EMAIL_MSPM36_DIEGO_SICILIANI!;
  const password = process.env.MS_PASSWORD!;
  await microsoftLogin(page, email, password);
  await handleERSDDialog(page);

  // Navigate to documents and create/open a test document
  await page.goto('/documents');
  await page.waitForLoadState('networkidle');
  
  
  // Step 1: Enter "abc"
  await test.step('Enter "abc"', async () => {
    // Enter short reason
const reasonField = page.getByTestId("reason-input");
await reasonField.fill("abc");
  });
  // Step 2: Too short error
  await test.step('Too short error', async () => {
    // Verify error
const error = page.getByText("Too short");
await expect(error).toBeVisible();
  });
  // Step 3: Enter valid reason
  await test.step('Enter valid reason', async () => {
    // Enter valid reason
await reasonField.fill("Valid reason for reversion");
  });

  // Final step: Screenshot (SC)
  await test.step('Take screenshot (SC)', async () => {
    const timestamp = new Date();
    const formattedTimestamp = `${timestamp.getFullYear()}.${String(timestamp.getMonth() + 1).padStart(2, '0')}.${String(timestamp.getDate()).padStart(2, '0')}-${String(timestamp.getHours()).padStart(2, '0')}.${String(timestamp.getMinutes()).padStart(2, '0')}.${String(timestamp.getSeconds()).padStart(2, '0')}`;
    await page.screenshot({ 
      path: getScreenshotPath(`TS.7.6.2-03-final-${formattedTimestamp}.png`) 
    });
  });

  // Expected Results: Reason Validation functionality verified
});