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

test('TS.7.7.2-01 Custom Text Entry', async ({ page }) => {
  // Login as a Pre-Approval participant
  const email = process.env.MS_EMAIL_ORG_USERNAME!;
  const password = process.env.MS_PASSWORD!;
  await microsoftLogin(page, email, password);
  await handleERSDDialog(page);

  // Navigate to a document in Pre-Approval stage
  await page.getByRole('button', { name: 'Menu' }).click();
  await page.getByRole('link', { name: 'Documents' }).click();
  await page.waitForLoadState('networkidle');
  
  // Find and open a document in Pre-Approval stage
  await page.getByText('Pre-Approval').first().click();
  await page.waitForLoadState('networkidle');

  // Test Steps
  await test.step('1. Click text option', async () => {
    // Click on the text annotation tool
    await page.getByRole('button', { name: 'Text', exact: true }).click();
    
    // Verify text tool is activated
    await expect(page.getByRole('button', { name: 'Text', exact: true })).toHaveClass(/active|selected/);
  });

  await test.step('2. Enter "Reviewed on site"', async () => {
    // Click on the document where we want to add text
    const documentArea = page.locator('.document-viewer, canvas').first();
    await documentArea.click({ position: { x: 300, y: 200 } });
    
    // Type the custom text
    await page.keyboard.type('Reviewed on site');
  });

  await test.step('3. Insert text', async () => {
    // Press Enter or click outside to insert the text
    await page.keyboard.press('Enter');
    
    // Wait for text to be inserted
    await page.waitForTimeout(1000);
  });

  await test.step('4. Blue color', async () => {
    // Verify the text appears in blue color
    const insertedText = page.locator('text=Reviewed on site').first();
    await expect(insertedText).toBeVisible();
    
    // Check the text color is blue
    const color = await insertedText.evaluate(el => window.getComputedStyle(el).color);
    expect(color).toMatch(/blue|rgb\(0,\s*0,\s*255\)|#0000ff/i);
  });

  await test.step('5. Text added (SC)', async () => {
    // Verify text is successfully added to the document
    await expect(page.locator('text=Reviewed on site')).toBeVisible();
    
    // Take screenshot
    const timestamp = formatTimestamp(new Date());
    await page.screenshot({ 
      path: getScreenshotPath(`TS.7.7.2-01-5-${timestamp}.png`) 
    });
  });

  // Expected Results:
  // 1. Text clicked ✓
  // 2. Custom entered ✓
  // 3. Inserted ✓
  // 4. Blue font ✓
  // 5. Successfully added ✓
});