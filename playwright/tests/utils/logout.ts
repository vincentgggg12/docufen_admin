import { Page } from '@playwright/test';
import { getScreenshotPath } from './paths';

/**
 * Re-usable helper to log out of Docufen.
 *
 * It clicks the user's profile button (by visible name), then selects "Log out",
 * and waits until the app returns to the landing page.
 *
 * @param page - The Playwright Page instance.
 * @param userName - The full name of the logged-in user as it appears on the UI.
 */
export async function logout(page: Page, userName: string): Promise<void> {
  // Open the profile dropdown by clicking the button matching the user's name
  const profileButton = page.getByTestId('lsb.user-profile.trigger');
  await profileButton.click({ force: true, timeout: 10000 });

  // Click the "Log out" option (try multiple ways to locate it)
  console.log('Locating Log out menu item...');
  
  // Take a screenshot to see what we're working with
  await page.screenshot({ path: getScreenshotPath('before-logout-click.png') });
  
  // Try multiple possible locators since UI frameworks render menus differently
  // First look by text content (most reliable across different menu implementations)
  const logoutByTestId = page.getByTestId('lsb.user-profile.logoutMenuItem');
  
  if (await logoutByTestId.isVisible({ timeout: 3000 }).catch(() => false)) {
    console.log('Found "Log out" by text - clicking...');
    await logoutByTestId.click({ force: true, timeout: 10000 });
  } else {
    // Try other approaches
    console.log('Text match failed, trying other selectors...');
    
    // Try common menu item roles with Log out text
    const menuItem = page.locator('[role="menuitem"]').filter({ hasText: /log out/i }).first().or(
      page.locator('li').filter({ hasText: /log out/i }).first()
    );
    
    if (await menuItem.isVisible({ timeout: 3000 }).catch(() => false)) {
      console.log('Found "Log out" as menu item - clicking...');
      await menuItem.click({ force: true, timeout: 10000 });
    } else {
      // Last resort - try to locate by common class names or deeper in the DOM
      console.log('Using more general selectors...');
      await page.locator('div, span, a, button', { hasText: /log out/i })
        .first()
        .click({ force: true, timeout: 10000 });
    }
  }

  // Wait for the login page to confirm logout
  await page.waitForURL('/login', { timeout: 15_000 });
} 