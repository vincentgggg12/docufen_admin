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

test('TS.7.5.3-05 Void Audit Recording', async ({ page }) => {
  // Setup: Login as owner
  const email = process.env.MS_EMAIL_MSPM36_DIEGO_SICILIANI!;
  const password = process.env.MS_PASSWORD!;
  await microsoftLogin(page, email, password);
  await handleERSDDialog(page);

  // Create a document
  await page.goto('/documents');
  await page.waitForLoadState('networkidle');
  
  await page.getByTestId('lsb.nav-main.documents-newDocument').click();
  await page.getByTestId('createDocumentDialog.documentNameInput').fill('Void Audit Test');
  await page.getByTestId('createDocumentDialog.createButton').click();
  await page.waitForURL(/.*\/editor\/.*/, { timeout: 10000 });

  // Add content to trigger void button
  const editor = page.getByTestId('editor-content');
  await editor.click();
  await page.keyboard.type('Document content for audit recording test');
  await page.waitForTimeout(1000);

  // Store the void reason for later verification
  const voidReason = 'This document is being voided for audit testing purposes';

  // Step 1: Void document
  await test.step('Void document.', async () => {
    // Click Void button
    await page.getByRole('button', { name: 'Void' }).click();
    
    // Enter void reason
    const reasonField = page.getByTestId('voidReasonDialog.reasonTextarea');
    await reasonField.fill(voidReason);
    
    // Confirm void
    const confirmButton = page.getByTestId('voidReasonDialog.confirmButton');
    await confirmButton.click();
    
    // Wait for void process to complete
    await page.waitForTimeout(2000);
  });

  // Step 2: Check audit log
  await test.step('Check audit log.', async () => {
    // Navigate to audit log/history
    // Try multiple possible ways to access audit
    
    // Option 1: Audit button in toolbar
    const auditButton = page.getByRole('button', { name: /Audit|History|Activity/i });
    if (await auditButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await auditButton.click();
    } else {
      // Option 2: Through menu
      const menuButton = page.getByRole('button', { name: 'Menu' });
      if (await menuButton.isVisible({ timeout: 1000 }).catch(() => false)) {
        await menuButton.click();
        await page.getByRole('link', { name: /Audit|History/i }).click();
      } else {
        // Option 3: Document info panel
        const infoButton = page.getByRole('button', { name: /Info|Details/i });
        if (await infoButton.isVisible({ timeout: 1000 }).catch(() => false)) {
          await infoButton.click();
          await page.getByRole('tab', { name: /Audit|History/i }).click();
        }
      }
    }
    
    // Wait for audit entries to load
    await page.waitForTimeout(1000);
  });

  // Step 3: Find void entry
  await test.step('Find void entry.', async () => {
    // Look for void entry in audit log
    const voidEntry = page.getByText(/Void|Voided/i).first();
    await expect(voidEntry).toBeVisible();
    
    // Alternative: Look for specific audit entry
    const auditEntries = page.getByTestId(/audit-entry|activity-entry/i);
    const voidAuditEntry = auditEntries.filter({ hasText: /Void/i }).first();
    if (await voidAuditEntry.isVisible({ timeout: 1000 }).catch(() => false)) {
      await expect(voidAuditEntry).toBeVisible();
    }
  });

  // Step 4: Shows reason
  await test.step('Shows reason.', async () => {
    // Verify the void reason is captured in audit
    const reasonText = page.getByText(voidReason);
    await expect(reasonText).toBeVisible();
    
    // Alternative: Check for partial match
    if (!await reasonText.isVisible({ timeout: 1000 }).catch(() => false)) {
      const partialReason = page.getByText(/audit testing purposes/i);
      await expect(partialReason).toBeVisible();
    }
  });

  // Step 5: Actor recorded (SC)
  await test.step('Actor recorded (SC)', async () => {
    // Verify user information is recorded
    const userInfo = page.getByText(/Diego.*Siciliani|DS|diego\.siciliani/i);
    await expect(userInfo).toBeVisible();
    
    // Take screenshot showing audit entry with user and reason
    const timestamp = new Date();
    const formattedTimestamp = `${timestamp.getFullYear()}.${String(timestamp.getMonth() + 1).padStart(2, '0')}.${String(timestamp.getDate()).padStart(2, '0')}-${String(timestamp.getHours()).padStart(2, '0')}.${String(timestamp.getMinutes()).padStart(2, '0')}.${String(timestamp.getSeconds()).padStart(2, '0')}`;
    await page.screenshot({ 
      path: getScreenshotPath(`TS.7.5.3-05-5-${formattedTimestamp}.png`) 
    });
    
    // Additional verification - timestamp should be present
    const timePattern = /\d{1,2}:\d{2}|\d{4}-\d{2}-\d{2}|ago|AM|PM/i;
    const timestampElement = page.getByText(timePattern).first();
    await expect(timestampElement).toBeVisible();
  });

  // Expected Results:
  // 1. Doc voided ✓
  // 2. Audit checked ✓
  // 3. Entry found ✓
  // 4. Reason captured ✓
  // 5. User identified ✓
});