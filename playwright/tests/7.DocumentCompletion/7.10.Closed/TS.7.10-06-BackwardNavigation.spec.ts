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

test('TS.7.10-06 Backward Navigation', async ({ page }) => {
  // Setup: Login as Trial Administrator (Owner)
  const email = process.env.MS_EMAIL_17NJ5D_MEGAN_BOWEN!;
  const password = process.env.MS_PASSWORD!;
  await microsoftLogin(page, email, password);
  await handleERSDDialog(page);

  // Navigate to tracking page
  await page.getByRole('button', { name: 'Menu' }).click();
  await page.getByRole('link', { name: 'Tracking' }).click();
  await page.waitForSelector('[data-testid="document-list"]', { timeout: 10000 });

  // Test Step 1: From closed stage
  await test.step('From closed stage', async () => {
    // Find a closed document or create one
    let closedDoc = page.locator('[data-testid="document-item"]').filter({ hasText: 'Closed' }).first();
    
    if (!(await closedDoc.isVisible())) {
      // Close a Post-Approval document
      const postApprovalDoc = page.locator('[data-testid="document-item"]').filter({ hasText: 'Post-Approval' }).first();
      await postApprovalDoc.click();
      await page.waitForSelector('[data-testid="document-content"]', { timeout: 10000 });
      await page.getByRole('button', { name: 'Close Document' }).click();
      await page.waitForTimeout(2000);
    } else {
      await closedDoc.click();
      await page.waitForSelector('[data-testid="document-content"]', { timeout: 10000 });
    }
    
    // Verify document is in closed stage
    await expect(page.getByText('Closed')).toBeVisible();
  });

  // Test Step 2: Can go back
  await test.step('Can go back', async () => {
    // Look for backward/revert button
    const backButton = page.getByRole('button', { name: /Back|Previous|Revert|Return/i });
    await expect(backButton).toBeVisible();
    
    // Verify button is enabled for owner
    await expect(backButton).toBeEnabled();
  });

  // Test Step 3: Reason required
  await test.step('Reason required', async () => {
    // Click the back button
    const backButton = page.getByRole('button', { name: /Back|Previous|Revert|Return/i });
    await backButton.click();
    
    // Wait for reason dialog to appear
    await page.waitForSelector('[data-testid="reason-dialog"], [role="dialog"]', { timeout: 5000 });
    
    // Verify reason input is present
    const reasonInput = page.getByPlaceholder(/reason|explanation|why/i);
    await expect(reasonInput).toBeVisible();
    
    // Verify reason is required (try to submit without reason)
    const submitButton = page.getByRole('button', { name: /Confirm|Submit|OK/i });
    await submitButton.click();
    
    // Should show validation error
    await expect(page.getByText(/required|must enter|please provide/i)).toBeVisible();
  });

  // Test Step 4: Returns to Post-Approval
  await test.step('Returns to Post-Approval', async () => {
    // Enter a reason
    const reasonInput = page.getByPlaceholder(/reason|explanation|why/i);
    await reasonInput.fill('Need to add additional signatures');
    
    // Submit the form
    const submitButton = page.getByRole('button', { name: /Confirm|Submit|OK/i });
    await submitButton.click();
    
    // Wait for stage change
    await page.waitForTimeout(2000);
    
    // Verify document is now in Post-Approval stage
    await expect(page.getByText('Post-Approval')).toBeVisible();
  });

  // Test Step 5: Reversion allowed (SC)
  await test.step('Reversion allowed (SC)', async () => {
    // Verify the reversion was successful
    await expect(page.getByText('Post-Approval')).toBeVisible();
    
    // Verify edit capabilities are restored
    const signButton = page.getByRole('button', { name: 'Sign', exact: true });
    await expect(signButton).toBeVisible();
    
    // Take screenshot showing successful reversion
    const timestamp = formatTimestamp(new Date());
    await page.screenshot({ 
      path: getScreenshotPath(`TS.7.10-06-5-${timestamp}.png`) 
    });
  });

  // Expected Results:
  // 1. Closed stage ✓
  // 2. Back button shown ✓
  // 3. Reason dialog ✓
  // 4. Stage reverted ✓
  // 5. Backward works ✓
});