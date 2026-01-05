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

test('TS.7.11.1-01 PDF Creation Trigger', async ({ page }) => {
  // Setup: Login as Trial Administrator (Owner)
  const email = process.env.MS_EMAIL_17NJ5D_MEGAN_BOWEN!;
  const password = process.env.MS_PASSWORD!;
  await microsoftLogin(page, email, password);
  await handleERSDDialog(page);

  // Navigate to a document in Closed stage
  await page.getByRole('button', { name: 'Menu' }).click();
  await page.getByRole('link', { name: 'Tracking' }).click();
  
  // Find document in Closed stage
  await page.waitForSelector('[data-testid="document-list"]', { timeout: 10000 });
  const closedDoc = page.locator('[data-testid="document-item"]').filter({ hasText: 'Closed' }).first();
  await closedDoc.click();
  
  // Wait for document to load
  await page.waitForSelector('[data-testid="document-content"]', { timeout: 10000 });

  // Test Step 1: Click Final PDF
  await test.step('Click Final PDF', async () => {
    const finalPDFButton = page.getByRole('button', { name: 'Final PDF' });
    await expect(finalPDFButton).toBeVisible();
    await finalPDFButton.click();
  });

  // Test Step 2: Generation starts
  await test.step('Generation starts', async () => {
    // Verify that PDF generation process has started
    await expect(page.getByText(/Creating PDF|Generating PDF|Processing/i)).toBeVisible({ timeout: 5000 });
  });

  // Test Step 3: API call made
  await test.step('API call made', async () => {
    // Monitor network for PDF generation API call
    const apiPromise = page.waitForResponse(response => 
      response.url().includes('/api/documents') && 
      response.url().includes('pdf') &&
      response.request().method() === 'POST'
    );
    
    // API call should be made within a reasonable time
    await apiPromise;
  });

  // Test Step 4: Processing begins
  await test.step('Processing begins', async () => {
    // Verify processing state is shown
    await expect(page.getByRole('progressbar')).toBeVisible();
    await expect(page.getByText(/Processing|Creating/i)).toBeVisible();
  });

  // Test Step 5: PDF creating (SC)
  await test.step('PDF creating (SC)', async () => {
    // Verify PDF creation is in progress
    await expect(page.getByText(/Creating PDF|Generating PDF/i)).toBeVisible();
    
    // Take screenshot of PDF creation in progress
    const timestamp = formatTimestamp(new Date());
    await page.screenshot({ 
      path: getScreenshotPath(`TS.7.11.1-01-5-${timestamp}.png`) 
    });
  });

  // Expected Results:
  // 1. Button clicked ✓
  // 2. Process initiated ✓
  // 3. API called ✓
  // 4. Server processing ✓
  // 5. Generation started ✓
});