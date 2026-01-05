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

test('TS.7.1-13 Create Document Submit', async ({ page }) => {
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
  
  // Setup: Navigate to documents (not reported)
  if (!page.url().includes('/documents')) {
    await page.goto(`${baseUrl}/documents`);
    await page.waitForLoadState('networkidle');
  }
  
  // Open Create New Document dialog
  await page.getByTestId('lsb.nav-main.documents-newDocument').click();
  await page.waitForSelector('[role="dialog"]', { state: 'visible' });
  const dialog = page.getByRole('dialog', { name: 'Create Document' });
  
  // Step 1: Fill all fields
  await test.step('Fill all fields.', async () => {
    // Fill document name
    const nameInput = dialog.getByTestId('createDocumentDialog.documentNameInput');
    await nameInput.fill('Test Submit Document');
    
    // Fill external reference (optional)
    const referenceInput = dialog.getByTestId('createDocumentDialog.externalReferenceInput');
    await referenceInput.fill('EXT-2024-TEST-001');
    
    // Select category if available
    const categoryDropdown = dialog.getByTestId('createDocumentDialog.categoryDropdown');
    if (await categoryDropdown.count() > 0) {
      await categoryDropdown.click();
      await page.getByRole('option', { name: 'validation' }).click();
    }
    
    // Upload file
    const testFilePath = path.join(__dirname, '../../WordDocuments/Docufen Testing Document v0._EN.docx');
    const fileInput = await page.locator('input[type="file"]');
    await fileInput.setInputFiles(testFilePath);
    
    // Wait for file processing
    await page.waitForTimeout(1000);
  });
  
  // Step 2: Click Create
  await test.step('Click Create.', async () => {
    const createButton = dialog.getByTestId('createDocumentDialog.createButton');
    await expect(createButton).toBeEnabled();
    
    // We'll click in step 3 to monitor network
  });
  
  // Step 3: Monitor network
  await test.step('Monitor network.', async () => {
    // Set up network monitoring
    const responsePromise = page.waitForResponse(
      response => response.url().includes('/api/documents') && response.request().method() === 'POST',
      { timeout: 30000 }
    );
    
    // Click create button
    const createButton = dialog.getByTestId('createDocumentDialog.createButton');
    await createButton.click();
    
    // Store the response promise for next step
    page.responsePromise = responsePromise;
  });
  
  // Step 4: See POST request
  await test.step('See POST request.', async () => {
    // Wait for and verify the POST request
    const response = await page.responsePromise;
    
    // Verify it's a POST request
    expect(response.request().method()).toBe('POST');
    
    // Verify the URL contains documents endpoint
    expect(response.url()).toContain('/api/documents');
    
    // Store response for next step
    page.apiResponse = response;
  });
  
  // Step 5: Success response (SC)
  await test.step('Success response (SC)', async () => {
    const response = page.apiResponse;
    
    // Verify 201 Created status
    expect(response.status()).toBe(201);
    
    // Verify response contains created document data
    const responseBody = await response.json();
    expect(responseBody).toHaveProperty('id');
    expect(responseBody).toHaveProperty('name', 'Test Submit Document');
    
    // Take screenshot of success state (may show redirect or success message)
    await page.waitForTimeout(2000);
    
    const now5 = new Date();
    const timestamp5 = `${now5.getFullYear()}.${String(now5.getMonth() + 1).padStart(2, '0')}.${String(now5.getDate()).padStart(2, '0')}-${String(now5.getHours()).padStart(2, '0')}.${String(now5.getMinutes()).padStart(2, '0')}.${String(now5.getSeconds()).padStart(2, '0')}`;
    await page.screenshot({ 
      path: getScreenshotPath(`TS.7.1-13-05-${timestamp5}.png`) 
    });
  });
});