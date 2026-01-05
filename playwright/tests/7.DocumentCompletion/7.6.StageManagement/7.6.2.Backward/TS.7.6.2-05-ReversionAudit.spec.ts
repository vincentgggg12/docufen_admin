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

test('TS.7.6.2-05 Reversion Audit', async ({ page }) => {
  // Setup: Login as owner
  const diegoEmail = process.env.MS_EMAIL_MSPM36_DIEGO_SICILIANI!;
  const password = process.env.MS_PASSWORD!;
  await microsoftLogin(page, diegoEmail, password);
  await handleERSDDialog(page);

  // Create a document
  await page.goto('/documents');
  await page.waitForLoadState('networkidle');
  
  await page.getByTestId('lsb.nav-main.documents-newDocument').click();
  await page.getByTestId('createDocumentDialog.documentNameInput').fill('Reversion Audit Test');
  await page.getByTestId('createDocumentDialog.createButton').click();
  await page.waitForURL(/.*\/editor\/.*/, { timeout: 10000 });

  // Advance document to a later stage
  const forwardButton = page.getByRole('button', { name: /Next Stage|Forward|Advance/i });
  if (await forwardButton.isVisible({ timeout: 5000 }).catch(() => false)) {
    await forwardButton.click();
    await page.waitForTimeout(2000);
    
    // Handle any confirmation dialogs
    const confirmButton = page.getByRole('button', { name: /Confirm|Yes|Continue/i });
    if (await confirmButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await confirmButton.click();
      await page.waitForTimeout(1000);
    }
  }

  const reversionReason = 'Testing audit trail for stage reversion - verification of tracking';

  // Step 1: Revert with reason
  await test.step('Revert with reason.', async () => {
    // Click back button to initiate reversion
    const backButton = page.getByRole('button', { name: /Back|Previous|Revert|Previous Stage/i });
    await backButton.click();
    
    // Enter reason in the modal
    const reasonInput = page.getByPlaceholder(/reason|explanation/i);
    await reasonInput.fill(reversionReason);
    
    // Submit the reversion
    const submitButton = page.getByRole('button', { name: /Submit|Confirm|Revert/i });
    await submitButton.click();
    
    await page.waitForTimeout(2000);
  });

  // Step 2: Check audit log
  await test.step('Check audit log.', async () => {
    // Navigate to audit log
    // First try via tabs
    const auditTab = page.getByRole('tab', { name: /Audit|History|Log/i });
    if (await auditTab.isVisible({ timeout: 3000 }).catch(() => false)) {
      await auditTab.click();
    } else {
      // Try via menu
      const menuButton = page.getByRole('button', { name: /Menu|More|Options/i });
      if (await menuButton.isVisible({ timeout: 2000 }).catch(() => false)) {
        await menuButton.click();
        const auditLink = page.getByRole('link', { name: /Audit|History|Log/i });
        if (await auditLink.isVisible({ timeout: 2000 }).catch(() => false)) {
          await auditLink.click();
        }
      }
    }
    
    await page.waitForTimeout(2000);
  });

  // Step 3: Reversion logged
  await test.step('Reversion logged.', async () => {
    // Look for the reversion entry in the audit log
    const reversionEntry = page.getByText(/revert|reversed|moved back|stage change/i);
    await expect(reversionEntry.first()).toBeVisible();
  });

  // Step 4: Reason captured
  await test.step('Reason captured.', async () => {
    // Verify the reason is captured in the audit log
    const reasonText = page.getByText(reversionReason);
    await expect(reasonText).toBeVisible();
  });

  // Step 5: Full tracking (SC)
  await test.step('Full tracking (SC)', async () => {
    // Take screenshot of the audit log showing the reversion entry
    const timestamp = new Date();
    const formattedTimestamp = `${timestamp.getFullYear()}.${String(timestamp.getMonth() + 1).padStart(2, '0')}.${String(timestamp.getDate()).padStart(2, '0')}-${String(timestamp.getHours()).padStart(2, '0')}.${String(timestamp.getMinutes()).padStart(2, '0')}.${String(timestamp.getSeconds()).padStart(2, '0')}`;
    await page.screenshot({ 
      path: getScreenshotPath(`TS.7.6.2-05-5-${formattedTimestamp}.png`) 
    });
  });

  // Expected Results:
  // 1. Stage reverted ✓
  // 2. Audit checked ✓
  // 3. Entry found ✓
  // 4. Reason recorded ✓
  // 5. Complete record ✓
});