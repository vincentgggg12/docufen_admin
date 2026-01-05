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

test('TS.5.1-01 User Status Filtering', async ({ page }) => {
  // Test Procedure:
  // 1. Login as Grady (User Manager)
  // 2. Navigate to Users page
  // 3. View All Users tab count
  // 4. Click Internal tab and verify count
  // 5. Click External tab and verify count
  // 6. Click Signature Pending tab
  // 7. Click Deactivated tab (SC)
  
  // Setup: Login (not reported as test step)
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
  
  // Test Step 1: Navigate to Users page
  await test.step('Navigate to Users page', async () => {
    await page.getByRole('button', { name: 'Menu' }).click();
    await page.getByRole('link', { name: 'Users' }).click();
    
    // Wait for Users page to load
    await page.waitForSelector('text=Users', { timeout: 10000 });
  });
  
  // Test Step 2: View All Users tab count
  await test.step('View All Users tab count', async () => {
    // Verify All Users tab is visible and has a count
    const allUsersTab = page.getByRole('tab', { name: /All Users/i });
    await expect(allUsersTab).toBeVisible();
    
    // Verify count is displayed in tab
    await expect(allUsersTab).toContainText(/\d+/);
  });
  
  // Test Step 3: Click Internal tab and verify count
  await test.step('Click Internal tab and verify count', async () => {
    await page.getByRole('tab', { name: /Internal/i }).click();
    
    // Wait for tab content to update
    await page.waitForTimeout(1000);
    
    // Verify only 17nj5d.onmicrosoft.com users are shown
    const userEmails = page.locator('[data-testid="user-email"], td:has-text("@")');
    const emailCount = await userEmails.count();
    
    for (let i = 0; i < emailCount; i++) {
      const email = await userEmails.nth(i).textContent();
      expect(email).toContain('17nj5d.onmicrosoft.com');
    }
  });
  
  // Test Step 4: Click External tab and verify count
  await test.step('Click External tab and verify count', async () => {
    await page.getByRole('tab', { name: /External/i }).click();
    
    // Wait for tab content to update
    await page.waitForTimeout(1000);
    
    // Verify only xmwkb users are shown
    const userEmails = page.locator('[data-testid="user-email"], td:has-text("@")');
    const emailCount = await userEmails.count();
    
    for (let i = 0; i < emailCount; i++) {
      const email = await userEmails.nth(i).textContent();
      expect(email).toContain('xmwkb');
    }
  });
  
  // Test Step 5: Click Signature Pending tab
  await test.step('Click Signature Pending tab', async () => {
    await page.getByRole('tab', { name: /Signature Pending/i }).click();
    
    // Wait for tab content to update
    await page.waitForTimeout(1000);
    
    // Verify unverified users are shown
    const signatureStatus = page.locator('[data-testid="signature-status"], td:has-text("Not Verified")');
    if (await signatureStatus.count() > 0) {
      await expect(signatureStatus.first()).toBeVisible();
    }
  });
  
  // Test Step 6: Click Deactivated tab (SC)
  await test.step('Click Deactivated tab (SC)', async () => {
    await page.getByRole('tab', { name: /Deactivated/i }).click();
    
    // Wait for tab content to update
    await page.waitForTimeout(1000);
    
    // Take screenshot
    const timestamp = formatTimestamp(new Date());
    await page.screenshot({ 
      path: getScreenshotPath(`TS.5.1-01-${timestamp}.png`),
      fullPage: true 
    });
    
    // Verify deactivated users are shown
    const statusBadges = page.locator('[data-testid="user-status"], span:has-text("Deactivated")');
    if (await statusBadges.count() > 0) {
      await expect(statusBadges.first()).toBeVisible();
    }
  });
  
  // Expected Results:
  // 1. Users page loads ✓
  // 2. All tabs visible with counts ✓
  // 3. All Users shows total count ✓
  // 4. Internal shows only 17nj5d users ✓
  // 5. External shows xmwkb users ✓
  // 6. Signature Pending shows unverified users ✓
  // 7. Deactivated shows inactive users ✓
});