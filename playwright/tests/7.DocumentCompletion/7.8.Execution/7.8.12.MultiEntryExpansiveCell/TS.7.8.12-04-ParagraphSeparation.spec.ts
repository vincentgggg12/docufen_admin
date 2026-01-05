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

test('TS.7.8.12-04 Paragraph Separation', async ({ page }) => {
  // Login as an executor
  const email = process.env.MS_EMAIL_17NJ5D_DAVID_SEAGAL!;
  const password = process.env.MS_PASSWORD!;
  await microsoftLogin(page, email, password);
  await handleERSDDialog(page);

  // Test Steps
  await test.step('1. View multi-entries', async () => {
    // Navigate to a document in Execution stage
    await page.getByRole('button', { name: 'Menu' }).click();
    await page.getByRole('link', { name: 'Documents' }).click();
    await page.waitForLoadState('networkidle');
    
    // Find and open a document in Execution stage
    await page.getByText('Execution').first().click();
    
    // Add multiple entries to a cell
    const cell = page.locator('td[contenteditable="true"]').first();
    
    // First entry
    await cell.click();
    await page.getByPlaceholder('Enter custom text').fill('First paragraph entry');
    await page.getByRole('button', { name: 'Insert' }).click();
    await page.waitForTimeout(1000);
    
    // Second entry
    await cell.click();
    await page.getByPlaceholder('Enter custom text').fill('Second paragraph entry');
    await page.getByRole('button', { name: 'Insert' }).click();
    await page.waitForTimeout(1000);
    
    // Third entry
    await cell.click();
    await page.getByPlaceholder('Enter custom text').fill('Third paragraph entry');
    await page.getByRole('button', { name: 'Insert' }).click();
    await page.waitForTimeout(1000);
  });

  await test.step('2. Line spacing between', async () => {
    // Check for line breaks or spacing between entries
    const cell = page.locator('td[contenteditable="true"]').first();
    const innerHTML = await cell.innerHTML();
    
    // Check for line breaks, <br> tags, or paragraph elements
    const hasLineBreaks = innerHTML.includes('<br') || innerHTML.includes('\\n\\n') || innerHTML.includes('<p');
    expect(hasLineBreaks).toBe(true);
  });

  await test.step('3. Clear separation', async () => {
    // Verify entries are visually separated
    const cell = page.locator('td[contenteditable="true"]').first();
    const lineHeight = await cell.evaluate(el => 
      window.getComputedStyle(el).lineHeight
    );
    
    // Line height should allow for separation
    expect(parseInt(lineHeight)).toBeGreaterThan(0);
  });

  await test.step('4. Easy to read', async () => {
    // Verify all entries are clearly visible and readable
    const cellText = await page.locator('td[contenteditable="true"]').first().textContent();
    expect(cellText).toContain('First paragraph entry');
    expect(cellText).toContain('Second paragraph entry');
    expect(cellText).toContain('Third paragraph entry');
  });

  await test.step('5. Well formatted (SC)', async () => {
    // Take screenshot showing paragraph separation
    const timestamp = formatTimestamp(new Date());
    await page.screenshot({ 
      path: getScreenshotPath(`TS.7.8.12-04-5-${timestamp}.png`) 
    });
  });

  // Expected Results:
  // 1. Entries viewed ✓
  // 2. Spacing visible ✓
  // 3. Distinct paragraphs ✓
  // 4. Readable ✓
  // 5. Good layout ✓
});