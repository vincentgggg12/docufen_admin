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

test('TS.4.4-05 Division by Zero ROI', async ({ page }) => {
  // Test Procedure:
  // 1. Set paper cost = $0.79
  // 2. Current tier also $0.79
  // 3. Check ROI calculation
  // 4. Verify no infinity/NaN (SC)
  
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
  
  // Navigate to ROI Analytics
  await page.getByRole('button', { name: 'Menu' }).click();
  await page.getByRole('link', { name: 'Analytics' }).click();
  await page.waitForSelector('text=ROI Analytics', { timeout: 10000 });
  await page.getByRole('link', { name: 'ROI Analytics' }).click();
  
  // Test Step 1: Set paper cost = $0.79
  await test.step('Set paper cost = $0.79', async () => {
    const setPaperCostButton = page.getByRole('button', { name: 'Set Paper Cost' });
    await setPaperCostButton.click();
    
    // Wait for modal
    await page.waitForSelector('[role="dialog"]', { timeout: 5000 });
    
    const costInput = page.getByLabel('Paper cost per page');
    await costInput.clear();
    await costInput.fill('0.79');
    
    const saveButton = page.getByRole('button', { name: 'Save' });
    await saveButton.click();
    
    // Wait for modal to close
    await expect(page.locator('[role="dialog"]')).not.toBeVisible();
  });
  
  // Test Step 2: Current tier also $0.79
  await test.step('Current tier also $0.79', async () => {
    // Verify we're looking at tier 1 pricing ($0.79)
    await expect(page.getByText('$0.79')).toBeVisible();
  });
  
  // Test Step 3: Check ROI calculation
  await test.step('Check ROI calculation', async () => {
    // Look for ROI display
    await expect(page.getByText(/ROI/)).toBeVisible();
  });
  
  // Test Step 4: Verify no infinity/NaN (SC)
  await test.step('Verify no infinity/NaN (SC)', async () => {
    // ROI should show "0%" when paper cost equals Docufen cost
    await expect(page.getByText('0%')).toBeVisible();
    
    // Verify no "Infinity" or "NaN" text appears
    await expect(page.getByText('Infinity')).not.toBeVisible();
    await expect(page.getByText('NaN')).not.toBeVisible();
    
    // Take screenshot
    const timestamp = formatTimestamp(new Date());
    await page.screenshot({ 
      path: getScreenshotPath(`TS.4.4-05-${timestamp}.png`),
      fullPage: true 
    });
  });
  
  // Expected Results:
  // 1. Same costs entered ✓
  // 2. No savings (0%) ✓
  // 3. ROI shows "0%" ✓
  // 4. No calculation errors ✓
});