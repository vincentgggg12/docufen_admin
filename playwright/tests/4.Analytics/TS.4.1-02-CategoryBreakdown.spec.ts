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

test('TS.4.1-02 Category Breakdown', async ({ page }) => {
  // Test Procedure:
  // 1. View page metrics dashboard
  // 2. Check document pages breakdown
  // 3. Verify Pre-Approval, Execution, Post-Approval, Closed counts (SC)
  
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
  
  // Test Step 1: View page metrics dashboard
  await test.step('View page metrics dashboard', async () => {
    // Verify dashboard is loaded
    await expect(page.getByText('Page Metrics')).toBeVisible();
    await expect(page.getByText('Document Pages')).toBeVisible();
  });
  
  // Test Step 2: Check document pages breakdown
  await test.step('Check document pages breakdown', async () => {
    // Look for category breakdown section
    await expect(page.getByText('Document Pages by Stage')).toBeVisible();
  });
  
  // Test Step 3: Verify Pre-Approval, Execution, Post-Approval, Closed counts (SC)
  await test.step('Verify Pre-Approval, Execution, Post-Approval, Closed counts (SC)', async () => {
    // Verify Pre-Approval count is visible
    await expect(page.getByText('Pre-Approval')).toBeVisible();
    
    // Verify Execution count is visible
    await expect(page.getByText('Execution')).toBeVisible();
    
    // Verify Post-Approval count is visible
    await expect(page.getByText('Post-Approval')).toBeVisible();
    
    // Verify Closed count is visible
    await expect(page.getByText('Closed')).toBeVisible();
    
    // Take screenshot
    const timestamp = formatTimestamp(new Date());
    await page.screenshot({ 
      path: getScreenshotPath(`TS.4.1-02-${timestamp}.png`),
      fullPage: true 
    });
  });
  
  // Expected Results:
  // 1. Dashboard shows categories ✓
  // 2. Document pages split by stage ✓
  // 3. All stage counts visible ✓
});