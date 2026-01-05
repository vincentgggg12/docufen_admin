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

test('TS.3.2-11 Disable Digital Signatures', async ({ page, baseURL }) => {
  // Test Procedure:
  // 1. With signatures enabled
  // 2. Toggle switch OFF
  // 3. Verify switch shows OFF state (SC)
  // 4. Reload page (F5/refresh)
  // 5. Verify switch still shows OFF (SC)
  
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
  
  // Navigate to Account page
  await navigateToAccount(page);
  
  // Verify we're on the account page
  await expect(page).toHaveURL(/.*\/account/);
  
  // Test Step 1: Ensure signatures are enabled first
  await test.step('Ensure Digital Signatures are currently enabled', async () => {
    // Look for Digital Signatures section
    await page.waitForSelector('text=Digital Signatures', { timeout: 10000 });
    
    // Find the switch/toggle for Digital Signatures
    const digitalSignatureSwitch = page.locator('input[type="checkbox"]').or(page.locator('[role="switch"]')).filter({ 
      has: page.locator('..').filter({ hasText: /Digital Signatures/i }) 
    }).first();
    
    // If not already ON, toggle it ON first
    const isChecked = await digitalSignatureSwitch.isChecked();
    if (!isChecked) {
      await digitalSignatureSwitch.click();
      await page.waitForTimeout(1000);
    }
    
    // Verify it's ON
    await expect(digitalSignatureSwitch).toBeChecked();
  });
  
  // Test Step 2: Toggle switch OFF
  await test.step('Toggle switch OFF', async () => {
    // Find the switch
    const digitalSignatureSwitch = page.locator('input[type="checkbox"]').or(page.locator('[role="switch"]')).filter({ 
      has: page.locator('..').filter({ hasText: /Digital Signatures/i }) 
    }).first();
    
    // Toggle it OFF
    await digitalSignatureSwitch.click();
    
    // Wait for the change to be saved
    await page.waitForTimeout(1000);
  });
  
  // Test Step 3: Verify switch shows OFF state (SC)
  await test.step('Verify switch shows OFF state (SC)', async () => {
    // Find the switch again
    const digitalSignatureSwitch = page.locator('input[type="checkbox"]').or(page.locator('[role="switch"]')).filter({ 
      has: page.locator('..').filter({ hasText: /Digital Signatures/i }) 
    }).first();
    
    // Verify it's in OFF state
    await expect(digitalSignatureSwitch).not.toBeChecked();
    
    // Take screenshot
    const timestamp = formatTimestamp(new Date());
    await page.screenshot({ 
      path: getScreenshotPath(`TS.3.2-11-01-${timestamp}.png`),
      fullPage: true 
    });
  });
  
  // Test Step 4: Reload page
  await test.step('Reload page (F5/refresh)', async () => {
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    // Wait for the account page to fully load
    await page.waitForSelector('text=Digital Signatures', { timeout: 10000 });
  });
  
  // Test Step 5: Verify switch still shows OFF (SC)
  await test.step('Verify switch still shows OFF (SC)', async () => {
    // Find the switch after reload
    const digitalSignatureSwitch = page.locator('input[type="checkbox"]').or(page.locator('[role="switch"]')).filter({ 
      has: page.locator('..').filter({ hasText: /Digital Signatures/i }) 
    }).first();
    
    // Verify it's still in OFF state
    await expect(digitalSignatureSwitch).not.toBeChecked();
    
    // Take screenshot
    const timestamp = formatTimestamp(new Date());
    await page.screenshot({ 
      path: getScreenshotPath(`TS.3.2-11-02-${timestamp}.png`),
      fullPage: true 
    });
  });
  
  // Expected Results:
  // 1. Switch currently ON ✓
  // 2. Switch toggles to OFF ✓
  // 3. Switch shows disabled state ✓
  // 4. Page reloads ✓
  // 5. Switch remains OFF ✓
});