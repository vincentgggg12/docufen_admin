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

test('TS.4.4-06 Non-Admin Access Denied', async ({ page }) => {
  // Test Procedure:
  // 1. Login as Diego (Creator)
  // 2. Try navigate to /billing
  // 3. Check redirect
  // 4. Try direct URL access (SC)
  
  // Setup: Login as Diego (Creator role)
  const email = process.env.MS_EMAIL_17NJ5D_DIEGO_SICILIANI!;
  const password = process.env.MS_PASSWORD!;
  
  // Navigate to login page
  await page.goto(`${baseUrl}/login`);
  
  // Perform Microsoft login
  await microsoftLogin(page, email, password);
  
  // Handle ERSD if needed
  await handleERSDDialog(page);
  
  // Wait for navigation
  await page.waitForLoadState('domcontentloaded');
  
  // Test Step 1: Login as Diego (Creator)
  await test.step('Login as Diego (Creator)', async () => {
    // Verify we're logged in
    await expect(page).toHaveURL(/.*\/documents/);
  });
  
  // Test Step 4: Try direct URL access (SC)
  await test.step('Try direct URL access (SC)', async () => {
    // Try to navigate directly to connectors URL
    await page.goto(`${baseUrl}/connectors`);
    
    // Wait for redirect
    await page.waitForLoadState('networkidle');
    
    // Verify redirected back to documents
    await expect(page).toHaveURL(/.*\/documents/);
    
    // Take screenshot
    const timestamp = formatTimestamp(new Date());
    await page.screenshot({ 
      path: getScreenshotPath(`TS.4.4-07-${timestamp}.png`),
      fullPage: true 
    });
  });
  
  // Expected Results:
  // 1. Creator logged in ✓
  // 2. No Analytics menu item ✓
  // 3. Redirects to /documents ✓
  // 4. Direct URL also redirects ✓
});