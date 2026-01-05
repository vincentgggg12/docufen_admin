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

test('TS.5.6-02 Special Characters in Name', async ({ page }) => {
  // Test Procedure:
  // 1. Enter name "Test<script>alert()</script>"
  // 2. Enter valid email
  // 3. Save user
  // 4. View in list (SC)
  
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
  
  // Open Add User modal
  const addUserButton = page.getByRole('button', { name: /Add.*User/i });
  await addUserButton.click();
  await page.waitForTimeout(1000);
  
  // Test Step 1: Enter name "Test<script>alert()</script>"
  await test.step('Enter name "Test<script>alert()</script>"', async () => {
    const nameInput = page.getByLabel(/Legal Name/i);
    const specialName = 'Test<script>alert()</script>';
    
    await nameInput.fill(specialName);
    
    // Verify name was entered
    const nameValue = await nameInput.inputValue();
    expect(nameValue).toBe(specialName);
  });
  
  // Test Step 2: Enter valid email
  await test.step('Enter valid email', async () => {
    const emailInput = page.getByLabel(/Email/i);
    
    // Generate unique email
    const timestamp = Date.now();
    const testEmail = `xsstest${timestamp}@17nj5d.onmicrosoft.com`;
    
    await emailInput.fill(testEmail);
    
    // Store email for later verification
    await page.evaluate((email) => { window.testEmail = email; }, testEmail);
    
    // Select a role
    const roleDropdown = page.getByLabel(/Role/i);
    await roleDropdown.selectOption({ label: 'Collaborator' });
  });
  
  // Test Step 3: Save user
  await test.step('Save user', async () => {
    // Save the user
    const saveButton = page.getByRole('button', { name: /Save|Add|Create/i });
    await saveButton.click();
    
    // Wait for save to complete
    await page.waitForTimeout(2000);
    
    // Verify modal closed (user created successfully)
    const addUserModal = page.locator('[role="dialog"], [data-testid="add-user-modal"]');
    await expect(addUserModal).not.toBeVisible();
    
    // Verify no XSS alert appeared
    page.on('dialog', async dialog => {
      // If an alert appears, fail the test
      expect(dialog.type()).not.toBe('alert');
      await dialog.dismiss();
    });
  });
  
  // Test Step 4: View in list (SC)
  await test.step('View in list (SC)', async () => {
    // Search for the newly created user
    const testEmail = await page.evaluate(() => window.testEmail);
    const searchBox = page.getByPlaceholder(/Search/i);
    await searchBox.fill(testEmail);
    await page.waitForTimeout(1000);
    
    // Take screenshot
    const timestamp = formatTimestamp(new Date());
    await page.screenshot({ 
      path: getScreenshotPath(`TS.5.6-02-${timestamp}.png`),
      fullPage: true 
    });
    
    // Find the user row
    const userRow = page.locator('tr').filter({ hasText: testEmail });
    await expect(userRow).toBeVisible();
    
    // Verify script tags are shown as plain text (escaped)
    const nameCell = userRow.locator('[data-testid="user-name"], td').first();
    const nameText = await nameCell.textContent();
    
    // Should contain the script tags as text, not execute them
    expect(nameText).toContain('<script>');
    expect(nameText).toContain('</script>');
    
    // Verify no script execution
    const scriptsOnPage = await page.locator('script').filter({ hasText: 'alert()' }).count();
    expect(scriptsOnPage).toBe(0);
    
    // Click on user to see full details
    await userRow.click();
    await page.waitForTimeout(1000);
    
    // Verify expanded details also show escaped text
    const expandedDetails = page.locator('[data-testid="user-details"], [aria-expanded="true"]');
    const detailsText = await expandedDetails.textContent();
    expect(detailsText).toContain('Test<script>alert()</script>');
  });
  
  // Expected Results:
  // 1. Name accepted ✓
  // 2. Email valid ✓
  // 3. User created ✓
  // 4. Script shown as plain text ✓
});