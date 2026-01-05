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

test('TS.7.8.11-04 Clock Symbol', async ({ page }) => {
  // Login as an executor
  const email = process.env.MS_EMAIL_17NJ5D_DAVID_SEAGAL!;
  const password = process.env.MS_PASSWORD!;
  await microsoftLogin(page, email, password);
  await handleERSDDialog(page);

  // Test Steps
  await test.step('1. Complete late entry', async () => {
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
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    await page.getByRole('button', { name: yesterday.getDate().toString(), exact: true }).click();
    
    // Enter reason
    await page.getByPlaceholder('Enter reason for late entry').fill('Forgot to complete yesterday');
    
    // Make an entry in a cell
    await page.locator('td[contenteditable="true"]').first().click();
    await page.getByPlaceholder('Enter custom text').fill('Late entry test');
    await page.getByRole('button', { name: 'Insert' }).click();
  });

  await test.step('2. Entry shows ⏰', async () => {
    // Look for clock emoji in the entry
    await expect(page.locator('text=⏰')).toBeVisible();
  });

  await test.step('3. Visual indicator', async () => {
    // Verify clock symbol is visible as indicator
    const clockSymbol = page.locator('text=⏰');
    await expect(clockSymbol).toBeVisible();
  });

  await test.step('4. Clear marking', async () => {
    // Verify the late entry is clearly marked
    const lateEntry = page.locator('td').filter({ hasText: '⏰' });
    await expect(lateEntry).toHaveCount(1);
  });

  await test.step('5. Late entry obvious (SC)', async () => {
    // Take screenshot showing late entry with clock symbol
    const timestamp = formatTimestamp(new Date());
    await page.screenshot({ 
      path: getScreenshotPath(`TS.7.8.11-04-5-${timestamp}.png`) 
    });
  });

  // Expected Results:
  // 1. Entry made ✓
  // 2. Clock shown ✓
  // 3. Symbol visible ✓
  // 4. Stands out ✓
  // 5. Clearly marked ✓
});