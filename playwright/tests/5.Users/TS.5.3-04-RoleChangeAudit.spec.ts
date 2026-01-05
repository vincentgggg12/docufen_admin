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

test('TS.5.3-04 Role Change Audit', async ({ page }) => {
  // Test Procedure:
  // 1. Change Lee from Collaborator to Creator
  // 2. Open Lee's audit trail
  // 3. Find role change entry
  // 4. Verify shows old/new role
  // 5. Check modifier identity (SC)
  
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
  
  // Test Step 1: Change Lee from Collaborator to Creator
  await test.step('Change Lee from Collaborator to Creator', async () => {
    // Search for Lee
    const searchBox = page.getByPlaceholder(/Search/i);
    await searchBox.fill('Lee');
    await page.waitForTimeout(1000);
    
    // Find Lee's row
    const leeRow = page.locator('tr').filter({ hasText: 'Lee' }).first();
    
    // Note current role
    const currentRole = await leeRow.textContent();
    console.log('Current role info:', currentRole);
    
    // Click edit button
    const editButton = leeRow.locator('button[aria-label*="Edit"], [data-testid="edit-user"]');
    await editButton.click();
    
    // Wait for edit modal
    await page.waitForTimeout(1000);
    
    // Change role to Creator
    const roleDropdown = page.getByLabel(/Role/i);
    await roleDropdown.selectOption({ label: 'Creator' });
    
    // Save changes
    const saveButton = page.getByRole('button', { name: /Save|Update/i });
    await saveButton.click();
    
    // Wait for save to complete
    await page.waitForTimeout(2000);
    
    // Verify role updated successfully
    await expect(leeRow).toContainText('Creator');
  });
  
  // Test Step 2: Open Lee's audit trail
  await test.step("Open Lee's audit trail", async () => {
    // Click on Lee's row to expand
    const leeRow = page.locator('tr').filter({ hasText: 'Lee' }).first();
    await leeRow.click();
    await page.waitForTimeout(1000);
    
    // Find and click Audit Trail button
    const auditTrailButton = page.getByRole('button', { name: /Audit Trail/i });
    await auditTrailButton.click();
    
    // Wait for audit modal to open
    await page.waitForTimeout(1000);
    
    // Verify audit modal is open
    const auditModal = page.locator('[role="dialog"], [data-testid="audit-trail-modal"]');
    await expect(auditModal).toBeVisible();
  });
  
  // Test Step 3: Find role change entry
  await test.step('Find role change entry', async () => {
    // Look for role change entry in audit trail
    const roleChangeEntry = page.locator('[data-testid="audit-entry"], tr').filter({ 
      hasText: /Role.*changed|Updated.*role/i 
    });
    
    // Verify role change entry exists
    const entryCount = await roleChangeEntry.count();
    expect(entryCount).toBeGreaterThan(0);
    
    // Focus on the most recent role change
    if (entryCount > 0) {
      await expect(roleChangeEntry.first()).toBeVisible();
    }
  });
  
  // Test Step 4: Verify shows old/new role
  await test.step('Verify shows old/new role', async () => {
    // Look for the role change details
    const roleChangeEntry = page.locator('[data-testid="audit-entry"], tr').filter({ 
      hasText: /Role.*changed|Updated.*role/i 
    }).first();
    
    // Verify it shows the transition
    await expect(roleChangeEntry).toContainText(/Collaborator.*Creator|Collaborator → Creator/i);
  });
  
  // Test Step 5: Check modifier identity (SC)
  await test.step('Check modifier identity (SC)', async () => {
    // Take screenshot
    const timestamp = formatTimestamp(new Date());
    await page.screenshot({ 
      path: getScreenshotPath(`TS.5.3-04-${timestamp}.png`),
      fullPage: true 
    });
    
    // Verify modifier is shown as Grady A
    const roleChangeEntry = page.locator('[data-testid="audit-entry"], tr').filter({ 
      hasText: /Role.*changed|Updated.*role/i 
    }).first();
    
    await expect(roleChangeEntry).toContainText(/Grady.*A|Changed by.*Grady/i);
    
    // Verify timestamp is present
    await expect(roleChangeEntry).toContainText(/\d{4}-\d{2}-\d{2}|\d{1,2}\/\d{1,2}\/\d{4}/);
  });
  
  // Expected Results:
  // 1. Role updated successfully ✓
  // 2. Audit trail opens ✓
  // 3. Role change logged ✓
  // 4. Shows "Collaborator → Creator" ✓
  // 5. Shows "Changed by Grady A" ✓
});