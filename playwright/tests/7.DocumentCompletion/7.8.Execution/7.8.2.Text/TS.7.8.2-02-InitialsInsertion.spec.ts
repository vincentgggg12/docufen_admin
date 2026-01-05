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

test('TS.7.8.2-02 Initials Insertion', async ({ page }) => {
  // Login as David Seagal (initials DS)
  const email = process.env.MS_EMAIL_17NJ5D_DAVID_SEAGAL!;
  const password = process.env.MS_PASSWORD!;
  await microsoftLogin(page, email, password);
  await handleERSDDialog(page);

  // Test Steps
  await test.step('1. Click Initials button', async () => {
    // Navigate to a document in Execution stage
    await page.getByRole('button', { name: 'Menu' }).click();
    await page.getByRole('link', { name: 'Documents' }).click();
    await page.waitForLoadState('networkidle');
    
    // Find and open a document in Execution stage
    await page.getByText('Execution').first().click();
    
    // Click on an editable cell
    await page.locator('td[contenteditable="true"]').first().click();
    
    // Click Initials button
    await page.getByRole('button', { name: 'Initials' }).click();
  });

  await test.step('2. "DS" inserted', async () => {
    // Verify initials are inserted in the cell
    const cellContent = await page.locator('td[contenteditable="true"]').first().textContent();
    expect(cellContent).toContain('DS');
  });

  await test.step('3. With timestamp', async () => {
    // Verify timestamp is included with initials
    const cellContent = await page.locator('td[contenteditable="true"]').first().textContent();
    expect(cellContent).toMatch(/\d{1,2}-\w{3}-\d{4}/); // Date format
  });

  await test.step('4. Blue color', async () => {
    // Verify text is blue
    const cell = page.locator('td[contenteditable="true"]').first();
    const color = await cell.evaluate(el => 
      window.getComputedStyle(el).color
    );
    expect(color).toMatch(/blue|rgb\(0,\s*0,\s*255\)/i);
  });

  await test.step('5. Quick entry (SC)', async () => {
    // Take screenshot showing initials with timestamp in blue
    const timestamp = formatTimestamp(new Date());
    await page.screenshot({ 
      path: getScreenshotPath(`TS.7.8.2-02-5-${timestamp}.png`) 
    });
  });

  // Expected Results:
  // 1. Button clicked ✓
  // 2. Initials added ✓
  // 3. Time included ✓
  // 4. Blue text ✓
  // 5. Efficient ✓
});