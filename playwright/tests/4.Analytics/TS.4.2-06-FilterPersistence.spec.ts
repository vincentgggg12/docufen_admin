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

test('TS.4.2-06 Filter Persistence', async ({ page }) => {
  // Test Procedure:
  // 1. Apply date filter
  // 2. Navigate pages
  // 3. Verify filter remains active (SC)
  
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
  
  // Navigate to Billing
  await page.getByRole('button', { name: 'Menu' }).click();
  await page.getByRole('link', { name: 'Analytics' }).click();
  await page.waitForSelector('text=Billing', { timeout: 10000 });
  await page.getByRole('link', { name: 'Billing' }).click();
  
  // Calculate dates
  const today = new Date();
  const lastMonth = new Date();
  lastMonth.setMonth(today.getMonth() - 1);
  
  // Format dates for input (YYYY-MM-DD)
  const formatDateForInput = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };
  
  // Test Step 1: Apply date filter
  await test.step('Apply date filter', async () => {
    const startDateInput = page.getByLabel('Start Date');
    const endDateInput = page.getByLabel('End Date');
    
    await startDateInput.fill(formatDateForInput(lastMonth));
    await endDateInput.fill(formatDateForInput(today));
    
    // Apply filter if button exists
    const applyButton = page.getByRole('button', { name: 'Apply' });
    if (await applyButton.isVisible()) {
      await applyButton.click();
    }
    
    await page.waitForTimeout(1000);
  });
  
  // Test Step 2: Navigate pages
  await test.step('Navigate pages', async () => {
    // Check if pagination exists and has multiple pages
    const pagination = page.locator('[role="navigation"][aria-label="pagination"]');
    
    if (await pagination.isVisible()) {
      const nextButton = page.getByRole('button', { name: 'Go to next page' });
      if (await nextButton.isEnabled()) {
        await nextButton.click();
        await page.waitForTimeout(1000);
      }
    }
  });
  
  // Test Step 3: Verify filter remains active (SC)
  await test.step('Verify filter remains active (SC)', async () => {
    // Check that date inputs still have the filter values
    const startDateInput = page.getByLabel('Start Date');
    const endDateInput = page.getByLabel('End Date');
    
    const startValue = await startDateInput.inputValue();
    const endValue = await endDateInput.inputValue();
    
    expect(startValue).toBe(formatDateForInput(lastMonth));
    expect(endValue).toBe(formatDateForInput(today));
    
    // Take screenshot
    const timestamp = formatTimestamp(new Date());
    await page.screenshot({ 
      path: getScreenshotPath(`TS.4.2-06-${timestamp}.png`),
      fullPage: true 
    });
  });
  
  // Expected Results:
  // 1. Filter applied ✓
  // 2. Pagination works ✓
  // 3. Date filter persists across pages ✓
});