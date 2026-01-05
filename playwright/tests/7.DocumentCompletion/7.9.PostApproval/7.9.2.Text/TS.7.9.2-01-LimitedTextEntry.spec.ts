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

test('TS.7.9.2-01 Limited Text Entry', async ({ page }) => {
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

  // Test Step 1: Click text option
  await test.step('Click text option', async () => {
    // Click on a cell in the document
    const editableCell = page.locator('[data-testid="editable-cell"], td').first();
    await editableCell.click();
    
    // Look for text entry button/option
    await page.getByRole('button', { name: 'Text', exact: true }).click();
    await page.waitForSelector('[data-testid="text-options-menu"]', { timeout: 5000 });
  });

  // Test Step 2: Fewer options than execution
  await test.step('Fewer options than execution', async () => {
    // Verify limited options are shown
    const textOptions = page.locator('[data-testid="text-option"]');
    const optionCount = await textOptions.count();
    
    // Post-Approval should have fewer options than Execution stage
    expect(optionCount).toBeLessThan(10); // Execution typically has 10+ options
    
    // Verify specific options are NOT available
    const unavailableOptions = ['Initials', 'Date/Time', 'Yes/No/NA', 'Pass/Fail'];
    for (const option of unavailableOptions) {
      await expect(page.getByText(option, { exact: true })).not.toBeVisible();
    }
  });

  // Test Step 3: Basic text only
  await test.step('Basic text only', async () => {
    // Verify only basic text options are available
    await expect(page.getByText('Custom Text')).toBeVisible();
    
    // Verify no advanced formatting options
    await expect(page.getByText('Bold')).not.toBeVisible();
    await expect(page.getByText('Italic')).not.toBeVisible();
    await expect(page.getByText('Underline')).not.toBeVisible();
  });

  // Test Step 4: Insert text
  await test.step('Insert text', async () => {
    // Click custom text option
    await page.getByText('Custom Text').click();
    
    // Type text
    const testText = 'Post-approval review comment';
    await page.keyboard.type(testText);
    
    // Confirm text entry
    await page.keyboard.press('Enter');
    
    // Verify text was inserted
    await expect(page.getByText(testText)).toBeVisible();
  });

  // Test Step 5: Limited functionality (SC)
  await test.step('Limited functionality (SC)', async () => {
    // Click on another cell to show options again
    const anotherCell = page.locator('[data-testid="editable-cell"], td').nth(1);
    await anotherCell.click();
    await page.getByRole('button', { name: 'Text', exact: true }).click();
    
    // Take screenshot showing limited text options
    const timestamp = formatTimestamp(new Date());
    await page.screenshot({ 
      path: getScreenshotPath(`TS.7.9.2-01-5-${timestamp}.png`) 
    });
  });

  // Expected Results:
  // 1. Text clicked ✓
  // 2. Reduced options ✓
  // 3. Basic only ✓
  // 4. Text added ✓
  // 5. Limitations confirmed ✓
});