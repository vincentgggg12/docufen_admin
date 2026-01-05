import { test, expect } from '@playwright/test';
import { microsoftLogin } from '../utils/msLogin';
import { getScreenshotPath } from '../utils/paths';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.playwright.env' });

// Set test timeout to 240 seconds (longer due to multiple logins)
test.setTimeout(240000);

test.use({
  viewport: { height: 1080, width: 1920 },
  ignoreHTTPSErrors: true
});

function formatTimestamp(date: Date): string {
  return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}-${String(date.getHours()).padStart(2, '0')}.${String(date.getMinutes()).padStart(2, '0')}.${String(date.getSeconds()).padStart(2, '0')}`;
}

test('TS.3.2-04 Force ERSD Re-acceptance', async ({ page, baseURL }) => {
  // Test Procedure:
  // 1. Login as Johanna after reset
  // 2. See ERSD prompt
  // 3. Accept terms
  // 4. Verify access granted (SC)
  // 5. Logout
  // 6. Login again as Johanna
  // 7. Verify no ERSD prompt appears (SC)
  
  // FS ID: FS.3.2-04
  
  // Note: This test assumes TS.3.2-03 has been run and Johanna's ERSD has been reset
  
  const password = process.env.MS_PASSWORD!;
  const johannaEmail = process.env.MS_EMAIL_17NJ5D_JOHANNA_LORENZ!;
  
  // Test Step 1-3: Login as Johanna and handle ERSD prompt
  await test.step('Login as Johanna and accept ERSD terms', async () => {
    // Navigate to login page
    await page.goto(`${baseURL}/login`);
    
    // Perform Microsoft login
    await microsoftLogin(page, johannaEmail, password);
    
    // Wait for ERSD dialog to appear (since it was reset)
    await page.waitForSelector('[data-testid="ersd-dialog"]', { timeout: 10000 });
    
    // Verify ERSD agreement is displayed
    const ersdDialog = page.getByTestId('ersd-dialog');
    await expect(ersdDialog).toBeVisible();
    
    // Find and check the consent checkbox
    const consentCheckbox = page.getByRole('checkbox', { name: /I have read and agree/i });
    await consentCheckbox.check();
    
    // Click I Agree button
    const agreeButton = page.getByRole('button', { name: 'I Agree' });
    await agreeButton.click();
    
    // Wait for dialog to close
    await page.waitForSelector('[data-testid="ersd-dialog"]', { state: 'hidden', timeout: 5000 });
  });
  
  // Test Step 4: Verify access granted (SC)
  await test.step('Verify access granted (SC)', async () => {
    // Wait for successful navigation to main application
    await page.waitForLoadState('networkidle');
    
    // Verify user is on documents page (Johanna is a Collaborator)
    await expect(page).toHaveURL(/.*\/documents/);
    
    // Verify main navigation is visible
    const mainNav = page.getByTestId('lsb.nav-main');
    await expect(mainNav).toBeVisible();
    
    // Take screenshot showing successful access
    const timestamp = formatTimestamp(new Date());
    await page.screenshot({ 
      path: getScreenshotPath(`TS.3.2-04-01-${timestamp}.png`),
      fullPage: true 
    });
  });
  
  // Test Step 5: Logout
  await test.step('Logout', async () => {
    // Click user profile trigger
    await page.getByTestId('lsb.user-profile.trigger').click();
    await page.waitForTimeout(500); // Wait for menu to open
    
    // Click logout
    await page.getByTestId('lsb.user-profile.logoutMenuItem').click();
    
    // Wait for redirect to login page
    await page.waitForURL(/.*\/login/, { timeout: 10000 });
  });
  
  // Test Step 6-7: Login again and verify no ERSD prompt
  await test.step('Login again as Johanna and verify no ERSD prompt (SC)', async () => {
    // Perform Microsoft login again
    await microsoftLogin(page, johannaEmail, password);
    
    // Wait for navigation to complete
    await page.waitForLoadState('networkidle');
    
    // Verify ERSD dialog does NOT appear
    const ersdDialog = page.getByTestId('ersd-dialog');
    await expect(ersdDialog).not.toBeVisible({ timeout: 5000 });
    
    // Verify user is directly on documents page
    await expect(page).toHaveURL(/.*\/documents/);
    
    // Take screenshot showing no ERSD prompt on re-login
    const timestamp = formatTimestamp(new Date());
    await page.screenshot({ 
      path: getScreenshotPath(`TS.3.2-04-02-${timestamp}.png`),
      fullPage: true 
    });
  });
  
  // Expected Results:
  // 1. ERSD agreement displays ✓
  // 2. Must accept to continue ✓
  // 3. Access granted after acceptance ✓
  // 4. System accessible ✓
  // 5. Logout successful ✓
  // 6. Second login successful ✓
  // 7. No ERSD prompt on re-login ✓
});