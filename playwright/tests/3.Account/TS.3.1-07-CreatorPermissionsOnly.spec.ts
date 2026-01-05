import { test, expect } from '@playwright/test';
import { microsoftLogin } from '../utils/msLogin';
import { handleERSDDialog } from '../utils/ersd-handler';
import { getScreenshotPath } from '../utils/paths';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.playwright.env' });

const baseUrl = process.env.BASE_URL;

// Set test timeout to 240 seconds (longer due to multiple logins)
test.setTimeout(240000);

test.use({
  viewport: { height: 1080, width: 1920 },
  ignoreHTTPSErrors: true
});

function formatTimestamp(date: Date): string {
  return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}-${String(date.getHours()).padStart(2, '0')}.${String(date.getMinutes()).padStart(2, '0')}.${String(date.getSeconds()).padStart(2, '0')}`;
}

test('TS.3.1-07 Creator Permissions Only', async ({ page }) => {
  // Test Procedure:
  // 1. Login as Diego (Creator role), Login as Grady (User Manager) and Julia Smith (External) (Collaborator)
  // 2. Navigate to Account page /account
  
  // FS ID: FS.3.1-01
  
  const password = process.env.MS_PASSWORD!;
  
  // Test Step 1 & 2: Login as Diego (Creator role) and navigate to /account
  await test.step('Login as Diego (Creator role) and navigate to /account', async () => {
    const email = process.env.MS_EMAIL_17NJ5D_JONI_SHERMAN!;
    
    // Navigate to login page
    await page.goto(`${baseUrl}/login`);
    
    // Perform Microsoft login
    await microsoftLogin(page, email, password);
    
    // Handle ERSD if needed
    await handleERSDDialog(page);
    
    // Wait for navigation
    await page.waitForLoadState('domcontentloaded');
    
    // Try to navigate directly to /account
    await page.goto(`${baseUrl}/account`);
    
    // Wait for redirect
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);
    
    // Expected Result: Site redirects Creator to /documents
    await expect(page).toHaveURL(/.*\/documents/);
    
    // Take screenshot
    const timestamp = formatTimestamp(new Date());
    await page.screenshot({ 
      path: getScreenshotPath(`TS.3.1-07-Diego-${timestamp}.png`),
      fullPage: true 
    });
    
    // Logout
    await page.getByTestId('lsb.user-profile.trigger').click();
    await page.waitForTimeout(100); // Wait for menu to open
    await page.getByTestId('lsb.user-profile.logoutMenuItem').click();
    await page.waitForTimeout(100); // Wait for menu to open
    await page.waitForLoadState('domcontentloaded');
    await expect(page).toHaveURL(/.*\/login/);

  });
  
  // Test Step 1 & 2: Login as Grady (User Manager) and navigate to /account
  await test.step('Login as Grady (User Manager) and navigate to /account', async () => {
    const email = process.env.MS_EMAIL_17NJ5D_GRADY_ARCHIE!;
    
    // Navigate to login page
    await page.goto(`${baseUrl}/login`);
    
    // Perform Microsoft login
    await microsoftLogin(page, email, password);
    
    // Handle ERSD if needed
    await handleERSDDialog(page);
    
    // Wait for navigation
    await page.waitForLoadState('domcontentloaded');
    
    // Try to navigate directly to /account
    await page.goto(`${baseUrl}/account`);
    
    // Wait for redirect
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);
    
    // Expected Result: Site redirects User Manager to /users
    await expect(page).toHaveURL(/.*\/users/);
    
    // Take screenshot
    const timestamp = formatTimestamp(new Date());
    await page.screenshot({ 
      path: getScreenshotPath(`TS.3.1-07-Grady-${timestamp}.png`),
      fullPage: true 
    });
    
    // Logout
    await page.getByTestId('lsb.user-profile.trigger').click();
    await page.waitForTimeout(100); // Wait for menu to open
    await page.getByTestId('lsb.user-profile.logoutMenuItem').click();
    await page.waitForTimeout(100); // Wait for menu to open
    await page.waitForLoadState('domcontentloaded');
    await expect(page).toHaveURL(/.*\/login/);
  });
  
  // Test Step 1 & 2: Login as Julia Smith (External/Collaborator) and navigate to /account
  await test.step('Login as Julia Smith (External/Collaborator) and navigate to /account', async () => {
    const email = process.env.MS_EMAIL_XMWKB_JULIA_SMITH!;
    
    // Navigate to login page
    await page.goto(`${baseUrl}/login`);
    
    // Perform Microsoft login
    await microsoftLogin(page, email, password);
    
    // Handle ERSD if needed
    await handleERSDDialog(page);
    
    // Wait for navigation
    await page.waitForLoadState('domcontentloaded');
    
    // Julia Smith might need to select the Pharma organization as she's external
    try {
      // Check if we need to select an organization
      const orgSelector = page.getByTestId("lsb.tenant-switcher.trigger");
      if (await orgSelector.isVisible({ timeout: 5000 })) {
        await orgSelector.click();
        // Look for Pharma organization (she's an external collaborator there)
        await page.getByTestId("lsb.tenant-switcher.organization.17nj5d").click();
        await page.waitForLoadState('domcontentloaded');
      }
    } catch {
      // If no org selector, continue
    }
    
    // Try to navigate directly to /account
    await page.goto(`${baseUrl}/account`);
    
    // Wait for redirect
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);
    
    // Expected Result: Site redirects Collaborator to /documents
    await expect(page).toHaveURL(/.*\/documents/);
    
    // Take screenshot
    const timestamp = formatTimestamp(new Date());
    await page.screenshot({ 
      path: getScreenshotPath(`TS.3.1-07-Julia-${timestamp}.png`),
      fullPage: true 
    });
  });
  
    // Logout
    await page.getByTestId('lsb.user-profile.trigger').click();
    await page.waitForTimeout(100); // Wait for menu to open
    await page.getByTestId('lsb.user-profile.logoutMenuItem').click();
    await page.waitForTimeout(100); // Wait for menu to open
    await page.waitForLoadState('domcontentloaded');
    await expect(page).toHaveURL(/.*\/login/);
});