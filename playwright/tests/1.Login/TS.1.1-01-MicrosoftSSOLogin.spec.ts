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

test('TS.1.1-01 Microsoft SSO Login', async ({ page }) => {
  // Test Procedure:
  // 1. Navigate to Docufen login page
  // 2. Click "Login with Microsoft" button
  // 3. Enter Microsoft credentials. Julia(xmwkb)
  // 4. Complete Microsoft authentication
  // 5. Verify redirect to Docufen (SC)

  const baseUrl = process.env.BASE_URL;
  const email = process.env.MS_EMAIL_XMWKB_JULIA_SMITH!;
  const password = process.env.MS_PASSWORD!;

  // Test Step 1: Navigate to Docufen login page
  await test.step('Navigate to Docufen login page', async () => {
    await page.goto(`${baseUrl}/login`);
    
    // Expected Result: Login page displays
    await expect(page).toHaveTitle(/Docufen/i);
    await expect(page.getByTestId('loginPage.loginButton')).toBeVisible();
  });

  // Test Step 2: Click "Login with Microsoft" button
  await test.step('Click "Login with Microsoft" button', async () => {
    await page.getByTestId('loginPage.loginButton').click();
    
    // Expected Result: Microsoft login page opens
    await page.waitForURL(/login\.microsoftonline\.com/, { timeout: 30000 });
  });

  // Test Step 3: Enter Microsoft credentials
  await test.step('Enter Microsoft credentials', async () => {
    // Email
    const emailInput = page.getByRole('textbox', {
      name: /Email|Username|Sign in/i,
    });
    await emailInput.fill(email);
    await page.getByRole('button', { name: /Next/i }).click();
    
    // Password
    const passwordInput = page.getByRole('textbox', { name: /Password/i }).or(
      page.getByPlaceholder('Password'),
    );
    await passwordInput.fill(password);
    
    // Expected Result: Credentials accepted
    await expect(passwordInput).toHaveValue(password);
  });

  // Test Step 4: Complete Microsoft authentication
  await test.step('Complete Microsoft authentication', async () => {
    await page.getByRole('button', { name: /Sign in/i }).click();
    await page.waitForLoadState('domcontentloaded');
    
    // Handle optional "Stay signed in?" prompt
    try {
      const staySignedInText = page.getByText('Stay signed in?');
      if (await staySignedInText.isVisible({ timeout: 5000 })) {
        const noButton = page
          .locator('input[value="No"]')
          .or(page.getByRole('button', { name: /No/i }));
        await noButton.click();
      }
    } catch (err) {
      // Optional prompt - continue if not present
    }
    
    // Expected Result: Authentication successful
  });

  // Test Step 5: Verify redirect to Docufen (SC)
  await test.step('Verify redirect to Docufen (SC)', async () => {
    // Wait for redirect back to Docufen
    await page.waitForURL(/account|\/documents|\/users|\/setup|\/ERSD/, { timeout: 30000 });
    
    // Take screenshot
    const timestamp = formatTimestamp(new Date());
    await page.screenshot({ 
      path: getScreenshotPath(`TS.1.1-01-5-${timestamp}.png`) 
    });
    
    // Expected Result: Returns to Docufen authenticated
    expect(page.url()).toMatch(/docufen/i);
    
    // Verify user is authenticated by checking for menu or logout option
    const menuButton = page.getByTestId('lsb.user-profile.trigger');
    await expect(menuButton).toBeVisible({ timeout: 10000 });
  });
});