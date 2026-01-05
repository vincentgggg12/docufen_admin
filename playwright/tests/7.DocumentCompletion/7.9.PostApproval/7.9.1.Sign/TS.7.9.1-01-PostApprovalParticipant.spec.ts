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

test('TS.7.9.1-01 Post-Approval Participant', async ({ page }) => {
  // Setup: Login as Trial Administrator (Owner)
  const email = process.env.MS_EMAIL_17NJ5D_MEGAN_BOWEN!;
  const password = process.env.MS_PASSWORD!;
  await microsoftLogin(page, email, password);
  await handleERSDDialog(page);

  // Test Step 1: Not in Post-Approval
  await test.step('Not in Post-Approval', async () => {
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

  // Test Step 2: Cannot sign
  await test.step('Cannot sign', async () => {
    // Switch to non-participant user
    await page.getByRole('button', { name: 'Menu' }).click();
    await page.getByRole('link', { name: 'Sign Out' }).click();
    
    // Login as non-participant
    const nonParticipantEmail = process.env.MS_EMAIL_17NJ5D_NESTOR_WILKE!;
    await microsoftLogin(page, nonParticipantEmail, password);
    await handleERSDDialog(page);
    
    // Navigate back to document
    await page.getByRole('button', { name: 'Menu' }).click();
    await page.getByRole('link', { name: 'Tracking' }).click();
    await page.waitForSelector('[data-testid="document-list"]', { timeout: 10000 });
    const doc = page.locator('[data-testid="document-item"]').filter({ hasText: 'Post-Approval' }).first();
    await doc.click();
    
    // Verify sign button not available
    await expect(page.getByRole('button', { name: 'Sign', exact: true })).not.toBeVisible();
  });

  // Test Step 3: Add to group
  await test.step('Add to group', async () => {
    // Switch back to owner
    await page.getByRole('button', { name: 'Menu' }).click();
    await page.getByRole('link', { name: 'Sign Out' }).click();
    await microsoftLogin(page, email, password);
    await handleERSDDialog(page);
    
    // Navigate back to document
    await page.getByRole('button', { name: 'Menu' }).click();
    await page.getByRole('link', { name: 'Tracking' }).click();
    await page.waitForSelector('[data-testid="document-list"]', { timeout: 10000 });
    const doc = page.locator('[data-testid="document-item"]').filter({ hasText: 'Post-Approval' }).first();
    await doc.click();
    
    // Open participants dialog
    await page.getByRole('button', { name: 'Participants' }).click();
    await page.waitForSelector('[data-testid="participants-dialog"]', { timeout: 5000 });
    
    // Add user to Post-Approval group
    await page.getByRole('tab', { name: 'Post-Approval' }).click();
    await page.getByPlaceholder('Search users...').fill('Nestor Wilke');
    await page.waitForTimeout(1000); // Debounce
    await page.getByText('Nestor Wilke').click();
    
    // Close dialog
    await page.getByRole('button', { name: 'Close' }).click();
  });

  // Test Step 4: Can sign now
  await test.step('Can sign now', async () => {
    // Switch to newly added participant
    await page.getByRole('button', { name: 'Menu' }).click();
    await page.getByRole('link', { name: 'Sign Out' }).click();
    
    const participantEmail = process.env.MS_EMAIL_17NJ5D_NESTOR_WILKE!;
    await microsoftLogin(page, participantEmail, password);
    await handleERSDDialog(page);
    
    // Navigate back to document
    await page.getByRole('button', { name: 'Menu' }).click();
    await page.getByRole('link', { name: 'Tracking' }).click();
    await page.waitForSelector('[data-testid="document-list"]', { timeout: 10000 });
    const doc = page.locator('[data-testid="document-item"]').filter({ hasText: 'Post-Approval' }).first();
    await doc.click();
    
    // Verify sign button is now available
    await expect(page.getByRole('button', { name: 'Sign', exact: true })).toBeVisible();
  });

  // Test Step 5: Access controlled (SC)
  await test.step('Access controlled (SC)', async () => {
    // Verify permissions are enforced
    await expect(page.getByRole('button', { name: 'Sign', exact: true })).toBeVisible();
    await expect(page.getByText('Post-Approval')).toBeVisible();
    
    // Take screenshot showing access control
    const timestamp = formatTimestamp(new Date());
    await page.screenshot({ 
      path: getScreenshotPath(`TS.7.9.1-01-5-${timestamp}.png`) 
    });
  });

  // Expected Results:
  // 1. Not participant ✓
  // 2. Sign blocked ✓
  // 3. Added ✓
  // 4. Sign enabled ✓
  // 5. Permission enforced ✓
});