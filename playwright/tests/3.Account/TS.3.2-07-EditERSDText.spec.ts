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

test('TS.3.2-07 Edit ERSD Text', async ({ page, baseURL }) => {
  // Test Procedure:
  // 1. Login as Grady (User Manager)
  // 2. Navigate to Account page
  // 3. Click Edit ERSD button
  // 4. Modify text to include "Updated ERSD Text"
  // 5. Save changes
  // 6. Open ERSD modal again
  // 7. Verify text shows "Updated ERSD Text" (SC)
  // 8. Reload page (F5/refresh)
  // 9. Open ERSD modal
  // 10. Verify text still shows "Updated ERSD Text" (SC)
  
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
  
  // Test Step 1-2: Navigate to Account page
  await test.step('Navigate to Account page', async () => {
    // Navigate directly to account page
    await page.goto(`${baseURL}/account`);
    await page.waitForLoadState('networkidle');
    
    // Click on Compliance tab
    const complianceTab = page.getByRole('tab', { name: 'Compliance' });
    await complianceTab.click();
    await page.waitForLoadState('networkidle');
  });
  
  // Test Step 3-5: Edit ERSD text
  await test.step('Edit ERSD text to include "Updated ERSD Text"', async () => {
    // Find and click Edit ERSD button
    const editERSDButton = page.getByRole('button', { name: /Edit ERSD/i });
    await expect(editERSDButton).toBeVisible();
    await editERSDButton.click();
    
    // Wait for modal to open
    await page.waitForSelector('[role="dialog"]', { timeout: 5000 });
    
    // Find the ERSD text area
    const ersdTextArea = page.locator('[data-testid="ersd-textarea"]');
    
    // Clear and enter new text
    await ersdTextArea.clear();
    await ersdTextArea.fill('Updated ERSD Text - This is the new Electronic Records and Signature Disclosure agreement text that has been modified by the User Manager.');
    
    // Save changes
    const saveButton = page.getByRole('button', { name: 'Save' });
    await saveButton.click();
    
    // Wait for modal to close
    await page.waitForSelector('[role="dialog"]', { state: 'hidden', timeout: 5000 });
  });
  
  // Test Step 6-7: Reopen modal and verify text (SC)
  await test.step('Reopen ERSD modal and verify text shows "Updated ERSD Text" (SC)', async () => {
    // Wait a moment for save to complete
    await page.waitForTimeout(1000);
    
    // Click Edit ERSD button again
    const editERSDButton = page.getByRole('button', { name: /Edit ERSD/i });
    await editERSDButton.click();
    
    // Wait for modal to open
    await page.waitForSelector('[role="dialog"]', { timeout: 5000 });
    await page.waitForTimeout(500); // Wait for dialog to fully render
    
    // Verify the text contains "Updated ERSD Text"
    const ersdTextArea = page.locator('[data-testid="ersd-textarea"]');
    const textContent = await ersdTextArea.inputValue();
    expect(textContent).toContain('Updated ERSD Text');
    
    // Take screenshot
    const timestamp = formatTimestamp(new Date());
    await page.screenshot({ 
      path: getScreenshotPath(`TS.3.2-07-01-${timestamp}.png`),
      fullPage: true 
    });
    
    // Close modal
    const cancelButton = page.getByRole('button', { name: 'Cancel' });
    await cancelButton.click();
    await page.waitForSelector('[role="dialog"]', { state: 'hidden', timeout: 5000 });
  });
  
  // Test Step 8: Reload page
  await test.step('Reload page (F5/refresh)', async () => {
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    // Navigate back to Compliance tab if needed
    const complianceTab = page.getByRole('tab', { name: 'Compliance' });
    if (await complianceTab.isVisible({ timeout: 5000 })) {
      await complianceTab.click();
      await page.waitForLoadState('networkidle');
    }
  });
  
  // Test Step 9-10: Open modal again and verify persistence (SC)
  await test.step('Open ERSD modal and verify text still shows "Updated ERSD Text" (SC)', async () => {
    // Click Edit ERSD button
    const editERSDButton = page.getByRole('button', { name: /Edit ERSD/i });
    await editERSDButton.click();
    
    // Wait for modal to open
    await page.waitForSelector('[role="dialog"]', { timeout: 5000 });
    await page.waitForTimeout(500); // Wait for dialog to fully render
    
    // Verify the text still contains "Updated ERSD Text"
    const ersdTextArea = page.locator('[data-testid="ersd-textarea"]');
    const textContent = await ersdTextArea.inputValue();
    expect(textContent).toContain('Updated ERSD Text');
    
    // Take screenshot
    const timestamp = formatTimestamp(new Date());
    await page.screenshot({ 
      path: getScreenshotPath(`TS.3.2-07-02-${timestamp}.png`),
      fullPage: true 
    });
  });
  
  // Expected Results:
  // 1. Account page loads ✓
  // 2. ERSD edit button visible ✓
  // 3. Modal opens with current text ✓
  // 4. Text editable ✓
  // 5. Save successful ✓
  // 6. Modal reopens ✓
  // 7. Updated text confirmed ✓
  // 8. Page reloads ✓
  // 9. Modal opens ✓
  // 10. Modified text persists ✓
});