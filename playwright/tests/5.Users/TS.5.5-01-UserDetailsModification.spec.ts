import { test, expect } from '@playwright/test';
import { microsoftLogin } from '../utils/msLogin';
import { handleERSDDialog } from '../utils/ersd-handler';
import { getScreenshotPath } from '../utils/paths';
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

test('TS.5.5-01 User Details Modification', async ({ page }) => {
  // Test Procedure:
  // 1. Edit Johanna's profile
  // 2. Change name to "Johanna M Lorenz"
  // 3. Update initials to "JML"
  // 4. Try to change email
  // 5. Save changes (SC)
  
  // Setup: Login as Grady (not reported as test step)
  const email = process.env.MS_EMAIL_17NJ5D_GRADY_ADAMS!;
  const password = process.env.MS_PASSWORD!;
  
  // Navigate to login page
  await page.goto(`${baseUrl}/login`);
  
  // Perform Microsoft login
  await microsoftLogin(page, email, password);
  
  // Handle ERSD if needed
  await handleERSDDialog(page);
  
  // Wait for navigation
  await page.waitForLoadState('domcontentloaded');
  
  // Navigate to Users page
  await page.getByRole('button', { name: 'Menu' }).click();
  await page.getByRole('link', { name: 'Users' }).click();
  await page.waitForSelector('text=Users', { timeout: 10000 });
  
  // Test Step 1: Edit Johanna's profile
  await test.step("Edit Johanna's profile", async () => {
    // Search for Johanna
    const searchBox = page.getByPlaceholder(/Search/i);
    await searchBox.fill('Johanna');
    await page.waitForTimeout(1000);
    
    // Find Johanna's row
    const johannaRow = page.locator('tr').filter({ hasText: 'Johanna' }).first();
    
    // Click edit button
    const editButton = johannaRow.locator('button[aria-label*="Edit"], [data-testid="edit-user"]');
    await editButton.click();
    
    // Wait for edit modal
    await page.waitForTimeout(1000);
    
    // Verify edit modal is open
    const editModal = page.locator('[role="dialog"], [data-testid="edit-user-modal"]');
    await expect(editModal).toBeVisible();
  });
  
  // Test Step 2: Change name to "Johanna M Lorenz"
  await test.step('Change name to "Johanna M Lorenz"', async () => {
    const nameInput = page.getByLabel(/Legal Name/i);
    await expect(nameInput).toBeVisible();
    
    // Clear and enter new name
    await nameInput.clear();
    await nameInput.fill('Johanna M Lorenz');
    
    // Verify name was entered
    const nameValue = await nameInput.inputValue();
    expect(nameValue).toBe('Johanna M Lorenz');
  });
  
  // Test Step 3: Update initials to "JML"
  await test.step('Update initials to "JML"', async () => {
    const initialsInput = page.getByLabel(/Initials/i);
    
    // Clear and enter new initials
    await initialsInput.clear();
    await initialsInput.fill('JML');
    
    // Verify initials were entered
    const initialsValue = await initialsInput.inputValue();
    expect(initialsValue).toBe('JML');
  });
  
  // Test Step 4: Try to change email
  await test.step('Try to change email', async () => {
    const emailInput = page.getByLabel(/Email/i);
    
    // Check if email field is read-only or disabled
    const isDisabled = await emailInput.isDisabled();
    const isReadOnly = await emailInput.getAttribute('readonly');
    
    expect(isDisabled || isReadOnly).toBeTruthy();
    
    // Try to interact with the field anyway
    if (!isDisabled && !isReadOnly) {
      await emailInput.click();
      await page.keyboard.type('newemail@test.com');
      
      // Verify email didn't change
      const currentValue = await emailInput.inputValue();
      expect(currentValue).not.toContain('newemail@test.com');
    }
  });
  
  // Test Step 5: Save changes (SC)
  await test.step('Save changes (SC)', async () => {
    // Take screenshot before saving
    const timestamp = formatTimestamp(new Date());
    await page.screenshot({ 
      path: getScreenshotPath(`TS.5.5-01-${timestamp}.png`),
      fullPage: true 
    });
    
    // Save the changes
    const saveButton = page.getByRole('button', { name: /Save|Update/i });
    await saveButton.click();
    
    // Wait for save to complete
    await page.waitForTimeout(2000);
    
    // Verify modal closed
    const editModal = page.locator('[role="dialog"], [data-testid="edit-user-modal"]');
    await expect(editModal).not.toBeVisible();
    
    // Verify changes were saved
    const searchBox = page.getByPlaceholder(/Search/i);
    await searchBox.clear();
    await searchBox.fill('Johanna M Lorenz');
    await page.waitForTimeout(1000);
    
    // Verify updated name appears
    const johannaRow = page.locator('tr').filter({ hasText: 'Johanna M Lorenz' });
    await expect(johannaRow).toBeVisible();
    
    // Verify initials were updated
    await expect(johannaRow).toContainText('JML');
  });
  
  // Expected Results:
  // 1. Edit modal opens ✓
  // 2. Name field editable ✓
  // 3. Initials update ✓
  // 4. Email field read-only ✓
  // 5. Changes saved successfully ✓
});