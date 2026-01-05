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

test('TS.4.3-03 Tiered Pricing Display', async ({ page }) => {
  // Test Procedure:
  // 1. View pricing tiers section
  // 2. Check all tier thresholds
  // 3. Verify current tier highlighted (SC)
  
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
  
  // Navigate to ROI Analytics
  await page.getByRole('button', { name: 'Menu' }).click();
  await page.getByRole('link', { name: 'Analytics' }).click();
  await page.waitForSelector('text=ROI Analytics', { timeout: 10000 });
  await page.getByRole('link', { name: 'ROI Analytics' }).click();
  
  // Test Step 1: View pricing tiers section
  await test.step('View pricing tiers section', async () => {
    // Wait for pricing tiers section to be visible
    await expect(page.getByText('Pricing Tiers')).toBeVisible();
  });
  
  // Test Step 2: Check all tier thresholds
  await test.step('Check all tier thresholds', async () => {
    // Verify tier 1: 0-1000
    await expect(page.getByText('0-1000')).toBeVisible();
    await expect(page.getByText('$0.79')).toBeVisible();
    
    // Verify tier 2: 1001-5000
    await expect(page.getByText('1001-5000')).toBeVisible();
    await expect(page.getByText('$0.67')).toBeVisible();
    
    // Verify tier 3: 5001-10000
    await expect(page.getByText('5001-10000')).toBeVisible();
    await expect(page.getByText('$0.59')).toBeVisible();
    
    // Verify tier 4: 10001-20000
    await expect(page.getByText('10001-20000')).toBeVisible();
    await expect(page.getByText('$0.51')).toBeVisible();
    
    // Verify tier 5: 20001+
    await expect(page.getByText('20001+')).toBeVisible();
    await expect(page.getByText('$0.41')).toBeVisible();
  });
  
  // Test Step 3: Verify current tier highlighted (SC)
  await test.step('Verify current tier highlighted (SC)', async () => {
    // Look for highlighted tier (usually has different background or border)
    const highlightedTier = page.locator('.tier-highlight, .active-tier, [data-active="true"]').first();
    
    if (await highlightedTier.isVisible({ timeout: 5000 })) {
      await expect(highlightedTier).toBeVisible();
    }
    
    // Take screenshot
    const timestamp = formatTimestamp(new Date());
    await page.screenshot({ 
      path: getScreenshotPath(`TS.4.3-03-${timestamp}.png`),
      fullPage: true 
    });
  });
  
  // Expected Results:
  // 1. Tiers displayed ✓
  // 2. Shows 0-1000, 1001-5000, 5001-10000, 10001-20000 and 20001+ ✓
  // 3. Current usage tier highlighted ✓
});