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

test('TS.1.2-03 Trial Expiration Check', async ({ page }) => {
  // Test Procedure:
  // 1. Set trial expiry to yesterday
  // 2. Login as Diego
  // 3. View expiration message
  // 4. Check upgrade options
  // 5. Verify feature block (SC)

  const baseUrl = process.env.BASE_URL;
  const email = process.env.MS_EMAIL_17NJ5D_DIEGO_SICILIANI!;
  const password = process.env.MS_PASSWORD!;

  // Note: Trial expiry is already set in test environment
  
  // Test Step 1: Login as Diego
  await test.step('Login as Diego', async () => {
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
    await page.waitForLoadState('networkidle', { timeout: 60000 });
    await page.waitForURL(`${baseUrl}/**`, { timeout: 1000 });
    const timestamp = formatTimestamp(new Date());
    await page.screenshot({ 
      path: getScreenshotPath(`TS.1.2-03-2-${timestamp}.png`) 
    });
  });

  // Test Step 3: View expiration message
  await test.step('View expiration message', async () => {
    // Expected Result: "Trial expired" shown
    await expect(page.getByText(/Trial expired|Your trial has expired|Trial period ended/i)).toBeVisible({ timeout: 10000 });
  });

  // Test Step 4: Check upgrade options
  await test.step('Check upgrade options', async () => {
    // Expected Result: Azure/Stripe options visible
    const azureOption = page.getByText(/Azure|Microsoft Azure|Azure Marketplace/i);
    const stripeOption = page.getByText(/Stripe|Credit Card|Payment/i);
    const upgradeButton = page.getByRole('button', { name: /Upgrade|Subscribe|Purchase/i });
    
    // At least one upgrade option should be visible
    await expect(azureOption.or(stripeOption).or(upgradeButton)).toBeVisible();
  });

  // Test Step 5: Verify feature block (SC)
  await test.step('Verify feature block (SC)', async () => {
    // Take screenshot
    const timestamp = formatTimestamp(new Date());
    await page.screenshot({ 
      path: getScreenshotPath(`TS.1.2-03-5-${timestamp}.png`) 
    });
    
    // Expected Result: Cannot access features
    // Try to navigate to documents
    await page.goto(`${baseUrl}/documents`);
    
    // Should either redirect back or show trial expired message
    const trialExpiredMessage = page.getByText(/Trial expired|Your trial has expired|Upgrade to continue/i);
    const documentsList = page.locator('[data-testid="documents-list"]');
    
    // Either trial message is shown OR documents are not accessible
    if (await trialExpiredMessage.isVisible({ timeout: 5000 })) {
      await expect(trialExpiredMessage).toBeVisible();
    } else {
      await expect(documentsList).not.toBeVisible();
    }
  });
});