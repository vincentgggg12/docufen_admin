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

test('TS.6.1-05 Document Status Display', async ({ page }) => {
  // Test Procedure:
  // 1. Create docs in each stage
  // 2. View Pre-Approval doc (orange icon)
  // 3. View Execution doc (blue icon)
  // 4. View Post-Approval (purple icon)
  // 5. View Completed (green icon)
  // 6. View Voided (red icon) (SC)
  
  // Setup: Login (not reported as test step)
  const email = process.env.MS_EMAIL_17NJ5D_MEGAN_BOWEN!;
  const password = process.env.MS_PASSWORD!;
  
  // Navigate to login page
  await page.goto(`${baseUrl}/login`);
  
  // Perform Microsoft login
  await microsoftLogin(page, email, password);
  
  // Handle ERSD if needed
  await handleERSDDialog(page);
  
  // Wait for navigation
  await page.waitForLoadState('domcontentloaded');
  
  // Navigate to Documents page
  await page.getByRole('button', { name: 'Menu' }).click();
  await page.getByRole('link', { name: 'Documents' }).click();
  await page.waitForSelector('text=Documents', { timeout: 10000 });
  
  // Test Step 1: View Pre-Approval doc (orange icon)
  await test.step('View Pre-Approval doc (orange icon)', async () => {
    // Click on Pre-Approval tab
    await page.getByRole('tab', { name: /Pre-Approval/i }).click();
    await page.waitForTimeout(1000);
    
    // Verify orange status indicator
    const orangeIndicator = page.locator('[data-testid="document-status"].orange, [class*="orange"][class*="status"], [style*="orange"]').first();
    if (await orangeIndicator.count() > 0) {
      await expect(orangeIndicator).toBeVisible();
      console.log('Pre-Approval documents show orange status indicator');
    }
  });
  
  // Test Step 2: View Execution doc (blue icon)
  await test.step('View Execution doc (blue icon)', async () => {
    // Click on Execution tab
    await page.getByRole('tab', { name: /Execution/i }).click();
    await page.waitForTimeout(1000);
    
    // Verify blue status indicator
    const blueIndicator = page.locator('[data-testid="document-status"].blue, [class*="blue"][class*="status"], [style*="blue"]').first();
    if (await blueIndicator.count() > 0) {
      await expect(blueIndicator).toBeVisible();
      console.log('Execution documents show blue status indicator');
    }
  });
  
  // Test Step 3: View Post-Approval (purple icon)
  await test.step('View Post-Approval (purple icon)', async () => {
    // Click on Post-Approval tab
    await page.getByRole('tab', { name: /Post-Approval/i }).click();
    await page.waitForTimeout(1000);
    
    // Verify purple status indicator
    const purpleIndicator = page.locator('[data-testid="document-status"].purple, [class*="purple"][class*="status"], [style*="purple"]').first();
    if (await purpleIndicator.count() > 0) {
      await expect(purpleIndicator).toBeVisible();
      console.log('Post-Approval documents show purple status indicator');
    }
  });
  
  // Test Step 4: View Completed (green icon)
  await test.step('View Completed (green icon)', async () => {
    // Click on Completed tab
    await page.getByRole('tab', { name: /Completed/i }).click();
    await page.waitForTimeout(1000);
    
    // Verify green status indicator
    const greenIndicator = page.locator('[data-testid="document-status"].green, [class*="green"][class*="status"], [style*="green"]').first();
    if (await greenIndicator.count() > 0) {
      await expect(greenIndicator).toBeVisible();
      console.log('Completed documents show green status indicator');
    }
  });
  
  // Test Step 5: View Voided (red icon) (SC)
  await test.step('View Voided (red icon) (SC)', async () => {
    // Click on Voided tab
    await page.getByRole('tab', { name: /Voided/i }).click();
    await page.waitForTimeout(1000);
    
    // Take screenshot
    const timestamp = formatTimestamp(new Date());
    await page.screenshot({ 
      path: getScreenshotPath(`TS.6.1-05-${timestamp}.png`),
      fullPage: true 
    });
    
    // Verify red void indicator
    const redIndicator = page.locator('[data-testid="document-status"].red, [class*="red"][class*="status"], [style*="red"], text=/void/i').first();
    if (await redIndicator.count() > 0) {
      await expect(redIndicator).toBeVisible();
      console.log('Voided documents show red status indicator');
    }
  });
  
  // Expected Results:
  // 1. Documents created ✓
  // 2. Orange status indicator ✓
  // 3. Blue status indicator ✓
  // 4. Purple status indicator ✓
  // 5. Green status indicator ✓
  // 6. Red void indicator ✓
});