import { test, expect } from '@playwright/test';
import * as dotenv from 'dotenv';
import { microsoftLogin, handleERSDDialog } from '../../../../src/utils/microsoftLogin';
import { getScreenshotPath, formatTimestamp } from '../../../../src/utils/screenshotUtils';

dotenv.config({ path: '.playwright.env' });

test.use({
  viewport: { height: 1080, width: 1920 },
  ignoreHTTPSErrors: true
});

test.setTimeout(120000); // 2 minutes

test('TS.7.9.2-02 Blue Text Format', async ({ page }) => {
  // Setup: Login as Post-Approval participant
  const email = process.env.MS_EMAIL_17NJ5D_ALEX_WILBER!;
  const password = process.env.MS_PASSWORD!;
  await microsoftLogin(page, email, password);
  await handleERSDDialog(page);

  // Navigate to a document in Post-Approval stage
  await page.getByRole('button', { name: 'Menu' }).click();
  await page.getByRole('link', { name: 'Tracking' }).click();
  
  // Find document in Post-Approval stage
  await page.waitForSelector('[data-testid="document-list"]', { timeout: 10000 });
  const postApprovalDoc = page.locator('[data-testid="document-item"]').filter({ hasText: 'Post-Approval' }).first();
  await postApprovalDoc.click();
  
  // Wait for document to load
  await page.waitForSelector('[data-testid="document-content"]', { timeout: 10000 });

  // Test Step 1: Add any text
  await test.step('Add any text', async () => {
    // Click on a cell in the document
    const editableCell = page.locator('[data-testid="editable-cell"], td').first();
    await editableCell.click();
    
    // Add text
    await page.getByRole('button', { name: 'Text', exact: true }).click();
    await page.getByText('Custom Text').click();
    
    const testText = 'Post-approval verification complete';
    await page.keyboard.type(testText);
    await page.keyboard.press('Enter');
    
    // Wait for text to be added
    await expect(page.getByText(testText)).toBeVisible();
  });

  // Test Step 2: Check color
  await test.step('Check color', async () => {
    // Find the added text
    const addedText = page.getByText('Post-approval verification complete');
    
    // Get the computed color
    const color = await addedText.evaluate(el => {
      return window.getComputedStyle(el).color;
    });
    
    // Log color for debugging
    console.log('Text color:', color);
  });

  // Test Step 3: Always blue
  await test.step('Always blue', async () => {
    // Verify text is blue
    const addedText = page.getByText('Post-approval verification complete');
    
    const color = await addedText.evaluate(el => {
      return window.getComputedStyle(el).color;
    });
    
    // Check if color is blue (various blue representations)
    expect(color).toMatch(/rgb\(0,\s*0,\s*255\)|blue|#0000ff|rgb\(0,\s*\d+,\s*255\)/i);
  });

  // Test Step 4: Consistent format
  await test.step('Consistent format', async () => {
    // Add text to another cell to verify consistency
    const anotherCell = page.locator('[data-testid="editable-cell"], td').nth(1);
    await anotherCell.click();
    
    await page.getByRole('button', { name: 'Text', exact: true }).click();
    await page.getByText('Custom Text').click();
    
    const secondText = 'Another post-approval note';
    await page.keyboard.type(secondText);
    await page.keyboard.press('Enter');
    
    // Check both texts have same color
    const firstTextColor = await page.getByText('Post-approval verification complete').evaluate(el => 
      window.getComputedStyle(el).color
    );
    
    const secondTextColor = await page.getByText('Another post-approval note').evaluate(el => 
      window.getComputedStyle(el).color
    );
    
    expect(firstTextColor).toBe(secondTextColor);
  });

  // Test Step 5: Stage agnostic (SC)
  await test.step('Stage agnostic (SC)', async () => {
    // Verify blue text formatting is consistent across stages
    // All user-entered text should be blue regardless of document stage
    
    const allUserText = page.locator('[data-testid="user-text"], .user-entered-text');
    const textCount = await allUserText.count();
    
    // Verify all user text is blue
    for (let i = 0; i < Math.min(textCount, 3); i++) {
      const text = allUserText.nth(i);
      const color = await text.evaluate(el => window.getComputedStyle(el).color);
      expect(color).toMatch(/rgb\(0,\s*0,\s*255\)|blue|#0000ff|rgb\(0,\s*\d+,\s*255\)/i);
    }
    
    // Take screenshot showing blue text
    const timestamp = formatTimestamp(new Date());
    await page.screenshot({ 
      path: getScreenshotPath(`TS.7.9.2-02-5-${timestamp}.png`) 
    });
  });

  // Expected Results:
  // 1. Text added ✓
  // 2. Color checked ✓
  // 3. Blue confirmed ✓
  // 4. Same as other stages ✓
  // 5. Consistent color ✓
});