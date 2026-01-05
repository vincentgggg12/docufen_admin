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

test('TS.5.5-03 Microsoft Tenant Display', async ({ page }) => {
  // Test Procedure:
  // 1. View Diego's expanded details
  // 2. Check MS Tenant Name shown
  // 3. Verify shows "17nj5d"
  // 4. Check Azure Object ID visible
  // 5. Verify fields read-only (SC)
  
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
  
  // Test Step 1: View Diego's expanded details
  await test.step("View Diego's expanded details", async () => {
    // Search for Diego
    const searchBox = page.getByPlaceholder(/Search/i);
    await searchBox.fill('Diego Siciliani');
    await page.waitForTimeout(1000);
    
    // Find Diego's row
    const diegoRow = page.locator('tr').filter({ hasText: 'Diego Siciliani' });
    
    // Click on row to expand
    await diegoRow.click();
    await page.waitForTimeout(1000);
    
    // Verify details are expanded
    const expandedDetails = page.locator('[data-testid="user-details"], [aria-expanded="true"]');
    await expect(expandedDetails).toBeVisible();
  });
  
  // Test Step 2: Check MS Tenant Name shown
  await test.step('Check MS Tenant Name shown', async () => {
    const expandedDetails = page.locator('[data-testid="user-details"], [aria-expanded="true"]');
    
    // Look for tenant field
    const tenantLabel = expandedDetails.getByText(/Tenant|Microsoft Tenant/i);
    await expect(tenantLabel).toBeVisible();
    
    // Verify tenant field is displayed
    const tenantValue = expandedDetails.locator('text=/17nj5d|Pharma.*17nj5d/i');
    await expect(tenantValue).toBeVisible();
  });
  
  // Test Step 3: Verify shows "17nj5d"
  await test.step('Verify shows "17nj5d"', async () => {
    const expandedDetails = page.locator('[data-testid="user-details"], [aria-expanded="true"]');
    
    // Verify tenant identifier is shown
    await expect(expandedDetails).toContainText('17nj5d');
  });
  
  // Test Step 4: Check Azure Object ID visible
  await test.step('Check Azure Object ID visible', async () => {
    const expandedDetails = page.locator('[data-testid="user-details"], [aria-expanded="true"]');
    
    // Look for Object ID field
    const objectIdLabel = expandedDetails.getByText(/Object ID|Azure.*ID|Microsoft.*ID/i);
    await expect(objectIdLabel).toBeVisible();
    
    // Verify Object ID is displayed (GUID format)
    const guidPattern = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;
    const objectIdValue = expandedDetails.locator(`text=${guidPattern}`);
    await expect(objectIdValue).toBeVisible();
  });
  
  // Test Step 5: Verify fields read-only (SC)
  await test.step('Verify fields read-only (SC)', async () => {
    // Click edit button to open edit modal
    const editButton = page.getByRole('button', { name: /Edit.*User/i });
    await editButton.click();
    await page.waitForTimeout(1000);
    
    // Take screenshot
    const timestamp = formatTimestamp(new Date());
    await page.screenshot({ 
      path: getScreenshotPath(`TS.5.5-03-${timestamp}.png`),
      fullPage: true 
    });
    
    // In edit modal, verify tenant and object ID fields are read-only
    const editModal = page.locator('[role="dialog"], [data-testid="edit-user-modal"]');
    await expect(editModal).toBeVisible();
    
    // Check if tenant field exists and is read-only
    const tenantInput = editModal.locator('input').filter({ hasText: /17nj5d/ }).or(
      editModal.getByLabel(/Tenant/i)
    );
    
    if (await tenantInput.count() > 0) {
      const isDisabled = await tenantInput.isDisabled();
      const isReadOnly = await tenantInput.getAttribute('readonly');
      expect(isDisabled || isReadOnly).toBeTruthy();
    }
    
    // Check if object ID field exists and is read-only
    const objectIdInput = editModal.locator('input').filter({ 
      hasText: /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i 
    }).or(
      editModal.getByLabel(/Object ID/i)
    );
    
    if (await objectIdInput.count() > 0) {
      const isDisabled = await objectIdInput.isDisabled();
      const isReadOnly = await objectIdInput.getAttribute('readonly');
      expect(isDisabled || isReadOnly).toBeTruthy();
    }
    
    // Close modal
    await page.keyboard.press('Escape');
  });
  
  // Expected Results:
  // 1. Details expand ✓
  // 2. Tenant field visible ✓
  // 3. Shows correct tenant ✓
  // 4. Object ID displayed ✓
  // 5. Fields not editable ✓
});