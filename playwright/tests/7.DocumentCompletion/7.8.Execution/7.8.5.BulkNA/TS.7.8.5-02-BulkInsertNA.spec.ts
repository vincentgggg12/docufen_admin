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

test('TS.7.8.5-02 Bulk Insert NA', async ({ page }) => {
  // Login as an executor
  const email = process.env.MS_EMAIL_17NJ5D_DAVID_SEAGAL!;
  const password = process.env.MS_PASSWORD!;
  await microsoftLogin(page, email, password);
  await handleERSDDialog(page);

  // Test Steps
  await test.step('1. Select multiple cells', async () => {
    // Navigate to a document in Execution stage
    await page.getByRole('button', { name: 'Menu' }).click();
    await page.getByRole('link', { name: 'Documents' }).click();
    await page.waitForLoadState('networkidle');
    
    // Find and open a document in Execution stage
    await page.getByText('Execution').first().click();
    
    // Select multiple cells using shift+click or drag
    const firstCell = page.locator('td[contenteditable="true"]').first();
    await firstCell.click();
    
    // Hold shift and click fifth cell
    await page.keyboard.down('Shift');
    await page.locator('td[contenteditable="true"]').nth(4).click();
    await page.keyboard.up('Shift');
  });

  await test.step('2. Click Bulk N/A', async () => {
    // Look for Bulk N/A button
    await page.getByRole('button', { name: 'Bulk N/A' }).click();
  });

  await test.step('3. All cells filled', async () => {
    // Verify all selected cells now contain N/A
    const cells = await page.locator('td[contenteditable="true"]').all();
    let filledCount = 0;
    
    for (let i = 0; i < 5; i++) {
      const content = await cells[i].textContent();
      if (content?.includes('N/A')) {
        filledCount++;
      }
    }
    
    expect(filledCount).toBe(5);
  });

  await test.step('4. Same timestamp', async () => {
    // Get timestamps from multiple cells
    const firstCellContent = await page.locator('td[contenteditable="true"]').first().textContent();
    const secondCellContent = await page.locator('td[contenteditable="true"]').nth(1).textContent();
    
    // Extract timestamps (assuming format includes time)
    const timePattern = /\d{2}:\d{2}:\d{2}/;
    const firstTime = firstCellContent?.match(timePattern)?.[0];
    const secondTime = secondCellContent?.match(timePattern)?.[0];
    
    expect(firstTime).toBe(secondTime);
  });

  await test.step('5. Bulk operation (SC)', async () => {
    // Take screenshot showing all cells filled with N/A
    const timestamp = formatTimestamp(new Date());
    await page.screenshot({ 
      path: getScreenshotPath(`TS.7.8.5-02-5-${timestamp}.png`) 
    });
  });

  // Expected Results:
  // 1. Cells selected ✓
  // 2. Bulk clicked ✓
  // 3. All populated ✓
  // 4. Identical time ✓
  // 5. Efficient fill ✓
});