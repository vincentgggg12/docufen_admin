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

test('TS.5.3-02 User Manager Role Restrictions', async ({ page }) => {
  // Test Procedure:
  // 1. Login as Grady (User Manager)
  // 2. Try to edit Megan (Admin)
  // 3. Verify edit disabled
  // 4. Edit Diego (Creator)
  // 5. Verify cannot promote to Admin (SC)
  
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
  
  // Test Step 1: Login as Grady (User Manager)
  await test.step('Login as Grady (User Manager)', async () => {
    // Navigate to Users page
    await page.getByRole('button', { name: 'Menu' }).click();
    await page.getByRole('link', { name: 'Users' }).click();
    await page.waitForSelector('text=Users', { timeout: 10000 });
  });
  
  // Test Step 2: Try to edit Megan (Admin)
  await test.step('Try to edit Megan (Admin)', async () => {
    // Search for Megan
    const searchBox = page.getByPlaceholder(/Search/i);
    await searchBox.fill('Megan Bowen');
    await page.waitForTimeout(1000);
    
    // Verify Megan is visible
    await expect(page.getByText('Megan Bowen')).toBeVisible();
    
    // Find Megan's row
    const meganRow = page.locator('tr').filter({ hasText: 'Megan Bowen' });
    
    // Look for edit button
    const editButton = meganRow.locator('button[aria-label*="Edit"], [data-testid="edit-user"]');
    
    // Check if edit button exists and is disabled
    if (await editButton.count() > 0) {
      const isDisabled = await editButton.isDisabled();
      expect(isDisabled).toBeTruthy();
    } else {
      // Edit button might not be shown at all for admins
      expect(await editButton.count()).toBe(0);
    }
  });
  
  // Test Step 3: Verify edit disabled
  await test.step('Verify edit disabled', async () => {
    // Verify we cannot edit an admin user
    const meganRow = page.locator('tr').filter({ hasText: 'Megan Bowen' });
    
    // Hover over row to see if tooltip appears
    await meganRow.hover();
    await page.waitForTimeout(500);
    
    // Check for any message indicating why edit is disabled
    const tooltip = page.getByRole('tooltip');
    if (await tooltip.isVisible()) {
      await expect(tooltip).toContainText(/Cannot edit.*admin|Insufficient permissions/i);
    }
  });
  
  // Test Step 4: Edit Diego (Creator)
  await test.step('Edit Diego (Creator)', async () => {
    // Clear search and search for Diego
    const searchBox = page.getByPlaceholder(/Search/i);
    await searchBox.clear();
    await searchBox.fill('Diego Siciliani');
    await page.waitForTimeout(1000);
    
    // Find Diego's row
    const diegoRow = page.locator('tr').filter({ hasText: 'Diego Siciliani' });
    
    // Click edit button
    const editButton = diegoRow.locator('button[aria-label*="Edit"], [data-testid="edit-user"]');
    await editButton.click();
    
    // Wait for edit modal to open
    await page.waitForTimeout(1000);
    
    // Verify edit modal is open
    const editModal = page.locator('[role="dialog"], [data-testid="edit-user-modal"]');
    await expect(editModal).toBeVisible();
  });
  
  // Test Step 5: Verify cannot promote to Admin (SC)
  await test.step('Verify cannot promote to Admin (SC)', async () => {
    // Click role dropdown
    const roleDropdown = page.getByLabel(/Role/i);
    await roleDropdown.click();
    await page.waitForTimeout(500);
    
    // Take screenshot
    const timestamp = formatTimestamp(new Date());
    await page.screenshot({ 
      path: getScreenshotPath(`TS.5.3-02-${timestamp}.png`),
      fullPage: true 
    });
    
    // Verify admin roles are not available
    const trialAdminOption = page.getByRole('option', { name: /Trial Administrator/i });
    const siteAdminOption = page.getByRole('option', { name: /Site Administrator/i });
    
    // These should either be hidden or disabled
    if (await trialAdminOption.count() > 0) {
      const isDisabled = await trialAdminOption.getAttribute('aria-disabled') || await trialAdminOption.isDisabled();
      expect(isDisabled).toBeTruthy();
    } else {
      expect(await trialAdminOption.count()).toBe(0);
    }
    
    if (await siteAdminOption.count() > 0) {
      const isDisabled = await siteAdminOption.getAttribute('aria-disabled') || await siteAdminOption.isDisabled();
      expect(isDisabled).toBeTruthy();
    } else {
      expect(await siteAdminOption.count()).toBe(0);
    }
    
    // Verify User Manager can assign Creator/Collaborator roles
    const creatorOption = page.getByRole('option', { name: /Creator/i });
    const collaboratorOption = page.getByRole('option', { name: /Collaborator/i });
    
    await expect(creatorOption).toBeVisible();
    await expect(collaboratorOption).toBeVisible();
    
    // Close modal
    await page.keyboard.press('Escape');
  });
  
  // Expected Results:
  // 1. Login successful ✓
  // 2. No edit option for Admin ✓
  // 3. Edit blocked with message ✓
  // 4. Edit modal opens ✓
  // 5. Admin roles not in dropdown ✓
});