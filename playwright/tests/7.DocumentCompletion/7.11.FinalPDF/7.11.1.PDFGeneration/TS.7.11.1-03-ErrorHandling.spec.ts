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

test('TS.7.11.1-03 Error Handling', async ({ page }) => {
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

  // Test Step 1: Simulate failure
  await test.step('Simulate failure', async () => {
    // Intercept PDF generation API call and force failure
    await page.route('**/api/documents/**/pdf', route => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ 
          error: 'PDF generation failed',
          message: 'An error occurred while generating the PDF'
        })
      });
    });

    // Click Final PDF button
    const finalPDFButton = page.getByRole('button', { name: 'Final PDF' });
    await finalPDFButton.click();
  });

  // Test Step 2: Error message shown
  await test.step('Error message shown', async () => {
    // Wait for and verify error message is displayed
    await expect(page.getByText(/error|failed|unable to generate/i)).toBeVisible({ timeout: 10000 });
  });

  // Test Step 3: Stays in Closed
  await test.step('Stays in Closed', async () => {
    // Verify document remains in Closed stage
    await expect(page.getByText('Closed')).toBeVisible();
    // Verify stage indicator hasn't changed
    const stageIndicator = page.locator('[data-testid="stage-indicator"], [data-testid="document-stage"]');
    await expect(stageIndicator).toContainText('Closed');
  });

  // Test Step 4: Can retry
  await test.step('Can retry', async () => {
    // Verify Final PDF button is still available for retry
    const finalPDFButton = page.getByRole('button', { name: 'Final PDF' });
    await expect(finalPDFButton).toBeVisible();
    await expect(finalPDFButton).toBeEnabled();
  });

  // Test Step 5: Graceful failure (SC)
  await test.step('Graceful failure (SC)', async () => {
    // Verify error is handled gracefully with appropriate UI feedback
    await expect(page.getByText(/error|failed/i)).toBeVisible();
    await expect(page.getByRole('button', { name: 'Final PDF' })).toBeEnabled();
    
    // Take screenshot of error state
    const timestamp = formatTimestamp(new Date());
    await page.screenshot({ 
      path: getScreenshotPath(`TS.7.11.1-03-5-${timestamp}.png`) 
    });
  });

  // Expected Results:
  // 1. Error triggered ✓
  // 2. Message displayed ✓
  // 3. Stage unchanged ✓
  // 4. Retry available ✓
  // 5. Handled well ✓
});