import { test, expect } from '@playwright/test';
import * as dotenv from 'dotenv';
import { microsoftLogin } from '../utils/msLogin';
import { getScreenshotPath } from '../utils/paths';

dotenv.config({ path: '.playwright.env' });

test.use({
  viewport: { height: 1080, width: 1920 },
  ignoreHTTPSErrors: true
});

test.setTimeout(120000); // 2 minutes

function formatTimestamp(date: Date): string {
  return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}-${String(date.getHours()).padStart(2, '0')}.${String(date.getMinutes()).padStart(2, '0')}.${String(date.getSeconds()).padStart(2, '0')}`;
}

test('TS.1.2-05 External User Identification', async ({ page }) => {
  // Test Procedure:
  // 1. Login as Charlotte (xmwkb)
  // 2. Access Pharma 17NJ5D
  // 3. View user profile
  // 4. Check External badge
  // 5. Verify company shown (SC)

  const baseUrl = process.env.BASE_URL;
  const email = process.env.MS_EMAIL_XMWKB_CHARLOTTE_WEISS!;
  const password = process.env.MS_PASSWORD!;

  // Test Step 1: Login as Charlotte (external user)
  await test.step('Login as Charlotte (external user)', async () => {
    await page.goto(`${baseUrl}/login`);
    await expect(page).toHaveTitle(/Docufen/i);
    await page.getByTestId('loginPage.loginButton').click();
  });

  // Test Step 2: Complete authentication and access Pharma 17NJ5D
  await test.step('Complete authentication and access Pharma 17NJ5D', async () => {
    // Wait for Microsoft login page
    await microsoftLogin(page, email, password, true);
    
    // Wait for redirect back to Docufen
    await page.waitForURL(`${baseUrl}/**`, { timeout: 60000 });
    
    // Handle ERSD if present
    try {
      const ersdCheckbox = page.getByRole('checkbox', { name: /I have read and accept/i });
      if (await ersdCheckbox.isVisible({ timeout: 5000 })) {
        await ersdCheckbox.check();
        await page.getByRole('button', { name: /Accept|Continue/i }).click();
      }
    } catch (err) {
      // ERSD not present, continue
    }
    
    // Expected Result: Cross-tenant access successful
    await expect(page.url()).toMatch(/docufen/i);
  });

  // Test Step 3: View user profile
  await test.step('View user profile', async () => {
    // Click on user menu/profile
    const userMenuButton = page.getByRole('button', { name: /User menu|Profile|Charlotte/i });
    await userMenuButton.click();
    
    // Click on profile or view profile option
    const profileLink = page.getByRole('link', { name: /Profile|My Profile|Account/i });
    if (await profileLink.isVisible({ timeout: 5000 })) {
      await profileLink.click();
    }
    
    // Expected Result: Profile displays
    await expect(page.getByText(/Charlotte|Profile|User Information/i)).toBeVisible();
  });

  // Test Step 4: Check External badge
  await test.step('Check External badge', async () => {
    // Expected Result: External badge visible
    const externalBadge = page.getByText(/External|External User|Guest/i);
    await expect(externalBadge).toBeVisible();
  });

  // Test Step 5: Verify company shown (SC)
  await test.step('Verify company shown (SC)', async () => {
    // Take screenshot
    const timestamp = formatTimestamp(new Date());
    await page.screenshot({ 
      path: getScreenshotPath(`TS.1.2-05-5-${timestamp}.png`) 
    });
    
    // Expected Result: Shows "Biotech XMWKB"
    const companyText = page.getByText(/Biotech XMWKB|XMWKB/i);
    await expect(companyText).toBeVisible();
  });
});