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

test('TS.1.3-03 ERSD Rejection Handling', async ({ page }) => {
  // Test Procedure:
  // 1. Reset ERSD for Lee
  // 2. Login as Lee
  // 3. Try to click I Agree without checking the box
  // 4. Enter /documents url directly
  // 5. Check can reconsider (SC)

  const baseUrl = process.env.BASE_URL;
  const email = process.env.MS_EMAIL_17NJ5D_LEE_GU!;
  const password = process.env.MS_PASSWORD!;

  // Test Step 1: Reset ERSD for Lee
  await test.step('Reset ERSD for Lee', async () => {
    // Note: ERSD reset is typically handled in test environment setup
    // In production test, this would involve logging in as User Manager and resetting ERSD
    // Expected Result: ERSD reset
  });

  // Test Step 2: Login as Lee
  await test.step('Login as Lee', async () => {
    await page.goto(`${baseUrl}/login`);
    await microsoftLogin(page, email, password);
    
    // Wait for redirect back to Docufen
    await page.waitForURL(`${baseUrl}/**`, { timeout: 60000 });
    
    // Expected Result: Login shows ERSD
    await expect(page.getByRole('heading', { name: /Electronic Records and Signature Disclosure|ERSD/i })).toBeVisible({ timeout: 10000 });
  });

  // Test Step 3: Try to click I Agree without checking the box
  await test.step('Try to click I Agree without checking the box', async () => {
    // Find the checkbox
    const ersdCheckbox = page.getByRole('checkbox', { name: /I have read|I accept|I agree/i });
    await expect(ersdCheckbox).toBeVisible();
    
    // Verify checkbox is not checked
    await expect(ersdCheckbox).not.toBeChecked();
    
    // Find the I Agree button
    const agreeButton = page.getByRole('button', { name: /I Agree|Accept|Continue/i });
    await expect(agreeButton).toBeVisible();
    
    // Try to click I Agree without checking the box
    await agreeButton.click();
    
    // Expected Result: Button disabled (click should have no effect)
    // Verify we're still on ERSD page
    await expect(page.getByRole('heading', { name: /Electronic Records and Signature Disclosure|ERSD/i })).toBeVisible();
    
    // Alternative check: button might be visually disabled
    const isDisabled = await agreeButton.isDisabled();
    if (isDisabled) {
      expect(isDisabled).toBeTruthy();
    } else {
      // If not disabled attribute, verify we didn't navigate away
      await expect(page).toHaveURL(/\/ERSD|\/ersd/i);
    }
  });

  // Test Step 4: Enter /documents url directly
  await test.step('Enter /documents url directly', async () => {
    // Try to bypass ERSD by going directly to documents
    await page.goto(`${baseUrl}/documents`);
    
    // Expected Result: Redirected to ERSD
    await page.waitForURL(/\/ERSD|\/ersd/i, { timeout: 10000 });
    await expect(page.getByRole('heading', { name: /Electronic Records and Signature Disclosure|ERSD/i })).toBeVisible();
  });

  // Test Step 5: Check can reconsider (SC)
  await test.step('Check can reconsider (SC)', async () => {
    // Now check the checkbox
    const ersdCheckbox = page.getByRole('checkbox', { name: /I have read|I accept|I agree/i });
    await ersdCheckbox.check();
    
    // Verify checkbox is now checked
    await expect(ersdCheckbox).toBeChecked();
    
    // Find the I Agree button again
    const agreeButton = page.getByRole('button', { name: /I Agree|Accept|Continue/i });
    
    // Take screenshot before clicking
    const timestamp = formatTimestamp(new Date());
    await page.screenshot({ 
      path: getScreenshotPath(`TS.1.3-03-5-${timestamp}.png`) 
    });
    
    // Expected Result: Can click I Agree after checking box
    await expect(agreeButton).toBeEnabled();
    await agreeButton.click();
    
    // Verify successful navigation away from ERSD
    await page.waitForURL(url => {
      const urlString = typeof url === 'string' ? url : url.toString();
      return !urlString.includes('/ERSD') && !urlString.includes('/ersd');
    }, { timeout: 10000 });
    await expect(page).not.toHaveURL(/\/ERSD|\/ersd/i);
  });
});