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

test('TS.7.4.2-01 Pre-Approval Group Display', async ({ page }) => {
  // Setup: Login
  const email = process.env.MS_EMAIL_MSPM36_DIEGO_SICILIANI!;
  const password = process.env.MS_PASSWORD!;
  await microsoftLogin(page, email, password);
  await handleERSDDialog(page);

  // Navigate to documents and create/open a test document
  await page.goto('/documents');
  await page.waitForLoadState('networkidle');
  
  
  // Step 1: Open participants
  await test.step('Open participants', async () => {
    // Open participants dialog
const participantsTab = page.getByRole("tab", { name: "Participants" });
await participantsTab.click();
  });
  // Step 2: Find Pre-Approval group
  await test.step('Find Pre-Approval group', async () => {
    // Find group
const preApprovalGroup = page.getByText("Pre-Approval");
await expect(preApprovalGroup).toBeVisible();
  });
  // Step 3: List shows approvers
  await test.step('List shows approvers', async () => {
    // Verify approvers list
const approversList = page.getByTestId("pre-approval-list");
await expect(approversList).toBeVisible();
  });

  // Final step: Screenshot (SC)
  await test.step('Take screenshot (SC)', async () => {
    const timestamp = new Date();
    const formattedTimestamp = `${timestamp.getFullYear()}.${String(timestamp.getMonth() + 1).padStart(2, '0')}.${String(timestamp.getDate()).padStart(2, '0')}-${String(timestamp.getHours()).padStart(2, '0')}.${String(timestamp.getMinutes()).padStart(2, '0')}.${String(timestamp.getSeconds()).padStart(2, '0')}`;
    await page.screenshot({ 
      path: getScreenshotPath(`TS.7.4.2-01-final-${formattedTimestamp}.png`) 
    });
  });

  // Expected Results: Pre-Approval Group Display functionality verified
});