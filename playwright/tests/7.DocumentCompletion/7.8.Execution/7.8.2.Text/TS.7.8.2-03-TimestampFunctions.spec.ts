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

test('TS.7.8.2-03 Timestamp Functions', async ({ page }) => {
  // Login as an executor
  const email = process.env.MS_EMAIL_17NJ5D_DAVID_SEAGAL!;
  const password = process.env.MS_PASSWORD!;
  await microsoftLogin(page, email, password);
  await handleERSDDialog(page);

  // Test Steps
  await test.step('1. Click Current Date', async () => {
    // Navigate to a document in Execution stage
    await page.getByRole('button', { name: 'Menu' }).click();
    await page.getByRole('link', { name: 'Documents' }).click();
    await page.waitForLoadState('networkidle');
    
    // Find and open a document in Execution stage
    await page.getByText('Execution').first().click();
    
    // Click on an editable cell
    await page.locator('td[contenteditable="true"]').first().click();
    
    // Click Current Date button
    await page.getByRole('button', { name: 'Current Date' }).click();
  });

  await test.step('2. Today\'s date inserted', async () => {
    // Verify today's date is inserted in correct format
    const cellContent = await page.locator('td[contenteditable="true"]').first().textContent();
    const today = new Date();
    const expectedFormat = today.toLocaleDateString('en-GB', { 
      day: '2-digit', 
      month: 'short', 
      year: 'numeric' 
    }).replace(/ /g, '-');
    expect(cellContent).toContain(expectedFormat);
  });

  await test.step('3. Click Current Time', async () => {
    // Click on another editable cell
    await page.locator('td[contenteditable="true"]').nth(1).click();
    
    // Click Current Time button
    await page.getByRole('button', { name: 'Current Time' }).click();
  });

  await test.step('4. Time inserted', async () => {
    // Verify time is inserted in correct format (HH:MM:SS)
    const cellContent = await page.locator('td[contenteditable="true"]').nth(1).textContent();
    expect(cellContent).toMatch(/\d{2}:\d{2}:\d{2}/);
  });

  await test.step('5. Formatted correctly (SC)', async () => {
    // Take screenshot showing date and time entries
    const timestamp = formatTimestamp(new Date());
    await page.screenshot({ 
      path: getScreenshotPath(`TS.7.8.2-03-5-${timestamp}.png`) 
    });
  });

  // Expected Results:
  // 1. Date clicked ✓
  // 2. "24-Jun-2025" ✓
  // 3. Time clicked ✓
  // 4. "14:30:25" ✓
  // 5. Proper format ✓
});