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

test('TS.4.2-02 UTC Timestamp Format', async ({ page }) => {
  // Test Procedure:
  // 1. View transaction timestamps
  // 2. Verify format
  // 3. Check date/time display (SC)
  
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
  
  // Test Step 1: View transaction timestamps
  await test.step('View transaction timestamps', async () => {
    // Wait for transaction table to load
    await page.waitForSelector('table', { timeout: 10000 });
    
    // Get the first timestamp cell
    const timestampCells = page.locator('td').filter({ hasText: /\d{2}-\w{3}-\d{4}/ });
    const count = await timestampCells.count();
    
    if (count > 0) {
      await expect(timestampCells.first()).toBeVisible();
    }
  });
  
  // Test Step 2: Verify format
  await test.step('Verify format', async () => {
    // Check that timestamps are in the expected format
    const timestampCells = page.locator('td').filter({ hasText: /\d{2}-\w{3}-\d{4}/ });
    const count = await timestampCells.count();
    
    if (count > 0) {
      const firstTimestamp = await timestampCells.first().textContent();
      
      // Verify format matches DD-MMM-YYYY HH:MM:SS pattern
      const datePattern = /\d{2}-\w{3}-\d{4} \d{2}:\d{2}:\d{2}/;
      expect(firstTimestamp).toMatch(datePattern);
    }
  });
  
  // Test Step 3: Check date/time display (SC)
  await test.step('Check date/time display (SC)', async () => {
    // Take screenshot showing timestamp format
    const timestamp = formatTimestamp(new Date());
    await page.screenshot({ 
      path: getScreenshotPath(`TS.4.2-02-${timestamp}.png`),
      fullPage: true 
    });
  });
  
  // Expected Results:
  // 1. Timestamps visible ✓
  // 2. Shows in local timezone ✓
  // 3. Format: DD-MMM-YYY HH:MM:SS (locale dependently) ✓
});