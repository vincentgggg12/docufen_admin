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

test('TS.5.6-01 Empty Required Fields', async ({ page }) => {
  // Test Procedure:
  // 1. Click Add New User
  // 2. Leave Legal Name empty
  // 3. Enter only email
  // 4. Try to save (SC)
  
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
  
  // Test Step 1: Click Add New User
  await test.step('Click Add New User', async () => {
    const addUserButton = page.getByRole('button', { name: /Add.*User/i });
    await addUserButton.click();
    
    // Wait for modal to open
    await page.waitForTimeout(1000);
    
    // Verify modal is open
    const addUserModal = page.locator('[role="dialog"], [data-testid="add-user-modal"]');
    await expect(addUserModal).toBeVisible();
  });
  
  // Test Step 2: Leave Legal Name empty
  await test.step('Leave Legal Name empty', async () => {
    const nameInput = page.getByLabel(/Legal Name/i);
    
    // Ensure field is empty
    await nameInput.clear();
    
    // Verify field is empty
    const nameValue = await nameInput.inputValue();
    expect(nameValue).toBe('');
  });
  
  // Test Step 3: Enter only email
  await test.step('Enter only email', async () => {
    const emailInput = page.getByLabel(/Email/i);
    
    // Generate unique email
    const timestamp = Date.now();
    const testEmail = `emptytest${timestamp}@17nj5d.onmicrosoft.com`;
    
    await emailInput.fill(testEmail);
    
    // Verify email was entered
    const emailValue = await emailInput.inputValue();
    expect(emailValue).toBe(testEmail);
    
    // Select a role (required field)
    const roleDropdown = page.getByLabel(/Role/i);
    await roleDropdown.selectOption({ label: 'Collaborator' });
  });
  
  // Test Step 4: Try to save (SC)
  await test.step('Try to save (SC)', async () => {
    // Try to save with empty name
    const saveButton = page.getByRole('button', { name: /Save|Add|Create/i });
    await saveButton.click();
    
    // Wait for validation
    await page.waitForTimeout(1000);
    
    // Take screenshot
    const timestamp = formatTimestamp(new Date());
    await page.screenshot({ 
      path: getScreenshotPath(`TS.5.6-01-${timestamp}.png`),
      fullPage: true 
    });
    
    // Verify error message appears
    const errorMessage = page.getByText(/Legal name.*required|Name.*required|Please enter.*name/i);
    await expect(errorMessage).toBeVisible();
    
    // Verify modal is still open (save was prevented)
    const addUserModal = page.locator('[role="dialog"], [data-testid="add-user-modal"]');
    await expect(addUserModal).toBeVisible();
    
    // Verify name field has error state
    const nameInput = page.getByLabel(/Legal Name/i);
    const hasErrorClass = await nameInput.getAttribute('class');
    const hasAriaInvalid = await nameInput.getAttribute('aria-invalid');
    
    expect(hasErrorClass?.includes('error') || hasAriaInvalid === 'true').toBeTruthy();
  });
  
  // Expected Results:
  // 1. Modal opens ✓
  // 2. Name field empty ✓
  // 3. Email entered ✓
  // 4. Error "Legal name required" ✓
});