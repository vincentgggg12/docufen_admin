import { test, expect } from '@playwright/test';
import { microsoftLogin } from '../utils/msLogin';
import { handleERSDDialog } from '../utils/ersd-handler';
import { getScreenshotPath } from '../utils/paths';
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

test('TS.3.2-02 Default ERSD', async ({ page, baseURL }) => {
  // Test Procedure:
  // 1. Delete current ERSD
  // 2. Edit ERSD to "This is a custom ERSD" and save and reload. Click edit again and check the ERSD saved persists. (SC)
  
  // FS ID: FS.3.2-02
  
  // Setup: Login (not reported as test step)
  // Use Megan (Trial Administrator) who has access to ERSD management
  const email = process.env.MS_EMAIL_17NJ5D_MEGAN_BOWEN!;
  const password = process.env.MS_PASSWORD!;
  
  // Navigate to login page
  await page.goto(`${baseURL}/login`);
  
  // Perform Microsoft login
  await microsoftLogin(page, email, password);
  
  // Handle ERSD if needed
  await handleERSDDialog(page);
  
  // Wait for navigation
  await page.waitForLoadState('domcontentloaded');
  
  // Handle Account Setup if needed
  if (await page.getByText('Account Setup').isVisible({ timeout: 3000 })) {
    // Complete the account setup wizard
    await page.getByPlaceholder('Enter your company name').fill('Pharma 17NJ5D');
    await page.getByPlaceholder('Enter your company address').fill('123 Test Street');
    await page.getByPlaceholder('Enter your city').fill('Test City');
    await page.getByPlaceholder('Enter your state/province').fill('Test State');
    await page.getByPlaceholder('Enter your post/zip code').fill('12345');
    await page.getByPlaceholder('Enter your country').fill('United States');
    await page.getByPlaceholder('Enter your business registration number').fill('BRN-12345');
    
    // Click Next
    await page.getByRole('button', { name: 'Next' }).click();
    
    // Wait for the next screen or completion
    await page.waitForLoadState('networkidle');
    
    // Continue through any additional setup steps if they exist
    // Check if we need to designate a User Manager
    if (await page.getByText('Designate User Manager').isVisible({ timeout: 3000 })) {
      // Skip this step for now or handle it if needed
      const skipButton = page.getByRole('button', { name: 'Skip' });
      if (await skipButton.isVisible({ timeout: 2000 })) {
        await skipButton.click();
      }
    }
  }
  
  // Test Step 1: Delete current ERSD
  await test.step('Delete current ERSD', async () => {
    // Navigate to Account page
    // First try direct navigation
    await page.goto(`${baseURL}/account`);
    await page.waitForLoadState('networkidle');
    
    // If we're not on the account page, try navigation through menu
    if (!page.url().includes('/account')) {
      try {
        await page.waitForLoadState("domcontentloaded");
        await page.getByTestId("lsb.tenant-switcher.trigger").first().click({ timeout: 5000 });
        
        // Wait for the organization menu to appear
        await page.waitForSelector('[data-testid*="lsb.tenant-switcher.organization"]', { timeout: 5000 });
        
        // Click on the organization
        await page.getByTestId("lsb.tenant-switcher.organization.17nj5d").first().click({ timeout: 5000 });
        
        // Look for Account option in the navigation
        await page.getByTestId('lsb.nav-main.nav-account').click({ timeout: 5000 });
      } catch {
        // Continue with current page
      }
    }
    
    // Wait for the account page to load
    await page.waitForLoadState('networkidle');
    
    // Click on Compliance tab
    // Look for Edit ERSD button
    const editERSDButton = page.getByTestId('accountPage.editErsdButton');
    await expect(editERSDButton).toBeVisible({ timeout: 10000 });
    
    // Click Edit ERSD button
    await editERSDButton.click();
    
    // Wait for modal to open
    await page.waitForSelector('[role="dialog"]', { timeout: 5000 });
    
    // Clear the ERSD text (delete current ERSD)
    const ersdTextArea = page.getByTestId('accountPage.ersdModal.textarea');
    await ersdTextArea.clear();
    
    // Save the empty ERSD
      const saveButton = page.getByTestId('accountPage.ersdModal.saveButton');
    await saveButton.click();
    
    // Wait for modal to close
    await saveButton.isHidden({ timeout: 5000 });

    
    // Verify that default ERSD is restored (by reopening the modal)
    await editERSDButton.click();
    await page.waitForTimeout(100);

    // Check that default text has been restored
    const defaultText = await ersdTextArea.inputValue();
    expect(defaultText).toBeTruthy();
    expect(defaultText.length).toBeGreaterThan(100); // Default ERSD should have substantial text
    
    // Close the modal
    const cancelButton = page.getByTestId('accountPage.ersdModal.cancelButton');
    await cancelButton.click();
    await page.waitForTimeout(500);
  });
  
  // Test Step 2: Edit ERSD to custom text and verify persistence
  await test.step('Edit ERSD to "This is a custom ERSD" and verify persistence (SC)', async () => {
    // Click Edit ERSD button again
    const editERSDButton = page.getByTestId('accountPage.editErsdButton');
    await editERSDButton.click();
    
    // Wait for modal to open
    await page.waitForSelector('[role="dialog"]', { timeout: 5000 });
    
    // Clear and enter custom ERSD text
    const ersdTextArea = page.getByTestId('accountPage.ersdModal.textarea');
    await ersdTextArea.clear();
    await ersdTextArea.fill('This is a custom ERSD');
    
    // Save the custom ERSD
    const saveButton = page.getByTestId('accountPage.ersdModal.saveButton');
    await saveButton.click();
    
    // Wait for modal to close and changes to save
    await saveButton.isHidden({ timeout: 1000 });
    
    // Reload the page (F5/refresh)
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    // Click Edit ERSD button again to check persistence
    await editERSDButton.click({ timeout: 10000});
    
    // Wait for modal to open
    await page.waitForTimeout(500); // Wait for dialog to fully render
    
    // Verify the custom ERSD text persists
    const persistedText = await ersdTextArea.inputValue();
    expect(persistedText).toBe('This is a custom ERSD');
    
    // Take screenshot showing the persisted custom ERSD
    const timestamp = formatTimestamp(new Date());
    await page.screenshot({ 
      path: getScreenshotPath(`TS.3.2-02-${timestamp}.png`),
      fullPage: true 
    });
    
    // Close the modal
    const cancelButton = page.getByRole('button', { name: 'Cancel' });
    await cancelButton.click();
  });
  
  // Expected Results:
  // 1. Default is deleted and default is restored ✓
  // 2. The custom ERSD shown and persists ✓
});