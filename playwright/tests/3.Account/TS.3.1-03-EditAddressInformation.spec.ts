import { test, expect } from '@playwright/test';
import { microsoftLogin } from '../utils/msLogin';
import { handleERSDDialog } from '../utils/ersd-handler';
import { getScreenshotPath } from '../utils/paths';
import dotenv from 'dotenv';
import { navigateToAccount } from '../utils/navigateToAccount';

// Load environment variables
dotenv.config({ path: '.playwright.env' });

// Set test timeout to 120 seconds
test.setTimeout(120000);

test.use({
  viewport: { height: 1080, width: 1920 },
  ignoreHTTPSErrors: true
});

function formatTimestamp(date: Date): string {
  return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}-${String(date.getHours()).padStart(2, '0')}.${String(date.getMinutes()).padStart(2, '0')}.${String(date.getSeconds()).padStart(2, '0')}`;
}

test('TS.3.1-03 Edit Address Information', async ({ page }) => {
  // Test Procedure:
  // 1. Click Edit on address section
  // 2. Update street to 456 Research Blvd
  // 3. Update postal code to 07002
  // 4. Save changes (SC)
  
  // FS ID: FS.3.1-03
  
  // Setup: Login as Megan Bowen (Trial Administrator) - not reported as test step
  const email = process.env.MS_EMAIL_17NJ5D_MEGAN_BOWEN!;
  const password = process.env.MS_PASSWORD!;
  const baseUrl = process.env.BASE_URL;
  
  // Navigate to login page
  await page.goto(`${baseUrl}/login`);
   
  // Perform Microsoft login
  await microsoftLogin(page, email, password);
  
  // Handle ERSD if needed
  await handleERSDDialog(page);
  
  // Wait for navigation and ensure we're logged in
  await page.waitForLoadState('domcontentloaded');
  
  await navigateToAccount(page);
  
  // Test Step 1: Click Edit on address section
  await test.step('Click Edit on address section', async () => {
    // Verify we're on the account page
    await expect(page).toHaveURL(/.*\/account/);
    
    // Wait for the Address section to be visible
    await page.waitForSelector('text=Address', { timeout: 10000 });
    
    // Find and click the Edit button for the Address section
    // Look for the edit button near the Address text
    const editButton =page.getByTestId("accountPage.editCompanyInfoButton")
    
    // Alternative approach if the above doesn't work
    try {
      await editButton.click({ timeout: 5000 });
    } catch {
      // Try a more general approach
      throw new Error('Could not find Edit button for Address section');
    }
  });
  
  // Test Step 2: Update street to 456 Research Blvd
  await test.step('Update street to 456 Research Blvd', async () => {
    // Clear and fill the street address field
    const streetInput = page.getByTestId('accountPage.companyAddressTextarea');
    await expect(streetInput).toBeVisible();
    await streetInput.clear();
    await streetInput.fill('456 Research Blvd');
    
    // Verify the value was entered
    await expect(streetInput).toHaveValue('456 Research Blvd');
  });
  
  // Test Step 3: Update postal code to 07002
  await test.step('Update postal code to 07002', async () => {
    // Clear and fill the postal code field
    const postalCodeInput = page.getByTestId('accountPage.companyPostCodeInput');
    await expect(postalCodeInput).toBeVisible();
    await postalCodeInput.clear();
    await postalCodeInput.fill('07002');
    
    // Verify the value was entered
    await expect(postalCodeInput).toHaveValue('07002');
  });
  
  // Test Step 4: Save changes (SC)
  await test.step('Save changes (SC)', async () => {
    // Click the Save button
    await page.getByTestId("accountPage.saveChangesButton").click();
    
    // Wait for save to complete
    // await page.waitForTimeout(2000); // Give time for the save operation
    
    
    // Expected Result: All fields update correctly
    // Verify the updated values are displayed in the read-only view
    await expect(page.getByText('456 Research Blvd').first()).toBeVisible({timeout: 10000 });
    await expect(page.getByText('07002').first()).toBeVisible();
    // Take screenshot after saving
    const timestamp = formatTimestamp(new Date());
    await page.screenshot({ 
      path: getScreenshotPath(`TS.3.1-03-${timestamp}.png`),
      fullPage: true 
    });
    
    // Expected Result: Changes persist after reload
    // Reload the page to verify persistence
    await page.reload();
    await page.waitForLoadState('domcontentloaded');
    
    // Verify values persist after reload
    await expect(page.getByText('456 Research Blvd')).toBeVisible();
    await expect(page.getByText('07002')).toBeVisible();
  });
  
  // Expected Results Summary:
  // 1. Address form editable ✓
  // 2. All fields update correctly ✓
  // 3. Changes persist after reload ✓
});