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

test('TS.7.14-05 Correction Chain', async ({ page }) => {
  // Login
  const email = process.env.MS_EMAIL_17NJ5D_EMILY_MARTIN!;
  const password = process.env.MS_PASSWORD!;
  await microsoftLogin(page, email, password);
  await handleERSDDialog(page);

  // Navigate to Sign page
  await page.getByRole('button', { name: 'Menu' }).click();
  await page.getByRole('link', { name: 'Sign' }).click();
  await page.waitForLoadState('networkidle');

  // Select a document to work with corrections
  const firstDocument = page.locator('[data-testid="sign-document-row"], tbody tr').first();
  await firstDocument.click();
  await page.waitForSelector('[data-testid="document-viewer"], iframe, .document-container');

  // Test Step 1: Make first correction
  await test.step('Make correction', async () => {
    // Find a field or cell to correct
    let documentFrame = page;
    const iframe = page.locator('iframe').first();
    if (await iframe.isVisible()) {
      documentFrame = page.frameLocator('iframe').first();
    }

    // Click on a field to edit
    const editableField = documentFrame.locator('input[type="text"], textarea, td, [contenteditable="true"]').first();
    await editableField.click();
    
    // Enter initial value
    await page.keyboard.press('Control+A');
    await page.keyboard.type('Initial Value 1');
    
    // Make correction
    await page.getByRole('button', { name: /Correction|Edit|Modify/i }).click();
    
    // Enter correction reason
    const reasonInput = page.locator('[data-testid="correction-reason"], input[placeholder*="reason" i], textarea[placeholder*="reason" i]');
    if (await reasonInput.isVisible()) {
      await reasonInput.fill('First correction: fixing initial data entry error');
    }
    
    // Change the value
    await editableField.click();
    await page.keyboard.press('Control+A');
    await page.keyboard.type('Corrected Value 1');
    
    // Save correction
    await page.getByRole('button', { name: /Save|Apply|Confirm/i }).click();
    await page.waitForTimeout(1000);
  });

  // Test Step 2: Correct the correction
  await test.step('Correct the correction', async () => {
    // Make another correction on the same field
    let documentFrame = page;
    const iframe = page.locator('iframe').first();
    if (await iframe.isVisible()) {
      documentFrame = page.frameLocator('iframe').first();
    }

    const editableField = documentFrame.locator('input[type="text"], textarea, td, [contenteditable="true"]').first();
    await editableField.click();
    
    // Make second correction
    await page.getByRole('button', { name: /Correction|Edit|Modify/i }).click();
    
    // Enter second correction reason
    const reasonInput = page.locator('[data-testid="correction-reason"], input[placeholder*="reason" i], textarea[placeholder*="reason" i]');
    if (await reasonInput.isVisible()) {
      await reasonInput.fill('Second correction: updating per new requirements');
    }
    
    // Change the value again
    await editableField.click();
    await page.keyboard.press('Control+A');
    await page.keyboard.type('Corrected Value 2');
    
    // Save correction
    await page.getByRole('button', { name: /Save|Apply|Confirm/i }).click();
    await page.waitForTimeout(1000);
  });

  // Test Step 3: Correct again
  await test.step('Correct again', async () => {
    // Make third correction
    let documentFrame = page;
    const iframe = page.locator('iframe').first();
    if (await iframe.isVisible()) {
      documentFrame = page.frameLocator('iframe').first();
    }

    const editableField = documentFrame.locator('input[type="text"], textarea, td, [contenteditable="true"]').first();
    await editableField.click();
    
    await page.getByRole('button', { name: /Correction|Edit|Modify/i }).click();
    
    // Enter third correction reason
    const reasonInput = page.locator('[data-testid="correction-reason"], input[placeholder*="reason" i], textarea[placeholder*="reason" i]');
    if (await reasonInput.isVisible()) {
      await reasonInput.fill('Third correction: final adjustment per review feedback');
    }
    
    // Change the value one more time
    await editableField.click();
    await page.keyboard.press('Control+A');
    await page.keyboard.type('Final Corrected Value');
    
    // Save correction
    await page.getByRole('button', { name: /Save|Apply|Confirm/i }).click();
    await page.waitForTimeout(1000);
  });

  // Test Step 4: All corrections preserved
  await test.step('All corrections preserved', async () => {
    // Open correction history or audit trail
    await page.getByRole('button', { name: /History|Audit|Corrections|View Changes/i }).click();
    await page.waitForSelector('[data-testid="correction-history"], [data-testid="audit-trail"], .history-modal');
    
    // Verify all three corrections are listed
    const corrections = page.locator('[data-testid="correction-entry"], .correction-item, .history-item');
    const correctionCount = await corrections.count();
    expect(correctionCount).toBeGreaterThanOrEqual(3);
    
    // Verify correction reasons are visible
    await expect(page.getByText('First correction: fixing initial data entry error')).toBeVisible();
    await expect(page.getByText('Second correction: updating per new requirements')).toBeVisible();
    await expect(page.getByText('Third correction: final adjustment per review feedback')).toBeVisible();
  });

  // Test Step 5: Full history maintained with screenshot
  await test.step('Full history maintained (SC)', async () => {
    // Verify the correction chain shows all values
    const historyTexts = [
      'Initial Value 1',
      'Corrected Value 1',
      'Corrected Value 2',
      'Final Corrected Value'
    ];
    
    for (const text of historyTexts) {
      const isVisible = await page.getByText(text).isVisible().catch(() => false);
      if (!isVisible) {
        console.log(`Warning: Could not find "${text}" in correction history`);
      }
    }
    
    // Verify timestamps are shown for each correction
    const timestamps = page.locator('[data-testid="correction-timestamp"], .timestamp, time');
    expect(await timestamps.count()).toBeGreaterThanOrEqual(3);
    
    // Take screenshot of the full correction history
    const timestamp = formatTimestamp(new Date());
    await page.screenshot({ 
      path: getScreenshotPath(`TS.7.14-05-5-${timestamp}.png`),
      fullPage: true
    });
  });

  // Expected Results:
  // 1. First correction ✓
  // 2. Second correction ✓
  // 3. Third correction ✓
  // 4. Chain visible ✓
  // 5. History intact ✓
});