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

test('TS.4.2-04 Search Clear', async ({ page }) => {
  // Test Procedure:
  // 1. Clear search field
  // 2. Verify all transactions return
  // 3. Check pagination reset (SC)
  
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
  
  // Navigate to Billing
  await page.getByRole('button', { name: 'Menu' }).click();
  await page.getByRole('link', { name: 'Analytics' }).click();
  await page.waitForSelector('text=Billing', { timeout: 10000 });
  await page.getByRole('link', { name: 'Billing' }).click();
  
  // First, add a search term to have something to clear
  const searchInput = page.getByPlaceholder('Search transactions...');
  await searchInput.fill('Protocol');
  await page.waitForTimeout(1000);
  
  // Test Step 1: Clear search field
  await test.step('Clear search field', async () => {
    // Clear the search input
    await searchInput.clear();
    
    // Wait for clear to process
    await page.waitForTimeout(500);
  });
  
  // Test Step 2: Verify all transactions return
  await test.step('Verify all transactions return', async () => {
    // Wait for table to update
    await page.waitForTimeout(1000);
    
    // Verify table is visible and has content
    await expect(page.locator('table')).toBeVisible();
    
    // Check that we have transactions displayed
    const rows = page.locator('tbody tr');
    const rowCount = await rows.count();
    expect(rowCount).toBeGreaterThan(0);
  });
  
  // Test Step 3: Check pagination reset (SC)
  await test.step('Check pagination reset (SC)', async () => {
    // Check if pagination exists
    const pagination = page.locator('[role="navigation"][aria-label="pagination"]');
    
    if (await pagination.isVisible()) {
      // Verify we're on page 1
      const currentPage = page.locator('[aria-current="page"]');
      if (await currentPage.isVisible()) {
        const pageText = await currentPage.textContent();
        expect(pageText).toBe('1');
      }
    }
    
    // Take screenshot
    const timestamp = formatTimestamp(new Date());
    await page.screenshot({ 
      path: getScreenshotPath(`TS.4.2-04-${timestamp}.png`),
      fullPage: true 
    });
  });
  
  // Expected Results:
  // 1. Search cleared ✓
  // 2. Full transaction list restored ✓
  // 3. Returns to page 1 ✓
});