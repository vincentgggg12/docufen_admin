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

test('TS.7.8.11-02 Date Time Selection', async ({ page }) => {
  // Login as an executor
  const email = process.env.MS_EMAIL_17NJ5D_DAVID_SEAGAL!;
  const password = process.env.MS_PASSWORD!;
  await microsoftLogin(page, email, password);
  await handleERSDDialog(page);

  // Test Steps
  await test.step('1. Select yesterday', async () => {
    // Navigate to a document in Execution stage
    await page.getByRole('button', { name: 'Menu' }).click();
    await page.getByRole('link', { name: 'Documents' }).click();
    await page.waitForLoadState('networkidle');
    
    // Find and open a document in Execution stage
    await page.getByText('Execution').first().click();
    
    // Enable late entry
    await page.getByLabel('Late Entry').check();
    
    // Click date picker
    await page.getByLabel('Select date and time').click();
    
    // Select yesterday's date
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const dayToSelect = yesterday.getDate().toString();
    
    await page.getByRole('button', { name: dayToSelect, exact: true }).click();
  });

  await test.step('2. Pick 2:00 PM', async () => {
    // Select time (14:00)
    await page.getByLabel('Hour').selectOption('14');
    await page.getByLabel('Minute').selectOption('00');
  });

  await test.step('3. Date accepted', async () => {
    // Verify date is accepted and displayed
    const dateInput = page.getByLabel('Select date and time');
    const value = await dateInput.inputValue();
    expect(value).toContain(yesterday.getDate().toString());
  });

  await test.step('4. Time accepted', async () => {
    // Verify time is accepted
    const dateInput = page.getByLabel('Select date and time');
    const value = await dateInput.inputValue();
    expect(value).toContain('14:00');
  });

  await test.step('5. Past datetime set (SC)', async () => {
    // Take screenshot showing past date/time selected
    const timestamp = formatTimestamp(new Date());
    await page.screenshot({ 
      path: getScreenshotPath(`TS.7.8.11-02-5-${timestamp}.png`) 
    });
  });

  // Expected Results:
  // 1. Yesterday selected ✓
  // 2. 14:00 chosen ✓
  // 3. Date valid ✓
  // 4. Time valid ✓
  // 5. Datetime configured ✓
});