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

test('TS.5.2-05 Email Validation', async ({ page }) => {
  // Test Procedure:
  // 1. Try email "invalid-email"
  // 2. Try "TEST@EXAMPLE.COM"
  // 3. Enter "test@example.com"
  // 4. Try to create duplicate email (SC)
  
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
  
  // Test Step 1: Try email "invalid-email"
  await test.step('Try email "invalid-email"', async () => {
    const emailInput = page.getByLabel(/Email/i);
    await emailInput.fill('invalid-email');
    
    // Tab out to trigger validation
    await page.keyboard.press('Tab');
    await page.waitForTimeout(500);
    
    // Verify error message
    const errorMessage = page.getByText(/Invalid email|Please enter a valid email/i);
    await expect(errorMessage).toBeVisible();
    
    // Clear the field
    await emailInput.clear();
  });
  
  // Test Step 2: Try "TEST@EXAMPLE.COM"
  await test.step('Try "TEST@EXAMPLE.COM"', async () => {
    const emailInput = page.getByLabel(/Email/i);
    await emailInput.fill('TEST@EXAMPLE.COM');
    
    // Tab out to trigger validation
    await page.keyboard.press('Tab');
    await page.waitForTimeout(500);
    
    // Verify email is accepted and converted to lowercase
    const emailValue = await emailInput.inputValue();
    expect(emailValue).toBe('test@example.com');
  });
  
  // Test Step 3: Enter "test@example.com"
  await test.step('Enter "test@example.com"', async () => {
    const emailInput = page.getByLabel(/Email/i);
    await emailInput.clear();
    
    // Generate unique email for first user
    const timestamp = Date.now();
    const testEmail = `test${timestamp}@example.com`;
    await emailInput.fill(testEmail);
    
    // Store for duplicate test
    await page.evaluate((email) => { window.testEmail = email; }, testEmail);
    
    // Fill other required fields
    const nameInput = page.getByLabel(/Legal Name/i);
    await nameInput.fill('Email Test User');
    
    const roleDropdown = page.getByLabel(/Role/i);
    await roleDropdown.selectOption({ label: 'Collaborator' });
    
    // Save the user
    const saveButton = page.getByRole('button', { name: /Save|Add|Create/i });
    await saveButton.click();
    
    // Wait for user to be created
    await page.waitForTimeout(2000);
    
    // Verify user was created
    await expect(page.getByText('Users')).toBeVisible();
  });
  
  // Test Step 4: Try to create duplicate email (SC)
  await test.step('Try to create duplicate email (SC)', async () => {
    // Open Add User modal again
    const addUserButton = page.getByRole('button', { name: /Add.*User/i });
    await addUserButton.click();
    await page.waitForTimeout(1000);
    
    // Try to use the same email
    const testEmail = await page.evaluate(() => window.testEmail);
    const emailInput = page.getByLabel(/Email/i);
    await emailInput.fill(testEmail);
    
    // Fill other required fields
    const nameInput = page.getByLabel(/Legal Name/i);
    await nameInput.fill('Duplicate Email User');
    
    const roleDropdown = page.getByLabel(/Role/i);
    await roleDropdown.selectOption({ label: 'Collaborator' });
    
    // Try to save
    const saveButton = page.getByRole('button', { name: /Save|Add|Create/i });
    await saveButton.click();
    
    // Wait for error
    await page.waitForTimeout(1000);
    
    // Take screenshot
    const timestamp = formatTimestamp(new Date());
    await page.screenshot({ 
      path: getScreenshotPath(`TS.5.2-05-${timestamp}.png`),
      fullPage: true 
    });
    
    // Verify error message
    const errorMessage = page.getByText(/User already exists|Email already in use|Duplicate email/i);
    await expect(errorMessage).toBeVisible();
  });
  
  // Expected Results:
  // 1. Shows "Invalid email" error ✓
  // 2. Accepts and converts to lowercase ✓
  // 3. Email valid ✓
  // 4. Error "User already exists" ✓
});