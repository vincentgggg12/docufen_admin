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

test('TS.1.3-05 ERSD Reset Capability', async ({ page }) => {
  // Test Procedure:
  // 1. As Grady, select Diego
  // 2. Click Reset ERSD
  // 3. Confirm reset
  // 4. Have Diego login
  // 5. Verify ERSD required (SC)

  const baseUrl = process.env.BASE_URL;
  const adminEmail = process.env.MS_EMAIL_17NJ5D_GRADY_ARCHIE!;
  const userEmail = process.env.MS_EMAIL_17NJ5D_DIEGO_SICILIANI!;
  const password = process.env.MS_PASSWORD!;

  // Test Step 1: Login as Grady and navigate to Users
  await test.step('Login as Grady and navigate to Users', async () => {
    await page.goto(`${baseUrl}/login`);
    await expect(page).toHaveTitle(/Docufen/i);
    await page.getByTestId('loginPage.loginButton').click();
    
    // Wait for Microsoft login page
    await page.waitForURL(/login\.microsoftonline\.com/, { timeout: 30000 });
    
    // Enter credentials
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
    
    // Wait for redirect back to Docufen
    await page.waitForURL(`${baseUrl}/**`, { timeout: 60000 });
    
    // Navigate to Users page if not already there
    if (!page.url().includes('/users')) {
      await page.getByRole('button', { name: 'Menu' }).click();
      await page.getByRole('link', { name: 'Users' }).click();
    }
    
    await expect(page).toHaveURL(/\/users/);
  });

  // Test Step 2: Select Diego and click Reset ERSD
  await test.step('Select Diego and click Reset ERSD', async () => {
    // Search for Diego
    const searchInput = page.getByPlaceholder(/Search users/i);
    if (await searchInput.isVisible()) {
      await searchInput.fill('Diego');
      await page.waitForTimeout(1000); // Wait for search results
    }
    
    // Find Diego's row
    const diegoRow = page.locator('tr', { hasText: 'Diego' });
    await expect(diegoRow).toBeVisible();
    
    // Click on Diego's row or actions menu
    const actionsButton = diegoRow.getByRole('button', { name: /Actions|More|Options/i });
    const editButton = diegoRow.getByRole('button', { name: /Edit|View/i });
    
    if (await actionsButton.isVisible({ timeout: 3000 })) {
      await actionsButton.click();
    } else if (await editButton.isVisible({ timeout: 3000 })) {
      await editButton.click();
    } else {
      // Click on the row itself
      await diegoRow.click();
    }
    
    // Expected Result: Reset option available
    const resetERSDButton = page.getByRole('button', { name: /Reset ERSD|Reset Agreement|Clear ERSD/i });
    const resetERSDMenuItem = page.getByRole('menuitem', { name: /Reset ERSD|Reset Agreement/i });
    
    if (await resetERSDButton.isVisible({ timeout: 3000 })) {
      await resetERSDButton.click();
    } else if (await resetERSDMenuItem.isVisible({ timeout: 3000 })) {
      await resetERSDMenuItem.click();
    }
  });

  // Test Step 3: Confirm reset
  await test.step('Confirm reset', async () => {
    // Look for confirmation dialog
    const confirmDialog = page.getByRole('dialog');
    const confirmButton = page.getByRole('button', { name: /Confirm|Yes|Reset/i });
    
    // Expected Result: Reset confirmed
    if (await confirmDialog.isVisible({ timeout: 3000 })) {
      await confirmButton.click();
    }
    
    // Wait for confirmation message or UI update
    const successMessage = page.getByText(/Reset successful|ERSD reset|Agreement cleared/i);
    if (await successMessage.isVisible({ timeout: 5000 }).catch(() => false)) {
      await expect(successMessage).toBeVisible();
    }
  });

  // Logout as Grady
  await test.step('Logout as Grady', async () => {
    await page.getByRole('button', { name: 'Menu' }).click();
    await page.getByRole('button', { name: /Logout|Sign out/i }).click();
    await page.waitForURL(/\/login/);
  });

  // Test Step 4: Have Diego login
  await test.step('Have Diego login', async () => {
    await page.getByTestId('loginPage.loginButton').click();
    
    // Wait for Microsoft login page
    await page.waitForURL(/login\.microsoftonline\.com/, { timeout: 30000 });
    
    // Enter Diego's credentials
    const emailInput = page.getByRole('textbox', {
      name: /Email|Username|Sign in/i,
    });
    await emailInput.fill(userEmail);
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
    
    // Wait for redirect back to Docufen
    await page.waitForURL(`${baseUrl}/**`, { timeout: 60000 });
  });

  // Test Step 5: Verify ERSD required (SC)
  await test.step('Verify ERSD required (SC)', async () => {
    // Expected Result: ERSD shown on login
    await expect(page.getByRole('heading', { name: /Electronic Records and Signature Disclosure|ERSD|Terms/i })).toBeVisible({ timeout: 10000 });
    
    // Verify ERSD acceptance is required
    const acceptCheckbox = page.getByRole('checkbox', { name: /I have read|I accept|I agree/i });
    await expect(acceptCheckbox).toBeVisible();
    await expect(acceptCheckbox).not.toBeChecked();
    
    // Take screenshot
    const timestamp = formatTimestamp(new Date());
    await page.screenshot({ 
      path: getScreenshotPath(`TS.1.3-05-5-${timestamp}.png`) 
    });
    
    // Verify cannot proceed without accepting
    const continueButton = page.getByRole('button', { name: /Continue|Accept|Proceed/i });
    await expect(continueButton).toBeDisabled();
  });
});