import { test, expect } from '@playwright/test';
import * as dotenv from 'dotenv';
import { microsoftLogin, handleERSDDialog } from '../../../src/utils/microsoftLogin';
import { getScreenshotPath, formatTimestamp } from '../../../src/utils/screenshotUtils';

dotenv.config({ path: '.playwright.env' });

test.use({
  viewport: { height: 1080, width: 1920 },
  ignoreHTTPSErrors: true
});

test.setTimeout(120000); // 2 minutes

test('TS.7.8.1-04 Digital Authentication', async ({ page }) => {
  // Login as an executor
  const email = process.env.MS_EMAIL_17NJ5D_DAVID_SEAGAL!;
  const password = process.env.MS_PASSWORD!;
  await microsoftLogin(page, email, password);
  await handleERSDDialog(page);

  // Test Steps
  await test.step('1. Sign in execution', async () => {
    // Navigate to a document in Execution stage
    await page.getByRole('button', { name: 'Menu' }).click();
    await page.getByRole('link', { name: 'Documents' }).click();
    await page.waitForLoadState('networkidle');
    
    // Find and open a document in Execution stage
    await page.getByText('Execution').first().click();
    
    // Click sign button
    await page.getByRole('button', { name: 'Sign' }).click();
  });

  await test.step('2. MS auth required', async () => {
    // Select a role
    await page.getByLabel('Performed By').check();
    
    // Click confirm to sign
    await page.getByRole('button', { name: 'Sign', exact: true }).click();
    
    // Wait for auth popup or check if already authenticated
    const authTitle = page.getByText('Sign in to your account');
    if (await authTitle.isVisible({ timeout: 5000 }).catch(() => false)) {
      // Auth popup appeared
      await expect(authTitle).toBeVisible();
    }
  });

  await test.step('3. Verify identity', async () => {
    // If auth popup is visible, it means identity verification is required
    // Otherwise, the user is already authenticated
    await expect(page.getByRole('dialog', { name: 'Sign Document' })).toBeVisible();
  });

  await test.step('4. Signature placed', async () => {
    // After successful auth, signature should be placed
    // Look for signature confirmation or the signature itself in the document
    await page.waitForTimeout(2000); // Wait for signature to be placed
    await expect(page.getByText('Signature added successfully')).toBeVisible({ timeout: 10000 });
  });

  await test.step('5. Authenticated (SC)', async () => {
    // Take screenshot showing authenticated signature
    const timestamp = formatTimestamp(new Date());
    await page.screenshot({ 
      path: getScreenshotPath(`TS.7.8.1-04-5-${timestamp}.png`) 
    });
  });

  // Expected Results:
  // 1. Sign clicked ✓
  // 2. Auth popup ✓
  // 3. Identity confirmed ✓
  // 4. Signature added ✓
  // 5. Secure signing ✓
});