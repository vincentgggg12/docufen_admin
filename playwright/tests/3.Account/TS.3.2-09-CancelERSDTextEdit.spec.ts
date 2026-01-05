import { test, expect } from '@playwright/test';
import { microsoftLogin } from '../utils/msLogin';
import { handleERSDDialog } from '../utils/ersd-handler';
import { getScreenshotPath } from '../utils/paths';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.playwright.env' });

// Set test timeout to 120 seconds
test.setTimeout(120000);

test.use({
  viewport: { height: 1080, width: 1920 },
  ignoreHTTPSErrors: true
});

function formatTimestamp(date: Date): string {
  return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}-${String(date.getHours()).padStart(2, '0')}.${String(date.getMinutes()).padStart(2, '0')}.${String(date.getSeconds()).padStart(2, '0')}`;
}

test('TS.3.2-09 Cancel ERSD Text Edit', async ({ page, baseURL }) => {
  // Test Procedure:
  // 1. Click Edit ERSD button
  // 2. Modify the text
  // 3. Click Cancel
  // 4. Open modal again
  // 5. Verify original text (SC)
  
  // FS ID: FS.3.2-05
  
  const email = process.env.MS_EMAIL_17NJ5D_GRADY_ARCHIE!;
  const password = process.env.MS_PASSWORD!;
  
  // Navigate to login page
  await page.goto(`${baseURL}/login`);
  
  // Perform Microsoft login
  await microsoftLogin(page, email, password);
  
  // Handle ERSD if needed
  await handleERSDDialog(page);
  
  // Wait for navigation
  await page.waitForLoadState('domcontentloaded');
  
  // Navigate to Account > Compliance
  await page.goto(`${baseURL}/account`);
  await page.waitForLoadState('networkidle');
  
  const complianceTab = page.getByRole('tab', { name: 'Compliance' });
  await complianceTab.click();
  await page.waitForLoadState('networkidle');
  
  let originalText = '';
  
  // Test Step 1: Click Edit ERSD button and capture original text
  await test.step('Click Edit ERSD button and capture original text', async () => {
    const editERSDButton = page.getByRole('button', { name: /Edit ERSD/i });
    await expect(editERSDButton).toBeVisible();
    await editERSDButton.click();
    
    // Wait for modal to open
    await page.waitForSelector('[role="dialog"]', { timeout: 5000 });
    
    // Capture the original text
    const ersdTextArea = page.locator('[data-testid="ersd-textarea"]');
    originalText = await ersdTextArea.inputValue();
    
    // Close modal to start fresh
    const cancelButton = page.getByRole('button', { name: 'Cancel' });
    await cancelButton.click();
    await page.waitForSelector('[role="dialog"]', { state: 'hidden', timeout: 5000 });
  });
  
  // Test Step 2-3: Modify text and cancel
  await test.step('Modify the text and click Cancel', async () => {
    // Reopen the modal
    const editERSDButton = page.getByRole('button', { name: /Edit ERSD/i });
    await editERSDButton.click();
    
    // Wait for modal to open
    await page.waitForSelector('[role="dialog"]', { timeout: 5000 });
    
    // Modify the text
    const ersdTextArea = page.locator('[data-testid="ersd-textarea"]');
    await ersdTextArea.clear();
    await ersdTextArea.fill('This is temporary text that should not be saved when we click Cancel.');
    
    // Click Cancel button
    const cancelButton = page.getByRole('button', { name: 'Cancel' });
    await cancelButton.click();
    
    // Wait for modal to close
    await page.waitForSelector('[role="dialog"]', { state: 'hidden', timeout: 5000 });
  });
  
  // Test Step 4-5: Open modal again and verify original text
  await test.step('Open modal again and verify original text (SC)', async () => {
    // Wait a moment
    await page.waitForTimeout(1000);
    
    // Click Edit ERSD button again
    const editERSDButton = page.getByRole('button', { name: /Edit ERSD/i });
    await editERSDButton.click();
    
    // Wait for modal to open
    await page.waitForSelector('[role="dialog"]', { timeout: 5000 });
    await page.waitForTimeout(500); // Wait for dialog to fully render
    
    // Verify the text is unchanged (original text)
    const ersdTextArea = page.locator('[data-testid="ersd-textarea"]');
    const currentText = await ersdTextArea.inputValue();
    expect(currentText).toBe(originalText);
    expect(currentText).not.toContain('This is temporary text');
    
    // Take screenshot showing original text unchanged
    const timestamp = formatTimestamp(new Date());
    await page.screenshot({ 
      path: getScreenshotPath(`TS.3.2-09-${timestamp}.png`),
      fullPage: true 
    });
  });
  
  // Expected Results:
  // 1. Modal opens ✓
  // 2. Text modified ✓
  // 3. Modal closes ✓
  // 4. Modal reopens ✓
  // 5. Original text unchanged ✓
});