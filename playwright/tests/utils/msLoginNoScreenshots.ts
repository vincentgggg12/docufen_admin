import { Page, expect } from '@playwright/test';

/**
 * Simplified version of microsoftLogin without screenshots
 * Used for tests that need to control their own screenshot timing
 */
export async function microsoftLoginNoScreenshots(page: Page, email: string, password: string): Promise<void> {
  // Basic argument guards
  if (!email || !password) {
    throw new Error('microsoftLogin: email or password was not provided');
  }

  // All tests start from the Docufen landing page
  await page.goto('/', { waitUntil: 'networkidle' });
  await expect(page).toHaveTitle(/Docufen/i);

  // Kick off the SSO flow using data-testid
  const msLoginButton = page.getByTestId('loginPage.loginButton');
  await expect(msLoginButton).toBeVisible({ timeout: 10_000 });
  await msLoginButton.click();

  // The Playwright context is now on the Microsoft domain
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

  // === Optional "Stay signed in?" prompt ===
  try {
    await page.waitForTimeout(2_000);
    const staySignedInText = page.getByText('Stay signed in?');
    if (await staySignedInText.isVisible({ timeout: 3_000 })) {
      const dontShowAgainCheckbox = page.locator('input[type="checkbox"]');
      if (await dontShowAgainCheckbox.isVisible()) {
        await dontShowAgainCheckbox.check();
      }
      const noButton = page
        .locator('input[value="No"]')
        .or(page.getByRole('button', { name: /No/i }));
      await noButton.click();
    }
  } catch (err) {
    console.warn('microsoftLogin: Stay-signed-in prompt not detected – continuing');
  }

  // Handle early permissions
  try {
    console.log('microsoftLogin: Checking for early Microsoft permissions dialog...');
    const permissionsHeader = page.getByText('Permissions requested');
    if (await permissionsHeader.isVisible({ timeout: 10_000 }).catch(() => false)) {
      console.log('microsoftLogin: Permissions dialog detected – clicking Accept');
      const acceptLocator = page
        .locator('input[type="submit"][value="Accept"], button:has-text("Accept")')
        .first();
      await acceptLocator.scrollIntoViewIfNeeded();
      await page.waitForTimeout(500);
      await acceptLocator.click({ force: true, timeout: 15_000 });
      console.log('microsoftLogin: Accept button clicked');
      await page.waitForLoadState('networkidle', { timeout: 30_000 });
    } else {
      console.log('microsoftLogin: No early permissions dialog – continuing');
    }
  } catch (err) {
    console.warn('microsoftLogin: Error while handling early permissions dialog:', (err as Error).message);
  }

  // Wait for redirect back to Docufen
  console.log('Waiting for redirect after Microsoft login...');
  
  try {
    await page.waitForLoadState('networkidle', { timeout: 20_000 });
    await page.waitForURL(/account|\/documents|\/users|\/invite|\/setup|\/ERSD|\/notinvited/, { timeout: 60_001 });
    
    // Handle invitation acceptance if needed
    console.log('Checking for invitation acceptance prompt...');
    const acceptButton = page.getByRole('button', { name: /Accept Invitation|Accept/i });
    if (await acceptButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      console.log('Invitation acceptance prompt detected - clicking Accept...');
      await acceptButton.click();
      await page.waitForLoadState('networkidle', { timeout: 30_000 });
    } else {
      console.log('No invitation prompt detected - continuing with regular login flow');
    }
  } catch (err) {
    console.warn('Error during post-login redirect: ', err.message);
    console.warn('Continuing anyway - test will check specific elements');
  }

  // Handle Microsoft permissions dialog if it appears
  try {
    console.log('Checking for Microsoft permissions dialog...');
    const permissionsText = page.getByText('Permissions requested');
    const permissionsVisible = await permissionsText.isVisible({ timeout: 20000 });
    
    if (permissionsVisible) {
      console.log('Microsoft permissions dialog detected');
      const acceptButton = page.getByRole('button', { name: 'Accept' })
        .or(page.getByRole('button', { name: 'Yes' }))
        .or(page.getByText('Accept', { exact: true }));
      
      if (await acceptButton.isVisible({ timeout: 5000 })) {
        await page.waitForTimeout(2000);
        await acceptButton.click({ force: true });
        console.log('Clicked Accept button on permissions dialog');
        await page.waitForTimeout(3000);
      }
    } else {
      console.log('No Microsoft permissions dialog detected, continuing with test');
    }
  } catch (error) {
    console.log('Error while checking for Microsoft permissions dialog:', error.message);
    console.log('Continuing with test regardless');
  }
}