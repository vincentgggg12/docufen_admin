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

test('TS.6.3-03 Compliance Warning Display', async ({ page }) => {
  // Test Procedure:
  // 1. Click delete on finalized doc
  // 2. Read criminal offense warning
  // 3. Try to proceed without checkbox
  // 4. Check confirmation box
  // 5. Complete deletion (SC)
  
  // Setup: Login as Megan (Admin)
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
  
  // Navigate to Documents page
  await page.getByRole('button', { name: 'Menu' }).click();
  await page.getByRole('link', { name: 'Documents' }).click();
  await page.waitForSelector('text=Documents', { timeout: 10000 });
  
  // Navigate to Final PDF tab
  const finalPdfTab = page.getByRole('tab', { name: /Final PDF/i });
  await finalPdfTab.click();
  await page.waitForTimeout(2000);
  
  // Open a finalized document
  const documentRow = page.locator('tr[role="row"]').nth(1);
  await documentRow.click();
  await page.waitForSelector('[data-testid="document-details"]', { timeout: 10000 });
  
  // Test Step 1: Click delete on finalized doc
  await test.step('Click delete on finalized doc', async () => {
    const deleteButton = page.getByRole('button', { name: /Delete/i });
    await deleteButton.click();
    
    // Wait for delete dialog to appear
    await page.waitForSelector('[role="dialog"], [data-testid="delete-dialog"]', { timeout: 5000 });
  });
  
  // Test Step 2: Read criminal offense warning
  await test.step('Read criminal offense warning', async () => {
    // Verify warning text is displayed
    const warningText = page.getByText(/criminal offense|legal.*violation|compliance.*warning|regulatory.*requirement/i);
    await expect(warningText).toBeVisible();
    
    // Log the warning text
    const warning = await warningText.textContent();
    console.log('Compliance warning displayed:', warning);
  });
  
  // Test Step 3: Try to proceed without checkbox
  await test.step('Try to proceed without checkbox', async () => {
    // Find the delete/confirm button in the dialog
    const confirmButton = page.locator('[role="dialog"] button:has-text("Delete"), [role="dialog"] button:has-text("Confirm")');
    
    // Verify button is disabled initially
    await expect(confirmButton).toBeDisabled();
    console.log('Delete button is disabled without checkbox confirmation');
  });
  
  // Test Step 4: Check confirmation box
  await test.step('Check confirmation box', async () => {
    // Find and check the confirmation checkbox
    const confirmCheckbox = page.locator('[role="dialog"] input[type="checkbox"], [role="dialog"] [role="checkbox"]');
    await confirmCheckbox.click();
    
    // Verify checkbox is checked
    await expect(confirmCheckbox).toBeChecked();
    
    // Verify button is now enabled
    const confirmButton = page.locator('[role="dialog"] button:has-text("Delete"), [role="dialog"] button:has-text("Confirm")');
    await expect(confirmButton).toBeEnabled();
  });
  
  // Test Step 5: Complete deletion (SC)
  await test.step('Complete deletion (SC)', async () => {
    // Take screenshot before deletion
    const timestamp = formatTimestamp(new Date());
    await page.screenshot({ 
      path: getScreenshotPath(`TS.6.3-03-${timestamp}.png`),
      fullPage: true 
    });
    
    // Click the confirm button to complete deletion
    const confirmButton = page.locator('[role="dialog"] button:has-text("Delete"), [role="dialog"] button:has-text("Confirm")');
    await confirmButton.click();
    
    // Wait for dialog to close and deletion to complete
    await page.waitForSelector('[role="dialog"]', { state: 'hidden', timeout: 5000 });
    
    // Verify we're back at the documents list
    await expect(page.getByRole('heading', { name: 'Documents' })).toBeVisible();
    
    // Verify success message if shown
    const successMessage = page.getByText(/deleted successfully|document.*removed/i);
    if (await successMessage.count() > 0) {
      await expect(successMessage).toBeVisible();
      console.log('Document deleted successfully');
    }
  });
  
  // Expected Results:
  // 1. Delete dialog opens ✓
  // 2. Warning text displayed ✓
  // 3. Delete button disabled ✓
  // 4. Checkbox enables button ✓
  // 5. Document deleted successfully ✓
});