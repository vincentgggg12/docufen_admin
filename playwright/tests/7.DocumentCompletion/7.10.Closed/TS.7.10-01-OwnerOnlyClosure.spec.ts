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

test('TS.7.10-01 Owner Only Closure', async ({ page }) => {
  // Setup: Login as Participant (non-owner)
  const participantEmail = process.env.MS_EMAIL_17NJ5D_NESTOR_WILKE!;
  const password = process.env.MS_PASSWORD!;
  await microsoftLogin(page, participantEmail, password);
  await handleERSDDialog(page);

  // Test Step 1: Participant tries close
  await test.step('Participant tries close', async () => {
    // Navigate to a document in Post-Approval stage
    await page.getByRole('button', { name: 'Menu' }).click();
    await page.getByRole('link', { name: 'Tracking' }).click();
    
    // Find document in Post-Approval stage
    await page.waitForSelector('[data-testid="document-list"]', { timeout: 10000 });
    const postApprovalDoc = page.locator('[data-testid="document-item"]').filter({ hasText: 'Post-Approval' }).first();
    await postApprovalDoc.click();
    
    // Wait for document to load
    await page.waitForSelector('[data-testid="document-content"]', { timeout: 10000 });
  });

  // Test Step 2: No button shown
  await test.step('No button shown', async () => {
    // Verify Close button is not visible for participant
    await expect(page.getByRole('button', { name: 'Close Document' })).not.toBeVisible();
    await expect(page.getByRole('button', { name: 'Close' })).not.toBeVisible();
  });

  // Test Step 3: Owner opens doc
  await test.step('Owner opens doc', async () => {
    // Switch to owner account
    await page.getByRole('button', { name: 'Menu' }).click();
    await page.getByRole('link', { name: 'Sign Out' }).click();
    
    // Login as Trial Administrator (Owner)
    const ownerEmail = process.env.MS_EMAIL_17NJ5D_MEGAN_BOWEN!;
    await microsoftLogin(page, ownerEmail, password);
    await handleERSDDialog(page);
    
    // Navigate back to document
    await page.getByRole('button', { name: 'Menu' }).click();
    await page.getByRole('link', { name: 'Tracking' }).click();
    await page.waitForSelector('[data-testid="document-list"]', { timeout: 10000 });
    const doc = page.locator('[data-testid="document-item"]').filter({ hasText: 'Post-Approval' }).first();
    await doc.click();
    
    // Wait for document to load
    await page.waitForSelector('[data-testid="document-content"]', { timeout: 10000 });
  });

  // Test Step 4: Close button visible
  await test.step('Close button visible', async () => {
    // Verify Close button is visible for owner
    await expect(page.getByRole('button', { name: 'Close Document' })).toBeVisible();
  });

  // Test Step 5: Owner restricted (SC)
  await test.step('Owner restricted (SC)', async () => {
    // Verify permissions are enforced - only owner can see close button
    await expect(page.getByRole('button', { name: 'Close Document' })).toBeVisible();
    await expect(page.getByText('Post-Approval')).toBeVisible();
    
    // Take screenshot showing owner-only close button
    const timestamp = formatTimestamp(new Date());
    await page.screenshot({ 
      path: getScreenshotPath(`TS.7.10-01-5-${timestamp}.png`) 
    });
  });

  // Expected Results:
  // 1. Participant view ✓
  // 2. Cannot close ✓
  // 3. Owner view ✓
  // 4. Can close ✓
  // 5. Permission enforced ✓
});