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

test('TS.5.4-03 Microsoft ID Verification', async ({ page }) => {
  // Test Procedure:
  // 1. Verify Charlotte's signature
  // 2. Select "Microsoft User ID"
  // 3. Confirm Azure AD details shown
  // 4. Save verification
  // 5. Check linked to MS identity (SC)
  
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
  
  // Test Step 1: Verify Charlotte's signature
  await test.step("Verify Charlotte's signature", async () => {
    // Search for Charlotte
    const searchBox = page.getByPlaceholder(/Search/i);
    await searchBox.fill('Charlotte Brown');
    await page.waitForTimeout(1000);
    
    // Find Charlotte's row
    const charlotteRow = page.locator('tr').filter({ hasText: 'Charlotte Brown' });
    
    // Click on row to expand
    await charlotteRow.click();
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
  
  // Test Step 2: Select "Microsoft User ID"
  await test.step('Select "Microsoft User ID"', async () => {
    // Select Microsoft User ID method
    const microsoftOption = page.getByLabel(/Microsoft.*ID/i).or(
      page.locator('input[type="radio"]').filter({ has: page.locator('text=/Microsoft.*ID/i') })
    );
    await microsoftOption.click();
    
    // Wait for Azure AD details to load
    await page.waitForTimeout(1000);
  });
  
  // Test Step 3: Confirm Azure AD details shown
  await test.step('Confirm Azure AD details shown', async () => {
    // Verify tenant information is shown
    await expect(page.getByText(/Tenant.*xmwkb|xmwkb.*tenant/i)).toBeVisible();
    
    // Verify object ID is shown (format: GUID)
    const objectIdPattern = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;
    await expect(page.getByText(objectIdPattern)).toBeVisible();
    
    // Verify user principal name or email is shown
    await expect(page.getByText(/charlotte.*@.*xmwkb/i)).toBeVisible();
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
    
    // Verify success message
    await expect(page.getByText(/Verification.*saved|Successfully verified/i)).toBeVisible();
  });
  
  // Test Step 5: Check linked to MS identity (SC)
  await test.step('Check linked to MS identity (SC)', async () => {
    // Refresh search
    const searchBox = page.getByPlaceholder(/Search/i);
    await searchBox.clear();
    await searchBox.fill('Charlotte Brown');
    await page.waitForTimeout(1000);
    
    // Click on Charlotte's row
    const charlotteRow = page.locator('tr').filter({ hasText: 'Charlotte Brown' });
    await charlotteRow.click();
    await page.waitForTimeout(1000);
    
    // Take screenshot
    const timestamp = formatTimestamp(new Date());
    await page.screenshot({ 
      path: getScreenshotPath(`TS.5.4-03-${timestamp}.png`),
      fullPage: true 
    });
    
    // Verify MS Verified status
    const expandedDetails = page.locator('[data-testid="user-details"], [aria-expanded="true"]');
    await expect(expandedDetails).toBeVisible();
    await expect(expandedDetails).toContainText(/MS.*Verified|Microsoft.*Verified/i);
    
    // Verify linked to Microsoft identity
    await expect(expandedDetails).toContainText(/Microsoft.*Identity|Azure.*AD/i);
  });
  
  // Expected Results:
  // 1. Modal opens ✓
  // 2. MS option available ✓
  // 3. Shows tenant/object ID ✓
  // 4. Verification saved ✓
  // 5. Shows "MS Verified" ✓
});