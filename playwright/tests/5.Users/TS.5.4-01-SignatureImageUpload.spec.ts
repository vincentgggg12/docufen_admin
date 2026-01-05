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

test('TS.5.4-01 Signature Image Upload', async ({ page }) => {
  // Test Procedure:
  // 1. Click "Verify Digital Signature" for Diego
  // 2. Select "Image Upload" method
  // 3. Upload PNG signature file
  // 4. Save verification
  // 5. Check status updated (SC)
  
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
  
  // Test Step 1: Click "Verify Digital Signature" for Diego
  await test.step('Click "Verify Digital Signature" for Diego', async () => {
    // Search for Diego
    const searchBox = page.getByPlaceholder(/Search/i);
    await searchBox.fill('Diego Siciliani');
    await page.waitForTimeout(1000);
    
    // Find Diego's row
    const diegoRow = page.locator('tr').filter({ hasText: 'Diego Siciliani' });
    
    // Click on row to expand or find verify button
    await diegoRow.click();
    await page.waitForTimeout(1000);
    
    // Click Verify Digital Signature button
    const verifyButton = page.getByRole('button', { name: /Verify.*Signature/i });
    await verifyButton.click();
    
    // Wait for modal to open
    await page.waitForTimeout(1000);
  });
  
  // Test Step 2: Select "Image Upload" method
  await test.step('Select "Image Upload" method', async () => {
    // Verify modal is open
    const verificationModal = page.locator('[role="dialog"], [data-testid="signature-verification-modal"]');
    await expect(verificationModal).toBeVisible();
    
    // Verify three methods are shown
    await expect(page.getByText(/Image Upload/i)).toBeVisible();
    await expect(page.getByText(/Register Notation/i)).toBeVisible();
    await expect(page.getByText(/Microsoft User ID/i)).toBeVisible();
    
    // Select Image Upload method
    const imageUploadOption = page.getByLabel(/Image Upload/i).or(
      page.locator('input[type="radio"]').filter({ has: page.locator('text=/Image Upload/i') })
    );
    await imageUploadOption.click();
  });
  
  // Test Step 3: Upload PNG signature file
  await test.step('Upload PNG signature file', async () => {
    // Use a test signature image (we'll use one of the existing test images as a placeholder)
    const signatureFilePath = path.join(process.cwd(), 'playwright/tests/WordDocuments/5mb.png');
    
    // Find file input
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(signatureFilePath);
    
    // Wait for file to be processed
    await page.waitForTimeout(1000);
    
    // Verify file was uploaded
    await expect(page.getByText(/5mb\.png|File selected/i)).toBeVisible();
  });
  
  // Test Step 4: Save verification
  await test.step('Save verification', async () => {
    // Click save button
    const saveButton = page.getByRole('button', { name: /Save|Verify|Confirm/i });
    await saveButton.click();
    
    // Wait for save to complete
    await page.waitForTimeout(2000);
    
    // Verify modal closed
    const verificationModal = page.locator('[role="dialog"], [data-testid="signature-verification-modal"]');
    await expect(verificationModal).not.toBeVisible();
  });
  
  // Test Step 5: Check status updated (SC)
  await test.step('Check status updated (SC)', async () => {
    // Refresh search to see updated status
    const searchBox = page.getByPlaceholder(/Search/i);
    await searchBox.clear();
    await searchBox.fill('Diego Siciliani');
    await page.waitForTimeout(1000);
    
    // Take screenshot
    const timestamp = formatTimestamp(new Date());
    await page.screenshot({ 
      path: getScreenshotPath(`TS.5.4-01-${timestamp}.png`),
      fullPage: true 
    });
    
    // Verify Diego's signature status shows as Verified
    const diegoRow = page.locator('tr').filter({ hasText: 'Diego Siciliani' });
    await expect(diegoRow).toContainText(/Verified|✓/);
    
    // Click to expand and verify details
    await diegoRow.click();
    await page.waitForTimeout(1000);
    
    // Verify signature verification details are shown
    const expandedDetails = page.locator('[data-testid="user-details"], [aria-expanded="true"]');
    await expect(expandedDetails).toContainText(/Signature.*Verified/i);
  });
  
  // Expected Results:
  // 1. Modal opens ✓
  // 2. Three methods shown ✓
  // 3. File uploads successfully ✓
  // 4. Verification saved ✓
  // 5. Status shows "Verified" ✓
});