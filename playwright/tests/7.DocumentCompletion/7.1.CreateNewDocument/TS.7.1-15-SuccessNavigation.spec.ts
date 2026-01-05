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

test('TS.7.1-15 Success Navigation', async ({ page }) => {
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
  
  // Setup: Navigate to documents and prepare to create (not reported)
  if (!page.url().includes('/documents')) {
    await page.goto(`${baseUrl}/documents`);
    await page.waitForLoadState('networkidle');
  }
  
  // Open Create New Document dialog
  await page.getByTestId('lsb.nav-main.documents-newDocument').click();
  await page.waitForSelector('[role="dialog"]', { state: 'visible' });
  const dialog = page.getByRole('dialog', { name: 'Create Document' });
  
  // Fill form
  await dialog.getByTestId('createDocumentDialog.documentNameInput').fill('Test Navigation Success');
  await dialog.getByTestId('createDocumentDialog.externalReferenceInput').fill('NAV-2024-001');
  
  const testFilePath = path.join(__dirname, '../../WordDocuments/Docufen Testing Document v0._EN.docx');
  const fileInput = await page.locator('input[type="file"]');
  await fileInput.setInputFiles(testFilePath);
  await page.waitForTimeout(1000);
  
  // Step 1: Create document successfully
  await test.step('Create document successfully.', async () => {
    // Monitor for successful creation
    const responsePromise = page.waitForResponse(
      response => response.url().includes('/api/documents') && 
                 response.request().method() === 'POST' &&
                 response.status() === 201,
      { timeout: 30000 }
    );
    
    // Click create button
    const createButton = dialog.getByTestId('createDocumentDialog.createButton');
    await createButton.click();
    
    // Wait for successful response
    const response = await responsePromise;
    expect(response.status()).toBe(201);
    
    // Store document ID for verification
    const responseBody = await response.json();
    page.documentId = responseBody.id;
  });
  
  // Step 2: Wait for redirect
  await test.step('Wait for redirect.', async () => {
    // Wait for navigation away from documents page
    await page.waitForURL(
      url => url.includes('/editor') || url.includes('/document/') || !url.includes('/documents'),
      { timeout: 15000 }
    );
  });
  
  // Step 3: Land on editor
  await test.step('Land on editor.', async () => {
    // Verify we're on the editor page
    const currentUrl = page.url();
    expect(currentUrl).toMatch(/\/(editor|document)/);
    
    // Wait for editor to load
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
  });
  
  // Step 4: Document loaded
  await test.step('Document loaded.', async () => {
    // Look for document content or editor interface
    const editorSelectors = [
      '[data-testid*="editor"]',
      '.document-editor',
      '.syncfusion-editor',
      '#editor-container',
      '.document-content',
      '[role="textbox"]'
    ];
    
    let editorFound = false;
    for (const selector of editorSelectors) {
      const element = await page.locator(selector).first();
      if (await element.isVisible({ timeout: 3000 })) {
        editorFound = true;
        break;
      }
    }
    
    expect(editorFound).toBeTruthy();
    
    // Verify document title if visible
    const titleSelectors = [
      'text=/Test Navigation Success/i',
      '[data-testid*="document-title"]',
      '.document-name'
    ];
    
    for (const selector of titleSelectors) {
      const element = await page.locator(selector).first();
      if (await element.isVisible({ timeout: 2000 })) {
        break;
      }
    }
  });
  
  // Step 5: Ready to edit (SC)
  await test.step('Ready to edit (SC)', async () => {
    // Verify editor is interactive (not read-only)
    const editableSelectors = [
      '[contenteditable="true"]',
      'input:not([readonly]):not([disabled])',
      'textarea:not([readonly]):not([disabled])',
      '.editor-content:not(.readonly)'
    ];
    
    let isEditable = false;
    for (const selector of editableSelectors) {
      const elements = await page.locator(selector).count();
      if (elements > 0) {
        isEditable = true;
        break;
      }
    }
    
    // Also check for edit mode indicators
    const editModeSelectors = [
      'text=/edit mode/i',
      '[data-testid*="edit"]',
      '.edit-mode'
    ];
    
    for (const selector of editModeSelectors) {
      const element = await page.locator(selector).first();
      if (await element.isVisible({ timeout: 1000 })) {
        isEditable = true;
        break;
      }
    }
    
    expect(isEditable).toBeTruthy();
    
    // Take screenshot of editor ready state
    const now5 = new Date();
    const timestamp5 = `${now5.getFullYear()}.${String(now5.getMonth() + 1).padStart(2, '0')}.${String(now5.getDate()).padStart(2, '0')}-${String(now5.getHours()).padStart(2, '0')}.${String(now5.getMinutes()).padStart(2, '0')}.${String(now5.getSeconds()).padStart(2, '0')}`;
    await page.screenshot({ 
      path: getScreenshotPath(`TS.7.1-15-05-${timestamp5}.png`) 
    });
  });
});