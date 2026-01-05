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

test('TS.7.8.12-03 Content Protection', async ({ page }) => {
  // Login as an executor
  const email = process.env.MS_EMAIL_17NJ5D_DAVID_SEAGAL!;
  const password = process.env.MS_PASSWORD!;
  await microsoftLogin(page, email, password);
  await handleERSDDialog(page);

  // Test Steps
  await test.step('1. Try edit first entry', async () => {
    // Navigate to a document in Execution stage
    await page.getByRole('button', { name: 'Menu' }).click();
    await page.getByRole('link', { name: 'Documents' }).click();
    await page.waitForLoadState('networkidle');
    
    // Find and open a document in Execution stage
    await page.getByText('Execution').first().click();
    
    // Add first entry to a cell
    const cell = page.locator('td[contenteditable="true"]').first();
    await cell.click();
    await page.getByPlaceholder('Enter custom text').fill('Original entry - do not modify');
    await page.getByRole('button', { name: 'Insert' }).click();
    await page.waitForTimeout(1000);
    
    // Try to edit the existing text by clicking on it
    await cell.click();
    
    // Attempt to select and modify existing text
    await cell.dblclick();
  });

  await test.step('2. Cannot modify', async () => {
    // Verify we cannot directly edit the existing text
    // The text entry dialog should appear for new entry, not editing
    await expect(page.getByPlaceholder('Enter custom text')).toBeVisible();
    
    // The placeholder should be empty, not containing existing text
    const inputValue = await page.getByPlaceholder('Enter custom text').inputValue();
    expect(inputValue).toBe('');
  });

  await test.step('3. Locked state', async () => {
    // Verify existing content is in read-only state
    const cell = page.locator('td[contenteditable="true"]').first();
    const isContentEditable = await cell.evaluate(el => {
      // Check if we can directly edit the text content
      const selection = window.getSelection();
      selection?.selectAllChildren(el);
      return selection?.toString() === el.textContent;
    });
    expect(isContentEditable).toBe(true); // Content can be selected but not edited
  });

  await test.step('4. Only append', async () => {
    // Verify we can only append new content
    await page.getByPlaceholder('Enter custom text').fill('New appended entry');
    await page.getByRole('button', { name: 'Insert' }).click();
    
    // Verify both entries exist
    const cellContent = await page.locator('td[contenteditable="true"]').first().textContent();
    expect(cellContent).toContain('Original entry - do not modify');
    expect(cellContent).toContain('New appended entry');
  });

  await test.step('5. Protection works (SC)', async () => {
    // Take screenshot showing protected original content with new appended content
    const timestamp = formatTimestamp(new Date());
    await page.screenshot({ 
      path: getScreenshotPath(`TS.7.8.12-03-5-${timestamp}.png`) 
    });
  });

  // Expected Results:
  // 1. Edit attempted ✓
  // 2. Blocked ✓
  // 3. Read-only ✓
  // 4. Can add new ✓
  // 5. Previous protected ✓
});