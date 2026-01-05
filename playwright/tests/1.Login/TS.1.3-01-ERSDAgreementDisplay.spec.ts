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

test('TS.1.3-01 ERSD Agreement Display', async ({ page }) => {
  // Test Procedure:
  // 1. Reset ERSD for Johanna
  // 2. Login as Johanna
  // 3. View ERSD text
  // 4. Verify in selected language
  // 5. Check checkbox required (SC)

  const baseUrl = process.env.BASE_URL;
  const email = process.env.MS_EMAIL_17NJ5D_JOHANNA_MURRAY!;
  const password = process.env.MS_PASSWORD!;

  // Note: ERSD reset is handled in test environment setup
  
  // Test Step 1: Login as Johanna
  await test.step('Login as Johanna', async () => {
    await page.goto(`${baseUrl}/login`);
    await expect(page).toHaveTitle(/Docufen/i);
    await page.getByTestId('loginPage.loginButton').click();
  });

  // Test Step 2: Complete authentication
  await test.step('Complete authentication', async () => {
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
    
    // Wait for redirect back to Docufen
    await page.waitForURL(`${baseUrl}/**`, { timeout: 60000 });
  });

  // Test Step 3: View ERSD text
  await test.step('View ERSD text', async () => {
    // Expected Result: ERSD agreement shows
    await expect(page.getByRole('heading', { name: /Electronic Records and Signature Disclosure|ERSD|Terms/i })).toBeVisible({ timeout: 10000 });
    
    // Verify ERSD content is displayed
    const ersdContent = page.locator('[data-testid="ersd-content"]').or(page.locator('.ersd-content')).or(page.getByText(/electronic records|signature|consent/i));
    await expect(ersdContent).toBeVisible();
  });

  // Test Step 4: Verify in selected language
  await test.step('Verify in selected language', async () => {
    // Expected Result: Correct language displayed
    // Check for language indicator or verify text is in expected language
    const languageSelector = page.getByRole('combobox', { name: /Language/i });
    if (await languageSelector.isVisible({ timeout: 3000 })) {
      const selectedLanguage = await languageSelector.inputValue();
      expect(['English', 'Inglés', 'Anglais']).toContain(selectedLanguage);
    }
    
    // Verify ERSD text contains expected English content
    await expect(page.getByText(/electronic records/i)).toBeVisible();
  });

  // Test Step 5: Check checkbox required (SC)
  await test.step('Check checkbox required (SC)', async () => {
    // Find the acceptance checkbox
    const acceptCheckbox = page.getByTestId('ersd-agreement-checkbox');
    await expect(acceptCheckbox).toBeVisible();
    
    // Verify checkbox is unchecked initially
    await expect(acceptCheckbox).not.toBeChecked();
    
    // Try to continue without checking
    const continueButton = page.getByTestId('ersd-agree-button');
    await expect(continueButton).toBeDisabled();
    
    // Check the checkbox
    await acceptCheckbox.check();
    
    // Take screenshot
    const timestamp = formatTimestamp(new Date());
    await page.screenshot({ 
      path: getScreenshotPath(`TS.1.3-01-5-${timestamp}.png`) 
    });
    
    // Expected Result: Must check to continue
    await expect(acceptCheckbox).toBeChecked();
    await expect(continueButton).toBeEnabled();
  });
});