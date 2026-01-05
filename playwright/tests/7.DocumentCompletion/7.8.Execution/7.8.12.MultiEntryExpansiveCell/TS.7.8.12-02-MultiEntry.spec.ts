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

test('TS.7.8.12-02 Multi Entry', async ({ page }) => {
  // Login as an executor
  const email = process.env.MS_EMAIL_17NJ5D_DAVID_SEAGAL!;
  const password = process.env.MS_PASSWORD!;
  await microsoftLogin(page, email, password);
  await handleERSDDialog(page);

  // Test Steps
  await test.step('1. Add first entry', async () => {
    // Navigate to a document in Execution stage
    await page.getByRole('button', { name: 'Menu' }).click();
    await page.getByRole('link', { name: 'Documents' }).click();
    await page.waitForLoadState('networkidle');
    
    // Find and open a document in Execution stage
    await page.getByText('Execution').first().click();
    
    // Click on an editable cell
    const cell = page.locator('td[contenteditable="true"]').first();
    await cell.click();
    
    // Add first entry
    await page.getByPlaceholder('Enter custom text').fill('First entry');
    await page.getByRole('button', { name: 'Insert' }).click();
    
    // Wait for entry to be saved
    await page.waitForTimeout(1000);
  });

  await test.step('2. Click same cell', async () => {
    // Click the same cell again
    const cell = page.locator('td[contenteditable="true"]').first();
    await cell.click();
  });

  await test.step('3. Add second entry', async () => {
    // Add second entry
    await page.getByPlaceholder('Enter custom text').fill('Second entry');
    await page.getByRole('button', { name: 'Insert' }).click();
    
    // Wait for entry to be saved
    await page.waitForTimeout(1000);
  });

  await test.step('4. Both shown', async () => {
    // Verify both entries are visible
    const cell = page.locator('td[contenteditable="true"]').first();
    const cellText = await cell.textContent();
    expect(cellText).toContain('First entry');
    expect(cellText).toContain('Second entry');
  });

  await test.step('5. Multiple entries (SC)', async () => {
    // Take screenshot showing multiple entries in one cell
    const timestamp = formatTimestamp(new Date());
    await page.screenshot({ 
      path: getScreenshotPath(`TS.7.8.12-02-5-${timestamp}.png`) 
    });
  });

  // Expected Results:
  // 1. First added ✓
  // 2. Cell re-selected ✓
  // 3. Second added ✓
  // 4. Both visible ✓
  // 5. Multi-entry works ✓
});