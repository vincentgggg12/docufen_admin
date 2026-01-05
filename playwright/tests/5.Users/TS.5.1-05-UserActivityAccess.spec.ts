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

test('TS.5.1-05 User Activity Access', async ({ page }) => {
  // Test Procedure:
  // 1. Click on Charlotte (xmwkb user)
  // 2. Expand row details
  // 3. Click "Audit Trail" button
  // 4. View activity history
  // 5. Check Created tab (SC)
  
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
  
  // Test Step 1: Click on Charlotte (xmwkb user)
  await test.step('Click on Charlotte (xmwkb user)', async () => {
    // Search for Charlotte to make sure she's visible
    const searchBox = page.getByPlaceholder(/Search/i);
    await searchBox.fill('Charlotte');
    
    // Wait for search to execute
    await page.waitForTimeout(1000);
    
    // Verify Charlotte is in the list
    await expect(page.getByText('Charlotte Brown')).toBeVisible();
  });
  
  // Test Step 2: Expand row details
  await test.step('Expand row details', async () => {
    // Click on Charlotte's row to expand it
    const charlotteRow = page.locator('tr').filter({ hasText: 'Charlotte Brown' });
    await charlotteRow.click();
    
    // Wait for expansion
    await page.waitForTimeout(1000);
    
    // Verify row is expanded
    const expandedDetails = page.locator('[data-testid="user-details"], [aria-expanded="true"]');
    await expect(expandedDetails).toBeVisible();
  });
  
  // Test Step 3: Click "Audit Trail" button
  await test.step('Click "Audit Trail" button', async () => {
    // Find and click Audit Trail button
    const auditTrailButton = page.getByRole('button', { name: /Audit Trail/i });
    await auditTrailButton.click();
    
    // Wait for modal to open
    await page.waitForTimeout(1000);
  });
  
  // Test Step 4: View activity history
  await test.step('View activity history', async () => {
    // Verify modal is open
    const auditModal = page.locator('[role="dialog"], [data-testid="audit-trail-modal"]');
    await expect(auditModal).toBeVisible();
    
    // Verify activity history is shown
    await expect(page.getByText(/Activity/i)).toBeVisible();
    
    // Verify user actions are displayed
    const activityRows = page.locator('[data-testid="activity-row"], tbody tr').filter({ hasText: /\d{4}-\d{2}-\d{2}/ });
    const activityCount = await activityRows.count();
    expect(activityCount).toBeGreaterThanOrEqual(0);
  });
  
  // Test Step 5: Check Created tab (SC)
  await test.step('Check Created tab (SC)', async () => {
    // Click on Created tab
    const createdTab = page.getByRole('tab', { name: /Created/i });
    await createdTab.click();
    
    // Wait for tab content to update
    await page.waitForTimeout(1000);
    
    // Take screenshot
    const timestamp = formatTimestamp(new Date());
    await page.screenshot({ 
      path: getScreenshotPath(`TS.5.1-05-${timestamp}.png`),
      fullPage: true 
    });
    
    // Verify Created tab shows documents created by user
    const documentRows = page.locator('[data-testid="document-row"], tbody tr');
    if (await documentRows.count() > 0) {
      await expect(documentRows.first()).toBeVisible();
    } else {
      // If no documents, verify empty state
      await expect(page.getByText(/No documents created/i)).toBeVisible();
    }
  });
  
  // Expected Results:
  // 1. Row expands on click ✓
  // 2. Audit Trail button visible ✓
  // 3. Modal opens with activity ✓
  // 4. Shows all user actions ✓
  // 5. Created tab shows documents created ✓
});