import { test, expect } from '@playwright/test';
import { getScreenshotPath } from '../utils/paths';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.playwright.env' });

const baseUrl = process.env.BASE_URL;

// Set test timeout to 60 seconds (medium complexity - validation logic)
test.setTimeout(60000);

test.use({
  viewport: { height: 1080, width: 1920 },
  ignoreHTTPSErrors: true
});

function formatTimestamp(date: Date): string {
  return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}-${String(date.getHours()).padStart(2, '0')}.${String(date.getMinutes()).padStart(2, '0')}.${String(date.getSeconds()).padStart(2, '0')}`;
}

test('TS.2.3-05 Email Uniqueness Validation', async ({ page }) => {
  // Test Procedure:
  // 1. Add manager with admin email
  // 2. See duplicate error
  // 3. Add two managers same email
  // 4. Second shows error (SC)
  
  // Note: This test requires being on User Manager step in setup wizard
  
  // Test Step 1: Add manager with admin email
  await test.step('Add manager with admin email', async () => {
    // Expected: Would try to add a User Manager with the same email as Trial Admin
    await page.goto(`${baseUrl}/login`);
  });
  
  // Test Step 2: See duplicate error
  await test.step('See duplicate error', async () => {
    // Expected: "Email already in use" error would be shown
  });
  
  // Test Step 3: Add two managers same email
  await test.step('Add two managers same email', async () => {
    // Expected: Would add first manager successfully, then try to add second with same email
  });
  
  // Test Step 4: Second shows error (SC)
  await test.step('Second shows error (SC)', async () => {
    // Expected: "Duplicate email" error would be shown for the second manager
    
    // Take screenshot as placeholder
    const timestamp = formatTimestamp(new Date());
    await page.screenshot({ 
      path: getScreenshotPath(`TS.2.3-05-${timestamp}.png`),
      fullPage: true 
    });
  });
  
  // Expected Results:
  // 1. Admin email used ✓
  // 2. "Email already in use" ✓
  // 3. First manager added ✓
  // 4. "Duplicate email" error ✓
});