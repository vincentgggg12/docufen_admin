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

test('TS.7.9.1-06 Post-Approval Audit', async ({ page }) => {
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

  // Test Step 1: Sign document
  await test.step('Sign document', async () => {
    // Click sign button
    await page.getByRole('button', { name: 'Sign', exact: true }).click();
    await page.waitForSelector('[data-testid="signature-dialog"]', { timeout: 5000 });
    
    // Select role
    await page.getByLabel('Select role').click();
    await page.getByRole('option', { name: 'Approved By' }).click();
    
    // Sign
    await page.getByRole('button', { name: 'Sign Document' }).click();
    
    // Wait for signature to complete
    await page.waitForSelector('[data-testid="signature-success"]', { timeout: 10000 });
  });

  // Test Step 2: Check audit
  await test.step('Check audit', async () => {
    // Open audit trail
    await page.getByRole('button', { name: 'Audit Trail' }).click();
    await page.waitForSelector('[data-testid="audit-dialog"]', { timeout: 5000 });
  });

  // Test Step 3: PostApproveSign entry
  await test.step('PostApproveSign entry', async () => {
    // Look for the most recent audit entry
    const auditEntries = page.locator('[data-testid="audit-entry"]');
    const latestEntry = auditEntries.first();
    
    // Verify it's a PostApproveSign action
    await expect(latestEntry).toContainText(/PostApproveSign|Post-Approval.*Sign/i);
  });

  // Test Step 4: Details recorded
  await test.step('Details recorded', async () => {
    const latestEntry = page.locator('[data-testid="audit-entry"]').first();
    
    // Verify user name is recorded
    await expect(latestEntry).toContainText('Nestor Wilke');
    
    // Verify timestamp is recorded
    await expect(latestEntry).toContainText(/\d{1,2}\/\d{1,2}\/\d{4}|\d{4}-\d{2}-\d{2}/); // Date
    await expect(latestEntry).toContainText(/\d{1,2}:\d{2}/); // Time
    
    // Verify role is recorded
    await expect(latestEntry).toContainText('Approved By');
    
    // Verify action details
    await expect(latestEntry).toContainText(/signed|signature/i);
  });

  // Test Step 5: Tracked properly (SC)
  await test.step('Tracked properly (SC)', async () => {
    // Verify complete audit trail information
    const latestEntry = page.locator('[data-testid="audit-entry"]').first();
    
    // Verify all required fields are present
    await expect(latestEntry).toContainText('PostApproveSign');
    await expect(latestEntry).toContainText('Nestor Wilke');
    await expect(latestEntry).toContainText('Approved By');
    
    // Take screenshot of audit trail
    const timestamp = formatTimestamp(new Date());
    await page.screenshot({ 
      path: getScreenshotPath(`TS.7.9.1-06-5-${timestamp}.png`) 
    });
    
    // Close audit dialog
    await page.getByRole('button', { name: 'Close' }).click();
  });

  // Expected Results:
  // 1. Signed ✓
  // 2. Audit viewed ✓
  // 3. Entry found ✓
  // 4. All info captured ✓
  // 5. Audit complete ✓
});