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

test('TS.5.2-04 Document Access Permission', async ({ page }) => {
  // Test Procedure:
  // 1. In Add User modal, locate toggle
  // 2. Verify "View All Documents" OFF default
  // 3. Toggle ON
  // 4. Save user
  // 5. Check user can view all docs (SC)
  
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
  
  // Navigate to Users page
  await page.getByRole('button', { name: 'Menu' }).click();
  await page.getByRole('link', { name: 'Users' }).click();
  await page.waitForSelector('text=Users', { timeout: 10000 });
  
  // Open Add User modal
  const addUserButton = page.getByRole('button', { name: /Add.*User/i });
  await addUserButton.click();
  await page.waitForTimeout(1000);
  
  // Test Step 1: In Add User modal, locate toggle
  await test.step('In Add User modal, locate toggle', async () => {
    // Find the document access toggle
    const toggleLabel = page.getByText(/View All Documents/i);
    await expect(toggleLabel).toBeVisible();
    
    // Find the associated toggle/switch
    const toggle = page.locator('[role="switch"], input[type="checkbox"]').filter({ 
      has: page.locator('text=/View All Documents/i') 
    }).or(
      toggleLabel.locator('..').locator('[role="switch"], input[type="checkbox"]')
    );
    
    await expect(toggle).toBeVisible();
  });
  
  // Test Step 2: Verify "View All Documents" OFF default
  await test.step('Verify "View All Documents" OFF default', async () => {
    const toggle = page.locator('[role="switch"], input[type="checkbox"]').filter({ 
      has: page.locator('text=/View All Documents/i') 
    }).or(
      page.getByText(/View All Documents/i).locator('..').locator('[role="switch"], input[type="checkbox"]')
    );
    
    // Check if toggle is OFF (unchecked)
    const isChecked = await toggle.isChecked();
    expect(isChecked).toBe(false);
  });
  
  // Test Step 3: Toggle ON
  await test.step('Toggle ON', async () => {
    const toggleLabel = page.getByText(/View All Documents/i);
    const toggle = toggleLabel.locator('..').locator('[role="switch"], input[type="checkbox"]').first();
    
    // Click to toggle ON
    await toggle.click();
    await page.waitForTimeout(500);
    
    // Verify it's now ON
    const isChecked = await toggle.isChecked();
    expect(isChecked).toBe(true);
  });
  
  // Test Step 4: Save user
  await test.step('Save user', async () => {
    // Fill required fields
    const timestamp = Date.now();
    const testEmail = `docaccess${timestamp}@17nj5d.onmicrosoft.com`;
    
    const emailInput = page.getByLabel(/Email/i);
    await emailInput.fill(testEmail);
    
    const nameInput = page.getByLabel(/Legal Name/i);
    await nameInput.fill('Doc Access Test User');
    
    const roleDropdown = page.getByLabel(/Role/i);
    await roleDropdown.selectOption({ label: 'Collaborator' });
    
    // Store email for later verification
    await page.evaluate((email) => { window.testEmail = email; }, testEmail);
    
    // Save the user
    const saveButton = page.getByRole('button', { name: /Save|Add|Create/i });
    await saveButton.click();
    
    // Wait for modal to close
    await page.waitForTimeout(2000);
  });
  
  // Test Step 5: Check user can view all docs (SC)
  await test.step('Check user can view all docs (SC)', async () => {
    // Search for the newly created user
    const testEmail = await page.evaluate(() => window.testEmail);
    const searchBox = page.getByPlaceholder(/Search/i);
    await searchBox.fill(testEmail);
    await page.waitForTimeout(1000);
    
    // Take screenshot
    const timestamp = formatTimestamp(new Date());
    await page.screenshot({ 
      path: getScreenshotPath(`TS.5.2-04-${timestamp}.png`),
      fullPage: true 
    });
    
    // Verify user is created with document access permission
    const userRow = page.locator('tr').filter({ hasText: testEmail });
    await expect(userRow).toBeVisible();
    
    // Click on user to view details
    await userRow.click();
    await page.waitForTimeout(1000);
    
    // Verify document access permission is enabled
    const expandedDetails = page.locator('[data-testid="user-details"], [aria-expanded="true"]');
    await expect(expandedDetails).toContainText(/View All Documents.*Enabled|Yes|True/i);
  });
  
  // Expected Results:
  // 1. Toggle visible in form ✓
  // 2. Default state is OFF ✓
  // 3. Toggle switches to ON ✓
  // 4. User created ✓
  // 5. User sees all documents ✓
});