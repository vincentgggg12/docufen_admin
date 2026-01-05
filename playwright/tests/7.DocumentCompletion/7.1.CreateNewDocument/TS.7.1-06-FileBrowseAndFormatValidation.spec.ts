import { test, expect } from '@playwright/test';
import { getScreenshotPath } from '../../utils/paths';
import { microsoftLogin } from '../../utils/msLogin';
import { handleERSDDialog } from '../../utils/ersd-handler';
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

// Set timeout for this test
test.setTimeout(120000);

function formatTimestamp(date: Date): string {
  return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}-${String(date.getHours()).padStart(2, '0')}.${String(date.getMinutes()).padStart(2, '0')}.${String(date.getSeconds()).padStart(2, '0')}`;
}

test('TS.7.1-06 File Browse and Format Validation', async ({ page }) => {
    // Setup: Login to application using the robust microsoftLogin utility
    const email = process.env.MS_EMAIL_17NJ5D_GRADY_ARCHIE!;
    const password = process.env.MS_PASSWORD!;
    
    // Use the microsoftLogin utility which handles all edge cases
    await microsoftLogin(page, email, password);
    
    // Handle ERSD dialog if it appears
    await handleERSDDialog(page);
    
    // Wait for app to be ready
    await page.waitForLoadState('networkidle');
    
    // Navigate to Documents page if not already there
    const currentUrl = page.url();
    if (!currentUrl.includes('/documents')) {
      await page.goto(`${baseUrl}/documents`);
      await page.waitForLoadState('networkidle');
    }

    // Test Step 1: Open create document dialog
    await test.step('Open create document dialog', async () => {
      // Click Create New Document button
      await page.getByTestId('lsb.nav-main.documents-newDocument').click();
      
      // Wait for dialog to appear
      await page.waitForSelector('[role="dialog"]', { state: 'visible' });
      const dialog = page.getByRole('dialog', { name: 'Create Document' });
      await expect(dialog).toBeVisible();
      
      // Verify dialog elements are present
      await expect(dialog.getByTestId('createDocumentDialog.documentNameInput')).toBeVisible();
      await expect(dialog.getByTestId('createDocumentDialog.uploadDocumentButton')).toBeVisible();
    });

    // Test Step 2: Click "Browse" or upload button
    await test.step('Click "Browse" or upload button', async () => {
      const dialog = page.getByRole('dialog', { name: 'Create Document' });
      const uploadButton = dialog.getByTestId('createDocumentDialog.uploadDocumentButton');
      
      // Verify upload button is visible
      await expect(uploadButton).toBeVisible();
      
      // Click the upload button - this will open the file browser
      await uploadButton.click();
    });

    // Test Step 3: Select non-.docx file (SC)
    await test.step('Select non-.docx file (SC)', async () => {
      // Create a test text file if it doesn't exist
      const testTextFilePath = path.join(process.cwd(), 'playwright/tests/WordDocuments/test-non-docx.txt');
      
      // Make file input visible if hidden by CSS
      await page.evaluate(() => {
        const inputs = document.querySelectorAll('input[type="file"]');
        for (const input of inputs) {
          (input as HTMLElement).style.opacity = '1';
          (input as HTMLElement).style.visibility = 'visible';
          (input as HTMLElement).style.display = 'block';
          (input as HTMLElement).style.position = 'relative';
        }
      });
      
      // Set the non-.docx file
      await page.setInputFiles('input[type="file"]', testTextFilePath);
      
      // Wait for error message to appear
      await page.waitForTimeout(1000);
      
      // Verify error message is displayed
      const dialog = page.getByRole('dialog', { name: 'Create Document' });
      const errorMessage = dialog.getByText('Only modern Word documents (.docx) are supported');
      await expect(errorMessage).toBeVisible();
      
      // Take screenshot
      const timestamp = formatTimestamp(new Date());
      await page.screenshot({ 
        path: getScreenshotPath(`TS.7.1-06-03-${timestamp}.png`) 
      });
    });

    // Test Step 4: Select .docx file (SC)
    await test.step('Select .docx file (SC)', async () => {
      const dialog = page.getByRole('dialog', { name: 'Create Document' });
      
      // Click upload button again
      await dialog.getByTestId('createDocumentDialog.uploadDocumentButton').click();
      
      // Use a valid .docx test document
      const docxFilePath = path.join(process.cwd(), 'playwright/tests/WordDocuments/Docufen Testing Document v0._EN.docx');
      
      // Make file input visible if hidden by CSS
      await page.evaluate(() => {
        const inputs = document.querySelectorAll('input[type="file"]');
        for (const input of inputs) {
          (input as HTMLElement).style.opacity = '1';
          (input as HTMLElement).style.visibility = 'visible';
          (input as HTMLElement).style.display = 'block';
          (input as HTMLElement).style.position = 'relative';
        }
      });
      
      // Set the .docx file
      await page.setInputFiles('input[type="file"]', docxFilePath);
      
      // Wait for file to be processed
      await page.waitForTimeout(3000);
      
      // Verify file was accepted (filename should be displayed)
      const uploadedFileName = dialog.getByText('Docufen Testing Document v0._EN.docx');
      await expect(uploadedFileName).toBeVisible();
      
      // Verify Remove button appears (indicates file was accepted)
      const removeButton = dialog.getByRole('button', { name: 'Remove' });
      await expect(removeButton).toBeVisible();
      
      // Take screenshot
      const timestamp = formatTimestamp(new Date());
      await page.screenshot({ 
        path: getScreenshotPath(`TS.7.1-06-04-${timestamp}.png`) 
      });
    });
});