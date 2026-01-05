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

test('TS.7.8.11-05 Late Entry Audit', async ({ page }) => {
  // Login as an executor
  const email = process.env.MS_EMAIL_17NJ5D_DAVID_SEAGAL!;
  const password = process.env.MS_PASSWORD!;
  await microsoftLogin(page, email, password);
  await handleERSDDialog(page);

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const lateEntryReason = 'Forgot to complete task yesterday';

  // Test Steps
  await test.step('1. Make late entry', async () => {
    // Navigate to a document in Execution stage
    await page.getByRole('button', { name: 'Menu' }).click();
    await page.getByRole('link', { name: 'Documents' }).click();
    await page.waitForLoadState('networkidle');
    
    // Find and open a document in Execution stage
    await page.getByText('Execution').first().click();
    
    // Enable late entry
    await page.getByLabel('Late Entry').check();
    
    // Select yesterday
    await page.getByLabel('Select date and time').click();
    await page.getByRole('button', { name: yesterday.getDate().toString(), exact: true }).click();
    
    // Enter reason
    await page.getByPlaceholder('Enter reason for late entry').fill(lateEntryReason);
    
    // Make an entry
    await page.locator('td[contenteditable="true"]').first().click();
    await page.getByPlaceholder('Enter custom text').fill('Late completion');
    await page.getByRole('button', { name: 'Insert' }).click();
    
    // Wait for entry to be saved
    await page.waitForTimeout(1000);
  });

  await test.step('2. Check audit', async () => {
    // Open audit log
    await page.getByRole('button', { name: 'Audit' }).click();
  });

  await test.step('3. Original date shown', async () => {
    // Look for late entry audit record with original date
    const yesterdayFormatted = yesterday.toLocaleDateString('en-GB', { 
      day: '2-digit', 
      month: 'short', 
      year: 'numeric' 
    }).replace(/ /g, '-');
    
    await expect(page.getByText(yesterdayFormatted)).toBeVisible();
  });

  await test.step('4. Actual time shown', async () => {
    // Verify current/actual time is also recorded
    const today = new Date();
    const todayFormatted = today.toLocaleDateString('en-GB', { 
      day: '2-digit', 
      month: 'short', 
      year: 'numeric' 
    }).replace(/ /g, '-');
    
    const auditEntry = page.locator('tr').filter({ hasText: 'Late Entry' });
    await expect(auditEntry.getByText(todayFormatted)).toBeVisible();
  });

  await test.step('5. Reason recorded (SC)', async () => {
    // Verify reason is captured in audit
    await expect(page.getByText(lateEntryReason)).toBeVisible();
    
    // Take screenshot showing late entry audit
    const timestamp = formatTimestamp(new Date());
    await page.screenshot({ 
      path: getScreenshotPath(`TS.7.8.11-05-5-${timestamp}.png`) 
    });
  });

  // Expected Results:
  // 1. Entry made ✓
  // 2. Audit checked ✓
  // 3. Past date logged ✓
  // 4. Current time logged ✓
  // 5. Reason captured ✓
});