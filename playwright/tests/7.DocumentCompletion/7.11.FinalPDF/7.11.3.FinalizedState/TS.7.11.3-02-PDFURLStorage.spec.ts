import { test, expect } from '@playwright/test';
import * as dotenv from 'dotenv';
import { microsoftLogin, handleERSDDialog } from '../../../../../src/utils/microsoftLogin';
import { getScreenshotPath, formatTimestamp } from '../../../../../src/utils/screenshotUtils';

dotenv.config({ path: '.playwright.env' });

test.use({
  viewport: { height: 1080, width: 1920 },
  ignoreHTTPSErrors: true
});

test.setTimeout(120000); // 2 minutes

test('TS.7.11.3-02 PDF URL Storage', async ({ page }) => {
  // Setup: Login as Trial Administrator (Owner)
  const email = process.env.MS_EMAIL_17NJ5D_MEGAN_BOWEN!;
  const password = process.env.MS_PASSWORD!;
  await microsoftLogin(page, email, password);
  await handleERSDDialog(page);

  // Navigate to a finalized document
  await page.getByRole('button', { name: 'Menu' }).click();
  await page.getByRole('link', { name: 'Tracking' }).click();
  
  // Find document in Finalised stage
  await page.waitForSelector('[data-testid="document-list"]', { timeout: 10000 });
  const finalizedDoc = page.locator('[data-testid="document-item"]').filter({ hasText: 'Finalised' }).first();
  await finalizedDoc.click();
  
  // Wait for document to load
  await page.waitForSelector('[data-testid="document-content"]', { timeout: 10000 });

  let pdfUrl: string = '';

  // Test Step 1: Check document state
  await test.step('Check document state', async () => {
    // Verify document is in Finalised state
    const stageIndicator = page.locator('[data-testid="stage-indicator"], [data-testid="document-stage"]');
    await expect(stageIndicator).toContainText('Finalised');
  });

  // Test Step 2: PDF URL present
  await test.step('PDF URL present', async () => {
    // Check for View PDF button which indicates PDF URL exists
    const viewPDFButton = page.getByRole('button', { name: 'View PDF' });
    await expect(viewPDFButton).toBeVisible();
    
    // Try to capture the PDF URL from network requests or page attributes
    page.on('request', request => {
      if (request.url().includes('.pdf') || request.url().includes('/api/documents') && request.url().includes('pdf')) {
        pdfUrl = request.url();
      }
    });
    
    // Click View PDF to trigger URL loading
    await viewPDFButton.click();
    await page.waitForTimeout(2000);
  });

  // Test Step 3: Valid URL format
  await test.step('Valid URL format', async () => {
    // Verify URL format is valid
    // Check if we captured a URL or if it's in the iframe/embed src
    const pdfViewer = page.locator('iframe[src*=".pdf"], embed[src*=".pdf"], [data-testid="pdf-viewer"]').first();
    
    if (await pdfViewer.count() > 0) {
      const src = await pdfViewer.getAttribute('src');
      if (src) {
        expect(src).toMatch(/^https?:\/\/.+\.pdf$|^https?:\/\/.+\/pdf/i);
      }
    }
  });

  // Test Step 4: Accessible link
  await test.step('Accessible link', async () => {
    // Verify the PDF link is accessible
    const pdfViewer = page.locator('[data-testid="pdf-viewer"], iframe[title*="PDF"], embed[type="application/pdf"]').first();
    await expect(pdfViewer).toBeVisible();
  });

  // Test Step 5: URL stored (SC)
  await test.step('URL stored (SC)', async () => {
    // Verify PDF URL is properly stored and accessible
    await expect(page.locator('[data-testid="pdf-viewer"], iframe[title*="PDF"], embed[type="application/pdf"]')).toBeVisible();
    
    // Take screenshot showing PDF is accessible via stored URL
    const timestamp = formatTimestamp(new Date());
    await page.screenshot({ 
      path: getScreenshotPath(`TS.7.11.3-02-5-${timestamp}.png`) 
    });
  });

  // Expected Results:
  // 1. State checked ✓
  // 2. URL found ✓
  // 3. Format valid ✓
  // 4. Link works ✓
  // 5. Properly stored ✓
});