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

test('TS.5.1-02 User Search', async ({ page }) => {
  // Test Procedure:
  // 1. In search box, type "Diego"
  // 2. Verify results filter
  // 3. Clear and search "17nj5d"
  // 4. Clear and search "DS" (initials)
  // 5. Search non-existent user "xyz" (SC)
  
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
  
  // Test Step 1: In search box, type "Diego"
  await test.step('In search box, type "Diego"', async () => {
    const searchBox = page.getByPlaceholder(/Search/i);
    await searchBox.fill('Diego');
    
    // Wait for search to execute
    await page.waitForTimeout(1000);
  });
  
  // Test Step 2: Verify results filter
  await test.step('Verify results filter', async () => {
    // Verify only Diego Siciliani is shown
    await expect(page.getByText('Diego Siciliani')).toBeVisible();
    
    // Verify other users are not visible
    const userRows = page.locator('tr[data-testid="user-row"], tbody tr').filter({ hasText: /@/ });
    const rowCount = await userRows.count();
    expect(rowCount).toBe(1);
  });
  
  // Test Step 3: Clear and search "17nj5d"
  await test.step('Clear and search "17nj5d"', async () => {
    const searchBox = page.getByPlaceholder(/Search/i);
    await searchBox.clear();
    await searchBox.fill('17nj5d');
    
    // Wait for search to execute
    await page.waitForTimeout(1000);
    
    // Verify all 17nj5d.onmicrosoft.com users are shown
    const userEmails = page.locator('[data-testid="user-email"], td:has-text("@")');
    const emailCount = await userEmails.count();
    
    for (let i = 0; i < emailCount; i++) {
      const email = await userEmails.nth(i).textContent();
      expect(email).toContain('17nj5d.onmicrosoft.com');
    }
  });
  
  // Test Step 4: Clear and search "DS" (initials)
  await test.step('Clear and search "DS" (initials)', async () => {
    const searchBox = page.getByPlaceholder(/Search/i);
    await searchBox.clear();
    await searchBox.fill('DS');
    
    // Wait for search to execute
    await page.waitForTimeout(1000);
    
    // Verify users with DS initials are shown
    const userInitials = page.locator('[data-testid="user-initials"], td:has-text("DS")');
    const initialsCount = await userInitials.count();
    expect(initialsCount).toBeGreaterThan(0);
  });
  
  // Test Step 5: Search non-existent user "xyz" (SC)
  await test.step('Search non-existent user "xyz" (SC)', async () => {
    const searchBox = page.getByPlaceholder(/Search/i);
    await searchBox.clear();
    await searchBox.fill('xyz');
    
    // Wait for search to execute
    await page.waitForTimeout(1000);
    
    // Take screenshot
    const timestamp = formatTimestamp(new Date());
    await page.screenshot({ 
      path: getScreenshotPath(`TS.5.1-02-${timestamp}.png`),
      fullPage: true 
    });
    
    // Verify "No users found" message
    await expect(page.getByText(/No users found/i)).toBeVisible();
  });
  
  // Expected Results:
  // 1. Search box accepts input ✓
  // 2. Shows only Diego Siciliani ✓
  // 3. Shows all 17nj5d.onmicrosoft.com users ✓
  // 4. Shows users with DS initials ✓
  // 5. Shows "No users found" message ✓
});