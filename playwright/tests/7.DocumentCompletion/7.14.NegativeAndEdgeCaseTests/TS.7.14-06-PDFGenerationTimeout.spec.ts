import { test, expect } from '@playwright/test';
import * as dotenv from 'dotenv';
import { microsoftLogin, handleERSDDialog } from '../../src/utils/microsoftLogin';
import { getScreenshotPath, formatTimestamp } from '../../src/utils/screenshotUtils';

dotenv.config({ path: '.playwright.env' });

test.use({
  viewport: { height: 1080, width: 1920 },
  ignoreHTTPSErrors: true
});

test.setTimeout(360000); // 6 minutes for timeout test

test('TS.7.14-06 PDF Generation Timeout', async ({ page }) => {
  // Login
  const email = process.env.MS_EMAIL_17NJ5D_CHRIS_GREEN!;
  const password = process.env.MS_PASSWORD!;
  await microsoftLogin(page, email, password);
  await handleERSDDialog(page);

  // Navigate to Archive page
  await page.getByRole('button', { name: 'Menu' }).click();
  await page.getByRole('link', { name: 'Archive' }).click();
  await page.waitForLoadState('networkidle');

  // Test Step 1: Trigger long PDF generation
  await test.step('Trigger long PDF generation', async () => {
    // Select a large or complex document
    const firstDocument = page.locator('[data-testid="archive-document-row"], tbody tr').first();
    await firstDocument.click();
    
    // Intercept PDF generation request to simulate delay
    await page.route('**/api/documents/*/pdf', async route => {
      if (route.request().method() === 'GET' || route.request().method() === 'POST') {
        // Wait for 5+ minutes before responding to simulate timeout
        await page.waitForTimeout(310000); // 5 minutes 10 seconds
        await route.fulfill({
          status: 504,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'PDF generation timed out' })
        });
      }
    });
    
    // Click Download PDF button
    await page.getByRole('button', { name: /Download PDF|Generate PDF|Export.*PDF/i }).click();
    
    // Show loading indicator
    await expect(page.getByText(/Generating|Processing|Creating.*PDF/i)).toBeVisible({ timeout: 10000 });
  });

  // Test Step 2: Wait 5 minutes
  await test.step('Wait 5 minutes', async () => {
    // The route handler above will enforce the 5-minute wait
    // Monitor for any loading indicators
    let loadingVisible = true;
    const startTime = Date.now();
    
    while (loadingVisible && (Date.now() - startTime) < 310000) {
      loadingVisible = await page.getByText(/Generating|Processing|Creating|Loading/i).isVisible().catch(() => false);
      if (loadingVisible) {
        await page.waitForTimeout(5000); // Check every 5 seconds
      }
    }
  });

  // Test Step 3: Timeout occurs
  await test.step('Timeout occurs', async () => {
    // Wait for timeout error to appear
    await expect(page.getByText(/timeout|timed out|generation failed|took too long/i)).toBeVisible({ timeout: 20000 });
  });

  // Test Step 4: Error shown
  await test.step('Error shown', async () => {
    // Verify specific error message
    const errorMessage = page.getByText(/PDF generation failed|Generation failed|Unable to generate PDF|Request timed out/i);
    await expect(errorMessage).toBeVisible();
    
    // Check for error styling (red text, error icon, etc.)
    const hasErrorStyling = await errorMessage.evaluate(el => {
      const styles = window.getComputedStyle(el);
      return styles.color.includes('rgb(220') || // Red colors
             styles.color.includes('rgb(239') ||
             el.closest('[role="alert"]') !== null ||
             el.closest('.error') !== null;
    });
    expect(hasErrorStyling).toBeTruthy();
  });

  // Test Step 5: Can retry with screenshot
  await test.step('Can retry (SC)', async () => {
    // Remove the route handler to allow normal operation
    await page.unroute('**/api/documents/*/pdf');
    
    // Look for retry button or ability to retry
    const retryButton = page.getByRole('button', { name: /Retry|Try Again|Regenerate/i });
    const downloadButton = page.getByRole('button', { name: /Download PDF|Generate PDF|Export.*PDF/i });
    
    // Verify either retry button exists or original download button is enabled
    const canRetry = await retryButton.isVisible().catch(() => false) || 
                     await downloadButton.isEnabled().catch(() => false);
    expect(canRetry).toBeTruthy();
    
    // Click retry if available
    if (await retryButton.isVisible()) {
      await retryButton.click();
    } else if (await downloadButton.isEnabled()) {
      await downloadButton.click();
    }
    
    // Take screenshot showing retry capability
    const timestamp = formatTimestamp(new Date());
    await page.screenshot({ 
      path: getScreenshotPath(`TS.7.14-06-5-${timestamp}.png`),
      fullPage: true
    });
  });

  // Expected Results:
  // 1. Long process ✓
  // 2. Extended wait ✓
  // 3. Times out ✓
  // 4. "Generation failed" ✓
  // 5. Retry available ✓
});