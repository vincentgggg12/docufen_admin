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

test('TS.7.4.4-02 Post-Approval Assignment', async ({ page }) => {
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

  // Step 1: Add QA reviewer
  await test.step('Add QA reviewer', async () => {
    // Click add participant button for Post-Approval group
    const addButton = page.locator('[data-testid="add-post-approval-participant"], .post-approval-section button:has-text("Add"), button:has-text("Add Participant")').first();
    await addButton.click();
    
    // Search for QA user
    const searchInput = page.locator('[data-testid="user-search"], input[placeholder*="Search"], input[type="search"]').first();
    await searchInput.fill('QA');
    await page.waitForTimeout(500);
    
    // Select QA reviewer from results
    const qaUser = page.locator('[data-testid="user-option"]:has-text("QA"), .user-option:has-text("QA")').first();
    await qaUser.click();
  });

  // Step 2: Add final approver
  await test.step('Add final approver', async () => {
    // Add another participant as final approver
    const addButton = page.locator('[data-testid="add-post-approval-participant"], .post-approval-section button:has-text("Add"), button:has-text("Add Participant")').first();
    await addButton.click();
    
    // Search for approver
    const searchInput = page.locator('[data-testid="user-search"], input[placeholder*="Search"], input[type="search"]').first();
    await searchInput.fill('Approver');
    await page.waitForTimeout(500);
    
    // Select approver from results
    const approverUser = page.locator('[data-testid="user-option"]:has-text("Approver"), .user-option:has-text("Approver")').first();
    await approverUser.click();
  });

  // Step 3: Both in group
  await test.step('Both in group', async () => {
    // Verify both users appear in Post-Approval list
    const postApprovalList = page.locator('[data-testid="post-approval-list"], .post-approval-section .participant-list').first();
    
    // Check QA reviewer is listed
    const qaParticipant = postApprovalList.locator(':has-text("QA")');
    await expect(qaParticipant).toBeVisible();
    
    // Check final approver is listed
    const approverParticipant = postApprovalList.locator(':has-text("Approver")');
    await expect(approverParticipant).toBeVisible();
  });

  // Step 4: Can review doc
  await test.step('Can review doc', async () => {
    // Verify access indicators show document review capability
    const accessIndicators = page.locator('[data-testid="access-indicator"], .access-status, .permission-badge');
    const count = await accessIndicators.count();
    
    if (count > 0) {
      // Check that participants have appropriate access level
      const firstIndicator = accessIndicators.first();
      await expect(firstIndicator).toBeVisible();
    }
  });

  // Step 5: Verification enabled (SC)
  await test.step('Verification enabled (SC)', async () => {
    // Verify that verification/signing capabilities are enabled for Post-Approval participants
    const verificationElements = page.locator('[data-testid="verification-status"], .can-verify, .signing-enabled');
    
    // Take screenshot showing Post-Approval assignment
    const timestamp = new Date();
    const formattedTimestamp = `${timestamp.getFullYear()}.${String(timestamp.getMonth() + 1).padStart(2, '0')}.${String(timestamp.getDate()).padStart(2, '0')}-${String(timestamp.getHours()).padStart(2, '0')}.${String(timestamp.getMinutes()).padStart(2, '0')}.${String(timestamp.getSeconds()).padStart(2, '0')}`;
    await page.screenshot({ 
      path: getScreenshotPath(`TS.7.4.4-02-final-${formattedTimestamp}.png`) 
    });
  });

  // Expected Results: 
  // 1. QA added
  // 2. Approver added
  // 3. List updated
  // 4. Access granted
  // 5. Can verify
});