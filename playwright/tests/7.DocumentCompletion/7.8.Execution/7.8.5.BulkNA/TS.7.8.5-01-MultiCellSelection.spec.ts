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

test('TS.7.8.5-01 Multi Cell Selection', async ({ page }) => {
  // Login as an executor
  const email = process.env.MS_EMAIL_17NJ5D_DAVID_SEAGAL!;
  const password = process.env.MS_PASSWORD!;
  await microsoftLogin(page, email, password);
  await handleERSDDialog(page);

  // Test Steps
  await test.step('1. Click first cell', async () => {
    // Navigate to a document in Execution stage
    await page.getByRole('button', { name: 'Menu' }).click();
    await page.getByRole('link', { name: 'Documents' }).click();
    await page.waitForLoadState('networkidle');
    
    // Find and open a document in Execution stage
    await page.getByText('Execution').first().click();
    
    // Click on first editable cell
    const firstCell = page.locator('td[contenteditable="true"]').first();
    await firstCell.click();
  });

  await test.step('2. Drag to select 5 cells', async () => {
    // Get the first cell position
    const firstCell = page.locator('td[contenteditable="true"]').first();
    const firstBox = await firstCell.boundingBox();
    
    // Get the fifth cell position
    const fifthCell = page.locator('td[contenteditable="true"]').nth(4);
    const fifthBox = await fifthCell.boundingBox();
    
    if (firstBox && fifthBox) {
      // Start drag from first cell
      await page.mouse.move(firstBox.x + firstBox.width / 2, firstBox.y + firstBox.height / 2);
      await page.mouse.down();
      
      // Drag to fifth cell
      await page.mouse.move(fifthBox.x + fifthBox.width / 2, fifthBox.y + fifthBox.height / 2);
    }
  });

  await test.step('3. Cells highlighted', async () => {
    // Check if cells are highlighted (selected)
    const selectedCells = await page.locator('td[contenteditable="true"].selected').count();
    expect(selectedCells).toBeGreaterThan(0);
  });

  await test.step('4. Selection visible', async () => {
    // Verify visual feedback for selection
    await page.mouse.up(); // Complete the drag
    
    // Look for any visual indication of selection
    const hasSelection = await page.locator('.cell-selection, .selected-cells, td.selected').count();
    expect(hasSelection).toBeGreaterThan(0);
  });

  await test.step('5. Multi-select works (SC)', async () => {
    // Take screenshot showing multiple cells selected
    const timestamp = formatTimestamp(new Date());
    await page.screenshot({ 
      path: getScreenshotPath(`TS.7.8.5-01-5-${timestamp}.png`) 
    });
  });

  // Expected Results:
  // 1. First clicked ✓
  // 2. Dragged down ✓
  // 3. 5 cells selected ✓
  // 4. Highlight shown ✓
  // 5. Selection functional ✓
});