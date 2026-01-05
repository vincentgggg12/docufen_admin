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
  viewport: { height: 1080, width: 1920 },
  ignoreHTTPSErrors: true
});

function formatTimestamp(date: Date): string {
  return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}-${String(date.getHours()).padStart(2, '0')}.${String(date.getMinutes()).padStart(2, '0')}.${String(date.getSeconds()).padStart(2, '0')}`;
}

test('TS.7.1-03 External Reference Field', async ({ page }) => {
    test.setTimeout(120000); // 2 minutes timeout
    
    // Setup: Login to application using the robust microsoftLogin utility
    const email = process.env.MS_EMAIL_17NJ5D_GRADY_ARCHIE || 'GradyA@17nj5d.onmicrosoft.com';
    const password = process.env.MS_PASSWORD || 'NoMorePaper88';
    
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
    });

    // Test Step 2: Enter text in external reference field (SC)
    await test.step('Enter text in external reference field (SC)', async () => {
      const dialog = page.getByRole('dialog', { name: 'Create Document' });
      const externalReferenceInput = dialog.getByTestId('createDocumentDialog.externalReferenceInput');
      
      // Enter text in the external reference field
      await externalReferenceInput.fill('EXT-REF-001');
      
      // Verify text was entered
      await expect(externalReferenceInput).toHaveValue('EXT-REF-001');
      
      // Take screenshot
      const timestamp = formatTimestamp(new Date());
      await page.screenshot({ 
        path: getScreenshotPath(`TS.7.1-03-02-${timestamp}.png`) 
      });
    });

    // Test Step 3: Clear the field (SC)
    await test.step('Clear the field (SC)', async () => {
      const dialog = page.getByRole('dialog', { name: 'Create Document' });
      const externalReferenceInput = dialog.getByTestId('createDocumentDialog.externalReferenceInput');
      
      // Clear the field
      await externalReferenceInput.click();
      await externalReferenceInput.fill('');
      
      // Verify field is empty
      await expect(externalReferenceInput).toHaveValue('');
      
      // Take screenshot
      const timestamp = formatTimestamp(new Date());
      await page.screenshot({ 
        path: getScreenshotPath(`TS.7.1-03-03-${timestamp}.png`) 
      });
    });

    // Test Step 4: Submit form without external reference (SC)
    await test.step('Submit form without external reference (SC)', async () => {
      const dialog = page.getByRole('dialog', { name: 'Create Document' });
      
      // Fill in the required Document Name field
      const documentNameInput = dialog.getByTestId('createDocumentDialog.documentNameInput');
      await documentNameInput.fill('Test Document Without External Reference');
      
      // Upload a document file
      const filePath = path.join(process.cwd(), 'playwright/tests/WordDocuments/Docufen Testing Document v0._EN.docx');
      
      // Click upload button
      await dialog.getByTestId('createDocumentDialog.uploadDocumentButton').click();
      
      // Wait for file chooser and upload file
      await page.setInputFiles('input[type="file"]', filePath);
      
      // Wait for file to be processed
      await page.waitForTimeout(2000);
      
      // Verify Create Document button is enabled
      const createButton = dialog.getByTestId('createDocumentDialog.createDocumentButton');
      await expect(createButton).toBeEnabled();
      
      // Click Create Document button
      await createButton.click();
      
      // Wait for navigation to the new document
      await page.waitForURL(/\/document\/[a-f0-9-]+/, { timeout: 10000 });
      
      // Verify form was submitted successfully - we should be on the document page
      await expect(page.url()).toMatch(/\/document\/[a-f0-9-]+/);
      
      // Verify the document was created without external reference
      const documentTitle = page.getByText('Test Document Without External Reference').first();
      await expect(documentTitle).toBeVisible();
      
      // Take screenshot
      const timestamp = formatTimestamp(new Date());
      await page.screenshot({ 
        path: getScreenshotPath(`TS.7.1-03-04-${timestamp}.png`) 
      });
    });
});