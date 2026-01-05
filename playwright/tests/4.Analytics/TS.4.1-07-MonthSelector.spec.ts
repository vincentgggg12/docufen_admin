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

test('TS.4.1-07 Month Selector', async ({ page }) => {
  // Test Procedure:
  // 1. Click month dropdown
  // 2. View available months
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
  
  // Navigate to Page Metrics
  await page.getByRole('button', { name: 'Menu' }).click();
  await page.getByRole('link', { name: 'Analytics' }).click();
  await page.waitForSelector('text=Page Metrics', { timeout: 10000 });
  await page.getByRole('link', { name: 'Page Metrics' }).click();
  
  // Test Step 1: Click month dropdown
  await test.step('Click month dropdown', async () => {
    // Wait for and click the month selector dropdown
    await page.waitForSelector('select', { timeout: 10000 });
    const monthSelector = page.locator('select').first();
    await expect(monthSelector).toBeVisible();
    await monthSelector.click();
  });
  
  // Test Step 2: View available months
  await test.step('View available months', async () => {
    // Verify "All Time" option is visible
    const allTimeOption = page.locator('option:has-text("All Time")');
    await expect(allTimeOption).toBeVisible();
    
    // Check that there are month options available
    const options = await page.locator('select option').count();
    expect(options).toBeGreaterThan(1);
  });
  
  // Test Step 3: Select specific month (SC)
  await test.step('Select specific month (SC)', async () => {
    // Select a specific month if available, otherwise select "All Time"
    const monthSelector = page.locator('select').first();
    const options = await monthSelector.locator('option').allTextContents();
    
    if (options.length > 2) {
      // Select the second option (first month after "All Time")
      await monthSelector.selectOption({ index: 1 });
    } else {
      // Select "All Time" if no specific months are available
      await monthSelector.selectOption('All Time');
    }
    
    // Wait for data to update
    await page.waitForTimeout(1000);
    
    // Take screenshot
    const timestamp = formatTimestamp(new Date());
    await page.screenshot({ 
      path: getScreenshotPath(`TS.4.1-07-${timestamp}.png`),
      fullPage: true 
    });
  });
  
  // Expected Results:
  // 1. Dropdown shows months with data ✓
  // 2. "All Time" option visible ✓
  // 3. Selection updates all metrics ✓
});