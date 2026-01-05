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

test('TS.7.7.2-02 Blue Text Rendering', async ({ page }) => {
  // Login as a Pre-Approval participant
  const email = process.env.MS_EMAIL_ORG_USERNAME!;
  const password = process.env.MS_PASSWORD!;
  await microsoftLogin(page, email, password);
  await handleERSDDialog(page);

  // Navigate to a document in Pre-Approval stage
  await page.getByRole('button', { name: 'Menu' }).click();
  await page.getByRole('link', { name: 'Documents' }).click();
  await page.waitForLoadState('networkidle');
  
  // Find and open a document in Pre-Approval stage with existing text
  await page.getByText('Pre-Approval').first().click();
  await page.waitForLoadState('networkidle');

  // Test Steps
  await test.step('1. Insert any text', async () => {
    // Click on the text annotation tool
    await page.getByRole('button', { name: 'Text', exact: true }).click();
    
    // Click on the document and add text
    const documentArea = page.locator('.document-viewer, canvas').first();
    await documentArea.click({ position: { x: 400, y: 300 } });
    
    // Type some test text
    await page.keyboard.type('Test annotation text');
    await page.keyboard.press('Enter');
    
    await page.waitForTimeout(1000);
  });

  await test.step('2. Check color', async () => {
    // Verify the newly added text color
    const newText = page.locator('text=Test annotation text').first();
    await expect(newText).toBeVisible();
    
    // Get the computed color
    const color = await newText.evaluate(el => window.getComputedStyle(el).color);
    expect(color).toMatch(/blue|rgb\(0,\s*0,\s*255\)|#0000ff/i);
  });

  await test.step('3. Always blue', async () => {
    // Add another text annotation to confirm consistency
    await page.getByRole('button', { name: 'Text', exact: true }).click();
    
    const documentArea = page.locator('.document-viewer, canvas').first();
    await documentArea.click({ position: { x: 500, y: 400 } });
    
    await page.keyboard.type('Another blue text');
    await page.keyboard.press('Enter');
    
    await page.waitForTimeout(1000);
    
    // Verify this text is also blue
    const anotherText = page.locator('text=Another blue text').first();
    const anotherColor = await anotherText.evaluate(el => window.getComputedStyle(el).color);
    expect(anotherColor).toMatch(/blue|rgb\(0,\s*0,\s*255\)|#0000ff/i);
  });

  await test.step('4. Original stays black', async () => {
    // Check that original document text remains black
    const originalText = page.locator('.document-content, .document-text').first();
    
    if (await originalText.isVisible()) {
      const originalColor = await originalText.evaluate(el => window.getComputedStyle(el).color);
      expect(originalColor).toMatch(/black|rgb\(0,\s*0,\s*0\)|#000000/i);
    }
  });

  await test.step('5. Clear distinction (SC)', async () => {
    // Verify visual distinction between original and annotation text
    await expect(page.locator('text=Test annotation text')).toBeVisible();
    await expect(page.locator('text=Another blue text')).toBeVisible();
    
    // Take screenshot showing the color distinction
    const timestamp = formatTimestamp(new Date());
    await page.screenshot({ 
      path: getScreenshotPath(`TS.7.7.2-02-5-${timestamp}.png`) 
    });
  });

  // Expected Results:
  // 1. Text inserted ✓
  // 2. Color checked ✓
  // 3. Blue confirmed ✓
  // 4. Black preserved ✓
  // 5. Visually distinct ✓
});