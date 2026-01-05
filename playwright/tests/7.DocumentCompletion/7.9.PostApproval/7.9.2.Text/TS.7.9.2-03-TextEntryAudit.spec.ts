import { test, expect } from '@playwright/test';
import * as dotenv from 'dotenv';
import { microsoftLogin, handleERSDDialog } from '../../../../src/utils/microsoftLogin';
import { getScreenshotPath, formatTimestamp } from '../../../../src/utils/screenshotUtils';

dotenv.config({ path: '.playwright.env' });

test.use({
  viewport: { height: 1080, width: 1920 },
  ignoreHTTPSErrors: true
});

test.setTimeout(120000); // 2 minutes

test('TS.7.9.2-03 Text Entry Audit', async ({ page }) => {
  // Setup: Login as Post-Approval participant
  const email = process.env.MS_EMAIL_17NJ5D_NESTOR_WILKE!;
  const password = process.env.MS_PASSWORD!;
  await microsoftLogin(page, email, password);
  await handleERSDDialog(page);

  // Navigate to a document in Post-Approval stage
  await page.getByRole('button', { name: 'Menu' }).click();
  await page.getByRole('link', { name: 'Tracking' }).click();
  
  // Find document in Post-Approval stage
  await page.waitForSelector('[data-testid="document-list"]', { timeout: 10000 });
  const postApprovalDoc = page.locator('[data-testid="document-item"]').filter({ hasText: 'Post-Approval' }).first();
  await postApprovalDoc.click();
  
  // Wait for document to load
  await page.waitForSelector('[data-testid="document-content"]', { timeout: 10000 });

  // Test Step 1: Add text
  await test.step('Add text', async () => {
    // Click on a cell in the document
    const editableCell = page.locator('[data-testid="editable-cell"], td').first();
    await editableCell.click();
    
    // Add text
    await page.getByRole('button', { name: 'Text', exact: true }).click();
    await page.getByText('Custom Text').click();
    
    const auditTestText = 'Final approval review - Quality check passed';
    await page.keyboard.type(auditTestText);
    await page.keyboard.press('Enter');
    
    // Wait for text to be added
    await expect(page.getByText(auditTestText)).toBeVisible();
    
    // Wait a moment for audit to be recorded
    await page.waitForTimeout(2000);
  });

  // Test Step 2: Check audit log
  await test.step('Check audit log', async () => {
    // Open audit trail
    await page.getByRole('button', { name: 'Audit Trail' }).click();
    await page.waitForSelector('[data-testid="audit-dialog"]', { timeout: 5000 });
  });

  // Test Step 3: PostApproveText entry
  await test.step('PostApproveText entry', async () => {
    // Look for the most recent audit entry
    const auditEntries = page.locator('[data-testid="audit-entry"]');
    const latestEntry = auditEntries.first();
    
    // Verify it's a PostApproveText action
    await expect(latestEntry).toContainText(/PostApproveText|Post-Approval.*Text/i);
  });

  // Test Step 4: Content recorded
  await test.step('Content recorded', async () => {
    const latestEntry = page.locator('[data-testid="audit-entry"]').first();
    
    // Verify the text content is recorded in the audit
    await expect(latestEntry).toContainText('Final approval review - Quality check passed');
    
    // Verify additional details
    await expect(latestEntry).toContainText(/added text|text entry|entered text/i);
  });

  // Test Step 5: User tracked (SC)
  await test.step('User tracked (SC)', async () => {
    const latestEntry = page.locator('[data-testid="audit-entry"]').first();
    
    // Verify user name is recorded
    await expect(latestEntry).toContainText('Nestor Wilke');
    
    // Verify timestamp is recorded
    await expect(latestEntry).toContainText(/\d{1,2}\/\d{1,2}\/\d{4}|\d{4}-\d{2}-\d{2}/); // Date
    await expect(latestEntry).toContainText(/\d{1,2}:\d{2}/); // Time
    
    // Verify action type
    await expect(latestEntry).toContainText('PostApproveText');
    
    // Take screenshot of audit trail
    const timestamp = formatTimestamp(new Date());
    await page.screenshot({ 
      path: getScreenshotPath(`TS.7.9.2-03-5-${timestamp}.png`) 
    });
    
    // Close audit dialog
    await page.getByRole('button', { name: 'Close' }).click();
  });

  // Expected Results:
  // 1. Text added ✓
  // 2. Audit viewed ✓
  // 3. Entry present ✓
  // 4. Text captured ✓
  // 5. Author shown ✓
});