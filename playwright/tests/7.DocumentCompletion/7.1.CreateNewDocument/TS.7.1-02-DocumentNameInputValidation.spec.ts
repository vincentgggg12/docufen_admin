import { test, expect } from '@playwright/test';
import { getScreenshotPath } from '../../utils/paths';
import { microsoftLoginNoScreenshots } from '../../utils/msLoginNoScreenshots';
import { handleERSDDialogNoScreenshots } from '../../utils/ersd-handlerNoScreenshots';
import path from 'path';
import dotenv from 'dotenv';

// Load environment variables from .playwright.env
dotenv.config({ path: '.playwright.env' });
const baseUrl = process.env.BASE_URL || "https://beta.docufen.com"

test.use({
  viewport: {
    height: 1080,
    width: 1920
  },
  ignoreHTTPSErrors: true
});

test.setTimeout(120000); // 2 minutes

function formatTimestamp(date: Date): string {
  return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}-${String(date.getHours()).padStart(2, '0')}.${String(date.getMinutes()).padStart(2, '0')}.${String(date.getSeconds()).padStart(2, '0')}`;
}

test('TS.7.1-02 Document Name Input Validation', async ({ page }) => {
    // Setup: Login to application using the no-screenshot version
    const email = process.env.MS_EMAIL_17NJ5D_GRADY_ARCHIE!;
    const password = process.env.MS_PASSWORD!;
    
    // Use the no-screenshot version of microsoftLogin
    await microsoftLoginNoScreenshots(page, email, password);
    
    // Handle ERSD dialog if it appears (no screenshots)
    await handleERSDDialogNoScreenshots(page);
    
    // Wait for app to be ready
    await page.waitForLoadState('networkidle');
    
    // Navigate to Documents page if not already there
    const currentUrl = page.url();
    if (!currentUrl.includes('/documents')) {
      await page.goto(`${baseUrl}/documents`);
      await page.waitForLoadState('networkidle');
    }

    // Test Step 1: Open Create Document dialog
    await test.step('Open create document dialog', async () => {
      // Click Create New Document button
      await page.getByTestId('lsb.nav-main.documents-newDocument').click();
      
      // Wait for dialog to appear
      await page.waitForSelector('[role="dialog"]', { state: 'visible' });
      const dialog = page.getByRole('dialog', { name: 'Create Document' });
      await expect(dialog).toBeVisible();
    });

    // Test Step 2: Leave document name field empty
    await test.step('Leave document name field empty', async () => {
      const dialog = page.getByRole('dialog', { name: 'Create Document' });
      const documentNameInput = dialog.getByTestId('createDocumentDialog.documentNameInput');
      
      // Verify document name field is empty
      await expect(documentNameInput).toBeVisible();
      await expect(documentNameInput).toHaveValue('');
    });

    // Test Step 3: Upload a .docx file
    await test.step('Upload a .docx file', async () => {
      const dialog = page.getByRole('dialog', { name: 'Create Document' });
      
      // Click upload button
      await dialog.getByTestId('createDocumentDialog.uploadDocumentButton').click();
      
      // Use test document from WordDocuments folder
      const filePath = path.join(process.cwd(), 'playwright/tests/WordDocuments/Docufen Testing Document v0._EN.docx');
      
      // Set the file directly on the input element
      await page.setInputFiles('input[type="file"]', filePath);
      
      // Wait for file to be processed
      await page.waitForTimeout(3000);
      
      // Verify file was uploaded (look for filename in dialog)
      const uploadedFile = dialog.getByText('Docufen Testing Document v0._EN.docx');
      await expect(uploadedFile).toBeVisible({ timeout: 5000 });
    });

    // Test Step 4: Verify 'Create Document button' is disabled (SC)
    await test.step('Verify Create Document button is disabled', async () => {
      const dialog = page.getByRole('dialog', { name: 'Create Document' });
      const createButton = dialog.getByTestId('createDocumentDialog.createDocumentButton');
      
      // Verify button is disabled (file uploaded but name is empty)
      await expect(createButton).toBeDisabled();
      
      // Take screenshot
      const timestamp = formatTimestamp(new Date());
      await page.screenshot({ 
        path: getScreenshotPath(`TS.7.1-02-04-${timestamp}.png`) 
      });
    });

    // Test Step 5: Enter valid document name
    await test.step('Enter valid document name', async () => {
      const dialog = page.getByRole('dialog', { name: 'Create Document' });
      const documentNameInput = dialog.getByTestId('createDocumentDialog.documentNameInput');
      
      // Click and fill document name
      await documentNameInput.click();
      await documentNameInput.fill('Test Document');
      
      // Verify text was entered
      await expect(documentNameInput).toHaveValue('Test Document');
    });

    // Test Step 6: Verify 'Create Document' button is enabled (SC)
    await test.step('Verify Create Document button is enabled', async () => {
      const dialog = page.getByRole('dialog', { name: 'Create Document' });
      const createButton = dialog.getByTestId('createDocumentDialog.createDocumentButton');
      
      // Verify button is now enabled (both file and name are provided)
      await expect(createButton).toBeEnabled();
      
      // Take screenshot
      const timestamp = formatTimestamp(new Date());
      await page.screenshot({ 
        path: getScreenshotPath(`TS.7.1-02-06-${timestamp}.png`) 
      });
    });
});