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

test('TS.4.2-01 Transaction Log Display', async ({ page }) => {
  // Test Procedure:
  // 1. Navigate to Analytics > Billing
  // 2. View transaction table
  // 3. Check columns displayed (SC)
  
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
  
  // Test Step 1: Navigate to Analytics > Billing
  await test.step('Navigate to Analytics > Billing', async () => {
    await page.getByRole('button', { name: 'Menu' }).click();
    await page.getByRole('link', { name: 'Analytics' }).click();
    
    // Wait for Analytics page to load
    await page.waitForSelector('text=Billing', { timeout: 10000 });
    await page.getByRole('link', { name: 'Billing' }).click();
  });
  
  // Test Step 2: View transaction table
  await test.step('View transaction table', async () => {
    // Wait for billing page to load
    await expect(page).toHaveURL(/.*\/billing/);
    
    // Wait for transaction table to be visible
    await page.waitForSelector('table', { timeout: 10000 });
    await expect(page.locator('table')).toBeVisible();
  });
  
  // Test Step 3: Check columns displayed (SC)
  await test.step('Check columns displayed (SC)', async () => {
    // Verify column headers are present
    await expect(page.getByRole('columnheader', { name: 'Timestamp' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Document' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Category' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'User' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Type' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Pages' })).toBeVisible();
    
    // Take screenshot
    const timestamp = formatTimestamp(new Date());
    await page.screenshot({ 
      path: getScreenshotPath(`TS.4.2-01-${timestamp}.png`),
      fullPage: true 
    });
  });
  
  // Expected Results:
  // 1. Billing tab loads ✓
  // 2. Table shows all transactions ✓
  // 3. Columns: timestamp, document, category, user, type, pages ✓
});