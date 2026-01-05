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

test('TS.7.10-02 Closure Audit', async ({ page }) => {
  // Setup: Login as Trial Administrator (Owner)
  const email = process.env.MS_EMAIL_17NJ5D_MEGAN_BOWEN!;
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

  // Test Step 1: Close document
  await test.step('Close document', async () => {
    // Click the Close Document button
    await page.getByRole('button', { name: 'Close Document' }).click();
    
    // Wait for closure to complete
    await page.waitForTimeout(2000);
    
    // Verify document is now in Closed stage
    await expect(page.getByText('Closed')).toBeVisible();
  });

  // Test Step 2: Check audit log
  await test.step('Check audit log', async () => {
    // Navigate to audit trail
    await page.getByRole('button', { name: 'Audit Trail' }).click();
    await page.waitForSelector('[data-testid="audit-trail-dialog"]', { timeout: 5000 });
  });

  // Test Step 3: Stage change logged
  await test.step('Stage change logged', async () => {
    // Look for the ChangedStage entry
    const auditEntry = page.locator('[data-testid="audit-entry"]').filter({ hasText: 'ChangedStage' }).first();
    await expect(auditEntry).toBeVisible();
    
    // Verify it shows transition from Post-Approval to Closed
    await expect(auditEntry).toContainText('Post-Approval');
    await expect(auditEntry).toContainText('Closed');
  });

  // Test Step 4: Actor recorded
  await test.step('Actor recorded', async () => {
    // Verify the user who closed the document is recorded
    const auditEntry = page.locator('[data-testid="audit-entry"]').filter({ hasText: 'ChangedStage' }).first();
    await expect(auditEntry).toContainText('Megan Bowen');
    await expect(auditEntry).toContainText('MB'); // Initials
  });

  // Test Step 5: Timestamp captured (SC)
  await test.step('Timestamp captured (SC)', async () => {
    // Verify timestamp is present
    const auditEntry = page.locator('[data-testid="audit-entry"]').filter({ hasText: 'ChangedStage' }).first();
    
    // Check for date/time format (e.g., "2024-01-15 14:30:00")
    const timestampRegex = /\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}:\d{2}/;
    const entryText = await auditEntry.textContent();
    expect(entryText).toMatch(timestampRegex);
    
    // Take screenshot of audit trail
    const timestamp = formatTimestamp(new Date());
    await page.screenshot({ 
      path: getScreenshotPath(`TS.7.10-02-5-${timestamp}.png`) 
    });
  });

  // Expected Results:
  // 1. Doc closed ✓
  // 2. Audit viewed ✓
  // 3. ChangedStage entry ✓
  // 4. Closer identified ✓
  // 5. Time recorded ✓
});