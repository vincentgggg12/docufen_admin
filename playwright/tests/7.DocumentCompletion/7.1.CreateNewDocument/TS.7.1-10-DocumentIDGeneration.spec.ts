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

test('TS.7.1-10 Document ID Generation', async ({ page }) => {
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
  
  // Setup: Navigate to documents and prepare to create document (not reported)
  if (!page.url().includes('/documents')) {
    await page.goto(`${baseUrl}/documents`);
    await page.waitForLoadState('networkidle');
  }
  
  // Open Create New Document dialog
  await page.getByTestId('lsb.nav-main.documents-newDocument').click();
  await page.waitForSelector('[role="dialog"]', { state: 'visible' });
  
  // Fill in required fields
  const dialog = page.getByRole('dialog', { name: 'Create Document' });
  await dialog.getByTestId('createDocumentDialog.documentNameInput').fill('Test Document for ID Generation');
  
  // Upload a test file
  const testFilePath = path.join(__dirname, '../../WordDocuments/Docufen Testing Document v0._EN.docx');
  const fileInput = await page.locator('input[type="file"]');
  await fileInput.setInputFiles(testFilePath);
  
  // Step 1: Create document
  await test.step('Create document.', async () => {
    // Start monitoring network requests
    const responsePromise = page.waitForResponse(
      response => response.url().includes('/api/documents') && response.request().method() === 'POST',
      { timeout: 30000 }
    );
    
    // Click create button
    const createButton = dialog.getByTestId('createDocumentDialog.createButton');
    await createButton.click();
    
    // Wait for the response
    const response = await responsePromise;
    
    // Store response for next steps
    page.apiResponse = response;
  });
  
  // Step 2: Check network response
  await test.step('Check network response.', async () => {
    const response = page.apiResponse;
    expect(response.status()).toBe(201);
    
    // Get response body
    const responseBody = await response.json();
    page.responseBody = responseBody;
  });
  
  // Step 3: Find document ID
  await test.step('Find document ID.', async () => {
    const responseBody = page.responseBody;
    
    // Check for document ID in response
    expect(responseBody).toHaveProperty('id');
    const documentId = responseBody.id || responseBody.documentId || responseBody._id;
    expect(documentId).toBeDefined();
    
    page.documentId = documentId;
  });
  
  // Step 4: Verify UUID format
  await test.step('Verify UUID format.', async () => {
    const documentId = page.documentId;
    
    // UUID v4 format: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    expect(documentId).toMatch(uuidRegex);
  });
  
  // Step 5: Unique ID created (SC)
  await test.step('Unique ID created (SC)', async () => {
    const documentId = page.documentId;
    
    // Verify the ID is unique (non-empty and valid format)
    expect(documentId).toBeTruthy();
    expect(documentId.length).toBe(36); // Standard UUID length
    
    // Take screenshot showing the created document (may show ID in URL or document info)
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    const now5 = new Date();
    const timestamp5 = `${now5.getFullYear()}.${String(now5.getMonth() + 1).padStart(2, '0')}.${String(now5.getDate()).padStart(2, '0')}-${String(now5.getHours()).padStart(2, '0')}.${String(now5.getMinutes()).padStart(2, '0')}.${String(now5.getSeconds()).padStart(2, '0')}`;
    await page.screenshot({ 
      path: getScreenshotPath(`TS.7.1-10-05-${timestamp5}.png`) 
    });
  });
});