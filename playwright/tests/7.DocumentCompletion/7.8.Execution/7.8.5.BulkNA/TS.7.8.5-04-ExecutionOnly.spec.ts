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

test('TS.7.8.5-04 Execution Only', async ({ page }) => {
  // Login as a user with access to both Pre-Approval and Execution stages
  const email = process.env.MS_EMAIL_17NJ5D_MEGAN_BOWEN!;
  const password = process.env.MS_PASSWORD!;
  await microsoftLogin(page, email, password);
  await handleERSDDialog(page);

  // Test Steps
  await test.step('1. Try in Pre-Approval', async () => {
    // Navigate to documents
    await page.getByRole('button', { name: 'Menu' }).click();
    await page.getByRole('link', { name: 'Documents' }).click();
    await page.waitForLoadState('networkidle');
    
    // Find and open a document in Pre-Approval stage
    await page.getByText('Pre-Approval').first().click();
    
    // Try to select multiple cells
    const firstCell = page.locator('td[contenteditable="true"]').first();
    await firstCell.click();
    
    await page.keyboard.down('Shift');
    await page.locator('td[contenteditable="true"]').nth(3).click();
    await page.keyboard.up('Shift');
  });

  await test.step('2. No bulk option', async () => {
    // Verify Bulk N/A button is not available
    await expect(page.getByRole('button', { name: 'Bulk N/A' })).not.toBeVisible();
  });

  await test.step('3. In Execution stage', async () => {
    // Navigate back to documents
    await page.getByRole('button', { name: 'Menu' }).click();
    await page.getByRole('link', { name: 'Documents' }).click();
    
    // Open a document in Execution stage
    await page.getByText('Execution').first().click();
  });

  await test.step('4. Bulk available', async () => {
    // Select multiple cells in Execution stage
    const firstCell = page.locator('td[contenteditable="true"]').first();
    await firstCell.click();
    
    await page.keyboard.down('Shift');
    await page.locator('td[contenteditable="true"]').nth(3).click();
    await page.keyboard.up('Shift');
    
    // Verify Bulk N/A button is now available
    await expect(page.getByRole('button', { name: 'Bulk N/A' })).toBeVisible();
  });

  await test.step('5. Stage specific (SC)', async () => {
    // Take screenshot showing Bulk N/A available in Execution stage
    const timestamp = formatTimestamp(new Date());
    await page.screenshot({ 
      path: getScreenshotPath(`TS.7.8.5-04-5-${timestamp}.png`) 
    });
  });

  // Expected Results:
  // 1. Pre-Approval checked ✓
  // 2. Not available ✓
  // 3. Execution stage ✓
  // 4. Option shown ✓
  // 5. Limited to execution ✓
});