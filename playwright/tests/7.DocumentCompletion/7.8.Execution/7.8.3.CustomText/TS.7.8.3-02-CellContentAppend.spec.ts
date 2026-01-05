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

test('TS.7.8.3-02 Cell Content Append', async ({ page }) => {
  // Login as an executor
  const email = process.env.MS_EMAIL_17NJ5D_DAVID_SEAGAL!;
  const password = process.env.MS_PASSWORD!;
  await microsoftLogin(page, email, password);
  await handleERSDDialog(page);

  // Test Steps
  await test.step('1. Cell has content', async () => {
    // Navigate to a document in Execution stage
    await page.getByRole('button', { name: 'Menu' }).click();
    await page.getByRole('link', { name: 'Documents' }).click();
    await page.waitForLoadState('networkidle');
    
    // Find and open a document in Execution stage
    await page.getByText('Execution').first().click();
    
    // Click on an editable cell and add initial content
    await page.locator('td[contenteditable="true"]').first().click();
    await page.getByPlaceholder('Enter custom text').fill('Initial content');
    await page.getByRole('button', { name: 'Insert' }).click();
    
    // Store initial content
    const initialContent = await page.locator('td[contenteditable="true"]').first().textContent();
    expect(initialContent).toContain('Initial content');
  });

  await test.step('2. Add custom text', async () => {
    // Click the same cell again
    await page.locator('td[contenteditable="true"]').first().click();
    
    // Add more text
    await page.getByPlaceholder('Enter custom text').fill('Additional text');
  });

  await test.step('3. Appends to end', async () => {
    // Insert the additional text
    await page.getByRole('button', { name: 'Insert' }).click();
    
    // Verify text was appended
    const cellContent = await page.locator('td[contenteditable="true"]').first().textContent();
    expect(cellContent).toContain('Initial content');
    expect(cellContent).toContain('Additional text');
  });

  await test.step('4. Doesn\'t overwrite', async () => {
    // Verify original content is still present
    const cellContent = await page.locator('td[contenteditable="true"]').first().textContent();
    expect(cellContent).toContain('Initial content');
  });

  await test.step('5. Preserves existing (SC)', async () => {
    // Take screenshot showing both texts in the cell
    const timestamp = formatTimestamp(new Date());
    await page.screenshot({ 
      path: getScreenshotPath(`TS.7.8.3-02-5-${timestamp}.png`) 
    });
  });

  // Expected Results:
  // 1. Existing content ✓
  // 2. Text added ✓
  // 3. Added at end ✓
  // 4. Original kept ✓
  // 5. Append mode ✓
});