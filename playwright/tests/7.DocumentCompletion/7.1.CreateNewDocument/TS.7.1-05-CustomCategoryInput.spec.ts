import { test, expect } from '@playwright/test';
import { getScreenshotPath } from '../../utils/paths';
import { microsoftLogin } from '../../utils/msLogin';
import { handleERSDDialog } from '../../utils/ersd-handler';
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

test('TS.7.1-05 Custom Category Input', async ({ page }) => {
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

    // Test Step 2: Select "Other" from category dropdown
    await test.step('Select "Other" from category dropdown', async () => {
      const dialog = page.getByRole('dialog', { name: 'Create Document' });
      
      // Click on the category dropdown
      await dialog.getByTestId('createDocumentDialog.documentCategorySelectTrigger').click();
      
      // Wait for dropdown options to appear
      await page.waitForSelector('[role="listbox"]', { state: 'visible' });
      
      // Click on "Enter custom document category..." option
      await page.getByRole('option', { name: 'Enter custom document category' }).click();
    });

    // Test Step 3: Verify custom input field appears (SC)
    await test.step('Verify custom input field appears. (SC)', async () => {
      const dialog = page.getByRole('dialog', { name: 'Create Document' });
      
      // Wait for and verify custom category input field is visible
      const customCategoryInput = dialog.getByTestId('createDocumentDialog.documentCategorySelectCustomInput');
      await expect(customCategoryInput).toBeVisible();
      
      // Verify the placeholder text
      await expect(customCategoryInput).toHaveAttribute('placeholder', 'Type custom category here...');
      
      // Take screenshot
      const timestamp = formatTimestamp(new Date());
      await page.screenshot({ 
        path: getScreenshotPath(`TS.7.1-05-03-${timestamp}.png`) 
      });
    });

    // Test Step 4: Enter custom category text (SC)
    await test.step('Enter custom category text. (SC)', async () => {
      const dialog = page.getByRole('dialog', { name: 'Create Document' });
      const customCategoryInput = dialog.getByTestId('createDocumentDialog.documentCategorySelectCustomInput');
      
      // Type custom category text
      await customCategoryInput.fill('Research Protocol');
      
      // Verify text was entered
      await expect(customCategoryInput).toHaveValue('Research Protocol');
      
      // Take screenshot
      const timestamp = formatTimestamp(new Date());
      await page.screenshot({ 
        path: getScreenshotPath(`TS.7.1-05-04-${timestamp}.png`) 
      });
    });
});