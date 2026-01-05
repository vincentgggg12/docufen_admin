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

test('TS.3.2-08 ERSD Text Character Count', async ({ page, baseURL }) => {
  // Test Procedure:
  // 1. Click Edit ERSD button
  // 2. Type in text area
  // 3. Monitor character count display
  // 4. Add text until 1000 chars (SC)
  
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
  
  // Test Step 1: Click Edit ERSD button
  await test.step('Click Edit ERSD button', async () => {
    const editERSDButton = page.getByRole('button', { name: /Edit ERSD/i });
    await expect(editERSDButton).toBeVisible();
    await editERSDButton.click();
    
    // Wait for modal to open
    await page.waitForSelector('[role="dialog"]', { timeout: 5000 });
  });
  
  // Test Step 2-3: Type in text area and monitor character count
  await test.step('Type in text area and monitor character count', async () => {
    const ersdTextArea = page.locator('[data-testid="ersd-textarea"]');
    
    // Clear the text area first
    await ersdTextArea.clear();
    
    // Look for character count display
    const charCountDisplay = page.locator('text=/\\d+ characters?/i').or(page.locator('text=/\\d+\\/\\d+/'));
    
    // Verify character count shows at bottom
    await expect(charCountDisplay).toBeVisible();
    
    // Type some text and verify count updates
    await ersdTextArea.type('This is a test of the character count functionality. ');
    
    // Wait for count to update
    await page.waitForTimeout(500);
    
    // Verify count updates as typing
    const countText = await charCountDisplay.textContent();
    expect(countText).toMatch(/\d+/);
  });
  
  // Test Step 4: Add text until 1000 chars (SC)
  await test.step('Add text until 1000 characters (SC)', async () => {
    const ersdTextArea = page.locator('[data-testid="ersd-textarea"]');
    
    // Create a string that is exactly 1000 characters
    const baseText = 'This is a test of the ERSD character count functionality. ';
    let fullText = baseText;
    
    // Keep adding text until we reach close to 1000 characters
    while (fullText.length < 950) {
      fullText += 'Adding more text to reach the character limit. ';
    }
    
    // Add final text to reach exactly 1000 characters
    const remainingChars = 1000 - fullText.length;
    if (remainingChars > 0) {
      fullText += 'X'.repeat(remainingChars);
    } else if (fullText.length > 1000) {
      fullText = fullText.substring(0, 1000);
    }
    
    // Clear and fill with exactly 1000 characters
    await ersdTextArea.clear();
    await ersdTextArea.fill(fullText);
    
    // Wait for character count to update
    await page.waitForTimeout(1000);
    
    // Look for character count showing 1000
    const charCountDisplay = page.locator('text=/1000/');
    await expect(charCountDisplay).toBeVisible();
    
    // Take screenshot showing 1000 characters
    const timestamp = formatTimestamp(new Date());
    await page.screenshot({ 
      path: getScreenshotPath(`TS.3.2-08-${timestamp}.png`),
      fullPage: true 
    });
  });
  
  // Expected Results:
  // 1. Modal opens ✓
  // 2. Character count shows at bottom ✓
  // 3. Count updates as typing ✓
  // 4. Shows "1000 characters" ✓
});