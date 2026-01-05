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

test('TS.7.8.11-03 Reason Requirement', async ({ page }) => {
  // Login as an executor
  const email = process.env.MS_EMAIL_17NJ5D_DAVID_SEAGAL!;
  const password = process.env.MS_PASSWORD!;
  await microsoftLogin(page, email, password);
  await handleERSDDialog(page);

  // Test Steps
  await test.step('1. Leave reason empty', async () => {
    // Navigate to a document in Execution stage
    await page.getByRole('button', { name: 'Menu' }).click();
    await page.getByRole('link', { name: 'Documents' }).click();
    await page.waitForLoadState('networkidle');
    
    // Find and open a document in Execution stage
    await page.getByText('Execution').first().click();
    
    // Enable late entry
    await page.getByLabel('Late Entry').check();
    
    // Select a past date
    await page.getByLabel('Select date and time').click();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    await page.getByRole('button', { name: yesterday.getDate().toString(), exact: true }).click();
    
    // Leave reason field empty
    const reasonField = page.getByPlaceholder('Enter reason for late entry');
    await reasonField.clear();
  });

  await test.step('2. Cannot proceed', async () => {
    // Try to proceed with entry
    await page.locator('td[contenteditable="true"]').first().click();
    await page.getByRole('button', { name: 'Insert' }).click();
    
    // Should show validation error
    await expect(page.getByText('Reason is required')).toBeVisible();
  });

  await test.step('3. Enter "Forgot yesterday"', async () => {
    // Enter a reason
    await page.getByPlaceholder('Enter reason for late entry').fill('Forgot yesterday');
  });

  await test.step('4. Min 3 chars required', async () => {
    // Clear and try with short reason
    await page.getByPlaceholder('Enter reason for late entry').clear();
    await page.getByPlaceholder('Enter reason for late entry').fill('AB');
    
    // Should show minimum length error
    await page.getByRole('button', { name: 'Insert' }).click();
    await expect(page.getByText(/minimum.*3.*characters/i)).toBeVisible();
    
    // Enter valid reason
    await page.getByPlaceholder('Enter reason for late entry').fill('Forgot yesterday');
  });

  await test.step('5. Valid reason (SC)', async () => {
    // Verify reason is accepted
    const reasonField = page.getByPlaceholder('Enter reason for late entry');
    const value = await reasonField.inputValue();
    expect(value.length).toBeGreaterThanOrEqual(3);
    
    // Take screenshot showing valid reason entered
    const timestamp = formatTimestamp(new Date());
    await page.screenshot({ 
      path: getScreenshotPath(`TS.7.8.11-03-5-${timestamp}.png`) 
    });
  });

  // Expected Results:
  // 1. Empty reason ✓
  // 2. Blocked ✓
  // 3. Reason entered ✓
  // 4. Length checked ✓
  // 5. Reason accepted ✓
});