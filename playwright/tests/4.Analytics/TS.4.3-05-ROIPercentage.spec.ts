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

test('TS.4.3-05 ROI Percentage', async ({ page }) => {
  // Test Procedure:
  // 1. With above costs
  // 2. Check ROI percentage
  // 3. Verify calculation (SC)
  
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
  
  // Test Step 1: With above costs
  await test.step('With above costs', async () => {
    // Ensure paper cost is set to $3.00
    const setPaperCostButton = page.getByRole('button', { name: 'Set Paper Cost' });
    await setPaperCostButton.click();
    
    // Wait for modal
    await page.waitForSelector('[role="dialog"]', { timeout: 5000 });
    
    const costInput = page.getByLabel('Paper cost per page');
    await costInput.clear();
    await costInput.fill('3.00');
    
    const saveButton = page.getByRole('button', { name: 'Save' });
    await saveButton.click();
    
    // Wait for modal to close
    await expect(page.locator('[role="dialog"]')).not.toBeVisible();
  });
  
  // Test Step 2: Check ROI percentage
  await test.step('Check ROI percentage', async () => {
    // Look for ROI percentage display
    await expect(page.getByText(/ROI/)).toBeVisible();
    
    // Look for percentage value
    await expect(page.getByText(/\d+%/)).toBeVisible();
  });
  
  // Test Step 3: Verify calculation (SC)
  await test.step('Verify calculation (SC)', async () => {
    // ROI calculation: (Savings / Cost) × 100
    // For 1000 pages: Savings = $2210, Cost = $790
    // ROI = (2210/790) × 100 = 280%
    
    // Look for 280% or similar
    await expect(page.getByText(/280%/)).toBeVisible();
    
    // Take screenshot
    const timestamp = formatTimestamp(new Date());
    await page.screenshot({ 
      path: getScreenshotPath(`TS.4.3-05-${timestamp}.png`),
      fullPage: true 
    });
  });
  
  // Expected Results:
  // 1. Costs configured ✓
  // 2. ROI displayed ✓
  // 3. Shows 280% (2210/790 × 100) for 1000 pages ✓
});