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

test('TS.7.12.2-02 PDF Invalidation', async ({ page }) => {
  // Setup: Create and finalize a document
  const diegoEmail = process.env.MS_EMAIL_MSPM36_DIEGO_SICILIANI!;
  const password = process.env.MS_PASSWORD!;
  await microsoftLogin(page, diegoEmail, password);
  await handleERSDDialog(page);

  // Create a document
  await page.goto('/documents');
  await page.waitForLoadState('networkidle');
  
  await page.getByTestId('lsb.nav-main.documents-newDocument').click();
  await page.getByTestId('createDocumentDialog.documentNameInput').fill('PDF Invalidation Test');
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
  await page.waitForTimeout(5000); // Wait for PDF generation

  // Reload to ensure finalized state
  await page.reload();
  await page.waitForLoadState('networkidle');

  let pdfUrl: string | null = null;

  // Step 1: Check PDF URL.
  await test.step('Check PDF URL.', async () => {
    // Look for PDF download button or link
    const pdfButton = page.getByRole('button', { name: /PDF|Download.*PDF|View.*PDF/i });
    if (await pdfButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      // Get the PDF URL from the button
      pdfUrl = await pdfButton.getAttribute('href') || await pdfButton.getAttribute('data-url');
    } else {
      // Check for PDF link
      const pdfLink = page.getByRole('link', { name: /PDF|Download.*PDF|View.*PDF/i });
      if (await pdfLink.isVisible({ timeout: 5000 }).catch(() => false)) {
        pdfUrl = await pdfLink.getAttribute('href');
      }
    }
    
    // Verify PDF URL exists
    expect(pdfUrl).toBeTruthy();
  });

  // Re-open the document
  await page.getByRole('button', { name: /Re-open/i }).click();
  const dialog = page.getByRole('dialog');
  await dialog.getByRole('button', { name: /Confirm|Yes|Proceed|Re-open/i }).click();
  await page.waitForTimeout(3000);

  // Step 2: URL cleared.
  await test.step('URL cleared.', async () => {
    // Check that PDF button/link is no longer available
    const pdfButton = page.getByRole('button', { name: /PDF|Download.*PDF|View.*PDF/i });
    const pdfLink = page.getByRole('link', { name: /PDF|Download.*PDF|View.*PDF/i });
    
    await expect(pdfButton).not.toBeVisible();
    await expect(pdfLink).not.toBeVisible();
  });

  // Step 3: Old PDF invalid.
  await test.step('Old PDF invalid.', async () => {
    // If we had a PDF URL, try to access it
    if (pdfUrl) {
      const response = await page.request.get(pdfUrl, { failOnStatusCode: false });
      expect(response.status()).toBe(404); // Should return 404
    }
  });

  // Step 4: Cannot access.
  await test.step('Cannot access.', async () => {
    // Verify no PDF access is available in the UI
    await expect(page.getByText(/PDF.*not.*available|PDF.*invalid|Generate.*PDF/i)).toBeVisible();
  });

  // Step 5: Properly invalidated (SC)
  await test.step('Properly invalidated (SC)', async () => {
    // Take screenshot showing no PDF access after re-open
    const timestamp = new Date();
    const formattedTimestamp = `${timestamp.getFullYear()}.${String(timestamp.getMonth() + 1).padStart(2, '0')}.${String(timestamp.getDate()).padStart(2, '0')}-${String(timestamp.getHours()).padStart(2, '0')}.${String(timestamp.getMinutes()).padStart(2, '0')}.${String(timestamp.getSeconds()).padStart(2, '0')}`;
    await page.screenshot({ 
      path: getScreenshotPath(`TS.7.12.2-02-5-${formattedTimestamp}.png`) 
    });
  });

  // Expected Results:
  // 1. URL checked ✓
  // 2. Now empty ✓
  // 3. Link broken ✓
  // 4. 404 error ✓
  // 5. PDF removed ✓
});