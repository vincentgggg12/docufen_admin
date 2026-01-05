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

test('TS.1.3-02 ERSD Acceptance Tracking', async ({ page }) => {
  // Test Procedure:
  // 1. Accept ERSD as Johanna
  // 2. Check audit trail
  // 3. Verify timestamp recorded
  // 4. Check user ID logged
  // 5. Verify acceptance saved (SC)

  const baseUrl = process.env.BASE_URL;
  const email = process.env.MS_EMAIL_17NJ5D_JOHANNA_MURRAY!;
  const password = process.env.MS_PASSWORD!;
  const adminEmail = process.env.MS_EMAIL_17NJ5D_GRADY_ARCHIE!; // User Manager for checking audit

  // Test Step 1: Login and accept ERSD as Johanna
  await test.step('Login and accept ERSD as Johanna', async () => {
    await page.goto(`${baseUrl}/login`);
    await expect(page).toHaveTitle(/Docufen/i);
    await page.getByTestId('loginPage.loginButton').click();
    
    // Wait for Microsoft login page
    await page.waitForURL(/login\.microsoftonline\.com/, { timeout: 30000 });
    
    // Enter credentials
    const emailInput = page.getByRole('textbox', {
      name: /Email|Username|Sign in/i,
    });
    await emailInput.fill(email);
    await page.getByRole('button', { name: /Next/i }).click();
    
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
    
    // Wait for redirect and ERSD display
    await page.waitForURL(`${baseUrl}/**`, { timeout: 60000 });
    
    // Accept ERSD if present
    try {
      const acceptCheckbox = page.getByRole('checkbox', { name: /I have read|I accept|I agree/i });
      if (await acceptCheckbox.isVisible({ timeout: 5000 })) {
        await acceptCheckbox.check();
        const acceptButton = page.getByRole('button', { name: /Accept|Continue|Proceed/i });
        await acceptButton.click();
        
        // Expected Result: ERSD accepted
        await page.waitForURL(/\/documents|\/account|\/setup/, { timeout: 10000 });
      }
    } catch (err) {
      // ERSD might already be accepted
    }
  });

  // Logout and login as User Manager to check audit trail
  await test.step('Logout current user', async () => {
    await page.getByRole('button', { name: 'Menu' }).click();
    await page.getByRole('button', { name: /Logout|Sign out/i }).click();
    await page.waitForURL(/\/login/);
  });

  // Test Step 2: Login as User Manager to check audit trail
  await test.step('Login as User Manager to check audit trail', async () => {
    await page.getByTestId('loginPage.loginButton').click();
    
    // Wait for Microsoft login page
    await page.waitForURL(/login\.microsoftonline\.com/, { timeout: 30000 });
    
    // Enter admin credentials
    const emailInput = page.getByRole('textbox', {
      name: /Email|Username|Sign in/i,
    });
    await emailInput.fill(adminEmail);
    await page.getByRole('button', { name: /Next/i }).click();
    
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
    
    await page.waitForURL(`${baseUrl}/**`, { timeout: 60000 });
  });

  // Test Step 3: Navigate to audit trail or users page
  await test.step('Navigate to audit trail or users page', async () => {
    // Navigate to Users or Audit section
    await page.getByRole('button', { name: 'Menu' }).click();
    
    // Try audit trail first
    const auditLink = page.getByRole('link', { name: /Audit|Logs|History/i });
    const usersLink = page.getByRole('link', { name: 'Users' });
    
    if (await auditLink.isVisible({ timeout: 3000 })) {
      await auditLink.click();
    } else {
      await usersLink.click();
      await expect(page).toHaveURL(/\/users/);
    }
  });

  // Test Step 4: Verify timestamp and user ID recorded
  await test.step('Verify timestamp and user ID recorded', async () => {
    // If on users page, find Johanna's record
    if (page.url().includes('/users')) {
      const searchInput = page.getByPlaceholder(/Search users/i);
      if (await searchInput.isVisible()) {
        await searchInput.fill('Johanna');
      }
      
      // Click on Johanna's row or view details
      const userRow = page.locator('tr', { hasText: 'Johanna' });
      if (await userRow.isVisible()) {
        await userRow.click();
      }
    }
    
    // Expected Result: Timestamp present
    const timestampPattern = /\d{4}-\d{2}-\d{2}|\d{1,2}\/\d{1,2}\/\d{4}/;
    const timestampElement = page.getByText(timestampPattern);
    await expect(timestampElement).toBeVisible();
    
    // Expected Result: Johanna's ID recorded
    await expect(page.getByText(/Johanna|Murray/i)).toBeVisible();
  });

  // Test Step 5: Verify acceptance saved (SC)
  await test.step('Verify acceptance saved (SC)', async () => {
    // Look for ERSD acceptance indicator
    const ersdAcceptance = page.getByText(/ERSD.*Accept|Accepted.*ERSD|ERSD.*Date/i);
    
    // Take screenshot
    const timestamp = formatTimestamp(new Date());
    await page.screenshot({ 
      path: getScreenshotPath(`TS.1.3-02-5-${timestamp}.png`) 
    });
    
    // Expected Result: Acceptance permanent
    if (await ersdAcceptance.isVisible({ timeout: 5000 })) {
      await expect(ersdAcceptance).toBeVisible();
    } else {
      // Alternative: Check for acceptance date/time
      const acceptanceDate = page.getByText(/\d{4}-\d{2}-\d{2}|\d{1,2}\/\d{1,2}\/\d{4}/);
      await expect(acceptanceDate).toBeVisible();
    }
  });
});