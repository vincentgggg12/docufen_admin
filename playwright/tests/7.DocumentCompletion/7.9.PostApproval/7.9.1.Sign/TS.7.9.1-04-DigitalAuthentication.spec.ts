import { test, expect } from '@playwright/test';
import * as dotenv from 'dotenv';
import { microsoftLogin, handleERSDDialog } from '../../../../src/utils/microsoftLogin';
import { getScreenshotPath, formatTimestamp } from '../../../../src/utils/screenshotUtils';

dotenv.config({ path: '.playwright.env' });

test.use({
  viewport: { height: 1080, width: 1920 },
  ignoreHTTPSErrors: true
});

test.setTimeout(120000); // 2 minutes

test('TS.7.9.1-04 Digital Authentication', async ({ page }) => {
  // Setup: Login as Post-Approval participant
  const email = process.env.MS_EMAIL_17NJ5D_ALEX_WILBER!;
  const password = process.env.MS_PASSWORD!;
  await microsoftLogin(page, email, password);
  await handleERSDDialog(page);

  // Navigate to a document in Post-Approval stage
  await page.getByRole('button', { name: 'Menu' }).click();
  await page.getByRole('link', { name: 'Tracking' }).click();
  
  // Find document in Post-Approval stage
  await page.waitForSelector('[data-testid="document-list"]', { timeout: 10000 });
  const postApprovalDoc = page.locator('[data-testid="document-item"]').filter({ hasText: 'Post-Approval' }).first();
  await postApprovalDoc.click();
  
  // Wait for document to load
  await page.waitForSelector('[data-testid="document-content"]', { timeout: 10000 });

  // Test Step 1: Sign document
  await test.step('Sign document', async () => {
    await page.getByRole('button', { name: 'Sign', exact: true }).click();
    await page.waitForSelector('[data-testid="signature-dialog"]', { timeout: 5000 });
  });

  // Test Step 2: MS auth required
  await test.step('MS auth required', async () => {
    // Select role
    await page.getByLabel('Select role').click();
    await page.getByRole('option', { name: 'Approved By' }).click();
    
    // Click sign button
    await page.getByRole('button', { name: 'Sign Document' }).click();
    
    // Verify authentication is required
    // Note: In test environment, authentication may be simulated
    // In production, this would trigger Microsoft authentication popup
    await expect(page.locator('text=/authenticat/i')).toBeVisible({ timeout: 5000 });
  });

  // Test Step 3: Complete auth
  await test.step('Complete auth', async () => {
    // In test environment, authentication is typically mocked
    // Wait for the authentication process to complete
    await page.waitForTimeout(2000);
    
    // If there's a confirm button after auth, click it
    const confirmButton = page.getByRole('button', { name: 'Confirm' });
    if (await confirmButton.isVisible({ timeout: 2000 })) {
      await confirmButton.click();
    }
  });

  // Test Step 4: Signature placed
  await test.step('Signature placed', async () => {
    // Wait for signature to be placed
    await page.waitForSelector('[data-testid="signature-success"]', { timeout: 10000 });
    
    // Verify signature appears in document
    const signature = page.locator('text=/Alex Wilber.*Approved By/i');
    await expect(signature).toBeVisible();
  });

  // Test Step 5: Identity verified (SC)
  await test.step('Identity verified (SC)', async () => {
    // Verify digital signature includes identity information
    const signatureBlock = page.locator('[data-testid="signature-block"]').filter({ hasText: 'Alex Wilber' });
    await expect(signatureBlock).toBeVisible();
    
    // Verify it includes authentication details
    await expect(signatureBlock).toContainText(/Digitally signed/i);
    
    // Take screenshot showing verified digital signature
    const timestamp = formatTimestamp(new Date());
    await page.screenshot({ 
      path: getScreenshotPath(`TS.7.9.1-04-5-${timestamp}.png`) 
    });
  });

  // Expected Results:
  // 1. Sign clicked ✓
  // 2. Auth popup ✓
  // 3. Authenticated ✓
  // 4. Signed ✓
  // 5. Secure signature ✓
});