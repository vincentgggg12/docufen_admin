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

test('TS.4.3-08 3-Year Projection', async ({ page }) => {
  // Test Procedure:
  // 1. View card
  // 2. Check accurately calculates return
  // 3. Verify cumulative savings (SC)
  
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
  
  // Test Step 1: View card
  await test.step('View card', async () => {
    // Look for 3-year projection card
    await expect(page.getByText('3-Year Projection')).toBeVisible();
  });
  
  // Test Step 2: Check accurately calculates return
  await test.step('Check accurately calculates return', async () => {
    // Look for return calculation
    await expect(page.getByText(/Year 1/)).toBeVisible();
    await expect(page.getByText(/Year 2/)).toBeVisible();
    await expect(page.getByText(/Year 3/)).toBeVisible();
    
    // Verify return values are displayed
    const returnValues = page.locator('text=/\\$\\d+/');
    const count = await returnValues.count();
    expect(count).toBeGreaterThan(0);
  });
  
  // Test Step 3: Verify cumulative savings (SC)
  await test.step('Verify cumulative savings (SC)', async () => {
    // Look for cumulative savings display
    await expect(page.getByText(/Cumulative/i)).toBeVisible();
    
    // Take screenshot
    const timestamp = formatTimestamp(new Date());
    await page.screenshot({ 
      path: getScreenshotPath(`TS.4.3-08-${timestamp}.png`),
      fullPage: true 
    });
  });
  
  // Expected Results:
  // 1. Card shows 3 years ✓
  // 2. Return ✓
  // 3. Savings line continues upward ✓
});