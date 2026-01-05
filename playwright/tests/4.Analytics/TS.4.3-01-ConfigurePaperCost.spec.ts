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

test('TS.4.3-01 Configure Paper Cost', async ({ page }) => {
  // Test Procedure:
  // 1. Navigate to ROI Analytics
  // 2. Click "Set Paper Cost"
  // 3. Enter $0.10 per page
  // 4. Save (SC)
  
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
  
  // Test Step 1: Navigate to ROI Analytics
  await test.step('Navigate to ROI Analytics', async () => {
    await page.getByRole('button', { name: 'Menu' }).click();
    await page.getByRole('link', { name: 'Analytics' }).click();
    
    // Wait for Analytics page to load
    await page.waitForSelector('text=ROI Analytics', { timeout: 10000 });
    await page.getByRole('link', { name: 'ROI Analytics' }).click();
  });
  
  // Test Step 2: Click "Set Paper Cost"
  await test.step('Click "Set Paper Cost"', async () => {
    // Wait for ROI page to load
    await expect(page).toHaveURL(/.*\/billing/);
    
    // Click Set Paper Cost button
    const setPaperCostButton = page.getByRole('button', { name: 'Set Paper Cost' });
    await expect(setPaperCostButton).toBeVisible();
    await setPaperCostButton.click();
    
    // Wait for modal to appear
    await page.waitForSelector('[role="dialog"]', { timeout: 5000 });
  });
  
  // Test Step 3: Enter $0.10 per page
  await test.step('Enter $0.10 per page', async () => {
    // Find the cost input field
    const costInput = page.getByLabel('Paper cost per page');
    await expect(costInput).toBeVisible();
    
    // Clear and enter 0.10
    await costInput.clear();
    await costInput.fill('0.10');
  });
  
  // Test Step 4: Save (SC)
  await test.step('Save (SC)', async () => {
    // Click save button
    const saveButton = page.getByRole('button', { name: 'Save' });
    await saveButton.click();
    
    // Wait for modal to close
    await expect(page.locator('[role="dialog"]')).not.toBeVisible();
    
    // Verify cost is displayed
    await expect(page.getByText('$0.10')).toBeVisible();
    
    // Take screenshot
    const timestamp = formatTimestamp(new Date());
    await page.screenshot({ 
      path: getScreenshotPath(`TS.4.3-01-${timestamp}.png`),
      fullPage: true 
    });
  });
  
  // Expected Results:
  // 1. ROI tab loads ✓
  // 2. Modal opens ✓
  // 3. Accepts 0.10 value ✓
  // 4. Cost saved and displayed ✓
});