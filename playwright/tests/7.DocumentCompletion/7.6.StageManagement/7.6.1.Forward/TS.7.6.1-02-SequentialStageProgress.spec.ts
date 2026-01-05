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

test('TS.7.6.1-02 Sequential Stage Progress', async ({ page }) => {
  // Setup: Login
  const email = process.env.MS_EMAIL_MSPM36_DIEGO_SICILIANI!;
  const password = process.env.MS_PASSWORD!;
  await microsoftLogin(page, email, password);
  await handleERSDDialog(page);

  // Navigate to documents and create/open a test document
  await page.goto('/documents');
  await page.waitForLoadState('networkidle');
  
  
  // Step 1: In Pre-Approval
  await test.step('In Pre-Approval', async () => {
    // Verify pre-approval stage
const stage = page.getByText("Pre-Approval");
await expect(stage).toBeVisible();
  });
  // Step 2: Can go to Execute
  await test.step('Can go to Execute', async () => {
    // Verify next stage available
const nextBtn = page.getByRole("button", { name: "To Execution" });
await expect(nextBtn).toBeVisible();
  });
  // Step 3: Cannot skip to Closed
  await test.step('Cannot skip to Closed', async () => {
    // Verify skip blocked
const closedBtn = page.getByRole("button", { name: "To Closed" });
await expect(closedBtn).not.toBeVisible();
  });

  // Final step: Screenshot (SC)
  await test.step('Take screenshot (SC)', async () => {
    const timestamp = new Date();
    const formattedTimestamp = `${timestamp.getFullYear()}.${String(timestamp.getMonth() + 1).padStart(2, '0')}.${String(timestamp.getDate()).padStart(2, '0')}-${String(timestamp.getHours()).padStart(2, '0')}.${String(timestamp.getMinutes()).padStart(2, '0')}.${String(timestamp.getSeconds()).padStart(2, '0')}`;
    await page.screenshot({ 
      path: getScreenshotPath(`TS.7.6.1-02-final-${formattedTimestamp}.png`) 
    });
  });

  // Expected Results: Sequential Stage Progress functionality verified
});