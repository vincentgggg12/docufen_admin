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

test('TS.4.1-01 View Page Count Totals', async ({ page }) => {
  // Test Procedure:
  // 1. Login as Megan (Administrator)
  // 2. Navigate to Analytics > Page Metrics
  // 3. View total pages by category (SC)
  
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
  
  // Test Step 1: Navigate to Analytics > Page Metrics
  await test.step('Navigate to Analytics > Page Metrics', async () => {
    await page.getByRole('button', { name: 'Menu' }).click();
    await page.getByRole('link', { name: 'Analytics' }).click();
    
    // Wait for Analytics page to load
    await page.waitForSelector('text=Page Metrics', { timeout: 10000 });
    await page.getByRole('link', { name: 'Page Metrics' }).click();
  });
  
  // Test Step 2: View total pages by category (SC)
  await test.step('View total pages by category (SC)', async () => {
    // Verify we're on the Page Metrics page
    await expect(page).toHaveURL(/.*\/billing/);
    
    // Wait for the page metrics content to load
    await page.waitForSelector('text=Page Metrics', { timeout: 10000 });
    
    // Take screenshot
    const timestamp = formatTimestamp(new Date());
    await page.screenshot({ 
      path: getScreenshotPath(`TS.4.1-01-${timestamp}.png`),
      fullPage: true 
    });
    
    // Verify total document pages are shown
    await expect(page.getByText('Document Pages')).toBeVisible();
    
    // Verify attachment pages are shown
    await expect(page.getByText('Attachment Pages')).toBeVisible();
    
    // Verify audit trail pages are shown
    await expect(page.getByText('Audit Trail Pages')).toBeVisible();
  });
  
  // Expected Results:
  // 1. Analytics page loads ✓
  // 2. Shows total document pages ✓
  // 3. Shows attachment and audit trail pages ✓
});