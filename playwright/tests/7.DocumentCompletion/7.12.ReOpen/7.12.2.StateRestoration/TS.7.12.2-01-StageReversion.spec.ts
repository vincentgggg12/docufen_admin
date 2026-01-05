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

test('TS.7.12.2-01 Stage Reversion', async ({ page }) => {
  // Setup: Create and finalize a document
  const diegoEmail = process.env.MS_EMAIL_MSPM36_DIEGO_SICILIANI!;
  const password = process.env.MS_PASSWORD!;
  await microsoftLogin(page, diegoEmail, password);
  await handleERSDDialog(page);

  // Create a document
  await page.goto('/documents');
  await page.waitForLoadState('networkidle');
  
  await page.getByTestId('lsb.nav-main.documents-newDocument').click();
  await page.getByTestId('createDocumentDialog.documentNameInput').fill('Stage Reversion Test');
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

  // Step 1: Re-open finalized.
  await test.step('Re-open finalized.', async () => {
    // Click re-open button
    await page.getByRole('button', { name: /Re-open/i }).click();
    
    // Confirm in dialog
    const dialog = page.getByRole('dialog');
    await dialog.getByRole('button', { name: /Confirm|Yes|Proceed|Re-open/i }).click();
    
    // Wait for re-open to complete
    await page.waitForTimeout(3000);
  });

  // Step 2: Stage changes.
  await test.step('Stage changes.', async () => {
    // Wait for stage change to be reflected
    await page.waitForLoadState('networkidle');
    
    // Verify finalized state is no longer shown
    await expect(page.getByText(/Finalised|Finalized/i)).not.toBeVisible();
  });

  // Step 3: Now Post-Approval.
  await test.step('Now Post-Approval.', async () => {
    // Verify document is in Post-Approval stage
    await expect(page.getByText(/Post-Approval|Post Approval/i)).toBeVisible();
  });

  // Step 4: Not finalized.
  await test.step('Not finalized.', async () => {
    // Verify document is no longer finalized
    const finalizeButton = page.getByRole('button', { name: /Finalise|Finalize/i });
    await expect(finalizeButton).toBeVisible(); // Can finalize again
    
    // Re-open button should not be visible anymore
    const reopenButton = page.getByRole('button', { name: /Re-open/i });
    await expect(reopenButton).not.toBeVisible();
  });

  // Step 5: Stage reverted (SC)
  await test.step('Stage reverted (SC)', async () => {
    // Take screenshot showing Post-Approval stage after re-open
    const timestamp = new Date();
    const formattedTimestamp = `${timestamp.getFullYear()}.${String(timestamp.getMonth() + 1).padStart(2, '0')}.${String(timestamp.getDate()).padStart(2, '0')}-${String(timestamp.getHours()).padStart(2, '0')}.${String(timestamp.getMinutes()).padStart(2, '0')}.${String(timestamp.getSeconds()).padStart(2, '0')}`;
    await page.screenshot({ 
      path: getScreenshotPath(`TS.7.12.2-01-5-${formattedTimestamp}.png`) 
    });
  });

  // Expected Results:
  // 1. Re-opened ✓
  // 2. Stage updated ✓
  // 3. Post-Approval stage ✓
  // 4. Finalised cleared ✓
  // 5. Properly reverted ✓
});