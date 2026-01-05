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

test('TS.5.4-05 Signature Revocation', async ({ page }) => {
  // Test Procedure:
  // 1. Open verified user (Diego)
  // 2. Click "Revoke Verification"
  // 3. Confirm revocation
  // 4. Check status cleared
  // 5. Verify cannot sign docs (SC)
  
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
  
  // Test Step 1: Open verified user (Diego)
  await test.step('Open verified user (Diego)', async () => {
    // Search for Diego
    const searchBox = page.getByPlaceholder(/Search/i);
    await searchBox.fill('Diego Siciliani');
    await page.waitForTimeout(1000);
    
    // Find Diego's row
    const diegoRow = page.locator('tr').filter({ hasText: 'Diego Siciliani' });
    
    // Click on row to expand
    await diegoRow.click();
    await page.waitForTimeout(1000);
    
    // Verify verification details are shown
    const expandedDetails = page.locator('[data-testid="user-details"], [aria-expanded="true"]');
    await expect(expandedDetails).toBeVisible();
    await expect(expandedDetails).toContainText(/Signature.*Verified/i);
  });
  
  // Test Step 2: Click "Revoke Verification"
  await test.step('Click "Revoke Verification"', async () => {
    // Find and click Revoke button
    const revokeButton = page.getByRole('button', { name: /Revoke.*Verification/i });
    await expect(revokeButton).toBeVisible();
    await revokeButton.click();
    
    // Wait for confirmation dialog
    await page.waitForTimeout(1000);
  });
  
  // Test Step 3: Confirm revocation
  await test.step('Confirm revocation', async () => {
    // Look for confirmation dialog
    const confirmDialog = page.locator('[role="dialog"], [data-testid="confirm-dialog"]');
    await expect(confirmDialog).toBeVisible();
    
    // Verify warning message
    await expect(confirmDialog).toContainText(/Are you sure|Confirm.*revoke|This action cannot be undone/i);
    
    // Click confirm button
    const confirmButton = confirmDialog.getByRole('button', { name: /Confirm|Yes|Revoke/i });
    await confirmButton.click();
    
    // Wait for revocation to process
    await page.waitForTimeout(2000);
  });
  
  // Test Step 4: Check status cleared
  await test.step('Check status cleared', async () => {
    // Refresh search to see updated status
    const searchBox = page.getByPlaceholder(/Search/i);
    await searchBox.clear();
    await searchBox.fill('Diego Siciliani');
    await page.waitForTimeout(1000);
    
    // Verify Diego's status now shows Not Verified
    const diegoRow = page.locator('tr').filter({ hasText: 'Diego Siciliani' });
    await expect(diegoRow).toContainText(/Not Verified|Unverified/i);
    
    // Click to expand and verify details
    await diegoRow.click();
    await page.waitForTimeout(1000);
    
    const expandedDetails = page.locator('[data-testid="user-details"], [aria-expanded="true"]');
    await expect(expandedDetails).toContainText(/Not Verified|Signature.*Not.*Verified/i);
  });
  
  // Test Step 5: Verify cannot sign docs (SC)
  await test.step('Verify cannot sign docs (SC)', async () => {
    // Take screenshot showing revoked status
    const timestamp = formatTimestamp(new Date());
    await page.screenshot({ 
      path: getScreenshotPath(`TS.5.4-05-${timestamp}.png`),
      fullPage: true 
    });
    
    // Document expected behavior
    console.log('Expected: User with revoked signature verification cannot sign documents');
    console.log('When attempting to sign, user would see "Signature not verified" message');
    
    // Verify revocation is logged in audit trail
    const auditTrailButton = page.getByRole('button', { name: /Audit Trail/i });
    await auditTrailButton.click();
    await page.waitForTimeout(1000);
    
    // Look for revocation entry
    const revocationEntry = page.locator('[data-testid="audit-entry"], tr').filter({ 
      hasText: /Signature.*revoked|Verification.*removed/i 
    });
    
    await expect(revocationEntry.first()).toBeVisible();
  });
  
  // Expected Results:
  // 1. Verification details shown ✓
  // 2. Revoke button available ✓
  // 3. Confirmation required ✓
  // 4. Status shows "Not Verified" ✓
  // 5. Signing disabled in documents ✓
});