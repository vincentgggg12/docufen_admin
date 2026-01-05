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

test('TS.5.4-02 Register Notation Entry', async ({ page }) => {
  // Test Procedure:
  // 1. Verify Henrietta's signature
  // 2. Select "Register Notation"
  // 3. Enter "Register Page 45, Entry 3"
  // 4. Save notation
  // 5. View verification details (SC)
  
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
  
  // Test Step 1: Verify Henrietta's signature
  await test.step("Verify Henrietta's signature", async () => {
    // Search for Henrietta
    const searchBox = page.getByPlaceholder(/Search/i);
    await searchBox.fill('Henrietta');
    await page.waitForTimeout(1000);
    
    // Find Henrietta's row
    const henriettaRow = page.locator('tr').filter({ hasText: 'Henrietta' });
    
    // Click on row to expand
    await henriettaRow.click();
    await page.waitForTimeout(1000);
    
    // Click Verify Digital Signature button
    const verifyButton = page.getByRole('button', { name: /Verify.*Signature/i });
    await verifyButton.click();
    
    // Wait for modal to open
    await page.waitForTimeout(1000);
    
    // Verify modal is open
    const verificationModal = page.locator('[role="dialog"], [data-testid="signature-verification-modal"]');
    await expect(verificationModal).toBeVisible();
  });
  
  // Test Step 2: Select "Register Notation"
  await test.step('Select "Register Notation"', async () => {
    // Select Register Notation method
    const registerNotationOption = page.getByLabel(/Register Notation/i).or(
      page.locator('input[type="radio"]').filter({ has: page.locator('text=/Register Notation/i') })
    );
    await registerNotationOption.click();
    
    // Wait for text field to appear
    await page.waitForTimeout(500);
    
    // Verify text field is visible
    const notationField = page.getByLabel(/Notation|Register.*Entry/i);
    await expect(notationField).toBeVisible();
  });
  
  // Test Step 3: Enter "Register Page 45, Entry 3"
  await test.step('Enter "Register Page 45, Entry 3"', async () => {
    const notationField = page.getByLabel(/Notation|Register.*Entry/i);
    await notationField.fill('Register Page 45, Entry 3');
    
    // Verify text was entered
    const fieldValue = await notationField.inputValue();
    expect(fieldValue).toBe('Register Page 45, Entry 3');
  });
  
  // Test Step 4: Save notation
  await test.step('Save notation', async () => {
    // Click save button
    const saveButton = page.getByRole('button', { name: /Save|Verify|Confirm/i });
    await saveButton.click();
    
    // Wait for save to complete
    await page.waitForTimeout(2000);
    
    // Verify modal closed
    const verificationModal = page.locator('[role="dialog"], [data-testid="signature-verification-modal"]');
    await expect(verificationModal).not.toBeVisible();
    
    // Verify success message or status update
    await expect(page.getByText(/Verification.*saved|Successfully verified/i)).toBeVisible();
  });
  
  // Test Step 5: View verification details (SC)
  await test.step('View verification details (SC)', async () => {
    // Refresh search to ensure we see updated data
    const searchBox = page.getByPlaceholder(/Search/i);
    await searchBox.clear();
    await searchBox.fill('Henrietta');
    await page.waitForTimeout(1000);
    
    // Click on Henrietta's row
    const henriettaRow = page.locator('tr').filter({ hasText: 'Henrietta' });
    await henriettaRow.click();
    await page.waitForTimeout(1000);
    
    // Take screenshot
    const timestamp = formatTimestamp(new Date());
    await page.screenshot({ 
      path: getScreenshotPath(`TS.5.4-02-${timestamp}.png`),
      fullPage: true 
    });
    
    // Verify verification details show the notation
    const expandedDetails = page.locator('[data-testid="user-details"], [aria-expanded="true"]');
    await expect(expandedDetails).toBeVisible();
    await expect(expandedDetails).toContainText(/Register Page 45, Entry 3/);
    await expect(expandedDetails).toContainText(/Signature.*Verified/i);
  });
  
  // Expected Results:
  // 1. Modal opens ✓
  // 2. Text field appears ✓
  // 3. Notation accepted ✓
  // 4. Verification saved ✓
  // 5. Shows notation in details ✓
});