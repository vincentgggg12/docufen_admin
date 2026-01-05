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

test('TS.7.12.1-05 Re-Open Audit', async ({ page }) => {
  // Setup: Create and finalize a document
  const diegoEmail = process.env.MS_EMAIL_MSPM36_DIEGO_SICILIANI!;
  const password = process.env.MS_PASSWORD!;
  await microsoftLogin(page, diegoEmail, password);
  await handleERSDDialog(page);

  // Create a document
  await page.goto('/documents');
  await page.waitForLoadState('networkidle');
  
  await page.getByTestId('lsb.nav-main.documents-newDocument').click();
  await page.getByTestId('createDocumentDialog.documentNameInput').fill('Re-Open Audit Test');
  await page.getByTestId('createDocumentDialog.createButton').click();
  await page.waitForURL(/.*\/editor\/.*/, { timeout: 10000 });

  // Add some content and finalize the document
  await page.getByRole('button', { name: /Sign/i }).first().click();
  await page.getByRole('option', { name: /Author/i }).click();
  await page.getByRole('button', { name: /Apply/i }).click();
  await page.waitForTimeout(2000);

  // Move through stages to finalize
  await page.getByRole('button', { name: /To Execution/i }).click();
  await page.waitForTimeout(2000);
  await page.getByRole('button', { name: /To Post-Approval/i }).click();
  await page.waitForTimeout(2000);
  await page.getByRole('button', { name: /Finalise/i }).click();
  await page.waitForTimeout(3000);

  // Reload to ensure finalized state
  await page.reload();
  await page.waitForLoadState('networkidle');

  // Step 1: Re-open document.
  await test.step('Re-open document.', async () => {
    // Click re-open button
    await page.getByRole('button', { name: /Re-open/i }).click();
    
    // Confirm in dialog
    const dialog = page.getByRole('dialog');
    await dialog.getByRole('button', { name: /Confirm|Yes|Proceed|Re-open/i }).click();
    
    // Wait for re-open to complete
    await page.waitForTimeout(3000);
  });

  // Step 2: Check audit.
  await test.step('Check audit.', async () => {
    // Navigate to audit trail
    const auditTab = page.getByRole('tab', { name: /Audit|History|Trail/i });
    if (await auditTab.isVisible({ timeout: 5000 }).catch(() => false)) {
      await auditTab.click();
    } else {
      // Try alternative navigation
      await page.getByRole('button', { name: /Menu|More/i }).click();
      await page.getByRole('menuitem', { name: /Audit|History/i }).click();
    }
    
    await page.waitForLoadState('networkidle');
  });

  // Step 3: Re-open recorded.
  await test.step('Re-open recorded.', async () => {
    // Look for re-open entry in audit trail
    const reopenEntry = page.getByText(/re-open|reopened|document.*opened/i).first();
    await expect(reopenEntry).toBeVisible();
  });

  // Step 4: Owner identified.
  await test.step('Owner identified.', async () => {
    // Check that Diego Siciliani is shown as the actor
    await expect(page.getByText(/Diego.*Siciliani/i)).toBeVisible();
  });

  // Step 5: Time logged (SC)
  await test.step('Time logged (SC)', async () => {
    // Verify timestamp is present
    const today = new Date();
    const datePattern = new RegExp(`${today.getFullYear()}|${String(today.getMonth() + 1).padStart(2, '0')}|${String(today.getDate()).padStart(2, '0')}`);
    await expect(page.getByText(datePattern)).toBeVisible();
    
    // Take screenshot of audit trail showing re-open entry
    const timestamp = new Date();
    const formattedTimestamp = `${timestamp.getFullYear()}.${String(timestamp.getMonth() + 1).padStart(2, '0')}.${String(timestamp.getDate()).padStart(2, '0')}-${String(timestamp.getHours()).padStart(2, '0')}.${String(timestamp.getMinutes()).padStart(2, '0')}.${String(timestamp.getSeconds()).padStart(2, '0')}`;
    await page.screenshot({ 
      path: getScreenshotPath(`TS.7.12.1-05-5-${formattedTimestamp}.png`) 
    });
  });

  // Expected Results:
  // 1. Re-opened ✓
  // 2. Audit checked ✓
  // 3. Entry found ✓
  // 4. Actor shown ✓
  // 5. Timestamp present ✓
});