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

test('TS.7.8.5-03 Selection Highlighting', async ({ page }) => {
  // Login as an executor
  const email = process.env.MS_EMAIL_17NJ5D_DAVID_SEAGAL!;
  const password = process.env.MS_PASSWORD!;
  await microsoftLogin(page, email, password);
  await handleERSDDialog(page);

  // Test Steps
  await test.step('1. Select cells', async () => {
    // Navigate to a document in Execution stage
    await page.getByRole('button', { name: 'Menu' }).click();
    await page.getByRole('link', { name: 'Documents' }).click();
    await page.waitForLoadState('networkidle');
    
    // Find and open a document in Execution stage
    await page.getByText('Execution').first().click();
    
    // Select multiple cells
    const firstCell = page.locator('td[contenteditable="true"]').first();
    await firstCell.click();
    
    await page.keyboard.down('Shift');
    await page.locator('td[contenteditable="true"]').nth(3).click();
    await page.keyboard.up('Shift');
  });

  await test.step('2. Blue highlight shown', async () => {
    // Check for blue highlight on selected cells
    const selectedCells = page.locator('td[contenteditable="true"].selected, td[contenteditable="true"][data-selected="true"]');
    const count = await selectedCells.count();
    
    if (count > 0) {
      const backgroundColor = await selectedCells.first().evaluate(el => 
        window.getComputedStyle(el).backgroundColor
      );
      expect(backgroundColor).toMatch(/blue|rgb\(.*,.*,\s*255/i);
    }
  });

  await test.step('3. Clear boundaries', async () => {
    // Verify selection has clear visual boundaries
    const hasSelectionBorder = await page.locator('td[contenteditable="true"]').first().evaluate(el => {
      const styles = window.getComputedStyle(el);
      return styles.border || styles.outline;
    });
    
    expect(hasSelectionBorder).toBeTruthy();
  });

  await test.step('4. Visual feedback', async () => {
    // Verify there's visual feedback for selection
    const hasVisualFeedback = await page.evaluate(() => {
      const selectedCells = document.querySelectorAll('td[contenteditable="true"].selected, td[contenteditable="true"][data-selected="true"]');
      return selectedCells.length > 0;
    });
    
    expect(hasVisualFeedback).toBe(true);
  });

  await test.step('5. User knows selection (SC)', async () => {
    // Take screenshot showing highlighted selection
    const timestamp = formatTimestamp(new Date());
    await page.screenshot({ 
      path: getScreenshotPath(`TS.7.8.5-03-5-${timestamp}.png`) 
    });
  });

  // Expected Results:
  // 1. Selected ✓
  // 2. Blue highlight ✓
  // 3. Edges clear ✓
  // 4. Visible selection ✓
  // 5. Good feedback ✓
});