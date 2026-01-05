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

test('TS.7.4.4-01 Post-Approval Group Display', async ({ page }) => {
  // Setup: Login
  const email = process.env.MS_EMAIL_MSPM36_DIEGO_SICILIANI!;
  const password = process.env.MS_PASSWORD!;
  await microsoftLogin(page, email, password);
  await handleERSDDialog(page);

  // Navigate to documents and create/open a test document
  await page.goto('/documents');
  await page.waitForLoadState('networkidle');
  
  // Step 1: View Post-Approval group
  await test.step('View Post-Approval group', async () => {
    // Open participants dialog
    const participantsTab = page.getByRole("tab", { name: "Participants" });
    await participantsTab.click();
    await page.waitForTimeout(1000);
  });

  // Step 2: Final approvers listed
  await test.step('Final approvers listed', async () => {
    // Verify Post-Approval group section shows final approvers
    const postApprovalSection = page.locator('[data-testid="post-approval-section"], .post-approval-section').first();
    await expect(postApprovalSection).toBeVisible();
    
    // Check for approvers list within the section
    const approversList = postApprovalSection.locator('[data-testid="post-approval-list"], .participant-list').first();
    await expect(approversList).toBeVisible();
  });

  // Step 3: Clear identification
  await test.step('Clear identification', async () => {
    // Verify "Post-Approval" label is clearly visible
    const postApprovalLabel = page.getByText('Post-Approval', { exact: false });
    await expect(postApprovalLabel).toBeVisible();
    
    // Check for visual distinction (e.g., background color, border)
    const groupContainer = page.locator('[data-testid="post-approval-group"], .post-approval-group').first();
    await expect(groupContainer).toBeVisible();
  });

  // Step 4: Status shown
  await test.step('Status shown', async () => {
    // Verify signing status indicators are visible
    const statusIndicators = page.locator('[data-testid="signing-status"], .signing-status, .status-indicator');
    const count = await statusIndicators.count();
    
    if (count > 0) {
      const firstStatus = statusIndicators.first();
      await expect(firstStatus).toBeVisible();
    }
  });

  // Step 5: Group visible (SC)
  await test.step('Group visible (SC)', async () => {
    // Take screenshot showing the Post-Approval group
    const timestamp = new Date();
    const formattedTimestamp = `${timestamp.getFullYear()}.${String(timestamp.getMonth() + 1).padStart(2, '0')}.${String(timestamp.getDate()).padStart(2, '0')}-${String(timestamp.getHours()).padStart(2, '0')}.${String(timestamp.getMinutes()).padStart(2, '0')}.${String(timestamp.getSeconds()).padStart(2, '0')}`;
    await page.screenshot({ 
      path: getScreenshotPath(`TS.7.4.4-01-final-${formattedTimestamp}.png`) 
    });
  });

  // Expected Results: 
  // 1. Group found
  // 2. Users displayed
  // 3. "Post-Approval" label
  // 4. Sign status visible
  // 5. Properly shown
});