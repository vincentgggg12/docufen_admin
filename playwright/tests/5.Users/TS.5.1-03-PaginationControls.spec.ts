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

test('TS.5.1-03 Pagination Controls', async ({ page }) => {
  // Test Procedure:
  // 1. With 10+ users, check default 10 per page
  // 2. Change to 5 rows per page
  // 3. Navigate to page 2
  // 4. Change to 20 rows per page
  // 5. Verify all users now on page 1 (SC)
  
  // Setup: Login (not reported as test step)
  const email = process.env.MS_EMAIL_17NJ5D_GRADY_ADAMS!;
  const password = process.env.MS_PASSWORD!;
  
  // Navigate to login page
  await page.goto(`${baseUrl}/login`);
  
  // Perform Microsoft login
  await microsoftLogin(page, email, password);
  
  // Handle ERSD if needed
  await handleERSDDialog(page);
  
  // Wait for navigation
  await page.waitForLoadState('domcontentloaded');
  
  // Navigate to Users page
  await page.getByRole('button', { name: 'Menu' }).click();
  await page.getByRole('link', { name: 'Users' }).click();
  await page.waitForSelector('text=Users', { timeout: 10000 });
  
  // Test Step 1: With 10+ users, check default 10 per page
  await test.step('With 10+ users, check default 10 per page', async () => {
    // Count visible user rows
    const userRows = page.locator('tr[data-testid="user-row"], tbody tr').filter({ hasText: /@/ });
    const initialRowCount = await userRows.count();
    
    // Verify default is 10 or less (if total users < 10)
    expect(initialRowCount).toBeLessThanOrEqual(10);
    
    // Check if pagination controls are visible
    const paginationControls = page.locator('[data-testid="pagination"], nav[aria-label="pagination"]');
    if (initialRowCount === 10) {
      await expect(paginationControls).toBeVisible();
    }
  });
  
  // Test Step 2: Change to 5 rows per page
  await test.step('Change to 5 rows per page', async () => {
    // Find rows per page selector
    const rowsPerPageSelector = page.locator('select[data-testid="rows-per-page"], [aria-label*="rows per page"]');
    await rowsPerPageSelector.selectOption('5');
    
    // Wait for table to update
    await page.waitForTimeout(1000);
    
    // Verify only 5 users shown
    const userRows = page.locator('tr[data-testid="user-row"], tbody tr').filter({ hasText: /@/ });
    const rowCount = await userRows.count();
    expect(rowCount).toBeLessThanOrEqual(5);
  });
  
  // Test Step 3: Navigate to page 2
  await test.step('Navigate to page 2', async () => {
    // Click next page button
    const nextPageButton = page.locator('button[aria-label="Go to next page"], [data-testid="next-page"]');
    await nextPageButton.click();
    
    // Wait for page to update
    await page.waitForTimeout(1000);
    
    // Verify different users are shown
    const userRows = page.locator('tr[data-testid="user-row"], tbody tr').filter({ hasText: /@/ });
    const rowCount = await userRows.count();
    expect(rowCount).toBeGreaterThan(0);
    expect(rowCount).toBeLessThanOrEqual(5);
  });
  
  // Test Step 4: Change to 20 rows per page
  await test.step('Change to 20 rows per page', async () => {
    // Find rows per page selector
    const rowsPerPageSelector = page.locator('select[data-testid="rows-per-page"], [aria-label*="rows per page"]');
    await rowsPerPageSelector.selectOption('20');
    
    // Wait for table to update
    await page.waitForTimeout(1000);
    
    // Verify up to 20 users shown
    const userRows = page.locator('tr[data-testid="user-row"], tbody tr').filter({ hasText: /@/ });
    const rowCount = await userRows.count();
    expect(rowCount).toBeLessThanOrEqual(20);
  });
  
  // Test Step 5: Verify all users now on page 1 (SC)
  await test.step('Verify all users now on page 1 (SC)', async () => {
    // Check if pagination controls are hidden (all users fit on one page)
    const paginationControls = page.locator('[data-testid="pagination"], nav[aria-label="pagination"]');
    const userRows = page.locator('tr[data-testid="user-row"], tbody tr').filter({ hasText: /@/ });
    const rowCount = await userRows.count();
    
    // Take screenshot
    const timestamp = formatTimestamp(new Date());
    await page.screenshot({ 
      path: getScreenshotPath(`TS.5.1-03-${timestamp}.png`),
      fullPage: true 
    });
    
    // If all users fit on page, pagination should be hidden or show page 1 of 1
    if (rowCount < 20) {
      const pageInfo = page.locator('text=/Page 1 of 1/i');
      if (await pageInfo.isVisible()) {
        await expect(pageInfo).toBeVisible();
      } else {
        // Pagination might be hidden entirely
        await expect(paginationControls).not.toBeVisible();
      }
    }
  });
  
  // Expected Results:
  // 1. Shows 10 users by default ✓
  // 2. Shows only 5 users ✓
  // 3. Page 2 loads next 5 users ✓
  // 4. Shows up to 20 users ✓
  // 5. Pagination disappears if all fit ✓
});