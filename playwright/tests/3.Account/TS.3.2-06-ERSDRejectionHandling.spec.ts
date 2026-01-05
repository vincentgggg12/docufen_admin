import { test, expect } from '@playwright/test';
import { microsoftLogin } from '../utils/msLogin';
import { handleERSDDialog } from '../utils/ersd-handler';
import { getScreenshotPath } from '../utils/paths';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.playwright.env' });

// Set test timeout to 240 seconds (longer due to multiple logins)
test.setTimeout(240000);

test.use({
  viewport: { height: 1080, width: 1920 },
  ignoreHTTPSErrors: true
});

function formatTimestamp(date: Date): string {
  return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}-${String(date.getHours()).padStart(2, '0')}.${String(date.getMinutes()).padStart(2, '0')}.${String(date.getSeconds()).padStart(2, '0')}`;
}

test('TS.3.2-06 ERSD Rejection Handling', async ({ page, baseURL }) => {
  // Test Procedure:
  // 1. Reset Lee Gu's ERSD
  // 2. Login as Lee
  // 3. Decline ERSD agreement (SC)
  
  // FS ID: FS.3.2-04
  
  const password = process.env.MS_PASSWORD!;
  
  // Test Step 1: Reset Lee Gu's ERSD (as User Manager)
  await test.step('Reset Lee Gu\'s ERSD', async () => {
    const gradyEmail = process.env.MS_EMAIL_17NJ5D_GRADY_ARCHIE!;
    
    // Navigate to login page
    await page.goto(`${baseURL}/login`);
    
    // Login as Grady (User Manager)
    await microsoftLogin(page, gradyEmail, password);
    
    // Handle ERSD if needed
    await handleERSDDialog(page);
    
    // Wait for navigation to user management page
    await page.waitForLoadState('domcontentloaded');
    await page.waitForSelector('text=User Management', { timeout: 10000 });
    
    // Find Lee Gu in the user table
    const leeRow = page.locator('tr', { hasText: 'Lee Gu' });
    await expect(leeRow).toBeVisible();
    
    // Find and click the Reset ERSD button for Lee
    const resetButton = leeRow.locator('button', { hasText: /Reset ERSD/i });
    await resetButton.click();
    
    // Confirm the reset
    await page.waitForSelector('[role="dialog"]', { timeout: 5000 });
    const confirmButton = page.getByRole('button', { name: /Confirm|Yes|Reset/i });
    await confirmButton.click();
    
    // Wait for dialog to close
    await page.waitForSelector('[role="dialog"]', { state: 'hidden', timeout: 5000 });
    
    // Logout
    await page.getByTestId('lsb.user-profile.trigger').click();
    await page.waitForTimeout(500);
    await page.getByTestId('lsb.user-profile.logoutMenuItem').click();
    await page.waitForURL(/.*\/login/, { timeout: 10000 });
  });
  
  // Test Step 2-3: Login as Lee and decline ERSD
  await test.step('Login as Lee and decline ERSD agreement (SC)', async () => {
    const leeEmail = process.env.MS_EMAIL_17NJ5D_LEE_GU!;
    
    // Perform Microsoft login as Lee
    await microsoftLogin(page, leeEmail, password);
    
    // Wait for ERSD dialog to appear
    await page.waitForSelector('[data-testid="ersd-dialog"]', { timeout: 10000 });
    
    // Verify ERSD prompt appears
    const ersdDialog = page.getByTestId('ersd-dialog');
    await expect(ersdDialog).toBeVisible();
    
    // Verify decline option is available
    const declineButton = page.getByRole('button', { name: /Decline|Cancel|I Do Not Agree/i });
    await expect(declineButton).toBeVisible();
    
    // Wait a moment before screenshot to ensure dialog is fully rendered
    await page.waitForTimeout(500);
    
    // Take screenshot showing ERSD with decline option
    const timestamp = formatTimestamp(new Date());
    await page.screenshot({ 
      path: getScreenshotPath(`TS.3.2-06-${timestamp}.png`),
      fullPage: true 
    });
    
    // Click decline
    await declineButton.click();
    
    // Verify user cannot proceed past ERSD screen
    await page.waitForTimeout(2000);
    
    // Try to navigate to /documents directly
    await page.goto(`${baseURL}/documents`);
    
    // Wait for redirect back to ERSD
    await page.waitForTimeout(2000);
    
    // Verify ERSD dialog is still visible (user redirected back)
    await expect(ersdDialog).toBeVisible();
    
    // Verify user cannot access the system
    await expect(page).not.toHaveURL(/.*\/documents/);
  });
  
  // Expected Results:
  // 1. ERSD prompt appears ✓
  // 2. Decline option available ✓
  // 3. User cannot get passed ERSD screen even if they enter /documents into url ✓
});