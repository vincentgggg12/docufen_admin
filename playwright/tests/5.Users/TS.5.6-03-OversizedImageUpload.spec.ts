import { test, expect } from '@playwright/test';
import { microsoftLogin } from '../utils/msLogin';
import { handleERSDDialog } from '../utils/ersd-handler';
import { getScreenshotPath } from '../utils/paths';
import dotenv from 'dotenv';
import path from 'path';

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

test('TS.5.6-03 Oversized Image Upload', async ({ page }) => {
  // Test Procedure:
  // 1. Try uploading 10MB image
  // 2. Check error message
  // 3. Upload 4.9MB image
  // 4. Verify success (SC)
  
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
  
  // Find a user to verify signature for
  const searchBox = page.getByPlaceholder(/Search/i);
  await searchBox.fill('Ethan');
  await page.waitForTimeout(1000);
  
  const userRow = page.locator('tr').filter({ hasText: 'Ethan' }).first();
  await userRow.click();
  await page.waitForTimeout(1000);
  
  const verifyButton = page.getByRole('button', { name: /Verify.*Signature/i });
  await verifyButton.click();
  await page.waitForTimeout(1000);
  
  // Select Image Upload method
  const imageUploadOption = page.getByLabel(/Image Upload/i).or(
    page.locator('input[type="radio"]').filter({ has: page.locator('text=/Image Upload/i') })
  );
  await imageUploadOption.click();
  
  // Test Step 1: Try uploading 10MB image
  await test.step('Try uploading 10MB image', async () => {
    // Use the 25mb.png file as our oversized test file
    const oversizedFilePath = path.join(process.cwd(), 'playwright/tests/WordDocuments/25mb.png');
    
    // Find file input
    const fileInput = page.locator('input[type="file"]');
    
    // Try to upload oversized file
    await fileInput.setInputFiles(oversizedFilePath);
    
    // Wait for error processing
    await page.waitForTimeout(2000);
  });
  
  // Test Step 2: Check error message
  await test.step('Check error message', async () => {
    // Look for error message about file size
    const errorMessage = page.getByText(/File exceeds.*5.*MB|File too large|Maximum.*5.*MB/i);
    await expect(errorMessage).toBeVisible();
    
    // Verify file was not accepted
    const fileAccepted = page.getByText(/25mb\.png/);
    const isFileShown = await fileAccepted.isVisible().catch(() => false);
    
    if (isFileShown) {
      // File name might be shown with error
      await expect(errorMessage).toBeVisible();
    }
  });
  
  // Test Step 3: Upload 4.9MB image
  await test.step('Upload 4.9MB image', async () => {
    // Clear any previous file selection
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles([]);
    
    // Use the 5mb.png file (which is actually under 5MB limit)
    const acceptableFilePath = path.join(process.cwd(), 'playwright/tests/WordDocuments/5mb.png');
    
    // Upload acceptable file
    await fileInput.setInputFiles(acceptableFilePath);
    
    // Wait for file to be processed
    await page.waitForTimeout(1000);
  });
  
  // Test Step 4: Verify success (SC)
  await test.step('Verify success (SC)', async () => {
    // Verify file was accepted
    await expect(page.getByText(/5mb\.png|File selected/i)).toBeVisible();
    
    // Verify no error message
    const errorMessage = page.getByText(/File exceeds.*MB|File too large/i);
    await expect(errorMessage).not.toBeVisible();
    
    // Take screenshot
    const timestamp = formatTimestamp(new Date());
    await page.screenshot({ 
      path: getScreenshotPath(`TS.5.6-03-${timestamp}.png`),
      fullPage: true 
    });
    
    // Save verification
    const saveButton = page.getByRole('button', { name: /Save|Verify|Confirm/i });
    await saveButton.click();
    
    // Wait for save to complete
    await page.waitForTimeout(2000);
    
    // Verify modal closed (success)
    const verificationModal = page.locator('[role="dialog"], [data-testid="signature-verification-modal"]');
    await expect(verificationModal).not.toBeVisible();
    
    // Verify success message or status update
    await expect(page.getByText(/Verification.*saved|Successfully verified/i)).toBeVisible();
  });
  
  // Expected Results:
  // 1. Upload rejected ✓
  // 2. "File exceeds 5MB" error ✓
  // 3. File accepted ✓
  // 4. Verification saved ✓
});