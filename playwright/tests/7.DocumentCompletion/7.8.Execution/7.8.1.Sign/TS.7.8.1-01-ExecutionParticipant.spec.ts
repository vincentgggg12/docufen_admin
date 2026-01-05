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

test('TS.7.8.1-01 Execution Participant', async ({ page }) => {
  // Login as a user not in Execution group
  const email = process.env.MS_EMAIL_ORG_USERNAME!;
  const password = process.env.MS_PASSWORD!;
  await microsoftLogin(page, email, password);
  await handleERSDDialog(page);

  // Test Steps
  await test.step('1. Not executor', async () => {
    // Navigate to a document in Execution stage
    await page.getByRole('button', { name: 'Menu' }).click();
    await page.getByRole('link', { name: 'Documents' }).click();
    await page.waitForLoadState('networkidle');
    
    // Find and open a document in Execution stage
    await page.getByText('Execution').first().click();
  });

  await test.step('2. Cannot sign', async () => {
    // Verify sign option is not available
    const signButton = page.getByRole('button', { name: 'Sign' });
    await expect(signButton).not.toBeVisible();
  });

  await test.step('3. Add as executor', async () => {
    // Navigate to participants management
    await page.getByRole('button', { name: 'Participants' }).click();
    
    // Add user to Execution group
    await page.getByRole('button', { name: 'Add Executor' }).click();
    await page.getByPlaceholder('Search users').fill(email);
    await page.getByText(email).first().click();
    await page.getByRole('button', { name: 'Add' }).click();
  });

  await test.step('4. Can sign now', async () => {
    // Wait for participants dialog to close
    await page.waitForTimeout(1000);
    
    // Verify sign option is now available
    await expect(page.getByRole('button', { name: 'Sign' })).toBeVisible();
  });

  await test.step('5. Access controlled (SC)', async () => {
    // Take screenshot showing sign button is now visible
    const timestamp = formatTimestamp(new Date());
    await page.screenshot({ 
      path: getScreenshotPath(`TS.7.8.1-01-5-${timestamp}.png`) 
    });
  });

  // Expected Results:
  // 1. Not in group ✓
  // 2. Sign blocked ✓
  // 3. Added ✓
  // 4. Sign enabled ✓
  // 5. Permission works ✓
});