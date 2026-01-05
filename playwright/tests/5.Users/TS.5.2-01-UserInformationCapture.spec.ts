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

test('TS.5.2-01 User Information Capture', async ({ page }) => {
  // Test Procedure:
  // 1. Click "Add New User" button
  // 2. Enter "Test User" in Legal Name
  // 3. Verify initials auto-generate to "TU"
  // 4. Change name to "John Paul Smith"
  // 5. Verify initials update to "JPS" (SC)
  
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
  
  // Test Step 1: Click "Add New User" button
  await test.step('Click "Add New User" button', async () => {
    const addUserButton = page.getByRole('button', { name: /Add.*User/i });
    await addUserButton.click();
    
    // Wait for modal to open
    await page.waitForTimeout(1000);
    
    // Verify modal is open
    const addUserModal = page.locator('[role="dialog"], [data-testid="add-user-modal"]');
    await expect(addUserModal).toBeVisible();
  });
  
  // Test Step 2: Enter "Test User" in Legal Name
  await test.step('Enter "Test User" in Legal Name', async () => {
    const nameInput = page.getByLabel(/Legal Name/i);
    await nameInput.fill('Test User');
    
    // Tab out or click elsewhere to trigger auto-generation
    await page.keyboard.press('Tab');
    await page.waitForTimeout(500);
  });
  
  // Test Step 3: Verify initials auto-generate to "TU"
  await test.step('Verify initials auto-generate to "TU"', async () => {
    const initialsInput = page.getByLabel(/Initials/i);
    const initialsValue = await initialsInput.inputValue();
    expect(initialsValue).toBe('TU');
  });
  
  // Test Step 4: Change name to "John Paul Smith"
  await test.step('Change name to "John Paul Smith"', async () => {
    const nameInput = page.getByLabel(/Legal Name/i);
    await nameInput.clear();
    await nameInput.fill('John Paul Smith');
    
    // Tab out or click elsewhere to trigger auto-generation
    await page.keyboard.press('Tab');
    await page.waitForTimeout(500);
  });
  
  // Test Step 5: Verify initials update to "JPS" (SC)
  await test.step('Verify initials update to "JPS" (SC)', async () => {
    const initialsInput = page.getByLabel(/Initials/i);
    const initialsValue = await initialsInput.inputValue();
    
    // Take screenshot
    const timestamp = formatTimestamp(new Date());
    await page.screenshot({ 
      path: getScreenshotPath(`TS.5.2-01-${timestamp}.png`),
      fullPage: true 
    });
    
    // Verify initials are limited to 3 characters
    expect(initialsValue).toBe('JPS');
    expect(initialsValue.length).toBeLessThanOrEqual(3);
  });
  
  // Close modal without saving (to avoid creating test user)
  const cancelButton = page.getByRole('button', { name: /Cancel/i });
  if (await cancelButton.isVisible()) {
    await cancelButton.click();
  } else {
    // Press Escape if no cancel button
    await page.keyboard.press('Escape');
  }
  
  // Expected Results:
  // 1. Modal opens ✓
  // 2. Name field accepts input ✓
  // 3. Initials show "TU" automatically ✓
  // 4. Name updates ✓
  // 5. Initials limited to 3 chars "JPS" ✓
});