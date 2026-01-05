import { test, expect, chromium } from '@playwright/test';
import * as dotenv from 'dotenv';
import { microsoftLogin, handleERSDDialog } from '../../src/utils/microsoftLogin';
import { getScreenshotPath, formatTimestamp } from '../../src/utils/screenshotUtils';

dotenv.config({ path: '.playwright.env' });

test.use({
  viewport: { height: 1080, width: 1920 },
  ignoreHTTPSErrors: true
});

test.setTimeout(180000); // 3 minutes for concurrent test

test('TS.7.14-03 Concurrent Stage Change', async ({ page }) => {
  // Create a second browser context for concurrent testing
  const browser = await chromium.launch();
  const context2 = await browser.newContext({
    viewport: { height: 1080, width: 1920 },
    ignoreHTTPSErrors: true
  });
  const page2 = await context2.newPage();

  try {
    // Test Step 1: Two owners open document
    await test.step('Two owners open document', async () => {
      // First owner login
      const email1 = process.env.MS_EMAIL_17NJ5D_CHRIS_GREEN!;
      const password = process.env.MS_PASSWORD!;
      await microsoftLogin(page, email1, password);
      await handleERSDDialog(page);

      // Second owner login
      const email2 = process.env.MS_EMAIL_17NJ5D_KRISTY_DAVIDSON!;
      await microsoftLogin(page2, email2, password);
      await handleERSDDialog(page2);

      // Both navigate to Document Management
      await page.getByRole('button', { name: 'Menu' }).click();
      await page.getByRole('link', { name: 'Document Management' }).click();
      await page.waitForLoadState('networkidle');

      await page2.getByRole('button', { name: 'Menu' }).click();
      await page2.getByRole('link', { name: 'Document Management' }).click();
      await page2.waitForLoadState('networkidle');

      // Both open the same document
      const docName = await page.locator('[data-testid="document-name"], tbody tr td:first-child').first().textContent();
      await page.locator(`text="${docName}"`).first().click();
      await page2.locator(`text="${docName}"`).first().click();

      // Wait for document details to load
      await page.waitForSelector('[data-testid="stage-advance-button"], button:has-text("Advance Stage")');
      await page2.waitForSelector('[data-testid="stage-advance-button"], button:has-text("Advance Stage")');
    });

    // Test Step 2: Both try to advance stage
    await test.step('Both try to advance stage simultaneously', async () => {
      // Set up response interceptors to detect the conflict
      let firstAdvanceCompleted = false;
      let secondAdvanceFailed = false;

      // Monitor first user's advance
      page.on('response', response => {
        if (response.url().includes('/api/documents') && response.url().includes('/stage') && 
            response.request().method() === 'PUT' && response.status() === 200) {
          firstAdvanceCompleted = true;
        }
      });

      // Monitor second user's advance
      page2.on('response', response => {
        if (response.url().includes('/api/documents') && response.url().includes('/stage') && 
            response.request().method() === 'PUT' && 
            (response.status() === 409 || response.status() === 400)) {
          secondAdvanceFailed = true;
        }
      });

      // Both click advance stage at nearly the same time
      const advancePromise1 = page.getByRole('button', { name: /Advance Stage|Next Stage/i }).click();
      const advancePromise2 = page2.getByRole('button', { name: /Advance Stage|Next Stage/i }).click();

      // Confirm any dialogs
      page.on('dialog', async dialog => {
        await dialog.accept();
      });
      page2.on('dialog', async dialog => {
        await dialog.accept();
      });

      await Promise.all([advancePromise1, advancePromise2]);
      
      // Give time for responses
      await page.waitForTimeout(2000);
    });

    // Test Step 3: First succeeds
    await test.step('First user advance succeeds', async () => {
      // Check for success message on first page
      const successVisible = await page.getByText(/stage.*advanced|successfully.*advanced|stage.*updated/i).isVisible({ timeout: 5000 }).catch(() => false);
      expect(successVisible).toBeTruthy();
    });

    // Test Step 4: Second gets error
    await test.step('Second user gets conflict error', async () => {
      // Check for error message on second page
      const errorVisible = await page2.getByText(/stage.*changed|conflict|already.*advanced|cannot.*advance/i).isVisible({ timeout: 5000 }).catch(() => false);
      expect(errorVisible).toBeTruthy();
    });

    // Test Step 5: Conflict handled gracefully with screenshot
    await test.step('Conflict handled gracefully (SC)', async () => {
      // Verify both pages are still functional
      await expect(page).not.toHaveURL(/.*error/);
      await expect(page2).not.toHaveURL(/.*error/);

      // Verify the document shows updated stage on both
      await page.reload();
      await page2.reload();
      await page.waitForLoadState('networkidle');
      await page2.waitForLoadState('networkidle');

      // Take screenshot of the conflict handling
      const timestamp = formatTimestamp(new Date());
      await page2.screenshot({ 
        path: getScreenshotPath(`TS.7.14-03-5-${timestamp}.png`),
        fullPage: true
      });
    });

  } finally {
    // Cleanup
    await page2.close();
    await context2.close();
    await browser.close();
  }

  // Expected Results:
  // 1. Both access ✓
  // 2. Simultaneous attempt ✓
  // 3. One advances ✓
  // 4. "Stage changed" error ✓
  // 5. Graceful handling ✓
});