import { test, expect } from '@playwright/test';
import { microsoftLogin } from '../utils/msLogin';
import { handleERSDDialog } from '../utils/ersd-handler';
import { getScreenshotPath } from '../utils/paths';
import { navigateToAccount } from '../utils/navigateToAccount';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Get __dirname equivalent in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

test('TS.3.1-08 Upload Company Logo', async ({ page }) => {
  // Test Procedure:
  // 1. Click Edit company info button
  // 2. Click Upload Logo
  // 3. Select a PNG file (max 512KB)
  // 4. Save changes
  // 5. Verify logo displays on account page (SC)
  // 6. Reload the page (F5/refresh)
  // 7. Verify logo still displays (SC)
  
  // FS ID: FS.3.1-04
  
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
  
  // Test Step 1: Click Edit company info button
  await test.step('Click Edit company info button', async () => {
    // Verify we're on the account page
    await expect(page).toHaveURL(/.*\/account/);
    
    // Wait for the Company Information section to be visible
    await page.waitForSelector('text=Company Information', { timeout: 10000 });
    
    // Find and click the Edit button for Company Information
    const editButton = page.getByTestId("accountPage.editCompanyInfoButton").first();
    await editButton.click();
    
    // Wait for the edit form to appear
    await page.waitForTimeout(100); // Small wait for form transition
    
    // Expected Result: Edit modal opens
    // Verify edit form is visible
    const companyNameInput = page.getByTestId('accountPage.companyNameInput');
    await expect(companyNameInput).toBeVisible();
  });
  
  // Test Step 2 & 3: Click Upload Logo and Select a PNG file
  await test.step('Click Upload Logo and select file', async () => {
    // Wait for the upload button to be visible first
    const uploadButton = page.getByTestId('accountPage.uploadLogoLabel');
    await expect(uploadButton).toBeVisible({ timeout: 5000 });
    
    // Expected Result: File picker opens
    // Set up file chooser before clicking the button
    const [fileChooser] = await Promise.all([
      page.waitForEvent('filechooser'),
      uploadButton.click()
    ]);
    
    // Verify file chooser was triggered
    expect(fileChooser).toBeTruthy();
    
    // Select the logo file
    const logoPath = path.join(__dirname, '../../../src/assets/docufen_logo.png');
    await fileChooser.setFiles(logoPath);
    
    // Wait for file to be processed and preview to appear
    await page.waitForTimeout(2000); // Increased wait time
    
    // Expected Result: Logo preview shows
    // Try multiple selectors as fallback
    const preview = await page.getByTestId('accountPage.logoPreview').or(
      page.locator('img[data-testid="accountPage.logoPreview"]')
    ).or(
      page.locator('[data-testid="accountPage.logoPreview"]')
    );
    
    await expect(preview).toBeVisible({ timeout: 10000 });
  });
  
  // Test Step 4: Save changes
  await test.step('Save changes', async () => {
    // Click the Save button
    const saveButton = page.getByTestId("accountPage.saveChangesButton");
    await saveButton.click();
    
    // Wait for save to complete
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000); // Give time for the save operation and modal to close
    
    // Expected Result: Save successful
    // Look for success message or verify form closes
    await expect(page.getByTestId('accountPage.companyNameInput')).not.toBeVisible({ timeout: 5000 });
  });
  
  // Test Step 5: Verify logo displays on account page (SC)
  await test.step('Verify logo displays on account page (SC)', async () => {
    // Wait for the logo to appear on the page
    const companyLogo = page.getByTestId('accountPage.companyLogo').or(
                       page.locator('img[alt*="Company logo"]')).or(
                       page.locator('.company-logo img'));
    
    await expect(companyLogo).toBeVisible({ timeout: 10000 });
    
    // Take screenshot showing the logo
    const timestamp = formatTimestamp(new Date());
    await page.screenshot({ 
      path: getScreenshotPath(`TS.3.1-08-logo-displayed-${timestamp}.png`),
      fullPage: true 
    });
    
    // Expected Result: Logo displays on account page
    // Verify the logo has a valid src attribute
    const logoSrc = await companyLogo.getAttribute('src');
    expect(logoSrc).toBeTruthy();
    expect(logoSrc).not.toBe('');
  });
  
  // Test Step 6: Reload the page (F5/refresh)
  await test.step('Reload the page (F5/refresh)', async () => {
    // Reload the page
    await page.reload();
    
    // Wait for the page to load
    await page.waitForLoadState('domcontentloaded');
    
    // Expected Result: Page reloads
    await expect(page).toHaveURL(/.*\/account/);
  });
  
  // Test Step 7: Verify logo still displays (SC)
  await test.step('Verify logo still displays (SC)', async () => {
    // Wait for the logo to appear after reload
    const companyLogo = page.getByTestId('accountPage.companyLogo').or(
                       page.locator('img[alt*="Company logo"]')).or(
                       page.locator('.company-logo img'));
    
    await expect(companyLogo).toBeVisible({ timeout: 10000 });
    
    // Take screenshot showing the logo persists
    const timestamp = formatTimestamp(new Date());
    await page.screenshot({ 
      path: getScreenshotPath(`TS.3.1-08-logo-persisted-${timestamp}.png`),
      fullPage: true 
    });
    
    // Expected Result: Logo persists and displays correctly
    // Verify the logo still has a valid src attribute
    const logoSrc = await companyLogo.getAttribute('src');
    expect(logoSrc).toBeTruthy();
    expect(logoSrc).not.toBe('');
    
    // Additional verification: Check that it's not a default/placeholder image
    expect(logoSrc).not.toContain('placeholder');
    expect(logoSrc).not.toContain('default');
  });
  
  // Expected Results Summary:
  // 1. Edit modal opens ✓
  // 2. File picker opens ✓
  // 3. Logo preview shows ✓
  // 4. Save successful ✓
  // 5. Logo displays on account page ✓
  // 6. Page reloads ✓
  // 7. Logo persists and displays correctly ✓
});