import { test, expect } from '@playwright/test';
import { microsoftLogin } from '../utils/msLogin';
import { handleERSDDialog } from '../utils/ersd-handler';
import { getScreenshotPath } from '../utils/paths';
import { navigateToAccount } from '../utils/navigateToAccount';
import dotenv from 'dotenv';

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

test('TS.3.1-04 Edit Business Registration', async ({ page }) => {
  // Test Procedure:
  // 1. Click Edit on registration number
  // 2. Change to BRN-2024-456
  // 3. Save changes (SC)
  
  // FS ID: FS.3.1-04
  
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
  
  await navigateToAccount(page)
  
  // Test Step 1: Click Edit on registration number
  await test.step('Click Edit on registration number', async () => {
    // Verify we're on the account page
    await expect(page).toHaveURL(/.*\/account/);
    
    // // Wait for the Business Registration section to be visible
    // await page.waitForSelector('text=Business Registration', { timeout: 10000 });
    
    // // Find and click the Edit button for the Business Registration section
    // // Look for the edit button associated with Business Registration
    // const businessRegSection = page.locator('h3:has-text("Business Registration")').locator('..');
    const editButton = page.getByTestId("accountPage.editCompanyInfoButton").first();
    
    // Alternative approach if needed
    try {
      await editButton.click({ timeout: 5000 });
    } catch {
      throw new Error('Could not find Edit button for Business Registration');
    }
    
    // Wait for the edit form to appear
    // await page.waitForTimeout(100); // Small wait for form transition
    
    // Expected Result: Field becomes editable
    const registrationInput = page.getByTestId('accountPage.businessRegistrationInput');
    await expect(registrationInput).toBeVisible({ timeout: 5000 });
  });
  
  // Test Step 2: Change to BRN-2024-456
  await test.step('Change to BRN-2024-456', async () => {
    // Clear and fill the business registration field
    const registrationInput = page.getByTestId('accountPage.businessRegistrationInput');
    await registrationInput.clear({ timeout: 5000 });
    await registrationInput.fill('BRN-2024-456');
    
    // Verify the value was entered
    await expect(registrationInput).toHaveValue('BRN-2024-456');
  });
  
  // Test Step 3: Save changes (SC)
  await test.step('Save changes (SC)', async () => {
    // Click the Save button
    await page.getByTestId("accountPage.saveChangesButton").click();
    
    // Wait for save to complete
    // await page.waitForTimeout(2000); // Give time for the save operation
    await page.waitForLoadState('domcontentloaded');
    
    // Take screenshot after saving
    
    // Expected Result: New value saves successfully
    // Wait for the form to close and the value to be displayed
    // await page.waitForTimeout(1000);
    
    // Expected Result: Displayed correctly
    // Verify the updated business registration number is displayed
    await expect(page.getByText('BRN-2024-456').first()).toBeVisible({ timeout: 10000 });

    const timestamp = formatTimestamp(new Date());
    await page.screenshot({ 
      path: getScreenshotPath(`TS.3.1-04-${timestamp}.png`),
      fullPage: true 
    });
    
    // Additional verification: Reload the page to ensure the change persists
    await page.reload();
    await page.waitForLoadState('domcontentloaded');
    
    // Verify the business registration number still shows the updated value
    await expect(page.getByText('BRN-2024-456').first()).toBeVisible({ timeout: 10000 });
  });
  
  // Expected Results Summary:
  // 1. Field becomes editable ✓
  // 2. New value saves successfully ✓
  // 3. Displayed correctly ✓
});