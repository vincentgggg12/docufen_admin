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

test('TS.7.7.1-06 Signature Audit', async ({ page }) => {
  // Login as a Pre-Approval participant
  const email = process.env.MS_EMAIL_ORG_USERNAME!;
  const password = process.env.MS_PASSWORD!;
  await microsoftLogin(page, email, password);
  await handleERSDDialog(page);

  // Navigate to a document in Pre-Approval stage
  await page.getByRole('button', { name: 'Menu' }).click();
  await page.getByRole('link', { name: 'Documents' }).click();
  await page.waitForLoadState('networkidle');
  
  // Open a document in Pre-Approval stage
  await page.getByText('Pre-Approval').first().click();

  // Test Steps
  await test.step('1. Sign document', async () => {
    await page.getByRole('button', { name: 'Sign' }).click();
    
    // Select role and sign
    await page.getByRole('combobox', { name: 'Role' }).selectOption('Reviewed By');
    await page.getByRole('button', { name: 'Sign' }).click();
    
    // Wait for signature to be placed
    await page.waitForTimeout(2000);
  });

  await test.step('2. Check audit log', async () => {
    // Navigate to audit log
    await page.getByRole('button', { name: 'Audit' }).click();
    await expect(page.getByText('Audit Trail')).toBeVisible();
  });

  await test.step('3. PreApproveSign entry', async () => {
    // Look for PreApproveSign entry
    const auditEntry = page.locator('text=PreApproveSign').first();
    await expect(auditEntry).toBeVisible();
  });

  await test.step('4. Role recorded', async () => {
    // Verify role is recorded in audit
    const roleEntry = page.locator('text=Reviewed By').first();
    await expect(roleEntry).toBeVisible();
  });

  await test.step('5. Time captured (SC)', async () => {
    // Verify timestamp is captured
    const now = new Date();
    const timePattern = new RegExp(now.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    }));
    
    const timestampEntry = page.locator(`text=/${timePattern.source}/`).first();
    await expect(timestampEntry).toBeVisible();
    
    // Take screenshot
    const timestamp = formatTimestamp(new Date());
    await page.screenshot({ 
      path: getScreenshotPath(`TS.7.7.1-06-5-${timestamp}.png`) 
    });
  });

  // Expected Results:
  // 1. Signed ✓
  // 2. Audit viewed ✓
  // 3. Entry found ✓
  // 4. "Reviewed By" shown ✓
  // 5. Timestamp present ✓
});