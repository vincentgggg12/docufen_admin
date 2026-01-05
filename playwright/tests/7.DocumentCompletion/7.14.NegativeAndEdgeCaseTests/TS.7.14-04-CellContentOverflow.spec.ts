import { test, expect } from '@playwright/test';
import * as dotenv from 'dotenv';
import { microsoftLogin, handleERSDDialog } from '../../src/utils/microsoftLogin';
import { getScreenshotPath, formatTimestamp } from '../../src/utils/screenshotUtils';

dotenv.config({ path: '.playwright.env' });

test.use({
  viewport: { height: 1080, width: 1920 },
  ignoreHTTPSErrors: true
});

test.setTimeout(120000); // 2 minutes

test('TS.7.14-04 Cell Content Overflow', async ({ page }) => {
  // Login
  const email = process.env.MS_EMAIL_17NJ5D_EMILY_MARTIN!;
  const password = process.env.MS_PASSWORD!;
  await microsoftLogin(page, email, password);
  await handleERSDDialog(page);

  // Navigate to Sign page
  await page.getByRole('button', { name: 'Menu' }).click();
  await page.getByRole('link', { name: 'Sign' }).click();
  await page.waitForLoadState('networkidle');

  // Select a document to sign
  const firstDocument = page.locator('[data-testid="sign-document-row"], tbody tr').first();
  await firstDocument.click();
  await page.waitForSelector('[data-testid="document-viewer"], iframe, .document-container');

  // Find a table cell to test overflow
  // Switch to iframe if document is in iframe
  let documentFrame = page;
  const iframe = page.locator('iframe').first();
  if (await iframe.isVisible()) {
    documentFrame = page.frameLocator('iframe').first();
  }

  // Test Step 1: Enter 5000 characters in cell
  await test.step('Enter 5000 characters in cell', async () => {
    // Generate 5000 character string
    const longText = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. '.repeat(100);
    
    // Find and click on a table cell
    const tableCell = documentFrame.locator('td, [data-testid="table-cell"], .table-cell').first();
    await tableCell.click();
    
    // Clear existing content and enter long text
    await page.keyboard.press('Control+A');
    await page.keyboard.press('Delete');
    await page.keyboard.type(longText);
    
    // Click outside to save
    await documentFrame.locator('body').click({ position: { x: 10, y: 10 } });
  });

  // Test Step 2: Cell expands
  await test.step('Cell expands', async () => {
    // Get the cell element
    const tableCell = documentFrame.locator('td, [data-testid="table-cell"], .table-cell').first();
    
    // Check if cell has expanded (height should be greater than standard)
    const cellBox = await tableCell.boundingBox();
    expect(cellBox).not.toBeNull();
    expect(cellBox!.height).toBeGreaterThan(30); // Standard cell height
  });

  // Test Step 3: All text visible
  await test.step('All text is visible', async () => {
    // Verify text is not truncated
    const tableCell = documentFrame.locator('td, [data-testid="table-cell"], .table-cell').first();
    const cellText = await tableCell.textContent();
    
    // Check that cell contains substantial text
    expect(cellText).not.toBeNull();
    expect(cellText!.length).toBeGreaterThan(1000);
    
    // Check for text-overflow style
    const hasOverflow = await tableCell.evaluate(el => {
      const styles = window.getComputedStyle(el);
      return styles.textOverflow === 'ellipsis' || styles.overflow === 'hidden';
    });
    expect(hasOverflow).toBeFalsy();
  });

  // Test Step 4: No truncation
  await test.step('No truncation', async () => {
    // Verify no ellipsis or truncation indicators
    const tableCell = documentFrame.locator('td, [data-testid="table-cell"], .table-cell').first();
    const cellHtml = await tableCell.innerHTML();
    
    // Check for common truncation indicators
    expect(cellHtml).not.toContain('...');
    expect(cellHtml).not.toContain('�');
    
    // Verify overflow is visible or auto, not hidden
    const overflow = await tableCell.evaluate(el => window.getComputedStyle(el).overflow);
    expect(overflow).not.toBe('hidden');
  });

  // Test Step 5: Handles large content with screenshot
  await test.step('Handles large content (SC)', async () => {
    // Scroll to ensure cell is in view
    const tableCell = documentFrame.locator('td, [data-testid="table-cell"], .table-cell').first();
    await tableCell.scrollIntoViewIfNeeded();
    
    // Verify cell is properly rendered
    await expect(tableCell).toBeVisible();
    
    // Check that table layout hasn't broken
    const table = documentFrame.locator('table, [data-testid="data-table"]').first();
    await expect(table).toBeVisible();
    
    // Take screenshot showing expanded cell
    const timestamp = formatTimestamp(new Date());
    await page.screenshot({ 
      path: getScreenshotPath(`TS.7.14-04-5-${timestamp}.png`),
      fullPage: true
    });
  });

  // Expected Results:
  // 1. Massive text ✓
  // 2. Cell grows ✓
  // 3. Fully displayed ✓
  // 4. Nothing cut ✓
  // 5. Scales properly ✓
});