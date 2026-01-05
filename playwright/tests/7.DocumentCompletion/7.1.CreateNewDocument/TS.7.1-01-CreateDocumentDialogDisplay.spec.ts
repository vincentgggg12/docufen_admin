import { test, expect } from '@playwright/test';
import { getScreenshotPath } from '../../utils/paths';
import dotenv from 'dotenv';

dotenv.config({ path: '.playwright.env' });
const baseUrl = process.env.BASE_URL || "https://beta.docufen.com"

test.use({
  viewport: {
    height: 1080,
    width: 1920
  },
  // Add HTTPS error handling - THIS IS CRITICAL!
  ignoreHTTPSErrors: true
});

test('TS.7.1-01 Create Document Dialog Display', async ({ page }) => {
    // Setup: Login to application (not reported)
    // Navigate to login page and wait for it to load
    await page.goto(`${baseUrl}/login`);
    await page.waitForLoadState('networkidle');
    
    // Setup: Microsoft authentication (not reported)
    // Click login button and wait for Microsoft login redirect
    await page.getByTestId('loginPage.loginButton').click();
    
    // Wait for either the email field or we might already be on password page
    await page.waitForSelector('input[type="email"], #i0118', { state: 'visible', timeout: 10000 });
    
    // Check if we need to enter email or if we're already on password page
    const emailField = page.getByRole('textbox', { name: 'Enter your email or phone' });
    if (await emailField.isVisible({ timeout: 1000 })) {
      await emailField.click();
      await emailField.fill('gradya@17nj5d.onmicrosoft.com');
      await page.getByRole('button', { name: 'Next' }).click();
    }
    
    // Wait for password field to appear
    await page.waitForSelector('#i0118', { state: 'visible', timeout: 10000 });
    await page.locator('#i0118').fill('NoMorePaper88');
    await page.getByRole('button', { name: 'Sign in' }).click();
    
    // Wait for either "Don't show this again" or redirect back to app
    try {
      // Wait for potential "Don't show this again" checkbox
      const dontShowCheckbox = page.getByRole('checkbox', { name: 'Don\'t show this again' });
      await dontShowCheckbox.waitFor({ state: 'visible', timeout: 5000 });
      await dontShowCheckbox.check();
      await page.getByRole('button', { name: 'No' }).click();
    } catch (e) {
      // Checkbox didn't appear, continue
      console.log('No "Don\'t show this again" checkbox appeared');
    }
    
    // CRITICAL: Wait for redirect back to application
    await page.waitForURL(`${baseUrl}/`, { timeout: 15000 });
    await page.waitForLoadState('networkidle');
    
    // Setup: Navigate to documents (not reported)
    // Navigate to documents page if not already there
    if (!page.url().includes('/documents')) {
      await page.goto(`${baseUrl}/documents`);
      await page.waitForLoadState('networkidle');
    }
    
    // Step 1: Navigate to Documents page (SC)
    await test.step('With a User Manager role, navigate to Documents page. (SC)', async () => {
      // Verify we are on the documents page
      await expect(page).toHaveURL(/.*\/documents/);
      
      // Wait for documents page to load completely
      await page.waitForLoadState('networkidle');
      
      // Take screenshot of documents page
      const now1 = new Date();
      const timestamp1 = `${now1.getFullYear()}.${String(now1.getMonth() + 1).padStart(2, '0')}.${String(now1.getDate()).padStart(2, '0')}-${String(now1.getHours()).padStart(2, '0')}.${String(now1.getMinutes()).padStart(2, '0')}.${String(now1.getSeconds()).padStart(2, '0')}`;
      await page.screenshot({ 
        path: getScreenshotPath(`TS.7.1-01-01-${timestamp1}.png`) 
      });
    });
    
    // Step 2: Click Create New Document button
    await test.step('Click "Create New Document" button.', async () => {
      // Verify the Create New Document button is visible
      await expect(page.getByTestId('lsb.nav-main.documents-newDocument')).toBeVisible();
      
      // Click the Create New Document button
      await page.getByTestId('lsb.nav-main.documents-newDocument').click();
    });
    
    // Step 3: Verify dialog appears (SC)
    await test.step('Verify dialog appears. (SC)', async () => {
      // Wait for dialog to appear
      await page.waitForSelector('[role="dialog"]', { state: 'visible' });
      const dialog = page.getByRole('dialog', { name: 'Create Document' });
      await expect(dialog).toBeVisible();
      
      // Verify dialog contains expected elements
      await expect(dialog.getByTestId('createDocumentDialog.documentNameInput')).toBeVisible();
      await expect(dialog.getByTestId('createDocumentDialog.externalReferenceInput')).toBeVisible();
      // Check if category dropdown exists (it might not be in all configurations)
      const categoryDropdown = dialog.getByTestId('createDocumentDialog.categoryDropdown');
      const hasCategoryDropdown = await categoryDropdown.count() > 0;
      if (hasCategoryDropdown) {
        await expect(categoryDropdown).toBeVisible();
      }
      await expect(dialog.getByTestId('createDocumentDialog.uploadDocumentButton')).toBeVisible();
      
      // Wait for dialog animation to complete
      await page.waitForTimeout(500);
      
      // Take screenshot of open dialog
      const now3 = new Date();
      const timestamp3 = `${now3.getFullYear()}.${String(now3.getMonth() + 1).padStart(2, '0')}.${String(now3.getDate()).padStart(2, '0')}-${String(now3.getHours()).padStart(2, '0')}.${String(now3.getMinutes()).padStart(2, '0')}.${String(now3.getSeconds()).padStart(2, '0')}`;
      await page.screenshot({ 
        path: getScreenshotPath(`TS.7.1-01-03-${timestamp3}.png`) 
      });
    });
});