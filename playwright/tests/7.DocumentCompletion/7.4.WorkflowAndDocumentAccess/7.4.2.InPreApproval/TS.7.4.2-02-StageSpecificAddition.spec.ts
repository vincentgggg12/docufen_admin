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

test('TS.7.4.2-02 Stage Specific Addition', async ({ page }) => {
  // Setup: Login
  const email = process.env.MS_EMAIL_MSPM36_DIEGO_SICILIANI!;
  const password = process.env.MS_PASSWORD!;
  await microsoftLogin(page, email, password);
  await handleERSDDialog(page);

  // Navigate to documents and create/open a test document
  await page.goto('/documents');
  await page.waitForLoadState('networkidle');
  
  
  // Step 1: Add user to Pre-Approval
  await test.step('Add user to Pre-Approval', async () => {
    // Add to pre-approval
await page.getByTestId("pre-approval-add").click();
await page.getByText("Diego").click();
  });
  // Step 2: Check document access
  await test.step('Check document access', async () => {
    // Verify access
const accessCheck = page.getByTestId("access-indicator");
await expect(accessCheck).toBeVisible();
  });

  // Final step: Screenshot (SC)
  await test.step('Take screenshot (SC)', async () => {
    const timestamp = new Date();
    const formattedTimestamp = `${timestamp.getFullYear()}.${String(timestamp.getMonth() + 1).padStart(2, '0')}.${String(timestamp.getDate()).padStart(2, '0')}-${String(timestamp.getHours()).padStart(2, '0')}.${String(timestamp.getMinutes()).padStart(2, '0')}.${String(timestamp.getSeconds()).padStart(2, '0')}`;
    await page.screenshot({ 
      path: getScreenshotPath(`TS.7.4.2-02-final-${formattedTimestamp}.png`) 
    });
  });

  // Expected Results: Stage Specific Addition functionality verified
});