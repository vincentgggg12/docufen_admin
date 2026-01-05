import { Page, expect } from '@playwright/test';
import dotenv from 'dotenv';
import { handleERSDDialog } from './ersd-handler';
import { getScreenshotPath } from './paths';

// Ensure the .playwright.env file is loaded so that any MS_PASSWORD fallbacks work
dotenv.config({ path: '.playwright.env' });
const baseUrl = process.env.BASE_URL || 'https://beta.docufen.com';
/**
 * Re-usable helper that performs the Microsoft single-sign-on flow.
 *
 * The function intentionally focuses only on the Microsoft hosted pages – it does **not**
 * contain any Docufen specific assertions so it can be re-used by a variety of tests
 * (setup wizard, invitation acceptance, etc.).
 *
 * Typical usage:
 * ```ts
 * await microsoftLogin(page, process.env.MS_EMAIL_17NJ5D_MEGAN_BOWEN!, process.env.MS_PASSWORD!);
 * ```
 */
export async function microsoftLogin(page: Page, email: string, password: string, noErsd_?: boolean): Promise<void> {
  // Basic argument guards – fail fast if a caller forgot to pass creds
  const noErsd = noErsd_ ? noErsd_ : false;
  const checkErsd = !noErsd
  if (!email || !password) {
    throw new Error('microsoftLogin: email or password was not provided');
  }
  await page.waitForLoadState('domcontentloaded');

  if (!page.url().endsWith('/login')) {
    await page.goto(`${baseUrl}/login`, { waitUntil: 'domcontentloaded' });
  }
  // All tests start from the Docufen landing page
  await expect(page).toHaveTitle(/Docufen/i);

  // Kick off the SSO flow using data-testid
  const msLoginButton = page.getByTestId('loginPage.loginButton');
  await expect(msLoginButton).toBeVisible({ timeout: 10_000 });
  await msLoginButton.click();
  await page.waitForTimeout(500); // Give it a moment to start the redirect
  await page.waitForLoadState("domcontentloaded")

  // The Playwright context is now on the Microsoft domain – continue there

  await page.waitForURL(/login\.microsoftonline\.com/);

  // === EMAIL ===
  const emailInput = page.getByRole('textbox', {
    name: /Email|Username|Sign in/i,
  });
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

  /********************
   * EARLY PERMISSIONS HANDLING – IMPORTANT *
   * -------------------------------------------------
   * Some accounts (e.g. newly-invited user managers like Grady) hit the
   * Microsoft "Permissions requested" screen **before** any redirect back
   * to Docufen can happen.  If we wait for the redirect first, we are stuck
   * forever because the Accept button has not been clicked yet.
   *
   * Therefore we attempt to detect & accept the permissions prompt **right
   * here**, straight after the credential flow – exactly where the prompt
   * actually appears.
   ********************/
  try {
    console.log('microsoftLogin: Checking for early Microsoft permissions dialog...');

    // This header text is unique to the permissions page
    await page.waitForLoadState('domcontentloaded', { timeout: 20_000 });
    const permissionsHeader = page.getByText('Permissions requested');
    if (await permissionsHeader.isVisible({ timeout: 2_000 }).catch(() => false)) {
      console.log('microsoftLogin: Permissions dialog detected – clicking Accept');
      await page.screenshot({ path: getScreenshotPath('permissions-dialog-early.png') });

      // The Accept element can be a <button> or an <input type="submit"> depending on MSFT markup/version.
      const acceptLocator = page
        .locator('input[type="submit"][value="Accept"], button:has-text("Accept")')
        .first();

      await acceptLocator.scrollIntoViewIfNeeded();
      await acceptLocator.click({ force: true, timeout: 15_000 });
      console.log('microsoftLogin: Accept button clicked');

      // Wait for the navigation away from the permissions page to start
      await page.waitForLoadState('domcontentloaded', { timeout: 30_000 });
    } else {
      console.log('microsoftLogin: No early permissions dialog – continuing');
    }
  } catch (err) {
    console.warn('microsoftLogin: Error while handling early permissions dialog:', (err as Error).message);
    // Non-fatal – we will attempt a fallback check later on
  }

  // Wait until we are redirected back to Docufen - try multiple patterns and handle invitation case
  console.log('Waiting for redirect after Microsoft login...');
  
  try {
    // First wait for any navigation to complete
    await page.waitForLoadState('domcontentloaded', { timeout: 20_000 });
    
    // Use a more flexible pattern to catch all possible landing pages
    // This includes dashboard, home, users, invitation pages, etc.
    await page.waitForURL(/account|\/documents|\/users|\/invite|\/setup|\/ERSD|\/notinvited/, { timeout: 60_001 });
    
    // Take a screenshot after redirect so we can see where we landed
    await page.screenshot({ path: getScreenshotPath('after-ms-login-redirect.png') });
    
    // Handle ERSD dialog if it appears
    try {
      console.log('microsoftLogin: Checking for ERSD dialog...', checkErsd);
      if (checkErsd) {
        console.log('microsoftLogin: ERSD dialog is enabled - handling it now');
        await handleERSDDialog(page);
      } else {
        return
      }
    } catch (ersdErr) {
      console.warn('microsoftLogin: Error while handling ERSD dialog:', (ersdErr as Error).message);
      // Non-fatal - we'll continue anyway
    }
    
    // Handle invitation acceptance if needed (for User Manager scenario)
    console.log('Checking for invitation acceptance prompt...');
    
    const acceptButton = page.getByRole('button', { name: /Accept Invitation|Accept/i });
    if (await acceptButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      console.log('Invitation acceptance prompt detected - clicking Accept...');
      await acceptButton.click();
      
      // Wait for the acceptance to process and redirect
      await page.waitForLoadState('domcontentloaded', { timeout: 30_000 });
      
      // Take another screenshot after accepting invitation
      await page.screenshot({ path: getScreenshotPath('after-invitation-acceptance.png') });
    } else {
      console.log('No invitation prompt detected - continuing with regular login flow');
    }
  } catch (err) {
    console.warn('Error during post-login redirect: ', err.message);
    console.warn('Continuing anyway - test will check specific elements');
    
    // Take a screenshot on error to debug
    await page.screenshot({ path: getScreenshotPath('login-redirect-error.png') });
  }

  // Step 4a: Handle Microsoft permissions dialog if it appears
  try {
    console.log('Checking for Microsoft permissions dialog...');
    
    // Look for the permissions dialog with a short timeout
    const permissionsText = page.getByText('Permissions requested');
    // Use a longer timeout (20 seconds) to ensure we don't miss it
    const permissionsVisible = await permissionsText.isVisible({ timeout: 20000 });
    
    if (permissionsVisible) {
      console.log('Microsoft permissions dialog detected');
      await page.screenshot({ path: getScreenshotPath('grady-permissions-check.png') });
      
      // Click the Accept button
      // Try to find the Accept button with multiple approaches
      const acceptButton = page.getByRole('button', { name: 'Accept' })
        .or(page.getByRole('button', { name: 'Yes' }))
        .or(page.getByText('Accept', { exact: true }));
      
      if (await acceptButton.isVisible({ timeout: 5000 })) {
        // Add a 2-second pause before clicking Accept
        await page.waitForTimeout(2000);
        await acceptButton.click({ force: true });
        console.log('Clicked Accept button on permissions dialog');
        await page.screenshot({ path: getScreenshotPath('after-permissions-accept.png') });
        // Wait a moment for the click to take effect
        await page.waitForTimeout(3000);
      }
    } else {
      console.log('No Microsoft permissions dialog detected, continuing with test');
    }
  } catch (error) {
    // Log the error but don't fail the test
    console.log('Error while checking for Microsoft permissions dialog:', error.message);
    console.log('Continuing with test regardless');
    await page.screenshot({ path: getScreenshotPath('permissions-dialog-error.png') });
  }
} 