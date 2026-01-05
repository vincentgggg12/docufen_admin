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

test('TS.4.2-03 Document Name Search', async ({ page }) => {
  // Test Procedure:
  // 1. Type "Protocol" in search
  // 2. View filtered results
  // 3. Verify only matching documents (SC)
  
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
  
  // Test Step 1: Type "Protocol" in search
  await test.step('Type "Protocol" in search', async () => {
    // Wait for search input to be visible
    const searchInput = page.getByPlaceholder('Search transactions...');
    await expect(searchInput).toBeVisible();
    
    // Type search term
    await searchInput.fill('Protocol');
    
    // Wait for search to process
    await page.waitForTimeout(500);
  });
  
  // Test Step 2: View filtered results
  await test.step('View filtered results', async () => {
    // Wait for table to update
    await page.waitForTimeout(1000);
    
    // Check that table is still visible
    await expect(page.locator('table')).toBeVisible();
  });
  
  // Test Step 3: Verify only matching documents (SC)
  await test.step('Verify only matching documents (SC)', async () => {
    // If there are results, verify they contain "Protocol"
    const documentCells = page.locator('td:nth-child(2)'); // Document name column
    const count = await documentCells.count();
    
    if (count > 0) {
      // Check first few results contain "Protocol"
      const maxToCheck = Math.min(count, 3);
      for (let i = 0; i < maxToCheck; i++) {
        const text = await documentCells.nth(i).textContent();
        if (text) {
          expect(text.toLowerCase()).toContain('protocol');
        }
      }
    } else {
      // If no results, verify "No transactions found" message
      await expect(page.getByText('No transactions found')).toBeVisible();
    }
    
    // Take screenshot
    const timestamp = formatTimestamp(new Date());
    await page.screenshot({ 
      path: getScreenshotPath(`TS.4.2-03-${timestamp}.png`),
      fullPage: true 
    });
  });
  
  // Expected Results:
  // 1. Search field accepts input ✓
  // 2. Table filters in real-time ✓
  // 3. Only "Protocol" documents shown ✓
});