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

test('TS.3.2-03 Reset ERSD Acceptance', async ({ page, baseURL }) => {
  // Test Procedure:
  // 1. Select Johanna Lorenz
  // 2. Click "Reset ERSD"
  // 3. Confirm action
  // 4. Verify status shows "Not Accepted" (SC)
  // 5. Reload the page (F5/refresh)
  // 6. Verify Johanna's status still shows "Not Accepted" (SC)
  
  // FS ID: FS.3.2-03
  
  // Setup: Login as Grady (User Manager) who can manage ERSD acceptances
  const email = process.env.MS_EMAIL_17NJ5D_GRADY_ARCHIE!;
  const password = process.env.MS_PASSWORD!;
  
  // Navigate to login page
  await page.goto(`${baseURL}/login`);
  
  // Perform Microsoft login
  await microsoftLogin(page, email, password);
  
  // Handle ERSD if needed
  await handleERSDDialog(page);
  
  // Wait for navigation
  await page.waitForLoadState('domcontentloaded');
  
  // Test Step 1-3: Select Johanna Lorenz and click Reset ERSD
  await test.step('Select Johanna Lorenz and reset ERSD', async () => {
    // User Managers are redirected to /users page by default
    // The user management page should show ERSD status
    await page.waitForSelector('text=User Management', { timeout: 10000 });
    
    // Look for Johanna Lorenz in the user table
    const johannaRow = page.locator('tr', { hasText: 'Johanna Lorenz' });
    await expect(johannaRow).toBeVisible();
    
    // Find the Reset ERSD button for Johanna
    const resetButton = johannaRow.locator('button', { hasText: /Reset ERSD/i });
    await expect(resetButton).toBeEnabled();
    
    // Click Reset ERSD button
    await resetButton.click();
    
    // Wait for confirmation dialog
    await page.waitForSelector('[role="dialog"]', { timeout: 5000 });
    
    // Confirm the action
    const confirmButton = page.getByRole('button', { name: /Confirm|Yes|Reset/i });
    await confirmButton.click();
    
    // Wait for dialog to close and action to complete
    await page.waitForSelector('[role="dialog"]', { state: 'hidden', timeout: 5000 });
  });
  
  // Test Step 4: Verify status shows "Not Accepted" (SC)
  await test.step('Verify status shows "Not Accepted" (SC)', async () => {
    // Wait for the table to update
    await page.waitForTimeout(1000);
    
    // Find Johanna's row again
    const johannaRow = page.locator('tr', { hasText: 'Johanna Lorenz' });
    
    // Check ERSD status column
    const ersdStatus = johannaRow.locator('td').filter({ hasText: /Not Accepted|Not signed/i });
    await expect(ersdStatus).toBeVisible();
    
    // Take screenshot
    const timestamp = formatTimestamp(new Date());
    await page.screenshot({ 
      path: getScreenshotPath(`TS.3.2-03-01-${timestamp}.png`),
      fullPage: true 
    });
  });
  
  // Test Step 5: Reload the page
  await test.step('Reload the page (F5/refresh)', async () => {
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    // Wait for the user table to load
    await page.waitForSelector('text=User Management', { timeout: 10000 });
  });
  
  // Test Step 6: Verify Johanna's status still shows "Not Accepted" (SC)
  await test.step('Verify Johanna\'s status persists as "Not Accepted" (SC)', async () => {
    // Find Johanna's row again after reload
    const johannaRow = page.locator('tr', { hasText: 'Johanna Lorenz' });
    await expect(johannaRow).toBeVisible();
    
    // Check ERSD status column still shows Not Accepted
    const ersdStatus = johannaRow.locator('td').filter({ hasText: /Not Accepted|Not signed/i });
    await expect(ersdStatus).toBeVisible();
    
    // Take screenshot
    const timestamp = formatTimestamp(new Date());
    await page.screenshot({ 
      path: getScreenshotPath(`TS.3.2-03-02-${timestamp}.png`),
      fullPage: true 
    });
  });
  
  // Expected Results:
  // 1. Reset button enabled ✓
  // 2. Confirmation dialog appears ✓
  // 3. Reset completes ✓
  // 4. Status changes to "Not Accepted" ✓
  // 5. Page reloads successfully ✓
  // 6. Johanna's ERSD status persists as "Not Accepted" ✓
});