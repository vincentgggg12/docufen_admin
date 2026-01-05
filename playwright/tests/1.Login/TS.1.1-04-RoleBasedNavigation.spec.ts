import { test, expect } from '@playwright/test';
import * as dotenv from 'dotenv';
import { microsoftLogin } from '../utils/msLogin';
import { getScreenshotPath } from '../utils/paths';

dotenv.config({ path: '.playwright.env' });

test.use({
  viewport: { height: 1080, width: 1920 },
  ignoreHTTPSErrors: true
});

test.setTimeout(120000); // 2 minutes - complex test with multiple logins

function formatTimestamp(date: Date): string {
  return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}-${String(date.getHours()).padStart(2, '0')}.${String(date.getMinutes()).padStart(2, '0')}.${String(date.getSeconds()).padStart(2, '0')}`;
}

test('TS.1.1-04 Role-Based Navigation', async ({ page, context }) => {
  // Test Procedure:
  // 1. Login as new user (no role)
  // 2. Verify redirect to "Access Restricted"
  // 3. Login as Grady (User Manager)
  // 4. Verify redirect to Users page
  // 5. Login as Megan (Trial Admin) to Account (SC)

  const baseUrl = process.env.BASE_URL;
  const password = process.env.MS_PASSWORD!;

  // Test Step 1: Login as new user (no role)
  await test.step('Login as new user (no role)', async () => {
    // Assuming a new user email exists in environment
    const newUserEmail = process.env.MS_EMAIL_NEW_USER || process.env.MS_EMAIL_17NJ5D_NEW_USER!;
    
    await page.goto(`${baseUrl}/login`);
    await microsoftLogin(page, newUserEmail, password);
    
    // Expected Result: New user authenticated
  });

  // Test Step 2: Verify redirect to "Access Restricted"
  await test.step('Verify redirect to "Access Restricted"', async () => {
    // Expected Result: Access Restricted shows
    await page.waitForURL(/\/notinvited/, { timeout: 60000 });
    await expect(page.getByText('Access Restricted')).toBeVisible();
  });

  // Test Step 3: Login as Grady (User Manager)
  await test.step('Login as Grady (User Manager)', async () => {
    const gradyEmail = process.env.MS_EMAIL_17NJ5D_GRADY_ARCHIE!;
    
    await page.goto(`${baseUrl}/login`);
    await microsoftLogin(page, gradyEmail, password);
    
    // Expected Result: User Manager logged in
  });

  // Test Step 4: Verify redirect to Users page
  await test.step('Verify redirect to Users page', async () => {
    // Expected Result: Users page displays
    await page.waitForURL(/\/users/, { timeout: 60000 });
    await expect(page).toHaveURL(/\/users/);
    await expect(page.getByRole('link', { name: 'User Management' })).toBeVisible();
    
  });

  // Test Step 5: Login as Megan (Trial Admin) to Account (SC)
  await test.step('Login as Megan (Trial Admin) to Account (SC)', async () => {
    const meganEmail = process.env.MS_EMAIL_17NJ5D_MEGAN_BOWEN!;
    
    await page.goto(`${baseUrl}/login`);
    await microsoftLogin(page, meganEmail, password);
    
    // Wait for navigation
    await page.waitForURL(/\/account/, { timeout: 60000 });
    
    // Take screenshot
    const timestamp = formatTimestamp(new Date());
    await page.screenshot({ 
      path: getScreenshotPath(`TS.1.1-04-5-${timestamp}.png`) 
    });
    
    // Expected Result: Account page displays
    if (page.url().includes('/account')) {
      await expect(page.getByRole('link', { name: /Account Settings/i })).toBeVisible();
    } else {
      throw new Error('Failed to navigate to Account page');
    }
  });
});