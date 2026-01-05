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

test('TS.7.8.3-01 Custom Text Input', async ({ page }) => {
  // Login as an executor
  const email = process.env.MS_EMAIL_17NJ5D_DAVID_SEAGAL!;
  const password = process.env.MS_PASSWORD!;
  await microsoftLogin(page, email, password);
  await handleERSDDialog(page);

  // Test Steps
  await test.step('1. Select custom text', async () => {
    // Navigate to a document in Execution stage
    await page.getByRole('button', { name: 'Menu' }).click();
    await page.getByRole('link', { name: 'Documents' }).click();
    await page.waitForLoadState('networkidle');
    
    // Find and open a document in Execution stage
    await page.getByText('Execution').first().click();
    
    // Click on an editable cell
    await page.locator('td[contenteditable="true"]').first().click();
    
    // Focus on custom text input field
    await page.getByPlaceholder('Enter custom text').click();
  });

  await test.step('2. Type "Test complete"', async () => {
    // Type custom text
    await page.getByPlaceholder('Enter custom text').fill('Test complete');
  });

  await test.step('3. Insert text', async () => {
    // Click insert button
    await page.getByRole('button', { name: 'Insert' }).click();
  });

  await test.step('4. Added to cell', async () => {
    // Verify text was added to the cell
    const cellContent = await page.locator('td[contenteditable="true"]').first().textContent();
    expect(cellContent).toContain('Test complete');
  });

  await test.step('5. Free text works (SC)', async () => {
    // Take screenshot showing custom text in cell
    const timestamp = formatTimestamp(new Date());
    await page.screenshot({ 
      path: getScreenshotPath(`TS.7.8.3-01-5-${timestamp}.png`) 
    });
  });

  // Expected Results:
  // 1. Custom selected ✓
  // 2. Text typed ✓
  // 3. Inserted ✓
  // 4. In cell ✓
  // 5. Custom functional ✓
});