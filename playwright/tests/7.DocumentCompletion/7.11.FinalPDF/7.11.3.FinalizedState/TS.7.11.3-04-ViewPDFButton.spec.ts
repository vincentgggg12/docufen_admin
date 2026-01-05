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

test('TS.7.11.3-04 View PDF Button', async ({ page }) => {
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

  // Test Step 1: Document finalized
  await test.step('Document finalized', async () => {
    // Verify document is in Finalised state
    const stageIndicator = page.locator('[data-testid="stage-indicator"], [data-testid="document-stage"]');
    await expect(stageIndicator).toContainText('Finalised');
  });

  // Test Step 2: View PDF button shown
  await test.step('View PDF button shown', async () => {
    // Verify View PDF button is visible
    const viewPDFButton = page.getByRole('button', { name: 'View PDF' });
    await expect(viewPDFButton).toBeVisible();
    await expect(viewPDFButton).toBeEnabled();
  });

  // Test Step 3: Click button
  await test.step('Click button', async () => {
    // Click the View PDF button
    const viewPDFButton = page.getByRole('button', { name: 'View PDF' });
    await viewPDFButton.click();
    
    // Wait for PDF viewer to start loading
    await page.waitForTimeout(1000);
  });

  // Test Step 4: PDF opens
  await test.step('PDF opens', async () => {
    // Verify PDF viewer opens
    const pdfViewer = page.locator('[data-testid="pdf-viewer"], iframe[title*="PDF"], embed[type="application/pdf"], .pdf-viewer');
    await expect(pdfViewer).toBeVisible({ timeout: 15000 });
  });

  // Test Step 5: Easy access (SC)
  await test.step('Easy access (SC)', async () => {
    // Verify PDF is easily accessible through the button
    await expect(page.locator('[data-testid="pdf-viewer"], iframe[title*="PDF"], embed[type="application/pdf"]')).toBeVisible();
    
    // Take screenshot showing PDF viewer opened
    const timestamp = formatTimestamp(new Date());
    await page.screenshot({ 
      path: getScreenshotPath(`TS.7.11.3-04-5-${timestamp}.png`),
      fullPage: true 
    });
  });

  // Expected Results:
  // 1. Finalized state ✓
  // 2. Button visible ✓
  // 3. Clicked ✓
  // 4. PDF displayed ✓
  // 5. Access works ✓
});