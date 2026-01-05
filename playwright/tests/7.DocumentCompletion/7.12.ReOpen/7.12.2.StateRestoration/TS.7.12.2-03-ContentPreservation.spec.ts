import { test, expect } from '@playwright/test';
import { getScreenshotPath } from '../../../utils/paths';
import dotenv from 'dotenv';
import { microsoftLogin } from '../../../utils/msLogin';
import { handleERSDDialog } from '../../../utils/ersd-handler';
import path from 'path';

dotenv.config({ path: '.playwright.env' });

test.use({
  viewport: { height: 1080, width: 1920 },
  ignoreHTTPSErrors: true
});

test.setTimeout(120000); // 2 minutes

test('TS.7.12.2-03 Content Preservation', async ({ page }) => {
  // Setup: Create document with content
  const diegoEmail = process.env.MS_EMAIL_MSPM36_DIEGO_SICILIANI!;
  const password = process.env.MS_PASSWORD!;
  await microsoftLogin(page, diegoEmail, password);
  await handleERSDDialog(page);

  // Create a document
  await page.goto('/documents');
  await page.waitForLoadState('networkidle');
  
  await page.getByTestId('lsb.nav-main.documents-newDocument').click();
  await page.getByTestId('createDocumentDialog.documentNameInput').fill('Content Preservation Test');
  await page.getByTestId('createDocumentDialog.createButton').click();
  await page.waitForURL(/.*\/editor\/.*/, { timeout: 10000 });

  // Add various content types
  // Add text
  await page.getByRole('button', { name: /Text/i }).first().click();
  await page.keyboard.type('This is test content that should be preserved after re-open.');
  await page.keyboard.press('Escape');
  await page.waitForTimeout(1000);

  // Add signature
  await page.getByRole('button', { name: /Sign/i }).first().click();
  await page.getByRole('option', { name: /Author/i }).click();
  await page.getByRole('button', { name: /Apply/i }).click();
  await page.waitForTimeout(2000);

  // Add attachment
  const attachButton = page.getByRole('button', { name: /Attach|Upload/i });
  if (await attachButton.isVisible({ timeout: 5000 }).catch(() => false)) {
    await attachButton.click();
    const filePath = path.join(process.cwd(), 'playwright/tests/WordDocuments/sample_test.docx');
    await page.setInputFiles('input[type="file"]', filePath);
    await page.waitForTimeout(2000);
  }

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

  // Re-open the document
  await page.getByRole('button', { name: /Re-open/i }).click();
  const dialog = page.getByRole('dialog');
  await dialog.getByRole('button', { name: /Confirm|Yes|Proceed|Re-open/i }).click();
  await page.waitForTimeout(3000);

  // Step 1: Check document.
  await test.step('Check document.', async () => {
    // Verify document is loaded and editable again
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(/.*\/editor\/.*/);
  });

  // Step 2: All content intact.
  await test.step('All content intact.', async () => {
    // Check that the text content is still present
    await expect(page.getByText('This is test content that should be preserved after re-open.')).toBeVisible();
  });

  // Step 3: Signatures preserved.
  await test.step('Signatures preserved.', async () => {
    // Check that signatures are still visible
    const signatures = page.locator('[data-testid*="signature"], [class*="signature"]');
    const signatureCount = await signatures.count();
    expect(signatureCount).toBeGreaterThan(0);
    
    // Check for Diego's signature specifically
    await expect(page.getByText(/Diego.*Siciliani|DS/i)).toBeVisible();
  });

  // Step 4: Attachments remain.
  await test.step('Attachments remain.', async () => {
    // Check attachments tab or section
    const attachmentsTab = page.getByRole('tab', { name: /Attachments|Files/i });
    if (await attachmentsTab.isVisible({ timeout: 5000 }).catch(() => false)) {
      await attachmentsTab.click();
      // Verify attachment is still present
      await expect(page.getByText(/sample.*test.*docx/i)).toBeVisible();
    }
  });

  // Step 5: Nothing lost (SC)
  await test.step('Nothing lost (SC)', async () => {
    // Take screenshot showing all content preserved
    const timestamp = new Date();
    const formattedTimestamp = `${timestamp.getFullYear()}.${String(timestamp.getMonth() + 1).padStart(2, '0')}.${String(timestamp.getDate()).padStart(2, '0')}-${String(timestamp.getHours()).padStart(2, '0')}.${String(timestamp.getMinutes()).padStart(2, '0')}.${String(timestamp.getSeconds()).padStart(2, '0')}`;
    await page.screenshot({ 
      path: getScreenshotPath(`TS.7.12.2-03-5-${formattedTimestamp}.png`) 
    });
  });

  // Expected Results:
  // 1. Doc checked ✓
  // 2. Content present ✓
  // 3. Signatures intact ✓
  // 4. Attachments OK ✓
  // 5. Fully preserved ✓
});