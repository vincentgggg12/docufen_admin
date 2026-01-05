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

test('TS.7.1-14 Error Handling', async ({ page, context }) => {
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
  
  // Setup: Navigate to documents and prepare form (not reported)
  if (!page.url().includes('/documents')) {
    await page.goto(`${baseUrl}/documents`);
    await page.waitForLoadState('networkidle');
  }
  
  // Open Create New Document dialog
  await page.getByTestId('lsb.nav-main.documents-newDocument').click();
  await page.waitForSelector('[role="dialog"]', { state: 'visible' });
  const dialog = page.getByRole('dialog', { name: 'Create Document' });
  
  // Fill in the form
  await dialog.getByTestId('createDocumentDialog.documentNameInput').fill('Test Error Handling');
  const testFilePath = path.join(__dirname, '../../WordDocuments/Docufen Testing Document v0._EN.docx');
  const fileInput = await page.locator('input[type="file"]');
  await fileInput.setInputFiles(testFilePath);
  await page.waitForTimeout(1000);
  
  // Step 1: Disconnect network
  await test.step('Disconnect network.', async () => {
    // Simulate network disconnection by setting offline mode
    await context.setOffline(true);
  });
  
  // Step 2: Try to create
  await test.step('Try to create.', async () => {
    // Click create button
    const createButton = dialog.getByTestId('createDocumentDialog.createButton');
    await createButton.click();
    
    // Wait a moment for error to appear
    await page.waitForTimeout(2000);
  });
  
  // Step 3: See error message (SC)
  await test.step('See error message. (SC)', async () => {
    // Look for error message in various possible locations
    const errorSelectors = [
      'text=/network error/i',
      'text=/connection error/i',
      'text=/failed to create/i',
      'text=/unable to connect/i',
      'text=/offline/i',
      '[role="alert"]',
      '.error-message',
      '[data-testid*="error"]'
    ];
    
    let errorFound = false;
    for (const selector of errorSelectors) {
      const element = await page.locator(selector).first();
      if (await element.isVisible({ timeout: 2000 })) {
        errorFound = true;
        break;
      }
    }
    
    expect(errorFound).toBeTruthy();
    
    // Take screenshot of error state
    const now3 = new Date();
    const timestamp3 = `${now3.getFullYear()}.${String(now3.getMonth() + 1).padStart(2, '0')}.${String(now3.getDate()).padStart(2, '0')}-${String(now3.getHours()).padStart(2, '0')}.${String(now3.getMinutes()).padStart(2, '0')}.${String(now3.getSeconds()).padStart(2, '0')}`;
    await page.screenshot({ 
      path: getScreenshotPath(`TS.7.1-14-03-${timestamp3}.png`) 
    });
  });
  
  // Step 4: Reconnect
  await test.step('Reconnect.', async () => {
    // Re-enable network
    await context.setOffline(false);
    
    // Wait for connection to be restored
    await page.waitForTimeout(2000);
  });
  
  // Step 5: Retry succeeds (SC)
  await test.step('Retry succeeds (SC)', async () => {
    // Try to create document again
    const createButton = dialog.getByTestId('createDocumentDialog.createButton');
    
    // If dialog closed due to error, reopen it
    if (!await dialog.isVisible()) {
      await page.getByTestId('lsb.nav-main.documents-newDocument').click();
      await page.waitForSelector('[role="dialog"]', { state: 'visible' });
      
      // Re-fill the form
      await dialog.getByTestId('createDocumentDialog.documentNameInput').fill('Test Error Handling Retry');
      await fileInput.setInputFiles(testFilePath);
      await page.waitForTimeout(1000);
    }
    
    // Monitor for success response
    const responsePromise = page.waitForResponse(
      response => response.url().includes('/api/documents') && 
                 response.request().method() === 'POST' &&
                 response.status() === 201,
      { timeout: 30000 }
    );
    
    // Click create
    await createButton.click();
    
    // Wait for success
    const response = await responsePromise;
    expect(response.status()).toBe(201);
    
    // Take screenshot of success state
    await page.waitForTimeout(2000);
    const now5 = new Date();
    const timestamp5 = `${now5.getFullYear()}.${String(now5.getMonth() + 1).padStart(2, '0')}.${String(now5.getDate()).padStart(2, '0')}-${String(now5.getHours()).padStart(2, '0')}.${String(now5.getMinutes()).padStart(2, '0')}.${String(now5.getSeconds()).padStart(2, '0')}`;
    await page.screenshot({ 
      path: getScreenshotPath(`TS.7.1-14-05-${timestamp5}.png`) 
    });
  });
});