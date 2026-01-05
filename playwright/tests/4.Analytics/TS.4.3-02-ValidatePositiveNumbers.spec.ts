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

test('TS.4.3-02 Validate Positive Numbers', async ({ page }) => {
  // Test Procedure:
  // 1. Open paper cost modal
  // 2. Try entering -5
  // 3. Try entering 0
  // 4. Check validation (SC)
  
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
  
  // Test Step 1: Open paper cost modal
  await test.step('Open paper cost modal', async () => {
    const setPaperCostButton = page.getByRole('button', { name: 'Set Paper Cost' });
    await expect(setPaperCostButton).toBeVisible();
    await setPaperCostButton.click();
    
    // Wait for modal to appear
    await page.waitForSelector('[role="dialog"]', { timeout: 5000 });
  });
  
  // Test Step 2: Try entering -5
  await test.step('Try entering -5', async () => {
    const costInput = page.getByLabel('Paper cost per page');
    await costInput.clear();
    await costInput.fill('-5');
    
    // Try to save
    const saveButton = page.getByRole('button', { name: 'Save' });
    await saveButton.click();
    
    // Check for validation error
    await expect(page.getByText('Must be positive number')).toBeVisible();
  });
  
  // Test Step 3: Try entering 0
  await test.step('Try entering 0', async () => {
    const costInput = page.getByLabel('Paper cost per page');
    await costInput.clear();
    await costInput.fill('0');
    
    // Try to save
    const saveButton = page.getByRole('button', { name: 'Save' });
    await saveButton.click();
    
    // Check for validation error
    await expect(page.getByText('Must be positive number')).toBeVisible();
  });
  
  // Test Step 4: Check validation (SC)
  await test.step('Check validation (SC)', async () => {
    // Verify both negative and zero are rejected
    // Error message should still be visible
    await expect(page.getByText('Must be positive number')).toBeVisible();
    
    // Take screenshot
    const timestamp = formatTimestamp(new Date());
    await page.screenshot({ 
      path: getScreenshotPath(`TS.4.3-02-${timestamp}.png`),
      fullPage: true 
    });
    
    // Cancel the modal
    const cancelButton = page.getByRole('button', { name: 'Cancel' });
    await cancelButton.click();
  });
  
  // Expected Results:
  // 1. Modal opens ✓
  // 2. Negative rejected ✓
  // 3. Zero rejected ✓
  // 4. Error: "Must be positive number" ✓
});