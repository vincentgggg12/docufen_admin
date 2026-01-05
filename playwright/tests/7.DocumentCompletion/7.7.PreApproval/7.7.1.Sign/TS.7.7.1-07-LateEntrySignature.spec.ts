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

test('TS.7.7.1-07 Late Entry Signature', async ({ page }) => {
  // Login as a Pre-Approval participant
  const email = process.env.MS_EMAIL_ORG_USERNAME!;
  const password = process.env.MS_PASSWORD!;
  await microsoftLogin(page, email, password);
  await handleERSDDialog(page);

  // Navigate to a document in Pre-Approval stage
  await page.getByRole('button', { name: 'Menu' }).click();
  await page.getByRole('link', { name: 'Documents' }).click();
  await page.waitForLoadState('networkidle');
  
  // Open a document in Pre-Approval stage
  await page.getByText('Pre-Approval').first().click();

  // Test Steps
  await test.step('1. Enable late entry', async () => {
    // Look for late entry checkbox
    await page.getByLabel('Late Entry').check();
    await expect(page.getByLabel('Late Entry')).toBeChecked();
  });

  await test.step('2. Select past date', async () => {
    // Date picker should appear
    await expect(page.getByLabel('Select Date')).toBeVisible();
    
    // Select yesterday's date
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const dateString = yesterday.toISOString().split('T')[0];
    
    await page.getByLabel('Select Date').fill(dateString);
  });

  await test.step('3. Enter reason', async () => {
    // Enter reason for late entry
    await page.getByLabel('Reason for Late Entry').fill('Document review was completed yesterday but signature was missed');
    await expect(page.getByLabel('Reason for Late Entry')).toHaveValue('Document review was completed yesterday but signature was missed');
  });

  await test.step('4. Sign with clock icon', async () => {
    // Click sign button
    await page.getByRole('button', { name: 'Sign' }).click();
    
    // Select role and sign
    await page.getByRole('combobox', { name: 'Role' }).selectOption('Reviewed By');
    await page.getByRole('button', { name: 'Sign' }).click();
    
    // Wait for signature to be placed
    await page.waitForTimeout(2000);
    
    // Verify clock icon is shown with signature
    const clockIcon = page.locator('text=⏰').first();
    await expect(clockIcon).toBeVisible();
  });

  await test.step('5. Backdated signature (SC)', async () => {
    // Verify signature shows past date
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const datePattern = yesterday.toLocaleDateString('en-US', { 
      day: '2-digit', 
      month: 'short', 
      year: 'numeric' 
    });
    
    const signature = page.locator(`text=/${datePattern}/`).first();
    await expect(signature).toBeVisible();
    
    // Take screenshot
    const timestamp = formatTimestamp(new Date());
    await page.screenshot({ 
      path: getScreenshotPath(`TS.7.7.1-07-5-${timestamp}.png`) 
    });
  });

  // Expected Results:
  // 1. Late entry on ✓
  // 2. Date selected ✓
  // 3. Reason provided ✓
  // 4. Clock symbol shown ✓
  // 5. Past date recorded ✓
});