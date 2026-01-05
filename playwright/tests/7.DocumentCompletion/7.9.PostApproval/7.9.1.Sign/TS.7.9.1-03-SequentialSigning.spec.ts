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

test('TS.7.9.1-03 Sequential Signing', async ({ page }) => {
  // Setup: Login as Trial Administrator (Owner)
  const email = process.env.MS_EMAIL_17NJ5D_MEGAN_BOWEN!;
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

  // Test Step 1: Enable order
  await test.step('Enable order', async () => {
    // Open participants dialog
    await page.getByRole('button', { name: 'Participants' }).click();
    await page.waitForSelector('[data-testid="participants-dialog"]', { timeout: 5000 });
    
    // Navigate to Post-Approval tab
    await page.getByRole('tab', { name: 'Post-Approval' }).click();
    
    // Enable signing order
    const signingOrderToggle = page.getByLabel('Enable signing order');
    if (!(await signingOrderToggle.isChecked())) {
      await signingOrderToggle.click();
    }
    
    // Verify order is enabled
    await expect(signingOrderToggle).toBeChecked();
    
    // Close dialog
    await page.getByRole('button', { name: 'Close' }).click();
  });

  // Test Step 2: Second tries first
  await test.step('Second tries first', async () => {
    // Switch to second signer
    await page.getByRole('button', { name: 'Menu' }).click();
    await page.getByRole('link', { name: 'Sign Out' }).click();
    
    const secondSignerEmail = process.env.MS_EMAIL_17NJ5D_ALEX_WILBER!;
    await microsoftLogin(page, secondSignerEmail, password);
    await handleERSDDialog(page);
    
    // Navigate back to document
    await page.getByRole('button', { name: 'Menu' }).click();
    await page.getByRole('link', { name: 'Tracking' }).click();
    await page.waitForSelector('[data-testid="document-list"]', { timeout: 10000 });
    const doc = page.locator('[data-testid="document-item"]').filter({ hasText: 'Post-Approval' }).first();
    await doc.click();
    
    // Try to sign
    await page.getByRole('button', { name: 'Sign', exact: true }).click();
  });

  // Test Step 3: Blocked message
  await test.step('Blocked message', async () => {
    // Verify blocked message appears
    await expect(page.getByText(/must sign before you/i)).toBeVisible();
    
    // Close any dialog
    const closeButton = page.getByRole('button', { name: 'Close' });
    if (await closeButton.isVisible()) {
      await closeButton.click();
    }
  });

  // Test Step 4: First signs
  await test.step('First signs', async () => {
    // Switch to first signer
    await page.getByRole('button', { name: 'Menu' }).click();
    await page.getByRole('link', { name: 'Sign Out' }).click();
    
    const firstSignerEmail = process.env.MS_EMAIL_17NJ5D_NESTOR_WILKE!;
    await microsoftLogin(page, firstSignerEmail, password);
    await handleERSDDialog(page);
    
    // Navigate back to document
    await page.getByRole('button', { name: 'Menu' }).click();
    await page.getByRole('link', { name: 'Tracking' }).click();
    await page.waitForSelector('[data-testid="document-list"]', { timeout: 10000 });
    const doc = page.locator('[data-testid="document-item"]').filter({ hasText: 'Post-Approval' }).first();
    await doc.click();
    
    // Sign document
    await page.getByRole('button', { name: 'Sign', exact: true }).click();
    await page.waitForSelector('[data-testid="signature-dialog"]', { timeout: 5000 });
    
    // Select role and sign
    await page.getByLabel('Select role').click();
    await page.getByRole('option', { name: 'Approved By' }).click();
    await page.getByRole('button', { name: 'Sign Document' }).click();
    
    // Wait for signature to complete
    await page.waitForSelector('[data-testid="signature-success"]', { timeout: 10000 });
  });

  // Test Step 5: Second allowed (SC)
  await test.step('Second allowed (SC)', async () => {
    // Switch back to second signer
    await page.getByRole('button', { name: 'Menu' }).click();
    await page.getByRole('link', { name: 'Sign Out' }).click();
    
    const secondSignerEmail = process.env.MS_EMAIL_17NJ5D_ALEX_WILBER!;
    await microsoftLogin(page, secondSignerEmail, password);
    await handleERSDDialog(page);
    
    // Navigate back to document
    await page.getByRole('button', { name: 'Menu' }).click();
    await page.getByRole('link', { name: 'Tracking' }).click();
    await page.waitForSelector('[data-testid="document-list"]', { timeout: 10000 });
    const doc = page.locator('[data-testid="document-item"]').filter({ hasText: 'Post-Approval' }).first();
    await doc.click();
    
    // Verify can now sign
    await expect(page.getByRole('button', { name: 'Sign', exact: true })).toBeEnabled();
    
    // Take screenshot showing second signer can now sign
    const timestamp = formatTimestamp(new Date());
    await page.screenshot({ 
      path: getScreenshotPath(`TS.7.9.1-03-5-${timestamp}.png`) 
    });
  });

  // Expected Results:
  // 1. Order on ✓
  // 2. Out of sequence ✓
  // 3. Must wait message ✓
  // 4. First completed ✓
  // 5. Next can sign ✓
});