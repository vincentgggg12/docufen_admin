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

test('TS.4.3-06 Investment Input', async ({ page }) => {
  // Test Procedure:
  // 1. Click "Track Investment"
  // 2. Enter $5000
  // 3. Save and verify display (SC)
  
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
  
  // Test Step 1: Click "Track Investment"
  await test.step('Click "Track Investment"', async () => {
    const trackInvestmentButton = page.getByRole('button', { name: 'Track Investment' });
    await expect(trackInvestmentButton).toBeVisible();
    await trackInvestmentButton.click();
    
    // Wait for modal to appear
    await page.waitForSelector('[role="dialog"]', { timeout: 5000 });
  });
  
  // Test Step 2: Enter $5000
  await test.step('Enter $5000', async () => {
    const investmentInput = page.getByLabel('Investment amount');
    await expect(investmentInput).toBeVisible();
    
    await investmentInput.clear();
    await investmentInput.fill('5000');
  });
  
  // Test Step 3: Save and verify display (SC)
  await test.step('Save and verify display (SC)', async () => {
    // Click save button
    const saveButton = page.getByRole('button', { name: 'Save' });
    await saveButton.click();
    
    // Wait for modal to close
    await expect(page.locator('[role="dialog"]')).not.toBeVisible();
    
    // Verify investment amount is displayed
    await expect(page.getByText(/\$5,?000/)).toBeVisible();
    
    // Take screenshot
    const timestamp = formatTimestamp(new Date());
    await page.screenshot({ 
      path: getScreenshotPath(`TS.4.3-06-${timestamp}.png`),
      fullPage: true 
    });
  });
  
  // Expected Results:
  // 1. Investment modal opens ✓
  // 2. Accepts 5000 ✓
  // 3. Investment amount displayed ✓
});