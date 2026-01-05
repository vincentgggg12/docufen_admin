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

test('TS.5.3-05 User Deactivation', async ({ page }) => {
  // Test Procedure:
  // 1. Edit Johanna's account
  // 2. Toggle status to Deactivated
  // 3. Save changes
  // 4. Verify in Deactivated tab
  // 5. Check audit trail preserved (SC)
  
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
  
  // Test Step 1: Edit Johanna's account
  await test.step("Edit Johanna's account", async () => {
    // Search for Johanna
    const searchBox = page.getByPlaceholder(/Search/i);
    await searchBox.fill('Johanna');
    await page.waitForTimeout(1000);
    
    // Find Johanna's row
    const johannaRow = page.locator('tr').filter({ hasText: 'Johanna' }).first();
    
    // Click edit button
    const editButton = johannaRow.locator('button[aria-label*="Edit"], [data-testid="edit-user"]');
    await editButton.click();
    
    // Wait for edit modal
    await page.waitForTimeout(1000);
    
    // Verify edit modal is open
    const editModal = page.locator('[role="dialog"], [data-testid="edit-user-modal"]');
    await expect(editModal).toBeVisible();
  });
  
  // Test Step 2: Toggle status to Deactivated
  await test.step('Toggle status to Deactivated', async () => {
    // Find status toggle
    const statusToggle = page.locator('[role="switch"], input[type="checkbox"]').filter({ 
      has: page.locator('text=/Status|Active|Deactivate/i') 
    }).or(
      page.getByLabel(/Status|Active/i).locator('..').locator('[role="switch"], input[type="checkbox"]')
    );
    
    // Click to deactivate
    await statusToggle.click();
    await page.waitForTimeout(500);
    
    // Verify toggle state changed
    const isChecked = await statusToggle.isChecked();
    expect(isChecked).toBe(false); // Assuming unchecked = deactivated
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
  });
  
  // Test Step 4: Verify in Deactivated tab
  await test.step('Verify in Deactivated tab', async () => {
    // Clear search first
    const searchBox = page.getByPlaceholder(/Search/i);
    await searchBox.clear();
    await page.waitForTimeout(1000);
    
    // Click on Deactivated tab
    await page.getByRole('tab', { name: /Deactivated/i }).click();
    await page.waitForTimeout(1000);
    
    // Search for Johanna in deactivated users
    await searchBox.fill('Johanna');
    await page.waitForTimeout(1000);
    
    // Verify Johanna appears in deactivated list
    const johannaRow = page.locator('tr').filter({ hasText: 'Johanna' });
    await expect(johannaRow).toBeVisible();
    
    // Verify status badge shows Deactivated
    const statusBadge = johannaRow.locator('[data-testid="user-status"], span:has-text("Deactivated")');
    await expect(statusBadge).toBeVisible();
  });
  
  // Test Step 5: Check audit trail preserved (SC)
  await test.step('Check audit trail preserved (SC)', async () => {
    // Click on Johanna's row to expand
    const johannaRow = page.locator('tr').filter({ hasText: 'Johanna' }).first();
    await johannaRow.click();
    await page.waitForTimeout(1000);
    
    // Find and click Audit Trail button
    const auditTrailButton = page.getByRole('button', { name: /Audit Trail/i });
    await auditTrailButton.click();
    
    // Wait for audit modal to open
    await page.waitForTimeout(1000);
    
    // Take screenshot
    const timestamp = formatTimestamp(new Date());
    await page.screenshot({ 
      path: getScreenshotPath(`TS.5.3-05-${timestamp}.png`),
      fullPage: true 
    });
    
    // Verify audit trail is preserved and accessible
    const auditModal = page.locator('[role="dialog"], [data-testid="audit-trail-modal"]');
    await expect(auditModal).toBeVisible();
    
    // Verify deactivation is logged
    const deactivationEntry = page.locator('[data-testid="audit-entry"], tr').filter({ 
      hasText: /Deactivated|Status.*changed/i 
    });
    await expect(deactivationEntry.first()).toBeVisible();
    
    // Verify full history is still accessible
    const auditEntries = page.locator('[data-testid="audit-entry"], tbody tr');
    const entryCount = await auditEntries.count();
    expect(entryCount).toBeGreaterThan(0);
  });
  
  // Expected Results:
  // 1. Edit modal opens ✓
  // 2. Status toggle available ✓
  // 3. Changes saved ✓
  // 4. Shows in Deactivated filter ✓
  // 5. Full history still accessible ✓
});