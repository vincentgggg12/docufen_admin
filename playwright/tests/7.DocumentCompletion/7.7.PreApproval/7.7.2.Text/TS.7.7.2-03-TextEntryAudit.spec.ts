import { test, expect } from '@playwright/test';
import * as dotenv from 'dotenv';
import { microsoftLogin, handleERSDDialog } from '../../../src/utils/microsoftLogin';
import { getScreenshotPath, formatTimestamp } from '../../../src/utils/screenshotUtils';

dotenv.config({ path: '.playwright.env' });

test.use({
  viewport: { height: 1080, width: 1920 },
  ignoreHTTPSErrors: true
});

test.setTimeout(120000); // 2 minutes

test('TS.7.7.2-03 Text Entry Audit', async ({ page }) => {
  // Login as a Pre-Approval participant
  const email = process.env.MS_EMAIL_ORG_USERNAME!;
  const password = process.env.MS_PASSWORD!;
  await microsoftLogin(page, email, password);
  await handleERSDDialog(page);

  // Navigate to a document in Pre-Approval stage
  await page.getByRole('button', { name: 'Menu' }).click();
  await page.getByRole('link', { name: 'Documents' }).click();
  await page.waitForLoadState('networkidle');
  
  // Find and open a document in Pre-Approval stage
  await page.getByText('Pre-Approval').first().click();
  await page.waitForLoadState('networkidle');

  // Test Steps
  await test.step('1. Add text', async () => {
    // Click on the text annotation tool
    await page.getByRole('button', { name: 'Text', exact: true }).click();
    
    // Click on the document and add text
    const documentArea = page.locator('.document-viewer, canvas').first();
    await documentArea.click({ position: { x: 350, y: 250 } });
    
    // Type audit test text
    await page.keyboard.type('Audit test annotation');
    await page.keyboard.press('Enter');
    
    // Wait for text to be saved
    await page.waitForTimeout(2000);
    
    // Verify text was added
    await expect(page.locator('text=Audit test annotation')).toBeVisible();
  });

  await test.step('2. Check audit log', async () => {
    // Navigate to audit log
    await page.getByRole('button', { name: 'Audit Log' }).click();
    
    // Wait for audit log to load
    await page.waitForLoadState('networkidle');
    await expect(page.getByRole('heading', { name: 'Audit Log' })).toBeVisible();
  });

  await test.step('3. PreApproveText entry', async () => {
    // Look for the PreApproveText audit entry
    const auditEntry = page.locator('tr').filter({ hasText: 'PreApproveText' }).first();
    await expect(auditEntry).toBeVisible();
    
    // Verify the action type
    await expect(auditEntry.locator('text=PreApproveText')).toBeVisible();
  });

  await test.step('4. Content recorded', async () => {
    // Verify the text content is recorded in the audit log
    const auditEntry = page.locator('tr').filter({ hasText: 'PreApproveText' }).first();
    
    // Click to expand details if needed
    const expandButton = auditEntry.locator('button[aria-label="Expand"]');
    if (await expandButton.isVisible()) {
      await expandButton.click();
    }
    
    // Check for the actual text content in the audit details
    await expect(page.locator('text=Audit test annotation')).toBeVisible();
  });

  await test.step('5. User tracked (SC)', async () => {
    // Verify the user information is tracked
    const auditEntry = page.locator('tr').filter({ hasText: 'PreApproveText' }).first();
    
    // Check for user email or name in the audit entry
    const userEmail = process.env.MS_EMAIL_ORG_USERNAME!;
    const userName = userEmail.split('@')[0];
    
    await expect(auditEntry.locator(`text=${userName}`)).toBeVisible();
    
    // Take screenshot of the audit log entry
    const timestamp = formatTimestamp(new Date());
    await page.screenshot({ 
      path: getScreenshotPath(`TS.7.7.2-03-5-${timestamp}.png`) 
    });
  });

  // Expected Results:
  // 1. Text added ✓
  // 2. Audit viewed ✓
  // 3. Entry present ✓
  // 4. Text captured ✓
  // 5. User shown ✓
});