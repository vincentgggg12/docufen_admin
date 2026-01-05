import { test, expect } from '@playwright/test';
import { getScreenshotPath } from '../../utils/paths';
import { microsoftLogin } from '../../utils/msLogin';
import { handleERSDDialog } from '../../utils/ersd-handler';
import path from 'path';
import dotenv from 'dotenv';

// Load environment variables from .playwright.env
dotenv.config({ path: '.playwright.env' });
const baseUrl = process.env.BASE_URL || 'https://beta.docufen.com';
test.use({
  viewport: {
    height: 1080,
    width: 1920
  },
  ignoreHTTPSErrors: true
});

function formatTimestamp(date: Date): string {
  return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}-${String(date.getHours()).padStart(2, '0')}.${String(date.getMinutes()).padStart(2, '0')}.${String(date.getSeconds()).padStart(2, '0')}`;
}

test('TS.7.1-07 Drag and Drop File Upload', async ({ page }) => {
    // Set test timeout to 2 minutes
    test.setTimeout(120000);
    
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

    // Test Step 2: Drag non-.docx file to drop zone (SC)
    await test.step('Drag non-.docx file to drop zone', async () => {
      const dialog = page.getByRole('dialog', { name: 'Create Document' });
      
      // Note: Actual drag and drop is simulated using file input
      // First, let's simulate the drag-over effect by hovering over the drop zone
      const dropZone = dialog.locator('div').filter({ hasText: 'Drop a file here or' }).first();
      await dropZone.hover();
      
      // Wait a moment to show the hover state
      await page.waitForTimeout(500);
      
      // Take screenshot showing drop zone highlight
      const timestamp = formatTimestamp(new Date());
      await page.screenshot({ 
        path: getScreenshotPath(`TS.7.1-07-02-${timestamp}.png`) 
      });
      
      // Now try to upload a non-docx file (PDF)
      const pdfPath = path.join(process.cwd(), 'playwright/tests/WordDocuments/test-non-docx.pdf');
      
      // Make file input visible
      await page.evaluate(() => {
        const inputs = document.querySelectorAll('input[type="file"]');
        for (const input of inputs) {
          (input as HTMLElement).style.opacity = '1';
          (input as HTMLElement).style.visibility = 'visible';
          (input as HTMLElement).style.display = 'block';
          (input as HTMLElement).style.position = 'relative';
        }
      });
      
      // Try to set the PDF file
      await page.setInputFiles('input[type="file"]', pdfPath);
      
      // Wait for any error message to appear
      await page.waitForTimeout(1000);
    });

    // Test Step 3: Drop file (SC) - Verify non-docx rejection
    await test.step('Drop file - Verify non-docx rejection', async () => {
      // Check for error message or that file was rejected
      // The dialog should still be empty (no file uploaded)
      const dialog = page.getByRole('dialog', { name: 'Create Document' });
      
      // Look for any error message that might appear
      const errorMessage = dialog.getByText(/only.*docx.*files.*supported|invalid.*file.*type|must.*be.*docx/i);
      const hasError = await errorMessage.isVisible().catch(() => false);
      
      if (hasError) {
        // If error message is shown, capture it
        expect(errorMessage).toBeVisible();
      } else {
        // Otherwise, verify that no file was accepted
        const uploadedFile = dialog.getByText(/\.pdf/i);
        await expect(uploadedFile).not.toBeVisible();
      }
      
      // Take screenshot showing rejection
      const timestamp = formatTimestamp(new Date());
      await page.screenshot({ 
        path: getScreenshotPath(`TS.7.1-07-03-${timestamp}.png`) 
      });
    });

    // Test Step 4: Try with .docx file (SC)
    await test.step('Try with .docx file', async () => {
      const dialog = page.getByRole('dialog', { name: 'Create Document' });
      
      // Clear any previous file attempt
      await page.reload();
      await page.waitForLoadState('networkidle');
      
      // Re-open dialog
      await page.getByTestId('lsb.nav-main.documents-newDocument').click();
      await page.waitForSelector('[role="dialog"]', { state: 'visible' });
      
      // Now upload a valid .docx file
      const docxPath = path.join(process.cwd(), 'playwright/tests/WordDocuments/Docufen Testing Document v0._EN.docx');
      
      // Make file input visible again
      await page.evaluate(() => {
        const inputs = document.querySelectorAll('input[type="file"]');
        for (const input of inputs) {
          (input as HTMLElement).style.opacity = '1';
          (input as HTMLElement).style.visibility = 'visible';
          (input as HTMLElement).style.display = 'block';
          (input as HTMLElement).style.position = 'relative';
        }
      });
      
      // Upload the docx file
      await page.setInputFiles('input[type="file"]', docxPath);
      
      // Wait for file to be processed
      await page.waitForTimeout(2000);
      
      // Verify file was accepted
      const uploadedFile = page.getByText(/Docufen Testing Document|\.docx/i);
      await expect(uploadedFile).toBeVisible({ timeout: 5000 });
      
      // Take screenshot showing successful upload
      const timestamp = formatTimestamp(new Date());
      await page.screenshot({ 
        path: getScreenshotPath(`TS.7.1-07-04-${timestamp}.png`) 
      });
    });
});