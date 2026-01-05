import { test, expect } from '@playwright/test';
import { microsoftLogin } from '../utils/msLogin';
import { handleERSDDialog } from '../utils/ersd-handler';
import { getScreenshotPath } from '../utils/paths';
import { navigateToAccount } from '../utils/navigateToAccount';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.playwright.env' });

const baseUrl = process.env.BASE_URL;

// Set test timeout to 120 seconds
test.setTimeout(120000);

test.use({
  viewport: { height: 1080, width: 1920 },
  ignoreHTTPSErrors: true
});

function formatTimestamp(date: Date): string {
  return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}-${String(date.getHours()).padStart(2, '0')}.${String(date.getMinutes()).padStart(2, '0')}.${String(date.getSeconds()).padStart(2, '0')}`;
}

test('TS.3.1-06 Empty Company Name Validation', async ({ page }) => {
  // Test Procedure:
  // 1. Click Edit on company name
  // 2. Clear the field completely
  // 3. Try to save (SC)
  
  // FS IDs: FS.3.1-01, FS.3.1-02
  
  // Setup: Login as Megan Bowen (Trial Administrator) - not reported as test step
  const email = process.env.MS_EMAIL_17NJ5D_MEGAN_BOWEN!;
  const password = process.env.MS_PASSWORD!;
  
  // Navigate to login page
  await page.goto(`${baseUrl}/login`);
  
  // Perform Microsoft login
  await microsoftLogin(page, email, password);
  
  // Handle ERSD if needed
  await handleERSDDialog(page);
  
  // Wait for navigation
  await page.waitForLoadState('domcontentloaded');
  
  // Navigate to Account page
  await navigateToAccount(page);
  
  // Test Step 1: Click Edit on company name
  await test.step('Click Edit on company name', async () => {
    // Verify we're on the account page
    await expect(page).toHaveURL(/.*\/account/);
    
    // Wait for the Company Information section to be visible
    await page.waitForSelector('text=Company Information', { timeout: 10000 });
    
    // Find and click the Edit button for the Company Name
    const editButton = page.getByTestId("accountPage.editCompanyInfoButton").first();
    await editButton.click();
    
    // Wait for the edit form to appear
    await page.waitForTimeout(100); // Small wait for form transition
    
    // Expected Result: Edit form appears
    const companyNameInput = page.getByTestId('accountPage.companyNameInput');
    await expect(companyNameInput).toBeVisible();
  });
  
  // Test Step 2: Clear the field completely
  await test.step('Clear the field completely', async () => {
    // Get the company name input field
    const companyNameInput = page.getByTestId('accountPage.companyNameInput');
    
    // Clear the field completely
    await companyNameInput.clear();
    
    // Verify the field is empty
    await expect(companyNameInput).toHaveValue('');
    
    // Expected Result: Field clears
    const fieldValue = await companyNameInput.inputValue();
    expect(fieldValue).toBe('');
  });
  
  // Test Step 3: Try to save (SC)
  await test.step('Try to save (SC)', async () => {
    // Click the Save button
    const saveButton = page.getByTestId("accountPage.saveChangesButton");
    await expect(saveButton).toBeDisabled();
    
    // Take screenshot showing the error message
    const timestamp = formatTimestamp(new Date());
    await page.screenshot({ 
      path: getScreenshotPath(`TS.3.1-06-${timestamp}.png`),
      fullPage: true 
    });
    
    // Expected Result: Error message "Company name required"
    // Look for validation error message
    const errorMessage = page.locator('text=/Company name is required/i').first()
    
    await expect(errorMessage).toBeVisible();
    
    // Verify the form is still in edit mode (save was prevented)
    const companyNameInput = page.getByTestId('accountPage.companyNameInput');
    await expect(companyNameInput).toBeVisible();
    
    // Verify the field still shows empty
    await expect(companyNameInput).toHaveValue('');
    
    // // Additional check: Verify that the save didn't go through by checking if we're still in edit mode
    // await expect(saveButton).toBeVisible();
  });
  
  // Expected Results Summary:
  // 1. Edit form appears ✓
  // 2. Field clears ✓
  // 3. Error message "Company name required" ✓
});