import { test, expect } from '@playwright/test';
import { microsoftLogin } from '../utils/msLogin';
import { handleERSDDialog } from '../utils/ersd-handler';
import { getScreenshotPath } from '../utils/paths';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.playwright.env' });

const baseUrl = process.env.BASE_URL;

// Set test timeout to 60 seconds (medium complexity)
test.setTimeout(60000);

test.use({
  viewport: { height: 1080, width: 1920 },
  ignoreHTTPSErrors: true
});

function formatTimestamp(date: Date): string {
  return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}-${String(date.getHours()).padStart(2, '0')}.${String(date.getMinutes()).padStart(2, '0')}.${String(date.getSeconds()).padStart(2, '0')}`;
}

test('TS.2.1-02 Existing Account Detection', async ({ page }) => {
  // Test Procedure:
  // 1. Login as Diego (has role)
  // 2. Navigate to /setup
  // 3. Verify redirect
  // 4. Check lands on Documents (SC)
  
  // Setup: Login as Diego (Creator role)
  const email = process.env.MS_EMAIL_17NJ5D_DIEGO_SICILIANI!;
  const password = process.env.MS_PASSWORD!;
  
  // Test Step 1: Login as Diego (has role)
  await test.step('Login as Diego (has role)', async () => {
    await page.goto(`${baseUrl}/login`);
    await microsoftLogin(page, email, password);
    await handleERSDDialog(page);
    await page.waitForLoadState('networkidle');
  });
  
  // Test Step 2: Navigate to /setup
  await test.step('Navigate to /setup', async () => {
    await page.goto(`${baseUrl}/setup`);
  });
  
  // Test Step 3: Verify redirect
  await test.step('Verify redirect', async () => {
    // Expected: Should redirect away from setup since user has a role
    await page.waitForLoadState('networkidle');
    await expect(page).not.toHaveURL(/.*\/setup/);
  });
  
  // Test Step 4: Check lands on Documents (SC)
  await test.step('Check lands on Documents (SC)', async () => {
    // Expected: Documents page shown for Creator role
    await expect(page).toHaveURL(/.*\/documents/);
    
    // Wait for documents page to load
    await page.waitForSelector('text=Documents', { timeout: 10000 });
    await expect(page.getByText('Documents').first()).toBeVisible();
    
    // Take screenshot
    const timestamp = formatTimestamp(new Date());
    await page.screenshot({ 
      path: getScreenshotPath(`TS.2.1-02-${timestamp}.png`),
      fullPage: true 
    });
  });
  
  // Expected Results:
  // 1. Existing user login ✓
  // 2. Setup URL accessed ✓
  // 3. Redirects immediately ✓
  // 4. Documents page shown ✓
});