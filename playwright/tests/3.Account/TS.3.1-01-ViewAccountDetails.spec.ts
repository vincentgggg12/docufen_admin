import { test, expect } from '@playwright/test';
import { microsoftLogin } from '../utils/msLogin';
import { handleERSDDialog } from '../utils/ersd-handler';
import { getScreenshotPath } from '../utils/paths';
import { navigateToAccount } from '../utils/navigateToAccount';
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

test('TS.3.1-01 View Account Details', async ({ page }) => {
  // Test Procedure:
  // 1. Login as Megan Bowen (Trial Administrator)
  // 2. Navigate to Account page
  // 3. View company information section (SC)
  
  // Setup: Login (not reported as test step)
  const email = process.env.MS_EMAIL_17NJ5D_MEGAN_BOWEN!;
  const password = process.env.MS_PASSWORD!;
  
  // Navigate to login page
  await page.goto(`${baseUrl}/login`);
  
  // Perform Microsoft login
  await microsoftLogin(page, email, password);
  
  // Handle ERSD if needed
  // await handleERSDDialog(page);
  
  // Wait for navigation
  await page.waitForLoadState('domcontentloaded');
  
  // Test Step 1: Navigate to Account page
  await test.step('Navigate to Account page', async () => {
    await navigateToAccount(page)
  });
  
  // Test Step 2: View company information section (SC)
  await test.step('View company information section (SC)', async () => {
    // Verify we're on the account page
    await expect(page).toHaveURL(/.*\/account/);
    
    // Wait for the company information to be visible
    await page.waitForSelector('text=Company Information', { timeout: 10000 });
    const companyInfoSection = page.getByText('Company Information').first();
    await expect(companyInfoSection).toBeVisible();
    
    // Look for company name "Pharma 17NJ5D" in the company information section
    // Use a more specific selector to avoid ambiguity with the tenant switcher
    const companyNameElement = page.getByRole('paragraph').filter({ hasText: 'Pharma 17NJ5D' });
    await expect(companyNameElement).toBeVisible();
    
    // Take screenshot
    const timestamp = formatTimestamp(new Date());
    await page.screenshot({ 
      path: getScreenshotPath(`TS.3.1-01-${timestamp}.png`),
      fullPage: true 
    });
    
    // Verify company details are visible
    // Use exact match to get the card title, not the sr-only text
    await expect(page.getByText('Company Information', { exact: true }).first()).toBeVisible();
    
    // Verify other expected elements are visible
    await expect(page.getByText('Address')).toBeVisible();
    await expect(page.getByText('Business Registration')).toBeVisible();
  });
  
  // Expected Results:
  // 1. Account page loads ✓
  // 2. Company name "Pharma 17NJ5D" displayed ✓
  // 3. All company details visible ✓
});