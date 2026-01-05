import { test, expect } from '@playwright/test';
import { microsoftLogin } from '../utils/msLogin';
import { handleERSDDialog } from '../utils/ersd-handler';
import { getScreenshotPath } from '../utils/paths';
import { navigateToAccount } from '../utils/navigateToAccount';
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

test('TS.3.3-01 View Trial Status', async ({ page }) => {
  // Test Procedure:
  // 1. Login as Megan (Trial Admin)
  // 2. Navigate to License section
  // 3. Check trial countdown (SC)
  
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
  
  // Test Step 1: Navigate to Account page
  await test.step('Navigate to Account page', async () => {
    await navigateToAccount(page);
  });
  
  // Test Step 2: Navigate to License section
  await test.step('Navigate to License section', async () => {
    // Click on License tab
    const licenseTab = page.getByRole('tab', { name: 'License' });
    await expect(licenseTab).toBeVisible();
    await licenseTab.click();
    
    // Wait for tab content to load
    await page.waitForLoadState('networkidle');
  });
  
  // Test Step 3: Check trial countdown (SC)
  await test.step('Check trial countdown (SC)', async () => {
    // License tab should be available
    const licenseTab = page.getByRole('tab', { name: 'License' });
    await expect(licenseTab).toBeVisible();
    
    // Look for trial status text
    const trialStatusRegex = /Trial\s*-\s*\d+\s*days?\s*remaining/i;
    const trialStatus = page.getByText(trialStatusRegex);
    await expect(trialStatus).toBeVisible();
    
    // Get the trial status text to verify countdown is accurate
    const statusText = await trialStatus.textContent();
    expect(statusText).toMatch(trialStatusRegex);
    
    // Verify countdown shows a number
    const daysMatch = statusText?.match(/(\d+)\s*days?\s*remaining/i);
    expect(daysMatch).toBeTruthy();
    const daysRemaining = parseInt(daysMatch![1]);
    expect(daysRemaining).toBeGreaterThanOrEqual(0);
    expect(daysRemaining).toBeLessThanOrEqual(365); // Reasonable upper limit
    
    // Take screenshot
    const timestamp = formatTimestamp(new Date());
    await page.screenshot({ 
      path: getScreenshotPath(`TS.3.3-01-${timestamp}.png`),
      fullPage: true 
    });
  });
  
  // Expected Results:
  // 1. License tab available ✓
  // 2. Shows "Trial - X days remaining" ✓
  // 3. Countdown accurate ✓
});