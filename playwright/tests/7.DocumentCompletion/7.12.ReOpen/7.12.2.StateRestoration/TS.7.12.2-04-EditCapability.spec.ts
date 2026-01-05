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

test('TS.7.12.2-04 Edit Capability', async ({ page }) => {
  // Setup: Create and finalize a document
  const diegoEmail = process.env.MS_EMAIL_MSPM36_DIEGO_SICILIANI!;
  const password = process.env.MS_PASSWORD!;
  await microsoftLogin(page, diegoEmail, password);
  await handleERSDDialog(page);

  // Create a document
  await page.goto('/documents');
  await page.waitForLoadState('networkidle');
  
  await page.getByTestId('lsb.nav-main.documents-newDocument').click();
  await page.getByTestId('createDocumentDialog.documentNameInput').fill('Edit Capability Test');
  await page.getByTestId('createDocumentDialog.createButton').click();
  await page.waitForURL(/.*\/editor\/.*/, { timeout: 10000 });

  // Add initial content
  await page.getByRole('button', { name: /Text/i }).first().click();
  await page.keyboard.type('Initial content before finalization.');
  await page.keyboard.press('Escape');
  await page.waitForTimeout(1000);

  // Add signature and finalize
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

  // Step 1: Document re-opened.
  await test.step('Document re-opened.', async () => {
    // Click re-open button
    await page.getByRole('button', { name: /Re-open/i }).click();
    
    // Confirm in dialog
    const dialog = page.getByRole('dialog');
    await dialog.getByRole('button', { name: /Confirm|Yes|Proceed|Re-open/i }).click();
    
    // Wait for re-open to complete
    await page.waitForTimeout(3000);
    
    // Verify document is in Post-Approval stage (not finalized)
    await expect(page.getByText(/Post-Approval|Post Approval/i)).toBeVisible();
  });

  // Step 2: Can add content.
  await test.step('Can add content.', async () => {
    // Try to add new text
    await page.getByRole('button', { name: /Text/i }).first().click();
    await page.keyboard.type('New content added after re-opening.');
    await page.keyboard.press('Escape');
    await page.waitForTimeout(1000);
    
    // Verify new content is visible
    await expect(page.getByText('New content added after re-opening.')).toBeVisible();
  });

  // Step 3: Can add signatures.
  await test.step('Can add signatures.', async () => {
    // Add another signature
    await page.getByRole('button', { name: /Sign/i }).first().click();
    await page.getByRole('option', { name: /Reviewer|Approver/i }).click();
    await page.getByRole('button', { name: /Apply/i }).click();
    await page.waitForTimeout(2000);
    
    // Verify multiple signatures exist
    const signatures = page.locator('[data-testid*="signature"], [class*="signature"]');
    const signatureCount = await signatures.count();
    expect(signatureCount).toBeGreaterThan(1); // Should have at least 2 signatures now
  });

  // Step 4: Full edit mode.
  await test.step('Full edit mode.', async () => {
    // Verify all editing buttons are available
    await expect(page.getByRole('button', { name: /Text/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Sign/i })).toBeVisible();
    
    // Check for other editing capabilities
    const attachButton = page.getByRole('button', { name: /Attach|Upload/i });
    const noteButton = page.getByRole('button', { name: /Note|Comment/i });
    
    // At least some editing buttons should be visible
    const editButtonsVisible = 
      await attachButton.isVisible({ timeout: 1000 }).catch(() => false) ||
      await noteButton.isVisible({ timeout: 1000 }).catch(() => false);
    
    expect(editButtonsVisible).toBeTruthy();
  });

  // Step 5: Editing restored (SC)
  await test.step('Editing restored (SC)', async () => {
    // Take screenshot showing full editing capabilities restored
    const timestamp = new Date();
    const formattedTimestamp = `${timestamp.getFullYear()}.${String(timestamp.getMonth() + 1).padStart(2, '0')}.${String(timestamp.getDate()).padStart(2, '0')}-${String(timestamp.getHours()).padStart(2, '0')}.${String(timestamp.getMinutes()).padStart(2, '0')}.${String(timestamp.getSeconds()).padStart(2, '0')}`;
    await page.screenshot({ 
      path: getScreenshotPath(`TS.7.12.2-04-5-${formattedTimestamp}.png`) 
    });
  });

  // Expected Results:
  // 1. Re-opened state ✓
  // 2. Content addable ✓
  // 3. Signing enabled ✓
  // 4. All functions work ✓
  // 5. Edit capability back ✓
});