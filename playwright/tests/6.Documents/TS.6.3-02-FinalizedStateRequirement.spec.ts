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

test('TS.6.3-02 Finalized State Requirement', async ({ page }) => {
  // Test Procedure:
  // 1. As Megan, open Pre-Approval doc
  // 2. Check for delete option
  // 3. Open Execution stage doc
  // 4. Check for delete option
  // 5. Open Final PDF doc
  // 6. Verify delete available (SC)
  
  // Setup: Login as Megan (Admin)
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
  
  // Test Step 1: As Megan, open Pre-Approval doc
  await test.step('As Megan, open Pre-Approval doc', async () => {
    // Click Pre-Approval tab
    const preApprovalTab = page.getByRole('tab', { name: /Pre-Approval/i });
    await preApprovalTab.click();
    await page.waitForTimeout(2000);
    
    // Open a Pre-Approval document if available
    const documentRow = page.locator('tr[role="row"]').nth(1);
    if (await documentRow.count() > 0) {
      await documentRow.click();
      await page.waitForSelector('[data-testid="document-details"]', { timeout: 10000 });
    }
  });
  
  // Test Step 2: Check for delete option
  await test.step('Check for delete option', async () => {
    // Look for delete button
    const deleteButton = page.getByRole('button', { name: /Delete/i });
    const deleteButtonCount = await deleteButton.count();
    
    // Verify no delete option for Pre-Approval docs
    expect(deleteButtonCount).toBe(0);
    console.log('No delete option for Pre-Approval documents - as expected');
    
    // Go back to documents list
    await page.getByRole('button', { name: /Back|Documents/i }).click();
  });
  
  // Test Step 3: Open Execution stage doc
  await test.step('Open Execution stage doc', async () => {
    // Click Execution tab
    const executionTab = page.getByRole('tab', { name: /Execution/i });
    await executionTab.click();
    await page.waitForTimeout(2000);
    
    // Open an Execution document if available
    const documentRow = page.locator('tr[role="row"]').nth(1);
    if (await documentRow.count() > 0) {
      await documentRow.click();
      await page.waitForSelector('[data-testid="document-details"]', { timeout: 10000 });
    }
  });
  
  // Test Step 4: Check for delete option
  await test.step('Check for delete option', async () => {
    // Look for delete button
    const deleteButton = page.getByRole('button', { name: /Delete/i });
    const deleteButtonCount = await deleteButton.count();
    
    // Verify no delete option for Execution docs
    expect(deleteButtonCount).toBe(0);
    console.log('No delete option for Execution documents - as expected');
    
    // Go back to documents list
    await page.getByRole('button', { name: /Back|Documents/i }).click();
  });
  
  // Test Step 5: Open Final PDF doc
  await test.step('Open Final PDF doc', async () => {
    // Click Final PDF tab
    const finalPdfTab = page.getByRole('tab', { name: /Final PDF/i });
    await finalPdfTab.click();
    await page.waitForTimeout(2000);
    
    // Open a Final PDF document
    const documentRow = page.locator('tr[role="row"]').nth(1);
    await documentRow.click();
    await page.waitForSelector('[data-testid="document-details"]', { timeout: 10000 });
  });
  
  // Test Step 6: Verify delete available (SC)
  await test.step('Verify delete available (SC)', async () => {
    // Take screenshot
    const timestamp = formatTimestamp(new Date());
    await page.screenshot({ 
      path: getScreenshotPath(`TS.6.3-02-${timestamp}.png`),
      fullPage: true 
    });
    
    // Verify delete button is visible for finalized docs
    const deleteButton = page.getByRole('button', { name: /Delete/i });
    await expect(deleteButton).toBeVisible();
    console.log('Delete button is visible for Final PDF documents');
  });
  
  // Expected Results:
  // 1. Pre-Approval doc opens ✓
  // 2. No delete option ✓
  // 3. Execution doc opens ✓
  // 4. No delete option ✓
  // 5. Finalized doc opens ✓
  // 6. Delete button visible ✓
});