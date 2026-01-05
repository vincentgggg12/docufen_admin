import { test, expect } from '@playwright/test';
import { microsoftLogin } from '../utils/msLogin';
import { handleERSDDialog } from '../utils/ersd-handler';
import { getScreenshotPath } from '../utils/paths';
import { navigateToAccount } from '../utils/navigateToAccount';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: '.playwright.env' });

const baseUrl = process.env.BASE_URL || 'https://beta.docufen.com';

// Set test timeout to 120 seconds
test.setTimeout(120000);

test.use({
  viewport: { height: 1080, width: 1920 },
  ignoreHTTPSErrors: true
});

function formatTimestamp(date: Date): string {
  return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}-${String(date.getHours()).padStart(2, '0')}.${String(date.getMinutes()).padStart(2, '0')}.${String(date.getSeconds()).padStart(2, '0')}`;
}

test('TS.3.1-09 Remove Company Logo', async ({ page }) => {
  // Test Procedure:
  // 1. Click Edit with existing logo
  // 2. Click X on logo preview
  // 3. Save changes
  // 4. Verify no logo displays (SC)
  // 5. Reload the page (F5/refresh)
  // 6. Verify logo still absent (SC)
  
  // Setup: Login (not reported as test step)
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
  
  // Test Step 1: Click Edit with existing logo
  await test.step('Click Edit with existing logo', async () => {
    // Verify we're on the account page
    await expect(page).toHaveURL(/.*\/account/);
    
    // Wait for the Edit Company Information button to be visible
    await page.waitForSelector('[data-testid="accountPage.editCompanyInfoButton"]', { timeout: 10000 });
    
    // Click the Edit Company Information button
    await page.getByTestId('accountPage.editCompanyInfoButton').click();
    
    // Wait for the modal to appear
    await page.waitForSelector('[role="dialog"]', { timeout: 5000 });
    
    // Verify the Update Company Details dialog is open
    await expect(page.getByRole('dialog', { name: 'Update Company Details' })).toBeVisible();
    
    // Check if a logo preview exists, if not upload one first
    const logoPreview = page.getByTestId('accountPage.logoPreview');
    const hasLogo = await logoPreview.isVisible().catch(() => false);
    
    if (!hasLogo) {
      // Upload a logo first since the test requires removing an existing logo
      console.log('No existing logo found - uploading a test logo first');
      
      // Find the file input and upload a test image
      const fileInput = page.locator('input[type="file"]#logo-upload');
      
      // Create a test image file path (using a sample file from the project)
      const testImagePath = path.join(process.cwd(), 'public', 'docufen_logo.png');
      
      // Upload the file
      await fileInput.setInputFiles(testImagePath);
      
      // Wait for the preview to appear
      await page.waitForSelector('[data-testid="accountPage.logoPreview"]', { timeout: 5000 });
      
      // Save the logo first
      await page.getByTestId('accountPage.saveButton').or(
        page.getByRole('button', { name: 'Save Changes' })
      ).click();
      
      // Wait for modal to close
      await page.waitForSelector('[role="dialog"]', { state: 'hidden', timeout: 10000 });
      
      // Re-open the edit modal
      await page.waitForTimeout(1000);
      await page.getByTestId('accountPage.editCompanyInfoButton').click();
      await page.waitForSelector('[role="dialog"]', { timeout: 5000 });
    }
  });
  
  // Test Step 2: Click X on logo preview
  await test.step('Click X on logo preview', async () => {
    // Wait for the logo preview to be visible
    await page.waitForSelector('[data-testid="accountPage.logoPreview"]', { timeout: 5000 });
    
    // Look for the remove logo button with the specific data-testid
    const removeLogoButton = page.getByTestId('accountPage.removeLogoButton');
    
    // The button should be visible when there's a logo preview
    await expect(removeLogoButton).toBeVisible();
    
    // Click the X button to remove the logo
    await removeLogoButton.click();
    
    // Verify the logo preview is no longer visible
    await expect(page.getByTestId('accountPage.logoPreview')).not.toBeVisible();
  });
  
  // Test Step 3: Save changes
  await test.step('Save changes', async () => {
    // Click the Save Changes button
    await page.getByTestId('accountPage.saveButton').or(
      page.getByRole('button', { name: 'Save Changes' })
    ).click();
    
    // Wait for the modal to close and changes to be saved
    await page.waitForSelector('[role="dialog"]', { state: 'hidden', timeout: 10000 });
    
    // Wait for any success notification or page update
    await page.waitForTimeout(1000);
  });
  
  // Test Step 4: Verify no logo displays (SC)
  await test.step('Verify no logo displays (SC)', async () => {
    // Wait for the page to update
    await page.waitForLoadState('networkidle');
    
    // Look for the logo section in the company information
    const logoSection = page.locator('text=Logo').locator('..');
    
    // Verify that no logo image is displayed
    // The logo section should either be empty or show an upload option
    const logoImage = logoSection.locator('img[alt*="logo" i], img[src*="logo" i]');
    const logoCount = await logoImage.count();
    
    // If there are logo images, they should be placeholder or upload icons, not actual company logos
    if (logoCount > 0) {
      // Check if the image is a placeholder by examining its attributes
      const imgSrc = await logoImage.first().getAttribute('src');
      expect(imgSrc).not.toContain('blob:'); // Uploaded logos usually have blob URLs
      expect(imgSrc).not.toContain('company-logo'); // Or specific company logo identifiers
    }
    
    // Take screenshot
    const timestamp = formatTimestamp(new Date());
    await page.screenshot({ 
      path: getScreenshotPath(`TS.3.1-09-01-${timestamp}.png`),
      fullPage: true 
    });
  });
  
  // Test Step 5: Reload the page (F5/refresh)
  await test.step('Reload the page (F5/refresh)', async () => {
    await page.reload();
    
    // Wait for the page to load completely
    await page.waitForLoadState('domcontentloaded');
    await page.waitForLoadState('networkidle');
  });
  
  // Test Step 6: Verify logo still absent (SC)
  await test.step('Verify logo still absent (SC)', async () => {
    // Wait for the company information section to be visible
    await page.waitForSelector('text=Company Information', { timeout: 10000 });
    
    // Look for the logo section again
    const logoSection = page.locator('text=Logo').locator('..');
    
    // Verify that no logo image is displayed after reload
    const logoImage = logoSection.locator('img[alt*="logo" i], img[src*="logo" i]');
    const logoCount = await logoImage.count();
    
    // Similar verification as before
    if (logoCount > 0) {
      const imgSrc = await logoImage.first().getAttribute('src');
      expect(imgSrc).not.toContain('blob:');
      expect(imgSrc).not.toContain('company-logo');
    }
    
    // Take final screenshot
    const timestamp = formatTimestamp(new Date());
    await page.screenshot({ 
      path: getScreenshotPath(`TS.3.1-09-02-${timestamp}.png`),
      fullPage: true 
    });
  });
  
  // Expected Results:
  // 1. Edit modal opens with logo ✓
  // 2. Logo preview disappears ✓
  // 3. Save successful ✓
  // 4. No logo shown on page ✓
  // 5. Page reloads ✓
  // 6. Logo remains removed ✓
});