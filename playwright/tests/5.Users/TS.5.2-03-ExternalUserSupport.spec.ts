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

test('TS.5.2-03 External User Support', async ({ page }) => {
  // Test Procedure:
  // 1. Enter email "test@external.com"
  // 2. Company field becomes visible
  // 3. Enter "External Corp"
  // 4. Save user
  // 5. Verify External badge in list (SC)
  
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
  
  // Test Step 1: Enter email "test@external.com"
  await test.step('Enter email "test@external.com"', async () => {
    // Generate unique email to avoid conflicts
    const timestamp = Date.now();
    const testEmail = `test${timestamp}@external.com`;
    
    const emailInput = page.getByLabel(/Email/i);
    await emailInput.fill(testEmail);
    
    // Store email for later verification
    await page.evaluate((email) => { window.testEmail = email; }, testEmail);
  });
  
  // Test Step 2: Company field becomes visible
  await test.step('Company field becomes visible', async () => {
    // Tab out or click elsewhere to trigger field visibility
    await page.keyboard.press('Tab');
    await page.waitForTimeout(500);
    
    // Verify company field appears for external email
    const companyField = page.getByLabel(/Company/i);
    await expect(companyField).toBeVisible();
  });
  
  // Test Step 3: Enter "External Corp"
  await test.step('Enter "External Corp"', async () => {
    const companyField = page.getByLabel(/Company/i);
    await companyField.fill('External Corp');
    
    // Fill other required fields
    const nameInput = page.getByLabel(/Legal Name/i);
    await nameInput.fill('Test External User');
    
    // Select a role
    const roleDropdown = page.getByLabel(/Role/i);
    await roleDropdown.selectOption({ label: 'Collaborator' });
  });
  
  // Test Step 4: Save user
  await test.step('Save user', async () => {
    const saveButton = page.getByRole('button', { name: /Save|Add|Create/i });
    await saveButton.click();
    
    // Wait for modal to close and user to be created
    await page.waitForTimeout(2000);
    
    // Verify we're back on the Users page
    await expect(page.getByText('Users')).toBeVisible();
  });
  
  // Test Step 5: Verify External badge in list (SC)
  await test.step('Verify External badge in list (SC)', async () => {
    // Search for the newly created user
    const testEmail = await page.evaluate(() => window.testEmail);
    const searchBox = page.getByPlaceholder(/Search/i);
    await searchBox.fill(testEmail);
    await page.waitForTimeout(1000);
    
    // Take screenshot
    const timestamp = formatTimestamp(new Date());
    await page.screenshot({ 
      path: getScreenshotPath(`TS.5.2-03-${timestamp}.png`),
      fullPage: true 
    });
    
    // Verify user shows as External
    const userRow = page.locator('tr').filter({ hasText: testEmail });
    const externalBadge = userRow.locator('[data-testid="external-badge"], span:has-text("External")');
    await expect(externalBadge).toBeVisible();
    
    // Verify company name is shown
    await expect(userRow).toContainText('External Corp');
  });
  
  // Expected Results:
  // 1. Email accepted ✓
  // 2. Company field appears ✓
  // 3. Company name accepted ✓
  // 4. User created successfully ✓
  // 5. Shows as External user ✓
});