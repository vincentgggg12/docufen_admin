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

test('TS.5.3-01 Self-Demotion Prevention', async ({ page }) => {
  // Test Procedure:
  // 1. Login as Megan (Trial Admin)
  // 2. Navigate to Users, find self
  // 3. Click edit on own account
  // 4. Try to change role to Creator
  // 5. Verify can only switch to Site Admin (SC)
  
  // Setup: Login as Megan (not reported as test step)
  const email = process.env.MS_EMAIL_17NJ5D_MEGAN_BOWEN!;
  const password = process.env.MS_PASSWORD!;
  
  // Navigate to login page
  await page.goto(`${baseUrl}/login`);
  
  // Perform Microsoft login
  await microsoftLogin(page, email, password);
  
  // Handle ERSD if needed
  await handleERSDDialog(page);
  
  // Wait for navigation
  await page.waitForLoadState('domcontentloaded');
  
  // Test Step 1: Login as Megan (Trial Admin)
  await test.step('Login as Megan (Trial Admin)', async () => {
    // Verify we're logged in as Megan
    await expect(page).toHaveURL(/.*\/documents/);
  });
  
  // Test Step 2: Navigate to Users, find self
  await test.step('Navigate to Users, find self', async () => {
    await page.getByRole('button', { name: 'Menu' }).click();
    await page.getByRole('link', { name: 'Users' }).click();
    await page.waitForSelector('text=Users', { timeout: 10000 });
    
    // Search for Megan
    const searchBox = page.getByPlaceholder(/Search/i);
    await searchBox.fill('Megan Bowen');
    await page.waitForTimeout(1000);
    
    // Verify Megan is visible
    await expect(page.getByText('Megan Bowen')).toBeVisible();
  });
  
  // Test Step 3: Click edit on own account
  await test.step('Click edit on own account', async () => {
    // Find Megan's row
    const meganRow = page.locator('tr').filter({ hasText: 'Megan Bowen' });
    
    // Click edit button
    const editButton = meganRow.locator('button[aria-label*="Edit"], [data-testid="edit-user"]');
    await editButton.click();
    
    // Wait for edit modal to open
    await page.waitForTimeout(1000);
    
    // Verify edit modal is open
    const editModal = page.locator('[role="dialog"], [data-testid="edit-user-modal"]');
    await expect(editModal).toBeVisible();
  });
  
  // Test Step 4: Try to change role to Creator
  await test.step('Try to change role to Creator', async () => {
    // Click role dropdown
    const roleDropdown = page.getByLabel(/Role/i);
    await roleDropdown.click();
    await page.waitForTimeout(500);
    
    // Check if Creator option is disabled
    const creatorOption = page.getByRole('option', { name: /Creator/i });
    const isDisabled = await creatorOption.getAttribute('aria-disabled') || await creatorOption.isDisabled();
    
    expect(isDisabled).toBeTruthy();
  });
  
  // Test Step 5: Verify can only switch to Site Admin (SC)
  await test.step('Verify can only switch to Site Admin (SC)', async () => {
    // Take screenshot
    const timestamp = formatTimestamp(new Date());
    await page.screenshot({ 
      path: getScreenshotPath(`TS.5.3-01-${timestamp}.png`),
      fullPage: true 
    });
    
    // Verify Site Administrator is selectable
    const siteAdminOption = page.getByRole('option', { name: /Site Administrator/i });
    await expect(siteAdminOption).toBeVisible();
    const siteAdminDisabled = await siteAdminOption.getAttribute('aria-disabled') || await siteAdminOption.isDisabled();
    expect(siteAdminDisabled).toBeFalsy();
    
    // Verify other non-admin roles are disabled
    const userManagerOption = page.getByRole('option', { name: /User Manager/i });
    const userManagerDisabled = await userManagerOption.getAttribute('aria-disabled') || await userManagerOption.isDisabled();
    expect(userManagerDisabled).toBeTruthy();
    
    const collaboratorOption = page.getByRole('option', { name: /Collaborator/i });
    const collaboratorDisabled = await collaboratorOption.getAttribute('aria-disabled') || await collaboratorOption.isDisabled();
    expect(collaboratorDisabled).toBeTruthy();
    
    // Close modal
    await page.keyboard.press('Escape');
  });
  
  // Expected Results:
  // 1. Login successful ✓
  // 2. Own account visible ✓
  // 3. Edit modal opens ✓
  // 4. Creator option disabled ✓
  // 5. Only Site Admin selectable ✓
});