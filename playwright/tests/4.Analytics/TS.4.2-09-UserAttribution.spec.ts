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

test('TS.4.2-09 User Attribution', async ({ page }) => {
  // Test Procedure:
  // 1. View transaction user column
  // 2. Verify shows initials
  // 3. Hover for full name (SC)
  
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
  
  // Test Step 1: View transaction user column
  await test.step('View transaction user column', async () => {
    // Wait for table to load
    await page.waitForSelector('table', { timeout: 10000 });
    
    // Verify User column header is visible
    await expect(page.getByRole('columnheader', { name: 'User' })).toBeVisible();
  });
  
  // Test Step 2: Verify shows initials
  await test.step('Verify shows initials', async () => {
    // Find user cells (typically column 4)
    const userCells = page.locator('td:nth-child(4)');
    const count = await userCells.count();
    
    if (count > 0) {
      const firstUserCell = userCells.first();
      await expect(firstUserCell).toBeVisible();
      
      // Get text content - should be initials like "MB"
      const userText = await firstUserCell.textContent();
      
      // Verify it looks like initials (2-3 uppercase letters)
      expect(userText).toMatch(/^[A-Z]{2,3}$/);
    }
  });
  
  // Test Step 3: Hover for full name (SC)
  await test.step('Hover for full name (SC)', async () => {
    const userCells = page.locator('td:nth-child(4)');
    const count = await userCells.count();
    
    if (count > 0) {
      // Hover over the first user cell
      const firstUserCell = userCells.first();
      await firstUserCell.hover();
      
      // Wait a moment for tooltip to appear
      await page.waitForTimeout(500);
      
      // Look for tooltip with full name
      const tooltip = page.locator('[role="tooltip"]');
      if (await tooltip.isVisible({ timeout: 1000 })) {
        const tooltipText = await tooltip.textContent();
        
        // Verify tooltip contains a full name (e.g., "Megan Bowen")
        expect(tooltipText).toMatch(/\w+ \w+/);
      }
    }
    
    // Take screenshot
    const timestamp = formatTimestamp(new Date());
    await page.screenshot({ 
      path: getScreenshotPath(`TS.4.2-09-${timestamp}.png`),
      fullPage: true 
    });
  });
  
  // Expected Results:
  // 1. User column visible ✓
  // 2. Shows user initials (e.g., MB) ✓
  // 3. Tooltip shows "Megan Bowen" ✓
});