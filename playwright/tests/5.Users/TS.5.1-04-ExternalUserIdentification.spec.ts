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

test('TS.5.1-04 External User Identification', async ({ page }) => {
  // Test Procedure:
  // 1. View user list with Julia (xmwkb)
  // 2. Verify External badge shown
  // 3. Check company name displays
  // 4. Expand row for full details (SC)
  
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
  
  // Test Step 1: View user list with Julia (xmwkb)
  await test.step('View user list with Julia (xmwkb)', async () => {
    // Search for Julia to make sure she's visible
    const searchBox = page.getByPlaceholder(/Search/i);
    await searchBox.fill('Julia');
    
    // Wait for search to execute
    await page.waitForTimeout(1000);
    
    // Verify Julia is in the list
    await expect(page.getByText('Julia Evans')).toBeVisible();
  });
  
  // Test Step 2: Verify External badge shown
  await test.step('Verify External badge shown', async () => {
    // Look for External badge near Julia's row
    const juliaRow = page.locator('tr').filter({ hasText: 'Julia Evans' });
    const externalBadge = juliaRow.locator('[data-testid="external-badge"], span:has-text("External")');
    
    await expect(externalBadge).toBeVisible();
  });
  
  // Test Step 3: Check company name displays
  await test.step('Check company name displays', async () => {
    // Verify company name is shown
    const juliaRow = page.locator('tr').filter({ hasText: 'Julia Evans' });
    await expect(juliaRow).toContainText('Biotech XMWKB');
  });
  
  // Test Step 4: Expand row for full details (SC)
  await test.step('Expand row for full details (SC)', async () => {
    // Click on Julia's row to expand it
    const juliaRow = page.locator('tr').filter({ hasText: 'Julia Evans' });
    await juliaRow.click();
    
    // Wait for expansion
    await page.waitForTimeout(1000);
    
    // Take screenshot
    const timestamp = formatTimestamp(new Date());
    await page.screenshot({ 
      path: getScreenshotPath(`TS.5.1-04-${timestamp}.png`),
      fullPage: true 
    });
    
    // Verify expanded details show tenant information
    const expandedDetails = page.locator('[data-testid="user-details"], [aria-expanded="true"]');
    await expect(expandedDetails).toBeVisible();
    
    // Verify tenant details are shown
    await expect(page.getByText(/Tenant.*xmwkb/i)).toBeVisible();
  });
  
  // Expected Results:
  // 1. Julia shows in list ✓
  // 2. "External" badge visible ✓
  // 3. Shows "Biotech XMWKB" company ✓
  // 4. Expanded view shows tenant details ✓
});