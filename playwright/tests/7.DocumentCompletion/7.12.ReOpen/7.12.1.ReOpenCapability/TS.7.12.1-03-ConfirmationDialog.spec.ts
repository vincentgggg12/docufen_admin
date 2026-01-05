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

test('TS.7.12.1-03 Confirmation Dialog', async ({ page }) => {
  // Setup: Create and finalize a document
  const diegoEmail = process.env.MS_EMAIL_MSPM36_DIEGO_SICILIANI!;
  const password = process.env.MS_PASSWORD!;
  await microsoftLogin(page, diegoEmail, password);
  await handleERSDDialog(page);

  // Create a document
  await page.goto('/documents');
  await page.waitForLoadState('networkidle');
  
  await page.getByTestId('lsb.nav-main.documents-newDocument').click();
  await page.getByTestId('createDocumentDialog.documentNameInput').fill('Re-Open Confirmation Test');
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

  // Step 1: Click re-open.
  await test.step('Click re-open.', async () => {
    const reopenButton = page.getByRole('button', { name: /Re-open/i });
    await reopenButton.click();
  });

  // Step 2: Warning dialog.
  await test.step('Warning dialog.', async () => {
    // Verify dialog is displayed
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    
    // Check for warning heading
    await expect(dialog.getByRole('heading', { name: /Warning|Confirm|Re-open/i })).toBeVisible();
  });

  // Step 3: PDF invalidation warning.
  await test.step('PDF invalidation warning.', async () => {
    const dialog = page.getByRole('dialog');
    
    // Check for PDF invalidation warning text
    await expect(dialog.getByText(/PDF.*invalid|invalidate.*PDF|PDF.*will.*no.*longer.*valid/i)).toBeVisible();
  });

  // Step 4: Must confirm.
  await test.step('Must confirm.', async () => {
    const dialog = page.getByRole('dialog');
    
    // Check for confirm and cancel buttons
    const confirmButton = dialog.getByRole('button', { name: /Confirm|Yes|Proceed|Re-open/i });
    const cancelButton = dialog.getByRole('button', { name: /Cancel|No|Back/i });
    
    await expect(confirmButton).toBeVisible();
    await expect(cancelButton).toBeVisible();
    
    // Cancel to keep dialog open for screenshot
    await cancelButton.click();
    await page.waitForTimeout(500);
    
    // Click re-open again to show dialog
    await page.getByRole('button', { name: /Re-open/i }).click();
  });

  // Step 5: Protection step (SC)
  await test.step('Protection step (SC)', async () => {
    // Take screenshot of the confirmation dialog
    const timestamp = new Date();
    const formattedTimestamp = `${timestamp.getFullYear()}.${String(timestamp.getMonth() + 1).padStart(2, '0')}.${String(timestamp.getDate()).padStart(2, '0')}-${String(timestamp.getHours()).padStart(2, '0')}.${String(timestamp.getMinutes()).padStart(2, '0')}.${String(timestamp.getSeconds()).padStart(2, '0')}`;
    await page.screenshot({ 
      path: getScreenshotPath(`TS.7.12.1-03-5-${formattedTimestamp}.png`) 
    });
    
    // Close dialog
    const dialog = page.getByRole('dialog');
    await dialog.getByRole('button', { name: /Cancel|No|Back/i }).click();
  });

  // Expected Results:
  // 1. Clicked ✓
  // 2. Dialog shown ✓
  // 3. Warning displayed ✓
  // 4. Confirmation required ✓
  // 5. Safety check ✓
});