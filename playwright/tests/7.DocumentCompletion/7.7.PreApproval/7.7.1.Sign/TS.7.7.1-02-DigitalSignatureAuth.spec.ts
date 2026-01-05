import { test, expect } from '@playwright/test';
import * as dotenv from 'dotenv';
import { microsoftLogin, handleERSDDialog } from '../../../src/utils/microsoftLogin';
import { getScreenshotPath, formatTimestamp } from '../../../src/utils/screenshotUtils';

dotenv.config({ path: '.playwright.env' });

test.use({
  viewport: { height: 1080, width: 1920 },
  ignoreHTTPSErrors: true
});

test.setTimeout(120000); // 2 minutes

test('TS.7.7.1-02 Digital Signature Auth', async ({ page }) => {
  // Login as a Pre-Approval participant
  const email = process.env.MS_EMAIL_ORG_USERNAME!;
  const password = process.env.MS_PASSWORD!;
  await microsoftLogin(page, email, password);
  await handleERSDDialog(page);

  // Navigate to a document in Pre-Approval stage
  await page.getByRole('button', { name: 'Menu' }).click();
  await page.getByRole('link', { name: 'Documents' }).click();
  await page.waitForLoadState('networkidle');
  
  // Open a document in Pre-Approval stage
  await page.getByText('Pre-Approval').first().click();

  // Test Steps
  await test.step('1. Click sign', async () => {
    await page.getByRole('button', { name: 'Sign' }).click();
  });

  await test.step('2. MS auth popup', async () => {
    // Wait for Microsoft authentication popup
    const popup = await page.waitForEvent('popup');
    await expect(popup).toHaveURL(/login\.microsoftonline\.com/);
  });

  await test.step('3. Authenticate', async () => {
    // Handle Microsoft authentication in popup
    const popup = await page.waitForEvent('popup');
    
    // Enter credentials if needed (usually already authenticated)
    if (await popup.getByLabel('Email, phone, or Skype').isVisible()) {
      await popup.getByLabel('Email, phone, or Skype').fill(email);
      await popup.getByRole('button', { name: 'Next' }).click();
      await popup.getByLabel('Password').fill(password);
      await popup.getByRole('button', { name: 'Sign in' }).click();
    }
    
    // Handle "Stay signed in?" prompt if it appears
    if (await popup.getByText('Stay signed in?').isVisible()) {
      await popup.getByRole('button', { name: 'Yes' }).click();
    }
    
    // Wait for popup to close
    await popup.waitForEvent('close');
  });

  await test.step('4. Signature placed', async () => {
    // Verify signature dialog appears
    await expect(page.getByText('Digital Signature')).toBeVisible();
    
    // Select role and confirm
    await page.getByRole('combobox', { name: 'Role' }).selectOption('Reviewed By');
    await page.getByRole('button', { name: 'Sign' }).click();
    
    // Verify signature is placed
    await expect(page.getByText(/.*\(.*\).*Reviewed By.*/)).toBeVisible();
  });

  await test.step('5. Verified identity (SC)', async () => {
    // Verify identity is shown in signature
    const signature = page.locator('text=/.*\\(.*\\).*Reviewed By.*/').first();
    await expect(signature).toBeVisible();
    
    // Take screenshot
    const timestamp = formatTimestamp(new Date());
    await page.screenshot({ 
      path: getScreenshotPath(`TS.7.7.1-02-5-${timestamp}.png`) 
    });
  });

  // Expected Results:
  // 1. Sign clicked ✓
  // 2. Auth required ✓
  // 3. MS login done ✓
  // 4. Signature added ✓
  // 5. Identity confirmed ✓
});