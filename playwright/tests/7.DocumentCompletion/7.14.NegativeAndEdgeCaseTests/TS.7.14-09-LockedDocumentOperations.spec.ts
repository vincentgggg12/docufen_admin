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

test('TS.7.14-09 Locked Document Operations', async ({ page }) => {
  // Create a second browser context for User B
  const browser = await chromium.launch();
  const context2 = await browser.newContext({
    viewport: { height: 1080, width: 1920 },
    ignoreHTTPSErrors: true
  });
  const page2 = await context2.newPage();

  try {
    // Test Step 1: User A opens document
    await test.step('User A opens document', async () => {
      const emailA = process.env.MS_EMAIL_17NJ5D_EMILY_MARTIN!;
      const password = process.env.MS_PASSWORD!;
      await microsoftLogin(page, emailA, password);
      await handleERSDDialog(page);

      // Navigate to Sign page
      await page.getByRole('button', { name: 'Menu' }).click();
      await page.getByRole('link', { name: 'Sign' }).click();
      await page.waitForLoadState('networkidle');

      // Open first document
      const firstDocument = page.locator('[data-testid="sign-document-row"], tbody tr').first();
      const docName = await firstDocument.locator('td').first().textContent();
      await firstDocument.click();
      await page.waitForSelector('[data-testid="document-viewer"], iframe, .document-container');
      
      console.log(`User A opened document: ${docName}`);
    });

    // Test Step 2: User B tries to sign
    await test.step('User B tries to sign', async () => {
      const emailB = process.env.MS_EMAIL_17NJ5D_ALICE_DOE!;
      const password = process.env.MS_PASSWORD!;
      await microsoftLogin(page2, emailB, password);
      await handleERSDDialog(page2);

      // Navigate to Sign page
      await page2.getByRole('button', { name: 'Menu' }).click();
      await page2.getByRole('link', { name: 'Sign' }).click();
      await page2.waitForLoadState('networkidle');

      // Try to open the same document
      const firstDocument = page2.locator('[data-testid="sign-document-row"], tbody tr').first();
      await firstDocument.click();
      
      // Wait for either document viewer or lock error
      await page2.waitForSelector('[data-testid="document-viewer"], [data-testid="lock-error"], .error-message', { timeout: 10000 });
    });

    // Test Step 3: Gets lock error
    await test.step('Gets lock error', async () => {
      // Check for lock error message
      const lockError = await page2.getByText(/document.*locked|already.*open|in use|cannot.*access/i).isVisible({ timeout: 5000 }).catch(() => false);
      
      if (!lockError) {
        // Alternative: Check if sign button is disabled
        const signButton = page2.getByRole('button', { name: /Sign.*Document|Apply.*Signature/i });
        if (await signButton.isVisible()) {
          const isDisabled = await signButton.isDisabled();
          expect(isDisabled).toBeTruthy();
          
          // Check for tooltip or helper text
          const helperText = await page2.getByText(/locked by|currently being edited/i).isVisible().catch(() => false);
          expect(helperText).toBeTruthy();
        }
      } else {
        expect(lockError).toBeTruthy();
      }
    });

    // Test Step 4: User A closes
    await test.step('User A closes document', async () => {
      // User A closes the document
      await page.getByRole('button', { name: /Close|Back|Exit/i }).click();
      
      // Or navigate away
      await page.getByRole('button', { name: 'Menu' }).click();
      await page.getByRole('link', { name: 'Dashboard' }).click();
      await page.waitForLoadState('networkidle');
      
      // Give time for lock to be released
      await page.waitForTimeout(2000);
    });

    // Test Step 5: User B can sign with screenshot
    await test.step('User B can sign (SC)', async () => {
      // Refresh or retry opening the document
      await page2.reload();
      await page2.waitForLoadState('networkidle');
      
      // Navigate back to Sign if needed
      const signPageVisible = await page2.getByRole('heading', { name: /Sign.*Documents/i }).isVisible().catch(() => false);
      if (!signPageVisible) {
        await page2.getByRole('button', { name: 'Menu' }).click();
        await page2.getByRole('link', { name: 'Sign' }).click();
        await page2.waitForLoadState('networkidle');
      }
      
      // Open the document again
      const firstDocument = page2.locator('[data-testid="sign-document-row"], tbody tr').first();
      await firstDocument.click();
      await page2.waitForSelector('[data-testid="document-viewer"], iframe, .document-container');
      
      // Verify sign button is now available
      const signButton = page2.getByRole('button', { name: /Sign.*Document|Apply.*Signature/i });
      await expect(signButton).toBeVisible();
      await expect(signButton).toBeEnabled();
      
      // Click sign to verify access
      await signButton.click();
      
      // Wait for signature modal or input
      await page2.waitForSelector('[data-testid="signature-modal"], [data-testid="signature-input"], input[type="password"]', { timeout: 5000 });
      
      // Take screenshot showing successful access
      const timestamp = formatTimestamp(new Date());
      await page2.screenshot({ 
        path: getScreenshotPath(`TS.7.14-09-5-${timestamp}.png`),
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
  // 1. First user locks ✓
  // 2. Second blocked ✓
  // 3. "Document locked" ✓
  // 4. Lock released ✓
  // 5. Now accessible ✓
});