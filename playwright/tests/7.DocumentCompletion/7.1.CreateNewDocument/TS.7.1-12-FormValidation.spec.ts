import { test, expect } from '@playwright/test';
import { getScreenshotPath } from '../../utils/paths';
import dotenv from 'dotenv';
import path from 'path';

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

test('TS.7.1-12 Form Validation', async ({ page }) => {
  test.setTimeout(120000);
  
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
  
  // Setup: Navigate to documents and open dialog (not reported)
  if (!page.url().includes('/documents')) {
    await page.goto(`${baseUrl}/documents`);
    await page.waitForLoadState('networkidle');
  }
  
  // Open Create New Document dialog
  await page.getByTestId('lsb.nav-main.documents-newDocument').click();
  await page.waitForSelector('[role="dialog"]', { state: 'visible' });
  const dialog = page.getByRole('dialog', { name: 'Create Document' });
  
  // Step 1: Fill only name
  await test.step('Fill only name.', async () => {
    // Clear any existing values
    const nameInput = dialog.getByTestId('createDocumentDialog.documentNameInput');
    await nameInput.clear();
    await nameInput.fill('Test Form Validation Document');
    
    // Ensure no file is uploaded yet
    const fileInput = await page.locator('input[type="file"]');
    await fileInput.evaluate(node => (node as HTMLInputElement).value = '');
  });
  
  // Step 2: Create disabled
  await test.step('Create disabled.', async () => {
    // Check that create button is disabled
    const createButton = dialog.getByTestId('createDocumentDialog.createButton');
    await expect(createButton).toBeDisabled();
    
    // Alternative check - button should have disabled attribute or class
    const isDisabled = await createButton.evaluate((button) => {
      return button.hasAttribute('disabled') || 
             button.classList.contains('disabled') ||
             button.getAttribute('aria-disabled') === 'true';
    });
    expect(isDisabled).toBeTruthy();
  });
  
  // Step 3: Add file upload
  await test.step('Add file upload.', async () => {
    // Upload a test file
    const testFilePath = path.join(__dirname, '../../WordDocuments/Docufen Testing Document v0._EN.docx');
    const fileInput = await page.locator('input[type="file"]');
    await fileInput.setInputFiles(testFilePath);
    
    // Wait for file to be processed
    await page.waitForTimeout(1000);
  });
  
  // Step 4: Create enables
  await test.step('Create enables.', async () => {
    // Check that create button is now enabled
    const createButton = dialog.getByTestId('createDocumentDialog.createButton');
    await expect(createButton).toBeEnabled();
    
    // Verify button is clickable
    const isEnabled = await createButton.evaluate((button) => {
      return !button.hasAttribute('disabled') && 
             !button.classList.contains('disabled') &&
             button.getAttribute('aria-disabled') !== 'true';
    });
    expect(isEnabled).toBeTruthy();
  });
  
  // Step 5: All required fields checked (SC)
  await test.step('All required fields checked (SC)', async () => {
    // Verify form validation is working correctly
    // Clear the name to test validation again
    const nameInput = dialog.getByTestId('createDocumentDialog.documentNameInput');
    await nameInput.clear();
    
    // Create button should be disabled again
    const createButton = dialog.getByTestId('createDocumentDialog.createButton');
    await expect(createButton).toBeDisabled();
    
    // Fill name back in
    await nameInput.fill('Test Form Validation Document');
    
    // Button should be enabled again
    await expect(createButton).toBeEnabled();
    
    // Take screenshot showing enabled create button with all required fields filled
    const now5 = new Date();
    const timestamp5 = `${now5.getFullYear()}.${String(now5.getMonth() + 1).padStart(2, '0')}.${String(now5.getDate()).padStart(2, '0')}-${String(now5.getHours()).padStart(2, '0')}.${String(now5.getMinutes()).padStart(2, '0')}.${String(now5.getSeconds()).padStart(2, '0')}`;
    await page.screenshot({ 
      path: getScreenshotPath(`TS.7.1-12-05-${timestamp5}.png`) 
    });
  });
});