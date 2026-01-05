import { test, expect } from '@playwright/test';
import { microsoftLogin } from '../utils/msLogin';
import { handleERSDDialog } from '../utils/ersd-handler';
import { getScreenshotPath } from '../utils/paths';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.playwright.env' });

const baseUrl = process.env.BASE_URL;

// Set test timeout to 150 seconds (longer due to multiple logins)
test.setTimeout(150000);

test.use({
  viewport: { height: 1080, width: 1920 },
  ignoreHTTPSErrors: true
});

function formatTimestamp(date: Date): string {
  return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}-${String(date.getHours()).padStart(2, '0')}.${String(date.getMinutes()).padStart(2, '0')}.${String(date.getSeconds()).padStart(2, '0')}`;
}

test('TS.5.5-02 ERSD Agreement Reset', async ({ page }) => {
  // Test Procedure:
  // 1. As User Manager, edit Lee
  // 2. Click "Reset ERSD"
  // 3. Confirm reset action
  // 4. Have Lee login
  // 5. Verify ERSD prompt appears (SC)
  
  // Setup: Login as Grady (not reported as test step)
  const gradyEmail = process.env.MS_EMAIL_17NJ5D_GRADY_ADAMS!;
  const password = process.env.MS_PASSWORD!;
  
  // Navigate to login page
  await page.goto(`${baseUrl}/login`);
  
  // Perform Microsoft login
  await microsoftLogin(page, gradyEmail, password);
  
  // Handle ERSD if needed
  await handleERSDDialog(page);
  
  // Wait for navigation
  await page.waitForLoadState('domcontentloaded');
  
  // Test Step 1: As User Manager, edit Lee
  await test.step('As User Manager, edit Lee', async () => {
    // Navigate to Users page
    await page.getByRole('button', { name: 'Menu' }).click();
    await page.getByRole('link', { name: 'Users' }).click();
    await page.waitForSelector('text=Users', { timeout: 10000 });
    
    // Search for Lee
    const searchBox = page.getByPlaceholder(/Search/i);
    await searchBox.fill('Lee Miller');
    await page.waitForTimeout(1000);
    
    // Find Lee's row
    const leeRow = page.locator('tr').filter({ hasText: 'Lee Miller' });
    
    // Click edit button
    const editButton = leeRow.locator('button[aria-label*="Edit"], [data-testid="edit-user"]');
    await editButton.click();
    
    // Wait for edit modal
    await page.waitForTimeout(1000);
    
    // Verify edit modal is open
    const editModal = page.locator('[role="dialog"], [data-testid="edit-user-modal"]');
    await expect(editModal).toBeVisible();
  });
  
  // Test Step 2: Click "Reset ERSD"
  await test.step('Click "Reset ERSD"', async () => {
    // Find Reset ERSD button
    const resetERSDButton = page.getByRole('button', { name: /Reset ERSD/i });
    await expect(resetERSDButton).toBeVisible();
    
    // Click the button
    await resetERSDButton.click();
    
    // Wait for confirmation dialog
    await page.waitForTimeout(1000);
  });
  
  // Test Step 3: Confirm reset action
  await test.step('Confirm reset action', async () => {
    // Look for confirmation dialog
    const confirmDialog = page.locator('[role="dialog"], [data-testid="confirm-dialog"]').last();
    await expect(confirmDialog).toBeVisible();
    
    // Verify confirmation message
    await expect(confirmDialog).toContainText(/Are you sure|Reset ERSD|require.*accept/i);
    
    // Click confirm button
    const confirmButton = confirmDialog.getByRole('button', { name: /Confirm|Yes|Reset/i });
    await confirmButton.click();
    
    // Wait for reset to process
    await page.waitForTimeout(2000);
    
    // Close edit modal if still open
    const editModal = page.locator('[role="dialog"], [data-testid="edit-user-modal"]');
    if (await editModal.isVisible()) {
      const closeButton = editModal.getByRole('button', { name: /Close|Cancel/i });
      await closeButton.click();
    }
  });
  
  // Test Step 4: Have Lee login
  await test.step('Have Lee login', async () => {
    // Logout as Grady
    await page.getByRole('button', { name: 'Menu' }).click();
    await page.getByRole('button', { name: /Sign Out/i }).click();
    await page.waitForTimeout(2000);
    
    // Login as Lee
    const leeEmail = process.env.MS_EMAIL_17NJ5D_LEE_MILLER!;
    
    await page.goto(`${baseUrl}/login`);
    await microsoftLogin(page, leeEmail, password);
    
    // Don't handle ERSD yet - we want to verify it appears
  });
  
  // Test Step 5: Verify ERSD prompt appears (SC)
  await test.step('Verify ERSD prompt appears (SC)', async () => {
    // Wait for ERSD dialog to appear
    await page.waitForTimeout(2000);
    
    // Take screenshot
    const timestamp = formatTimestamp(new Date());
    await page.screenshot({ 
      path: getScreenshotPath(`TS.5.5-02-${timestamp}.png`),
      fullPage: true 
    });
    
    // Verify ERSD dialog is shown
    const ersdDialog = page.locator('[role="dialog"], [data-testid="ersd-dialog"]').filter({ 
      hasText: /Electronic Record.*Signature|ERSD|Terms.*Conditions/i 
    });
    await expect(ersdDialog).toBeVisible();
    
    // Verify must accept to continue
    const acceptButton = ersdDialog.getByRole('button', { name: /Accept|Agree/i });
    const declineButton = ersdDialog.getByRole('button', { name: /Decline|Reject/i });
    
    await expect(acceptButton).toBeVisible();
    await expect(declineButton).toBeVisible();
    
    // Accept ERSD to continue
    await acceptButton.click();
    await page.waitForTimeout(2000);
    
    // Verify user can now access the application
    await expect(page).toHaveURL(/.*\/documents/);
  });
  
  // Expected Results:
  // 1. Edit modal opens ✓
  // 2. Reset ERSD button visible ✓
  // 3. Confirmation required ✓
  // 4. Login shows ERSD ✓
  // 5. Must accept to continue ✓
});