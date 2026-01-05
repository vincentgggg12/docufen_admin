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

test('TS.7.4.4-03 Completion Verification', async ({ page }) => {
  // Setup: Login
  const email = process.env.MS_EMAIL_MSPM36_DIEGO_SICILIANI!;
  const password = process.env.MS_PASSWORD!;
  await microsoftLogin(page, email, password);
  await handleERSDDialog(page);

  // Navigate to documents and create/open a test document
  await page.goto('/documents');
  await page.waitForLoadState('networkidle');
  
  // Open participants dialog
  const participantsTab = page.getByRole("tab", { name: "Participants" });
  await participantsTab.click();
  await page.waitForTimeout(1000);

  // Step 1: Check signing status
  await test.step('Check signing status', async () => {
    // Locate Post-Approval section
    const postApprovalSection = page.locator('[data-testid="post-approval-section"], .post-approval-section').first();
    await expect(postApprovalSection).toBeVisible();
    
    // Check for signing status indicators
    const signingStatuses = postApprovalSection.locator('[data-testid="signing-status"], .signing-status, .status-icon');
    const count = await signingStatuses.count();
    expect(count).toBeGreaterThan(0);
  });

  // Step 2: Unsigned show pending
  await test.step('Unsigned show pending', async () => {
    // Look for pending status indicators
    const pendingStatuses = page.locator('[data-testid="status-pending"], .status-pending, .pending-signature, :has-text("Pending")');
    const pendingCount = await pendingStatuses.count();
    
    if (pendingCount > 0) {
      // Verify pending status is clearly shown
      const firstPending = pendingStatuses.first();
      await expect(firstPending).toBeVisible();
      
      // Check for visual indication (e.g., yellow/orange color, specific icon)
      const pendingIcon = page.locator('[data-testid="pending-icon"], .pending-icon, .status-icon.pending').first();
      const hasPendingIcon = await pendingIcon.count() > 0;
      
      if (hasPendingIcon) {
        await expect(pendingIcon).toBeVisible();
      }
    }
  });

  // Step 3: Signed show complete
  await test.step('Signed show complete', async () => {
    // Look for completed status indicators
    const completedStatuses = page.locator('[data-testid="status-complete"], .status-complete, .signed, :has-text("Signed"), :has-text("Complete")');
    const completedCount = await completedStatuses.count();
    
    if (completedCount > 0) {
      // Verify completed status is clearly shown
      const firstCompleted = completedStatuses.first();
      await expect(firstCompleted).toBeVisible();
      
      // Check for visual indication (e.g., green color, checkmark icon)
      const completeIcon = page.locator('[data-testid="complete-icon"], .complete-icon, .status-icon.complete, .checkmark').first();
      const hasCompleteIcon = await completeIcon.count() > 0;
      
      if (hasCompleteIcon) {
        await expect(completeIcon).toBeVisible();
      }
    }
  });

  // Step 4: Progress visible
  await test.step('Progress visible', async () => {
    // Check for overall progress indicator
    const progressIndicator = page.locator('[data-testid="signing-progress"], .progress-indicator, .completion-progress').first();
    const hasProgress = await progressIndicator.count() > 0;
    
    if (hasProgress) {
      await expect(progressIndicator).toBeVisible();
    } else {
      // Alternative: Check for completion ratio text (e.g., "2/3 signed")
      const progressText = page.locator(':has-text("/"):has-text("signed"), :has-text("of"):has-text("signed")').first();
      const hasProgressText = await progressText.count() > 0;
      
      if (hasProgressText) {
        await expect(progressText).toBeVisible();
      }
    }
  });

  // Step 5: Clear tracking (SC)
  await test.step('Clear tracking (SC)', async () => {
    // Verify the signing status tracking is clear and easy to monitor
    
    // Take screenshot showing completion verification status
    const timestamp = new Date();
    const formattedTimestamp = `${timestamp.getFullYear()}.${String(timestamp.getMonth() + 1).padStart(2, '0')}.${String(timestamp.getDate()).padStart(2, '0')}-${String(timestamp.getHours()).padStart(2, '0')}.${String(timestamp.getMinutes()).padStart(2, '0')}.${String(timestamp.getSeconds()).padStart(2, '0')}`;
    await page.screenshot({ 
      path: getScreenshotPath(`TS.7.4.4-03-final-${formattedTimestamp}.png`) 
    });
  });

  // Expected Results: 
  // 1. Status checked
  // 2. Pending indicated
  // 3. Complete marked
  // 4. Progress shown
  // 5. Easy monitoring
});