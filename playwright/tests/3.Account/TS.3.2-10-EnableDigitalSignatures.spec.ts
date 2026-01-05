import { test, expect } from '@playwright/test';
import { microsoftLogin } from '../utils/msLogin';
import { handleERSDDialog } from '../utils/ersd-handler';
import { getScreenshotPath } from '../utils/paths';
import { navigateToAccount } from '../utils/navigateToAccount';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.playwright.env' });

// Set test timeout to 120 seconds
test.setTimeout(120000);

test.use({
  viewport: { height: 1080, width: 1920 },
  ignoreHTTPSErrors: true
});

function formatTimestamp(date: Date): string {
  return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}-${String(date.getHours()).padStart(2, '0')}.${String(date.getMinutes()).padStart(2, '0')}.${String(date.getSeconds()).padStart(2, '0')}`;
}

test('TS.3.2-10 Enable Digital Signatures', async ({ page, baseURL }) => {
  // Test Procedure:
  // 1. Login as Megan (Administrator)
  // 2. Navigate to Account page
  // 3. Toggle Digital Signatures switch ON
  // 4. Verify switch shows ON state (SC)
  // 5. Reload page (F5/refresh)
  // 6. Verify switch still shows ON (SC)
  
  // FS ID: FS.3.2-06
  
  const email = process.env.MS_EMAIL_17NJ5D_MEGAN_BOWEN!;
  const password = process.env.MS_PASSWORD!;
  
  // Navigate to login page
  await page.goto(`${baseURL}/login`);
  
  // Perform Microsoft login
  await microsoftLogin(page, email, password);
  
  // Handle ERSD if needed
  await handleERSDDialog(page);
  
  // Wait for navigation
  await page.waitForLoadState('domcontentloaded');
  
  // Test Step 1-2: Navigate to Account page
  await test.step('Navigate to Account page', async () => {
    await navigateToAccount(page);
    
    // Verify we're on the account page
    await expect(page).toHaveURL(/.*\/account/);
  });
  
  // Test Step 3: Toggle Digital Signatures switch ON
  await test.step('Toggle Digital Signatures switch ON', async () => {
    // Look for Digital Signatures section
    await page.waitForSelector('text=Digital Signatures', { timeout: 10000 });
    
    // Find the switch/toggle for Digital Signatures
    const digitalSignatureSwitch = page.locator('input[type="checkbox"]').or(page.locator('[role="switch"]')).filter({ 
      has: page.locator('..').filter({ hasText: /Digital Signatures/i }) 
    }).first();
    
    // If not already ON, toggle it
    const isChecked = await digitalSignatureSwitch.isChecked();
    if (!isChecked) {
      await digitalSignatureSwitch.click();
    }
    
    // Wait for the change to be saved
    await expect(digitalSignatureSwitch).toBeChecked({ timeout: 5000 });
  });
  
  // Test Step 4: Verify switch shows ON state (SC)
  await test.step('Verify switch shows ON state (SC)', async () => {
    // Find the switch again
    const digitalSignatureSwitch = page.locator('input[type="checkbox"]').or(page.locator('[role="switch"]')).filter({ 
      has: page.locator('..').filter({ hasText: /Digital Signatures/i }) 
    }).first();
    
    // Verify it's in ON state
    await expect(digitalSignatureSwitch).toBeChecked();
    
    // Take screenshot
    const timestamp = formatTimestamp(new Date());
    await page.screenshot({ 
      path: getScreenshotPath(`TS.3.2-10-01-${timestamp}.png`),
      fullPage: true 
    });
  });
  
  // Test Step 5: Reload page
  await test.step('Reload page (F5/refresh)', async () => {
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    // Wait for the account page to fully load
    await page.waitForSelector('text=Digital Signatures', { timeout: 10000 });
  });
  
  // Test Step 6: Verify switch still shows ON (SC)
  await test.step('Verify switch still shows ON (SC)', async () => {
    // Find the switch after reload
    const digitalSignatureSwitch = page.locator('input[type="checkbox"]').or(page.locator('[role="switch"]')).filter({ 
      has: page.locator('..').filter({ hasText: /Digital Signatures/i }) 
    }).first();
    
    // Verify it's still in ON state
    await expect(digitalSignatureSwitch).toBeChecked();
    
    // Take screenshot
    const timestamp = formatTimestamp(new Date());
    await page.screenshot({ 
      path: getScreenshotPath(`TS.3.2-10-02-${timestamp}.png`),
      fullPage: true 
    });
  });
  
  // Expected Results:
  // 1. Account page loads ✓
  // 2. Digital signatures switch visible ✓
  // 3. Switch toggles to ON ✓
  // 4. Switch shows enabled state ✓
  // 5. Page reloads ✓
  // 6. Switch remains ON ✓
});