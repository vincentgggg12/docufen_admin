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

test('TS.7.7.1-01 Pre-Approval Participant', async ({ page }) => {
  // Login as a user not in Pre-Approval group
  const email = process.env.MS_EMAIL_ORG_USERNAME!;
  const password = process.env.MS_PASSWORD!;
  await microsoftLogin(page, email, password);
  await handleERSDDialog(page);

  // Test Steps
  await test.step('1. Not in Pre-Approval group', async () => {
    // Navigate to a document in Pre-Approval stage
    await page.getByRole('button', { name: 'Menu' }).click();
    await page.getByRole('link', { name: 'Documents' }).click();
    await page.waitForLoadState('networkidle');
    
    // Find and open a document in Pre-Approval stage
    await page.getByText('Pre-Approval').first().click();
  });

  await test.step('2. Try to sign', async () => {
    // Attempt to find sign option
    const signButton = page.getByRole('button', { name: 'Sign' });
    await expect(signButton).not.toBeVisible();
  });

  await test.step('3. Option not available', async () => {
    // Verify sign option is not available
    await expect(page.getByText('You do not have permission to sign in this stage')).toBeVisible();
  });

  await test.step('4. Add to group', async () => {
    // This would typically be done by an admin
    // For test purposes, we'll simulate being added to the Pre-Approval group
    await page.getByRole('button', { name: 'Menu' }).click();
    await page.getByRole('link', { name: 'Admin' }).click();
    await page.getByRole('link', { name: 'Users' }).click();
    
    // Add user to Pre-Approval group
    await page.getByRole('button', { name: 'Edit' }).click();
    await page.getByLabel('Pre-Approval').check();
    await page.getByRole('button', { name: 'Save' }).click();
    
    // Navigate back to document
    await page.getByRole('button', { name: 'Menu' }).click();
    await page.getByRole('link', { name: 'Documents' }).click();
    await page.getByText('Pre-Approval').first().click();
  });

  await test.step('5. Can sign now (SC)', async () => {
    // Verify sign option is now available
    await expect(page.getByRole('button', { name: 'Sign' })).toBeVisible();
    
    // Take screenshot
    const timestamp = formatTimestamp(new Date());
    await page.screenshot({ 
      path: getScreenshotPath(`TS.7.7.1-01-5-${timestamp}.png`) 
    });
  });

  // Expected Results:
  // 1. Not participant ✓
  // 2. Sign blocked ✓
  // 3. No access ✓
  // 4. Added to group ✓
  // 5. Sign enabled ✓
});