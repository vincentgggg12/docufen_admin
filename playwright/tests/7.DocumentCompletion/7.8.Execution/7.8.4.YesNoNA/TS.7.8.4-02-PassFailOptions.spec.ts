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

test('TS.7.8.4-02 Pass Fail Options', async ({ page }) => {
  // Login as an executor
  const email = process.env.MS_EMAIL_17NJ5D_DAVID_SEAGAL!;
  const password = process.env.MS_PASSWORD!;
  await microsoftLogin(page, email, password);
  await handleERSDDialog(page);

  // Test Steps
  await test.step('1. Find Pass button', async () => {
    // Navigate to a document in Execution stage
    await page.getByRole('button', { name: 'Menu' }).click();
    await page.getByRole('link', { name: 'Documents' }).click();
    await page.waitForLoadState('networkidle');
    
    // Find and open a document in Execution stage
    await page.getByText('Execution').first().click();
    
    // Click on an editable cell
    await page.locator('td[contenteditable="true"]').first().click();
    
    // Verify Pass button exists
    await expect(page.getByRole('button', { name: 'Pass' })).toBeVisible();
  });

  await test.step('2. Click Pass', async () => {
    // Click Pass button
    await page.getByRole('button', { name: 'Pass' }).click();
  });

  await test.step('3. "Pass" inserted', async () => {
    // Verify "Pass" was inserted
    const cellContent = await page.locator('td[contenteditable="true"]').first().textContent();
    expect(cellContent).toContain('Pass');
  });

  await test.step('4. Try Fail', async () => {
    // Click on another editable cell
    await page.locator('td[contenteditable="true"]').nth(1).click();
    
    // Click Fail button
    await page.getByRole('button', { name: 'Fail' }).click();
    
    // Verify "Fail" was inserted
    const cellContent = await page.locator('td[contenteditable="true"]').nth(1).textContent();
    expect(cellContent).toContain('Fail');
  });

  await test.step('5. Quality options (SC)', async () => {
    // Take screenshot showing Pass/Fail options
    const timestamp = formatTimestamp(new Date());
    await page.screenshot({ 
      path: getScreenshotPath(`TS.7.8.4-02-5-${timestamp}.png`) 
    });
  });

  // Expected Results:
  // 1. Pass found ✓
  // 2. Pass clicked ✓
  // 3. Pass added ✓
  // 4. Fail works ✓
  // 5. QC options ✓
});