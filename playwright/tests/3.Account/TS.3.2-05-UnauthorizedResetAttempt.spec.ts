import { test, expect } from '@playwright/test';
import { microsoftLogin } from '../utils/msLogin';
import { handleERSDDialog } from '../utils/ersd-handler';
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

test('TS.3.2-05 Unauthorized Reset Attempt', async ({ page, baseURL }) => {
  // Test Procedure:
  // 1. Login as Diego (Creator) and Lee (Collaborator)
  // 2. Navigate to /users
  
  // FS IDs: FS.3.2-??, FS.3.2-??
  
  const password = process.env.MS_PASSWORD!;
  
  // Test with Diego (Creator)
  await test.step('Login as Diego (Creator) and navigate to /users', async () => {
    const diegoEmail = process.env.MS_EMAIL_17NJ5D_DIEGO_SICILIANI!;
    
    // Navigate to login page
    await page.goto(`${baseURL}/login`);
    
    // Perform Microsoft login
    await microsoftLogin(page, diegoEmail, password);
    
    // Handle ERSD if needed
    await handleERSDDialog(page);
    
    // Wait for navigation
    await page.waitForLoadState('domcontentloaded');
    
    // Try to navigate to /users
    await page.goto(`${baseURL}/users`);
    
    // Wait for redirect
    await page.waitForLoadState('networkidle');
    
    // Expected Result: User redirected to /documents
    await expect(page).toHaveURL(/.*\/documents/);
    
    // Take screenshot
    const timestamp = formatTimestamp(new Date());
    await page.screenshot({ 
      path: getScreenshotPath(`TS.3.2-05-Diego-${timestamp}.png`),
      fullPage: true 
    });
    
    // Logout
    await page.getByTestId('lsb.user-profile.trigger').click();
    await page.waitForTimeout(500);
    await page.getByTestId('lsb.user-profile.logoutMenuItem').click();
    await page.waitForURL(/.*\/login/, { timeout: 10000 });
  });
  
  // Test with Lee (Collaborator)
  await test.step('Login as Lee (Collaborator) and navigate to /users', async () => {
    const leeEmail = process.env.MS_EMAIL_17NJ5D_LEE_GU!;
    
    // Perform Microsoft login
    await microsoftLogin(page, leeEmail, password);
    
    // Handle ERSD if needed
    await handleERSDDialog(page);
    
    // Wait for navigation
    await page.waitForLoadState('domcontentloaded');
    
    // Try to navigate to /users
    await page.goto(`${baseURL}/users`);
    
    // Wait for redirect
    await page.waitForLoadState('networkidle');
    
    // Expected Result: User redirected to /documents
    await expect(page).toHaveURL(/.*\/documents/);
    
    // Take screenshot
    const timestamp = formatTimestamp(new Date());
    await page.screenshot({ 
      path: getScreenshotPath(`TS.3.2-05-Lee-${timestamp}.png`),
      fullPage: true 
    });
  });
  
  // Expected Results:
  // 1. Diego (Creator) redirected to /documents ✓
  // 2. Lee (Collaborator) redirected to /documents ✓
});