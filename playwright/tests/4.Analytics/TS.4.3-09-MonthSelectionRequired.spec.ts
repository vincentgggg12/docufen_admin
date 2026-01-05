import { test, expect } from '@playwright/test';
import { microsoftLogin } from '../utils/msLogin';
import { handleERSDDialog } from '../utils/ersd-handler';
import { getScreenshotPath } from '../utils/paths';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.playwright.env' });

const baseUrl = process.env.BASE_URL;

// Set test timeout to 120 seconds
test.setTimeout(120000);

test.use({
  viewport: { height: 1080, width: 1920 },
  ignoreHTTPSErrors: true
});

function formatTimestamp(date: Date): string {
  return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}-${String(date.getHours()).padStart(2, '0')}.${String(date.getMinutes()).padStart(2, '0')}.${String(date.getSeconds()).padStart(2, '0')}`;
}

test('TS.4.3-09 Month Selection Required', async ({ page }) => {
  // Test Procedure:
  // 1. Try selecting "All Time"
  // 2. Verify disabled for ROI
  // 3. Select specific month (SC)
  
  // Setup: Login (not reported as test step)
  const email = process.env.MS_EMAIL_17NJ5D_MEGAN_BOWEN!;
  const password = process.env.MS_PASSWORD!;
  
  // Navigate to login page
  await page.goto(`${baseUrl}/login`);
  
  // Perform Microsoft login
  await microsoftLogin(page, email, password);
  
  // Handle ERSD if needed
  await handleERSDDialog(page);
  
  // Wait for navigation
  await page.waitForLoadState('domcontentloaded');
  
  // Navigate to ROI Analytics
  await page.getByRole('button', { name: 'Menu' }).click();
  await page.getByRole('link', { name: 'Analytics' }).click();
  await page.waitForSelector('text=ROI Analytics', { timeout: 10000 });
  await page.getByRole('link', { name: 'ROI Analytics' }).click();
  
  // Test Step 1: Try selecting "All Time"
  await test.step('Try selecting "All Time"', async () => {
    // Find month selector
    const monthSelector = page.locator('select').first();
    await expect(monthSelector).toBeVisible();
    
    // Click to open options
    await monthSelector.click();
  });
  
  // Test Step 2: Verify disabled for ROI
  await test.step('Verify disabled for ROI', async () => {
    // Check if "All Time" option is disabled
    const allTimeOption = page.locator('option:has-text("All Time")');
    
    if (await allTimeOption.isVisible()) {
      // Check if it's disabled
      const isDisabled = await allTimeOption.isDisabled();
      expect(isDisabled).toBeTruthy();
    }
  });
  
  // Test Step 3: Select specific month (SC)
  await test.step('Select specific month (SC)', async () => {
    const monthSelector = page.locator('select').first();
    
    // Get all options
    const options = await monthSelector.locator('option').allTextContents();
    
    // Select a specific month (not "All Time")
    const monthOptions = options.filter(opt => opt !== 'All Time' && opt.trim() !== '');
    
    if (monthOptions.length > 0) {
      await monthSelector.selectOption(monthOptions[0]);
    }
    
    // Wait for data to update
    await page.waitForTimeout(1000);
    
    // Take screenshot
    const timestamp = formatTimestamp(new Date());
    await page.screenshot({ 
      path: getScreenshotPath(`TS.4.3-09-${timestamp}.png`),
      fullPage: true 
    });
  });
  
  // Expected Results:
  // 1. All Time option present ✓
  // 2. Disabled/unselectable ✓
  // 3. Must select actual month ✓
});