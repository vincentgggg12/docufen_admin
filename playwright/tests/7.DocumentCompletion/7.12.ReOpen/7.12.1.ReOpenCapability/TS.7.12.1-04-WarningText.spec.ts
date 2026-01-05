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

test('TS.7.12.1-04 Warning Text', async ({ page }) => {
  // Setup: Create and finalize a document
  const diegoEmail = process.env.MS_EMAIL_MSPM36_DIEGO_SICILIANI!;
  const password = process.env.MS_PASSWORD!;
  await microsoftLogin(page, diegoEmail, password);
  await handleERSDDialog(page);

  // Create a document
  await page.goto('/documents');
  await page.waitForLoadState('networkidle');
  
  await page.getByTestId('lsb.nav-main.documents-newDocument').click();
  await page.getByTestId('createDocumentDialog.documentNameInput').fill('Re-Open Warning Text Test');
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

  // Click re-open to show dialog
  await page.getByRole('button', { name: /Re-open/i }).click();

  // Step 1: Read warning.
  await test.step('Read warning.', async () => {
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    
    // Verify warning text is readable
    const warningText = await dialog.textContent();
    expect(warningText).toBeTruthy();
    expect(warningText!.length).toBeGreaterThan(50); // Substantial warning text
  });

  // Step 2: GxP implications stated.
  await test.step('GxP implications stated.', async () => {
    const dialog = page.getByRole('dialog');
    
    // Check for GxP compliance mentions
    await expect(dialog.getByText(/GxP|compliance|regulatory|quality|validation/i)).toBeVisible();
  });

  // Step 3: System update mentioned.
  await test.step('System update mentioned.', async () => {
    const dialog = page.getByRole('dialog');
    
    // Check for system update mentions
    await expect(dialog.getByText(/system.*update|audit|track|record/i)).toBeVisible();
  });

  // Step 4: Clear consequences.
  await test.step('Clear consequences.', async () => {
    const dialog = page.getByRole('dialog');
    
    // Check for clear consequence descriptions
    await expect(dialog.getByText(/PDF.*invalid|document.*edit|stage.*revert|consequence/i)).toBeVisible();
  });

  // Step 5: Comprehensive warning (SC)
  await test.step('Comprehensive warning (SC)', async () => {
    // Take screenshot of the full warning dialog
    const timestamp = new Date();
    const formattedTimestamp = `${timestamp.getFullYear()}.${String(timestamp.getMonth() + 1).padStart(2, '0')}.${String(timestamp.getDate()).padStart(2, '0')}-${String(timestamp.getHours()).padStart(2, '0')}.${String(timestamp.getMinutes()).padStart(2, '0')}.${String(timestamp.getSeconds()).padStart(2, '0')}`;
    await page.screenshot({ 
      path: getScreenshotPath(`TS.7.12.1-04-5-${formattedTimestamp}.png`) 
    });
  });

  // Expected Results:
  // 1. Warning read ✓
  // 2. Compliance noted ✓
  // 3. Updates mentioned ✓
  // 4. Impact clear ✓
  // 5. Full disclosure ✓
});