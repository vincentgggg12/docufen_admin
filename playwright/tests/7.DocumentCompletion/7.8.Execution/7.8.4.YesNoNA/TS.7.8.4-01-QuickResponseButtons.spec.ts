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

test('TS.7.8.4-01 Quick Response Buttons', async ({ page }) => {
  // Login as an executor
  const email = process.env.MS_EMAIL_17NJ5D_DAVID_SEAGAL!;
  const password = process.env.MS_PASSWORD!;
  await microsoftLogin(page, email, password);
  await handleERSDDialog(page);

  // Test Steps
  await test.step('1. Click Yes button', async () => {
    // Navigate to a document in Execution stage
    await page.getByRole('button', { name: 'Menu' }).click();
    await page.getByRole('link', { name: 'Documents' }).click();
    await page.waitForLoadState('networkidle');
    
    // Find and open a document in Execution stage
    await page.getByText('Execution').first().click();
    
    // Click on an editable cell
    await page.locator('td[contenteditable="true"]').first().click();
    
    // Click Yes button
    await page.getByRole('button', { name: 'Yes' }).click();
  });

  await test.step('2. "Yes" inserted', async () => {
    // Verify "Yes" was inserted
    const cellContent = await page.locator('td[contenteditable="true"]').first().textContent();
    expect(cellContent).toContain('Yes');
  });

  await test.step('3. Click No button', async () => {
    // Click on another editable cell
    await page.locator('td[contenteditable="true"]').nth(1).click();
    
    // Click No button
    await page.getByRole('button', { name: 'No' }).click();
  });

  await test.step('4. "No" inserted', async () => {
    // Verify "No" was inserted
    const cellContent = await page.locator('td[contenteditable="true"]').nth(1).textContent();
    expect(cellContent).toContain('No');
  });

  await test.step('5. Quick entry (SC)', async () => {
    // Take screenshot showing Yes and No entries
    const timestamp = formatTimestamp(new Date());
    await page.screenshot({ 
      path: getScreenshotPath(`TS.7.8.4-01-5-${timestamp}.png`) 
    });
  });

  // Expected Results:
  // 1. Yes clicked ✓
  // 2. Yes added ✓
  // 3. No clicked ✓
  // 4. No added ✓
  // 5. One-click entry ✓
});