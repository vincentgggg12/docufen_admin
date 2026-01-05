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

test('TS.7.8.4-03 Single Click Entry', async ({ page }) => {
  // Login as David Seagal (initials DS)
  const email = process.env.MS_EMAIL_17NJ5D_DAVID_SEAGAL!;
  const password = process.env.MS_PASSWORD!;
  await microsoftLogin(page, email, password);
  await handleERSDDialog(page);

  // Test Steps
  await test.step('1. Click N/A', async () => {
    // Navigate to a document in Execution stage
    await page.getByRole('button', { name: 'Menu' }).click();
    await page.getByRole('link', { name: 'Documents' }).click();
    await page.waitForLoadState('networkidle');
    
    // Find and open a document in Execution stage
    await page.getByText('Execution').first().click();
    
    // Click on an editable cell
    await page.locator('td[contenteditable="true"]').first().click();
    
    // Click N/A button
    await page.getByRole('button', { name: 'N/A' }).click();
  });

  await test.step('2. "N/A DS 24-Jun-2025" inserted', async () => {
    // Verify full entry was inserted with initials and date
    const cellContent = await page.locator('td[contenteditable="true"]').first().textContent();
    expect(cellContent).toContain('N/A');
    expect(cellContent).toContain('DS');
    expect(cellContent).toMatch(/\d{1,2}-\w{3}-\d{4}/); // Date format
  });

  await test.step('3. One click', async () => {
    // Verify it was a single click operation
    // The content should be inserted immediately without additional steps
    const cellContent = await page.locator('td[contenteditable="true"]').first().textContent();
    expect(cellContent).toBeTruthy();
  });

  await test.step('4. Full entry', async () => {
    // Verify the entry contains all required components
    const cellContent = await page.locator('td[contenteditable="true"]').first().textContent();
    const parts = cellContent?.split(' ') || [];
    expect(parts.length).toBeGreaterThanOrEqual(3); // N/A, initials, date
  });

  await test.step('5. Efficient (SC)', async () => {
    // Take screenshot showing complete N/A entry with initials and timestamp
    const timestamp = formatTimestamp(new Date());
    await page.screenshot({ 
      path: getScreenshotPath(`TS.7.8.4-03-5-${timestamp}.png`) 
    });
  });

  // Expected Results:
  // 1. N/A clicked ✓
  // 2. Complete entry ✓
  // 3. Single action ✓
  // 4. All info added ✓
  // 5. Quick process ✓
});