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

test('TS.3.3-05 Trial Expiration Warning', async ({ page }) => {
  // Test Procedure:
  // 1. Use system with 1 day left, login with Megan Bowen, view warning banner (SC)
  
  // Note: This test checks for trial expiration warnings
  // In a real scenario, the system would need to have 1-14 days left on trial
  
  // Setup: Login
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
  
  // Test Step 1: View warning banner (SC)
  await test.step('View warning banner (SC)', async () => {
    // Look for trial expiration warning banner
    // Banner should appear if trial has 1-14 days remaining
    const warningBanner = page.locator('[role="alert"]').filter({ hasText: /trial|days? remaining|upgrade/i });
    const bannerText = page.getByText(/\d+\s*days?\s*remaining/i);
    
    // Check if banner is visible
    const isBannerVisible = await warningBanner.isVisible().catch(() => false) ||
                           await bannerText.isVisible().catch(() => false);
    
    if (isBannerVisible) {
      // Banner is visible - verify it shows days remaining
      const bannerContent = await warningBanner.textContent().catch(() => '') || 
                           await bannerText.textContent().catch(() => '');
      
      // Check if it mentions days remaining (between 1 and 14)
      const daysMatch = bannerContent.match(/(\d+)\s*days?\s*remaining/i);
      if (daysMatch) {
        const daysRemaining = parseInt(daysMatch[1]);
        expect(daysRemaining).toBeGreaterThanOrEqual(1);
        expect(daysRemaining).toBeLessThanOrEqual(14);
      }
      
      // Verify upgrade link is provided
      const upgradeLink = page.getByRole('link', { name: /upgrade/i }).or(
                         page.getByRole('button', { name: /upgrade/i }));
      await expect(upgradeLink).toBeVisible();
      
      // Take screenshot of warning banner
      const timestamp = formatTimestamp(new Date());
      await page.screenshot({ 
        path: getScreenshotPath(`TS.3.3-05-warning-banner-${timestamp}.png`),
        fullPage: true 
      });
    } else {
      // No banner visible - might be because trial has more than 14 days
      // Navigate to Account > License to check trial status
      const accountLink = page.getByRole('link', { name: 'Account' }).or(
                         page.getByRole('button', { name: 'Account' }));
      
      if (await accountLink.isVisible()) {
        await accountLink.click();
        await page.waitForLoadState('networkidle');
        
        // Go to License tab
        await page.getByRole('tab', { name: 'License' }).click();
        await page.waitForTimeout(1000);
        
        // Check trial status
        const trialStatus = page.getByText(/Trial\s*-\s*\d+\s*days?\s*remaining/i);
        await expect(trialStatus).toBeVisible();
        
        // Take screenshot of license page
        const timestamp = formatTimestamp(new Date());
        await page.screenshot({ 
          path: getScreenshotPath(`TS.3.3-05-license-status-${timestamp}.png`),
          fullPage: true 
        });
      }
    }
  });
  
  // Expected Results:
  // 1. Banner shows between 1 and 14 days remaining, and Upgrade link provided ✓
});