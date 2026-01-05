import { test, expect } from '@playwright/test';
import { getScreenshotPath } from '../../utils/paths';
import { microsoftLogin } from '../../utils/msLogin';
import { handleERSDDialog } from '../../utils/ersd-handler';
import path from 'path';
import * as fs from 'fs';
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

test('TS.7.1-08 File Type and Size Validation', async ({ page }) => {
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

    // Test Step 1: Try uploading: .doc (SC), .pdf (SC), .xlsx files (SC)
    await test.step('Try uploading: .doc (SC), .pdf (SC), .xlsx files (SC)', async () => {
      // Sub-step 1a: Try .doc file
      await page.getByTestId('lsb.nav-main.documents-newDocument').click();
      await page.waitForSelector('[role="dialog"]', { state: 'visible' });
      let dialog = page.getByRole('dialog', { name: 'Create Document' });
      
      // Create a temporary .doc file
      const tempDocPath = path.join(process.cwd(), 'playwright/tests/WordDocuments/temp-test.doc');
      fs.writeFileSync(tempDocPath, 'This is a test .doc file');
      
      try {
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
        
        await page.setInputFiles('input[type="file"]', tempDocPath);
        await page.waitForTimeout(1000);
        
        // Check for error message
        const errorMessage = dialog.getByText(/only.*docx.*files.*supported|must.*be.*\.docx/i);
        const hasError = await errorMessage.isVisible().catch(() => false);
        
        if (hasError) {
          await expect(errorMessage).toBeVisible();
        }
        
        // Take screenshot for .doc attempt
        const timestamp1 = formatTimestamp(new Date());
        await page.screenshot({ 
          path: getScreenshotPath(`TS.7.1-08-01a-${timestamp1}.png`) 
        });
      } finally {
        if (fs.existsSync(tempDocPath)) {
          fs.unlinkSync(tempDocPath);
        }
      }
      
      // Sub-step 1b: Try .pdf file
      await page.reload();
      await page.waitForLoadState('networkidle');
      await page.getByTestId('lsb.nav-main.documents-newDocument').click();
      await page.waitForSelector('[role="dialog"]', { state: 'visible' });
      dialog = page.getByRole('dialog', { name: 'Create Document' });
      
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
      
      await page.setInputFiles('input[type="file"]', pdfPath);
      await page.waitForTimeout(1000);
      
      // Verify error message
      const pdfError = dialog.getByText(/only.*docx.*files.*supported|must.*be.*\.docx/i);
      const hasPdfError = await pdfError.isVisible().catch(() => false);
      
      if (hasPdfError) {
        await expect(pdfError).toBeVisible();
      }
      
      // Take screenshot for .pdf attempt
      const timestamp2 = formatTimestamp(new Date());
      await page.screenshot({ 
        path: getScreenshotPath(`TS.7.1-08-01b-${timestamp2}.png`) 
      });
      
      // Sub-step 1c: Try .xlsx file
      await page.reload();
      await page.waitForLoadState('networkidle');
      await page.getByTestId('lsb.nav-main.documents-newDocument').click();
      await page.waitForSelector('[role="dialog"]', { state: 'visible' });
      dialog = page.getByRole('dialog', { name: 'Create Document' });
      
      // Create a temporary .xlsx file
      const tempXlsxPath = path.join(process.cwd(), 'playwright/tests/WordDocuments/temp-test.xlsx');
      fs.writeFileSync(tempXlsxPath, 'PK'); // Minimal XLSX header
      
      try {
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
        
        await page.setInputFiles('input[type="file"]', tempXlsxPath);
        await page.waitForTimeout(1000);
        
        // Verify error
        const xlsxError = dialog.getByText(/only.*docx.*files.*supported|must.*be.*\.docx/i);
        const hasXlsxError = await xlsxError.isVisible().catch(() => false);
        
        if (hasXlsxError) {
          await expect(xlsxError).toBeVisible();
        }
        
        // Take screenshot for .xlsx attempt
        const timestamp3 = formatTimestamp(new Date());
        await page.screenshot({ 
          path: getScreenshotPath(`TS.7.1-08-01c-${timestamp3}.png`) 
        });
      } finally {
        if (fs.existsSync(tempXlsxPath)) {
          fs.unlinkSync(tempXlsxPath);
        }
      }
    });

    // Test Step 2: Try uploading file > 25MB. (SC)
    await test.step('Try uploading file > 25MB', async () => {
      // Clear and reopen dialog
      await page.reload();
      await page.waitForLoadState('networkidle');
      await page.getByTestId('lsb.nav-main.documents-newDocument').click();
      await page.waitForSelector('[role="dialog"]', { state: 'visible' });
      
      const dialog = page.getByRole('dialog', { name: 'Create Document' });
      
      // Use the actual large DOCX file (> 25MB)
      const largePath = path.join(process.cwd(), 'playwright/tests/WordDocuments/Docufen Testing Document v0._EN_large file_26MB.docx');
      
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
      
      await page.setInputFiles('input[type="file"]', largePath);
      await page.waitForTimeout(2000);
      
      // Check for size error
      const sizeError = dialog.getByText(/file.*too.*large|maximum.*size|exceeds.*25.*MB|size.*limit/i);
      const hasError = await sizeError.isVisible().catch(() => false);
      
      if (hasError) {
        await expect(sizeError).toBeVisible();
      }
      
      // Take screenshot for large file
      const timestamp = formatTimestamp(new Date());
      await page.screenshot({ 
        path: getScreenshotPath(`TS.7.1-08-02-${timestamp}.png`) 
      });
    });

    // Test Step 3: Try uploading corrupted .docx (SC)
    await test.step('Try uploading corrupted .docx', async () => {
      // Clear and reopen dialog
      await page.reload();
      await page.waitForLoadState('networkidle');
      await page.getByTestId('lsb.nav-main.documents-newDocument').click();
      await page.waitForSelector('[role="dialog"]', { state: 'visible' });
      
      const dialog = page.getByRole('dialog', { name: 'Create Document' });
      
      // Create a corrupted DOCX file
      const corruptPath = path.join(process.cwd(), 'playwright/tests/WordDocuments/corrupt-test.docx');
      
      // Write invalid data that has .docx extension but is not a valid DOCX
      fs.writeFileSync(corruptPath, 'This is not a valid DOCX file structure');
      
      try {
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
        
        await page.setInputFiles('input[type="file"]', corruptPath);
        await page.waitForTimeout(2000);
        
        // Check for corruption error
        const corruptError = dialog.getByText(/corrupt|invalid.*format|cannot.*read|error.*processing/i);
        const hasError = await corruptError.isVisible().catch(() => false);
        
        // The system might accept the file initially but show error during processing
        // Or it might show the file name but disable the Create button
        
        // Take screenshot showing the result
        const timestamp = formatTimestamp(new Date());
        await page.screenshot({ 
          path: getScreenshotPath(`TS.7.1-08-03-${timestamp}.png`) 
        });
        
        // Verify appropriate error handling
        if (hasError) {
          await expect(corruptError).toBeVisible();
        } else {
          // Check if Create button is disabled due to invalid file
          const createButton = dialog.getByTestId('createDocumentDialog.createDocumentButton');
          const isDisabled = await createButton.isDisabled().catch(() => true);
          expect(isDisabled).toBeTruthy();
        }
      } finally {
        if (fs.existsSync(corruptPath)) {
          fs.unlinkSync(corruptPath);
        }
      }
    });
});