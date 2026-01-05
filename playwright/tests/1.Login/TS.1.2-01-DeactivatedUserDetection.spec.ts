import { test, expect } from '@playwright/test';
import * as dotenv from 'dotenv';
import { microsoftLogin } from '../utils/msLogin';
import { handleERSDDialog } from '../utils/ersd-handler';
import { getScreenshotPath } from '../utils/paths';

dotenv.config({ path: '.playwright.env' });

test.use({
  viewport: { height: 1080, width: 1920 },
  ignoreHTTPSErrors: true
});

test.setTimeout(180000); // 3 minutes - includes deactivation step

function formatTimestamp(date: Date): string {
  return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}-${String(date.getHours()).padStart(2, '0')}.${String(date.getMinutes()).padStart(2, '0')}.${String(date.getSeconds()).padStart(2, '0')}`;
}

test('TS.1.2-01 Deactivated User Detection', async ({ page }) => {
  // Test Procedure:
  // 1. Deactivate Lee's account
  // 2. Attempt login as Lee
  // 3. Complete MS authentication
  // 4. View restriction message
  // 5. Verify cannot access app (SC)

  const baseUrl = process.env.BASE_URL;
  const leeEmail = process.env.MS_EMAIL_17NJ5D_LEE_GU!;
  const gradyEmail = process.env.MS_EMAIL_17NJ5D_GRADY_ARCHIE!; // User Manager
  const password = process.env.MS_PASSWORD!;

  // Test Step 1: Deactivate Lee's account
  await test.step('Deactivate Lee\'s account', async () => {
    // Login as Grady (User Manager) to deactivate Lee
    await page.goto(`${baseUrl}/login`);
    await microsoftLogin(page, gradyEmail, password);
    await handleERSDDialog(page);
    
    // Navigate to Users page
    await page.waitForLoadState('domcontentloaded');
    const menuButton = page.getByTestId('lsb.user-profile.trigger');
    await menuButton.click();
    await page.getByTestId('lsb.nav-main.nav-users').click();
    
    // Wait for users list to load
    await page.waitForURL(/\/users/);
    
    // Find Lee Gu in the users list and click the edit button
    const leeRow = page.locator('tr', { hasText: 'Lee Gu' });
    await expect(leeRow).toBeVisible({ timeout: 10000 });
    
    // Click the edit user button for Lee's row
    const editButton = leeRow.getByTestId('usersTable.editUserButton');
    await editButton.click();
    
    // Wait for user info modal to appear
    await page.waitForTimeout(1000);
    
    // Find and click the deactivate switch using testId
    const deactivateSwitch = page.getByTestId('userInfoModal.activatedSwitch');
    await deactivateSwitch.click();
    
    // Click save changes button
    const saveButton = page.getByTestId('userInfoModal.saveChangesButton');
    await saveButton.click();
    
    // Expected Result: Account deactivated
    await expect(page.getByText(/User deactivated|Account disabled|Successfully deactivated|User updated/i)).toBeVisible({ timeout: 10000 });
    
    // Logout
    await page.getByTestId('lsb.user-profile.trigger').click();
    await page.getByRole('button', { name: /Logout|Sign out/i }).click();
  });

  // Test Step 2: Attempt login as Lee
  await test.step('Attempt login as Lee', async () => {
    await page.goto(`${baseUrl}/login`);
    await expect(page).toHaveTitle(/Docufen/i);
    
    // Expected Result: Login attempted
  });

  // Test Step 3: Complete MS authentication
  await test.step('Complete MS authentication', async () => {
    await page.getByTestId('loginPage.loginButton').click();
    
    // Wait for Microsoft login page
    await page.waitForURL(/login\.microsoftonline\.com/, { timeout: 30000 });
    
    // Enter email
    const emailInput = page.getByRole('textbox', {
      name: /Email|Username|Sign in/i,
    });
    await emailInput.fill(leeEmail);
    await page.getByRole('button', { name: /Next/i }).click();
    
    // Enter password
    const passwordInput = page.getByRole('textbox', { name: /Password/i }).or(
      page.getByPlaceholder('Password'),
    );
    await passwordInput.fill(password);
    await page.getByRole('button', { name: /Sign in/i }).click();
    
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
    
    // Expected Result: MS auth succeeds
  });

  // Test Step 4: View restriction message
  await test.step('View restriction message', async () => {
    // Wait for redirect back to Docufen
    await page.waitForURL(`${baseUrl}/**`, { timeout: 60000 });
    
    // Expected Result: "Access Restricted" message
    await expect(page.getByText(/Access Restricted|Account disabled|Your account has been deactivated/i)).toBeVisible({ timeout: 10000 });
  });

  // Test Step 5: Verify cannot access app (SC)
  await test.step('Verify cannot access app (SC)', async () => {
    // Take screenshot
    const timestamp = formatTimestamp(new Date());
    await page.screenshot({ 
      path: getScreenshotPath(`TS.1.2-01-5-${timestamp}.png`) 
    });
    
    // Expected Result: No access to features
    // Verify no menu/navigation is available
    const menuButton = page.getByTestId('lsb.user-profile.trigger');
    await expect(menuButton).not.toBeVisible();
    
    // Verify cannot navigate to protected routes
    await page.goto(`${baseUrl}/documents`);
    await expect(page).not.toHaveURL(/\/documents/);
    
    await page.goto(`${baseUrl}/users`);
    await expect(page).not.toHaveURL(/\/users/);
  });
});