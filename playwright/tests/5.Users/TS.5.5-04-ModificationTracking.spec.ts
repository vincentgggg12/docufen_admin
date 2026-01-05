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

test('TS.5.5-04 Modification Tracking', async ({ page }) => {
  // Test Procedure:
  // 1. Change Ethan's name
  // 2. Update role to Creator
  // 3. Save changes
  // 4. Open audit trail
  // 5. Verify both changes logged (SC)
  
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
  
  // Test Step 1: Change Ethan's name
  await test.step("Change Ethan's name", async () => {
    // Search for Ethan
    const searchBox = page.getByPlaceholder(/Search/i);
    await searchBox.fill('Ethan');
    await page.waitForTimeout(1000);
    
    // Find Ethan's row
    const ethanRow = page.locator('tr').filter({ hasText: 'Ethan' }).first();
    
    // Store original name for comparison
    const originalName = await ethanRow.locator('[data-testid="user-name"], td').first().textContent();
    await page.evaluate((name) => { window.originalName = name; }, originalName);
    
    // Click edit button
    const editButton = ethanRow.locator('button[aria-label*="Edit"], [data-testid="edit-user"]');
    await editButton.click();
    
    // Wait for edit modal
    await page.waitForTimeout(1000);
    
    // Change name
    const nameInput = page.getByLabel(/Legal Name/i);
    await nameInput.clear();
    await nameInput.fill('Ethan James Wilson');
  });
  
  // Test Step 2: Update role to Creator
  await test.step('Update role to Creator', async () => {
    // Store original role
    const roleDropdown = page.getByLabel(/Role/i);
    const originalRole = await roleDropdown.inputValue();
    await page.evaluate((role) => { window.originalRole = role; }, originalRole);
    
    // Change role to Creator
    await roleDropdown.selectOption({ label: 'Creator' });
    
    // Verify role changed
    const newRole = await roleDropdown.inputValue();
    expect(newRole).not.toBe(originalRole);
  });
  
  // Test Step 3: Save changes
  await test.step('Save changes', async () => {
    // Save the changes
    const saveButton = page.getByRole('button', { name: /Save|Update/i });
    await saveButton.click();
    
    // Wait for save to complete
    await page.waitForTimeout(2000);
    
    // Verify modal closed
    const editModal = page.locator('[role="dialog"], [data-testid="edit-user-modal"]');
    await expect(editModal).not.toBeVisible();
    
    // Verify changes were saved
    const searchBox = page.getByPlaceholder(/Search/i);
    await searchBox.clear();
    await searchBox.fill('Ethan James Wilson');
    await page.waitForTimeout(1000);
    
    const ethanRow = page.locator('tr').filter({ hasText: 'Ethan James Wilson' });
    await expect(ethanRow).toBeVisible();
    await expect(ethanRow).toContainText('Creator');
  });
  
  // Test Step 4: Open audit trail
  await test.step('Open audit trail', async () => {
    // Click on Ethan's row to expand
    const ethanRow = page.locator('tr').filter({ hasText: 'Ethan James Wilson' });
    await ethanRow.click();
    await page.waitForTimeout(1000);
    
    // Click Audit Trail button
    const auditTrailButton = page.getByRole('button', { name: /Audit Trail/i });
    await auditTrailButton.click();
    
    // Wait for audit modal to open
    await page.waitForTimeout(1000);
    
    // Verify audit modal is open
    const auditModal = page.locator('[role="dialog"], [data-testid="audit-trail-modal"]');
    await expect(auditModal).toBeVisible();
  });
  
  // Test Step 5: Verify both changes logged (SC)
  await test.step('Verify both changes logged (SC)', async () => {
    // Take screenshot
    const timestamp = formatTimestamp(new Date());
    await page.screenshot({ 
      path: getScreenshotPath(`TS.5.5-04-${timestamp}.png`),
      fullPage: true 
    });
    
    // Look for name change entry
    const nameChangeEntry = page.locator('[data-testid="audit-entry"], tr').filter({ 
      hasText: /Name.*changed|Legal Name.*updated/i 
    });
    
    // Verify name change is logged
    await expect(nameChangeEntry.first()).toBeVisible();
    
    // Get original name from page context
    const originalName = await page.evaluate(() => window.originalName);
    
    // Verify shows old and new name values
    await expect(nameChangeEntry.first()).toContainText('Ethan James Wilson');
    if (originalName && !originalName.includes('Ethan James Wilson')) {
      await expect(nameChangeEntry.first()).toContainText(originalName);
    }
    
    // Look for role change entry
    const roleChangeEntry = page.locator('[data-testid="audit-entry"], tr').filter({ 
      hasText: /Role.*changed|Role.*updated/i 
    });
    
    // Verify role change is logged
    await expect(roleChangeEntry.first()).toBeVisible();
    
    // Verify shows transition to Creator
    await expect(roleChangeEntry.first()).toContainText(/Creator/);
    
    // Verify both entries show modifier (Grady)
    await expect(nameChangeEntry.first()).toContainText(/Grady/);
    await expect(roleChangeEntry.first()).toContainText(/Grady/);
    
    // Verify timestamps are present
    const datePattern = /\d{4}-\d{2}-\d{2}|\d{1,2}\/\d{1,2}\/\d{4}/;
    await expect(nameChangeEntry.first()).toContainText(datePattern);
    await expect(roleChangeEntry.first()).toContainText(datePattern);
  });
  
  // Expected Results:
  // 1. Name updated ✓
  // 2. Role changed ✓
  // 3. Save successful ✓
  // 4. Audit trail shows entries ✓
  // 5. Shows old/new values for each ✓
});