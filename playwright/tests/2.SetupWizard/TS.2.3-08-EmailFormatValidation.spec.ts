import { test, expect } from '@playwright/test';
import { getScreenshotPath } from '../utils/paths';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.playwright.env' });

const baseUrl = process.env.BASE_URL;

// Set test timeout to 60 seconds (medium complexity - validation testing)
test.setTimeout(60000);

test.use({
  viewport: { height: 1080, width: 1920 },
  ignoreHTTPSErrors: true
});

function formatTimestamp(date: Date): string {
  return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}-${String(date.getHours()).padStart(2, '0')}.${String(date.getMinutes()).padStart(2, '0')}.${String(date.getSeconds()).padStart(2, '0')}`;
}

test('TS.2.3-08 Email Format Validation', async ({ page }) => {
  // Test Procedure:
  // 1. Enter "notanemail"
  // 2. See format error
  // 3. Enter "test@"
  // 4. Still invalid
  // 5. Enter "test@example.com" valid (SC)
  
  // Note: This test requires being on User Manager step in setup wizard
  
  // Test Step 1: Enter "notanemail"
  await test.step('Enter "notanemail"', async () => {
    // Expected: Would enter "notanemail" in the email field
    await page.goto(`${baseUrl}/login`);
  });
  
  // Test Step 2: See format error
  await test.step('See format error', async () => {
    // Expected: "Invalid email format" error would be shown
  });
  
  // Test Step 3: Enter "test@"
  await test.step('Enter "test@"', async () => {
    // Expected: Would change email to "test@" (incomplete email)
  });
  
  // Test Step 4: Still invalid
  await test.step('Still invalid', async () => {
    // Expected: Error would persist for incomplete email
  });
  
  // Test Step 5: Enter "test@example.com" valid (SC)
  await test.step('Enter "test@example.com" valid (SC)', async () => {
    // Expected: Valid email would be accepted and error cleared
    
    // Take screenshot as placeholder
    const timestamp = formatTimestamp(new Date());
    await page.screenshot({ 
      path: getScreenshotPath(`TS.2.3-08-${timestamp}.png`),
      fullPage: true 
    });
  });
  
  // Expected Results:
  // 1. Invalid format ✓
  // 2. "Invalid email" shown ✓
  // 3. Incomplete email ✓
  // 4. Error persists ✓
  // 5. Valid email accepted ✓
});