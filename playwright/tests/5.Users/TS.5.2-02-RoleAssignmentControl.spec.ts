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

test('TS.5.2-02 Role Assignment Control', async ({ page }) => {
  // Test Procedure:
  // 1. As Grady (User Manager), open Add User
  // 2. Check role dropdown options
  // 3. Verify no Administrator roles
  // 4. Login as Megan (Trial Admin)
  // 5. Check all roles available (SC)
  
  // Setup: Login as Grady first (not reported as test step)
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
  
  // Navigate to Users page
  await page.getByRole('button', { name: 'Menu' }).click();
  await page.getByRole('link', { name: 'Users' }).click();
  await page.waitForSelector('text=Users', { timeout: 10000 });
  
  // Test Step 1: As Grady (User Manager), open Add User
  await test.step('As Grady (User Manager), open Add User', async () => {
    const addUserButton = page.getByRole('button', { name: /Add.*User/i });
    await addUserButton.click();
    
    // Wait for modal to open
    await page.waitForTimeout(1000);
    
    // Verify modal is open
    const addUserModal = page.locator('[role="dialog"], [data-testid="add-user-modal"]');
    await expect(addUserModal).toBeVisible();
  });
  
  // Test Step 2: Check role dropdown options
  await test.step('Check role dropdown options', async () => {
    const roleDropdown = page.getByLabel(/Role/i);
    await roleDropdown.click();
    
    // Wait for dropdown to open
    await page.waitForTimeout(500);
  });
  
  // Test Step 3: Verify no Administrator roles
  await test.step('Verify no Administrator roles', async () => {
    // Check available options
    const creatorOption = page.getByRole('option', { name: /Creator/i });
    const collaboratorOption = page.getByRole('option', { name: /Collaborator/i });
    
    await expect(creatorOption).toBeVisible();
    await expect(collaboratorOption).toBeVisible();
    
    // Verify Administrator roles are not available
    const trialAdminOption = page.getByRole('option', { name: /Trial Administrator/i });
    const siteAdminOption = page.getByRole('option', { name: /Site Administrator/i });
    
    await expect(trialAdminOption).not.toBeVisible();
    await expect(siteAdminOption).not.toBeVisible();
    
    // Close modal
    await page.keyboard.press('Escape');
  });
  
  // Test Step 4: Login as Megan (Trial Admin)
  await test.step('Login as Megan (Trial Admin)', async () => {
    // Logout current user
    await page.getByRole('button', { name: 'Menu' }).click();
    await page.getByRole('button', { name: /Sign Out/i }).click();
    await page.waitForTimeout(2000);
    
    // Login as Megan
    const meganEmail = process.env.MS_EMAIL_17NJ5D_MEGAN_BOWEN!;
    await page.goto(`${baseUrl}/login`);
    await microsoftLogin(page, meganEmail, password);
    await handleERSDDialog(page);
    
    // Navigate back to Users page
    await page.getByRole('button', { name: 'Menu' }).click();
    await page.getByRole('link', { name: 'Users' }).click();
    await page.waitForSelector('text=Users', { timeout: 10000 });
  });
  
  // Test Step 5: Check all roles available (SC)
  await test.step('Check all roles available (SC)', async () => {
    // Open Add User modal
    const addUserButton = page.getByRole('button', { name: /Add.*User/i });
    await addUserButton.click();
    await page.waitForTimeout(1000);
    
    // Click role dropdown
    const roleDropdown = page.getByLabel(/Role/i);
    await roleDropdown.click();
    await page.waitForTimeout(500);
    
    // Take screenshot
    const timestamp = formatTimestamp(new Date());
    await page.screenshot({ 
      path: getScreenshotPath(`TS.5.2-02-${timestamp}.png`),
      fullPage: true 
    });
    
    // Verify all 5 roles are available
    const expectedRoles = [
      'Trial Administrator',
      'Site Administrator',
      'User Manager',
      'Creator',
      'Collaborator'
    ];
    
    for (const role of expectedRoles) {
      const roleOption = page.getByRole('option', { name: new RegExp(role, 'i') });
      await expect(roleOption).toBeVisible();
    }
    
    // Close modal
    await page.keyboard.press('Escape');
  });
  
  // Expected Results:
  // 1. Modal opens ✓
  // 2. Dropdown shows roles ✓
  // 3. Only Creator/Collaborator shown ✓
  // 4. Login successful ✓
  // 5. All 5 roles available to select ✓
});