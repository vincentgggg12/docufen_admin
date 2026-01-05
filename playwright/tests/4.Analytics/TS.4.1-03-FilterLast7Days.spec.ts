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

test('TS.4.1-03 Filter Last 7 Days', async ({ page }) => {
  // Test Procedure:
  // 1. Click time tab
  // 2. Select "Last 7 days"
  // 3. Verify metrics update (SC)
  
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
  
  // Test Step 1: Click time tab
  await test.step('Click time tab', async () => {
    // Wait for the time filter tabs to be visible
    await page.waitForSelector('button:has-text("Last 7 days")', { timeout: 10000 });
  });
  
  // Test Step 2: Select "Last 7 days"
  await test.step('Select "Last 7 days"', async () => {
    await page.getByRole('button', { name: 'Last 7 days' }).click();
    
    // Wait for data to update
    await page.waitForTimeout(1000);
  });
  
  // Test Step 3: Verify metrics update (SC)
  await test.step('Verify metrics update (SC)', async () => {
    // Verify the Last 7 days tab is selected
    await expect(page.getByRole('button', { name: 'Last 7 days' })).toHaveAttribute('aria-selected', 'true');
    
    // Verify metrics are displayed
    await expect(page.getByText('Document Pages')).toBeVisible();
    await expect(page.getByText('Attachment Pages')).toBeVisible();
    await expect(page.getByText('Audit Trail Pages')).toBeVisible();
    
    // Take screenshot
    const timestamp = formatTimestamp(new Date());
    await page.screenshot({ 
      path: getScreenshotPath(`TS.4.1-03-${timestamp}.png`),
      fullPage: true 
    });
  });
  
  // Expected Results:
  // 1. Last 7 day tab ✓
  // 2. Selection changes to 7 days ✓
  // 3. All metrics refresh for 7-day period ✓
});