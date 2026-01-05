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

test('TS.7.1-04 Category Dropdown Selection', async ({ page }) => {
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

    // Test Step 2: Click category dropdown
    await test.step('Click category dropdown', async () => {
      const dialog = page.getByRole('dialog', { name: 'Create Document' });
      const categoryDropdown = dialog.getByTestId('createDocumentDialog.documentCategorySelectTrigger');
      
      // Verify dropdown is visible
      await expect(categoryDropdown).toBeVisible();
      
      // Click to open dropdown
      await categoryDropdown.click();
      
      // Wait for dropdown menu to appear
      await page.waitForSelector('[role="listbox"]', { state: 'visible' });
    });

    // Test Step 3: Verify predefined options appear (SC)
    await test.step('Verify predefined options appear (SC)', async () => {
      // Verify dropdown menu is open
      const listbox = page.getByRole('listbox');
      await expect(listbox).toBeVisible();
      
      // Verify "Enter custom document category..." option exists (this is the "Other" option)
      await expect(page.getByRole('option', { name: 'Enter custom document category...' })).toBeVisible();
      
      // Verify Common GxP Documents group exists
      await expect(page.getByRole('group', { name: 'Common GxP Documents' })).toBeVisible();
      
      // Verify some predefined options exist
      await expect(page.getByRole('option', { name: 'Batch Record' })).toBeVisible();
      await expect(page.getByRole('option', { name: 'Validation' })).toBeVisible();
      await expect(page.getByRole('option', { name: 'Log Book' })).toBeVisible();
      
      // Take screenshot
      const timestamp = formatTimestamp(new Date());
      await page.screenshot({ 
        path: getScreenshotPath(`TS.7.1-04-03-${timestamp}.png`) 
      });
    });

    // Test Step 4: Select option 1 (Batch Record) (SC)
    await test.step('Select option 1 (Batch Record) (SC)', async () => {
      // Click on Batch Record option
      await page.getByRole('option', { name: 'Batch Record' }).click();
      
      // Wait for dropdown to close
      await page.waitForSelector('[role="listbox"]', { state: 'hidden' });
      
      // Verify selected option displays in field
      const dialog = page.getByRole('dialog', { name: 'Create Document' });
      const categoryDropdown = dialog.getByTestId('createDocumentDialog.documentCategorySelectTrigger');
      await expect(categoryDropdown).toHaveText('Batch Record');
      
      // Take screenshot
      const timestamp = formatTimestamp(new Date());
      await page.screenshot({ 
        path: getScreenshotPath(`TS.7.1-04-04a-${timestamp}.png`) 
      });
    });

    // Test Step 4 continued: Select option 2 (Validation) (SC)
    await test.step('Select option 2 (Validation) (SC)', async () => {
      const dialog = page.getByRole('dialog', { name: 'Create Document' });
      const categoryDropdown = dialog.getByTestId('createDocumentDialog.documentCategorySelectTrigger');
      
      // Click to reopen dropdown
      await categoryDropdown.click();
      await page.waitForSelector('[role="listbox"]', { state: 'visible' });
      
      // Click on Validation option
      await page.getByRole('option', { name: 'Validation' }).click();
      
      // Wait for dropdown to close
      await page.waitForSelector('[role="listbox"]', { state: 'hidden' });
      
      // Verify selected option displays in field
      await expect(categoryDropdown).toHaveText('Validation');
      
      // Take screenshot
      const timestamp = formatTimestamp(new Date());
      await page.screenshot({ 
        path: getScreenshotPath(`TS.7.1-04-04b-${timestamp}.png`) 
      });
    });

    // Test Step 4 continued: Select option 3 (Log Book) (SC)
    await test.step('Select option 3 (Log Book) (SC)', async () => {
      const dialog = page.getByRole('dialog', { name: 'Create Document' });
      const categoryDropdown = dialog.getByTestId('createDocumentDialog.documentCategorySelectTrigger');
      
      // Click to reopen dropdown
      await categoryDropdown.click();
      await page.waitForSelector('[role="listbox"]', { state: 'visible' });
      
      // Click on Log Book option
      await page.getByRole('option', { name: 'Log Book' }).click();
      
      // Wait for dropdown to close
      await page.waitForSelector('[role="listbox"]', { state: 'hidden' });
      
      // Verify selected option displays in field
      await expect(categoryDropdown).toHaveText('Log Book');
      
      // Take screenshot
      const timestamp = formatTimestamp(new Date());
      await page.screenshot({ 
        path: getScreenshotPath(`TS.7.1-04-04c-${timestamp}.png`) 
      });
    });
});