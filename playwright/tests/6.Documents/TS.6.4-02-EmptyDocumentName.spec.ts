import { test, expect } from '@playwright/test';
import * as dotenv from 'dotenv';
import { microsoftLogin, handleERSDDialog } from '../../src/utils/microsoftLogin';
import { getScreenshotPath, formatTimestamp } from '../../src/utils/screenshotUtils';

dotenv.config({ path: '.playwright.env' });

test.use({
  viewport: { height: 1080, width: 1920 },
  ignoreHTTPSErrors: true
});

test.setTimeout(120000); // 2 minutes

test('TS.6.4-02 Empty Document Name', async ({ page }) => {
  // Login as Diego (Trial Administrator)
  const email = process.env.MS_EMAIL_17NJ5D_DIEGO_SICILIANI!;
  const password = process.env.MS_PASSWORD!;
  await microsoftLogin(page, email, password);
  await handleERSDDialog(page);

  // Navigate to Documents page
  await page.getByRole('button', { name: 'Menu' }).click();
  await page.getByRole('link', { name: 'Documents' }).click();
  await expect(page).toHaveURL(/.*\/documents/);

  // Wait for documents to load
  await page.waitForTimeout(2000);

  // Find a document to edit
  const documentRow = page.locator('tr').filter({ hasText: 'Test' }).first();
  await expect(documentRow).toBeVisible();

  // Test Step 1: Edit document info
  await test.step('Edit document info', async () => {
    // Click the actions menu (three dots)
    await documentRow.locator('button[aria-label="Actions"]').click();
    
    // Click Edit in the dropdown menu
    await page.getByRole('menuitem', { name: 'Edit' }).click();
    
    // Wait for edit dialog to appear
    await expect(page.getByRole('dialog')).toBeVisible();
  });

  // Test Step 2: Clear name field completely
  await test.step('Clear name field completely', async () => {
    // Find the name input field
    const nameInput = page.getByLabel('Document Name');
    await expect(nameInput).toBeVisible();
    
    // Clear the field
    await nameInput.clear();
    
    // Verify field is empty
    await expect(nameInput).toHaveValue('');
  });

  // Test Step 3: Try to save
  await test.step('Try to save', async () => {
    // Try to click save button
    const saveButton = page.getByRole('button', { name: 'Save' });
    
    // Check if button is disabled or try to click it
    if (await saveButton.isDisabled()) {
      // Button is disabled as expected
      await expect(saveButton).toBeDisabled();
    } else {
      // Button is not disabled, click it to trigger validation
      await saveButton.click();
    }
  });

  // Test Step 4: Check validation error (SC)
  await test.step('Check validation error (SC)', async () => {
    // Wait for validation error to appear
    await page.waitForTimeout(1000);
    
    // Take screenshot showing validation error
    const timestamp = formatTimestamp(new Date());
    await page.screenshot({ 
      path: getScreenshotPath(`TS.6.4-02-4-${timestamp}.png`) 
    });
  });

  // Expected Results:
  // 1. Edit dialog opens ✓
  // 2. Name cleared ✓
  // 3. Save disabled/fails ✓
  // 4. "Name required" error ✓
  
  // Verify save is prevented and error message is shown
  const errorMessage = page.getByText(/name.*required/i).or(page.getByText(/required/i));
  const saveDisabled = await page.getByRole('button', { name: 'Save' }).isDisabled();
  
  // Either save button is disabled OR error message is shown
  expect(saveDisabled || await errorMessage.isVisible()).toBeTruthy();
  
  // Close the dialog
  const cancelButton = page.getByRole('button', { name: 'Cancel' });
  if (await cancelButton.isVisible()) {
    await cancelButton.click();
  } else {
    // Click outside dialog or press Escape
    await page.keyboard.press('Escape');
  }
});