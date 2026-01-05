import { test, expect } from '@playwright/test';
import * as dotenv from 'dotenv';
import { getScreenshotPath } from '../utils/paths';

dotenv.config({ path: '.playwright.env' });

test.use({
  viewport: { height: 1080, width: 1920 },
  ignoreHTTPSErrors: true
});

test.setTimeout(240000); // 4 minutes - test requires 3 minute wait

function formatTimestamp(date: Date): string {
  return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}-${String(date.getHours()).padStart(2, '0')}.${String(date.getMinutes()).padStart(2, '0')}.${String(date.getSeconds()).padStart(2, '0')}`;
}

test('TS.1.1-05 Authentication Error Handling', async ({ page }) => {
  // Test Procedure:
  // 1. Click login with Microsoft
  // 2. Wait 3 minutes
  // 3. Enter login details
  // 4. (SC)

  const baseUrl = process.env.BASE_URL;
  const email = process.env.MS_EMAIL_17NJ5D_ALEX_WILBER!;
  const password = process.env.MS_PASSWORD!;

  // Test Step 1: Click login with Microsoft
  await test.step('Click login with Microsoft', async () => {
    await page.goto(`${baseUrl}/login`);

    // Expected Result: MS login initiated
    await expect(page.getByTestId('loginPage.loginButton')).toBeVisible();
    await page.getByTestId('loginPage.loginButton').click();

    // Wait for Microsoft login page
    await page.waitForURL(/login\.microsoftonline\.com/, { timeout: 30000 });
  });

  // Test Step 2: Wait 3 minutes
  await test.step('Wait 3 minutes', async () => {
    // Expected Result: Microsoft login screen waits
    console.log('Waiting 3 minutes as per test requirement...');
    await page.waitForTimeout(180000); // 3 minutes = 180000ms
  });

  // Test Step 3: Enter login details
  await test.step('Enter login details', async () => {
    const emailInput = page.getByRole('textbox', {
      name: /Email|Username|Sign in/i,
    });
    console.log("email: ", email);
    await emailInput.fill(email);
    await page.getByRole('button', { name: /Next/i }).click();

    // === PASSWORD ===
    const passwordInput = page.getByRole('textbox', { name: /Password/i }).or(
      page.getByPlaceholder('Password'),
    );
    await passwordInput.fill(password);
    await page.getByRole('button', { name: /Sign in/i }).click();
    await page.waitForLoadState('domcontentloaded');

    // === Optional "Stay signed in?" prompt ===
    try {
      // Give the prompt a moment to appear – if it doesn't we simply fall through
      console.log('microsoftLogin: Checking for "Stay signed in?" prompt...', performance.now());
      const staySignedInText = page.getByText('Stay signed in?');
      if (await staySignedInText.isVisible({ timeout: 20_000 })) {
        // Select "Don't show this again" to speed up subsequent logins
        const dontShowAgainCheckbox = page.locator('input[type="checkbox"]');
        if (await dontShowAgainCheckbox.isVisible({ timeout: 2000 })) {
          await dontShowAgainCheckbox.check();
        }
        // Choose the conservative "No" option
        const noButton = page
          .locator('input[value="No"]')
          .or(page.getByRole('button', { name: /No/i }));
        await noButton.click();
      }
      console.log('microsoftLogin: No Checking for "Stay signed in?" prompt...', performance.now());
    } catch (err) {
      // Non-fatal – the prompt is genuinely optional and MS love to A/B test its appearance
      console.warn('microsoftLogin: Stay-signed-in prompt not detected – continuing');
    }
  });

  // Test Step 4: (SC)
  await test.step('Verify access denied (SC)', async () => {
    // Wait for navigation after attempting login
    await page.waitForLoadState('networkidle', { timeout: 60000 });
    try {
      // Give the prompt a moment to appear – if it doesn't we simply fall through
      console.log('microsoftLogin: Checking for "Stay signed in?" prompt...', performance.now());
      const staySignedInText = page.getByText('Stay signed in?');
      if (await staySignedInText.isVisible({ timeout: 20_000 })) {
        // Select "Don't show this again" to speed up subsequent logins
        const dontShowAgainCheckbox = page.locator('input[type="checkbox"]');
        if (await dontShowAgainCheckbox.isVisible({ timeout: 2000 })) {
          await dontShowAgainCheckbox.check();
        }
        // Choose the conservative "No" option
        const noButton = page
          .locator('input[value="No"]')
          .or(page.getByRole('button', { name: /No/i }));
        await noButton.click();
      }
      console.log('microsoftLogin: No Checking for "Stay signed in?" prompt...', performance.now());
    } catch (err) {
      // Non-fatal – the prompt is genuinely optional and MS love to A/B test its appearance
      console.warn('microsoftLogin: Stay-signed-in prompt not detected – continuing');
    }

    // Take screenshot
    const timestamp = formatTimestamp(new Date());
    await page.screenshot({
      path: getScreenshotPath(`TS.1.1-05-4-${timestamp}.png`)
    });

    // Expected Result: User is directed to "Access denied" page
    // Check for various possible error indicators
    const currentUrl = page.url();
    console.log("Current URL: ", currentUrl);
    const hasError = currentUrl.includes('notinvited')

    expect(hasError).toBeTruthy();
  });
});