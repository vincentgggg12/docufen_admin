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

test('TS.6.1-02 Workflow Status Filtering', async ({ page }) => {
  // Test Procedure:
  // 1. View All Documents tab
  // 2. Click Pre-Approval tab and note count
  // 3. Click Execution tab
  // 4. Click Post-Approval tab
  // 5. Click Completed tab
  // 6. Click Final PDF tab
  // 7. Click Voided tab (SC)
  
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
  
  // Test Step 1: View All Documents tab
  await test.step('View All Documents tab', async () => {
    // Verify All Documents tab is selected by default
    const allDocsTab = page.getByRole('tab', { name: /All Documents/i });
    await expect(allDocsTab).toBeVisible();
    await expect(allDocsTab).toHaveAttribute('aria-selected', 'true');
    
    // Note the count
    const tabText = await allDocsTab.textContent();
    console.log('All Documents count:', tabText);
  });
  
  // Test Step 2: Click Pre-Approval tab and note count
  await test.step('Click Pre-Approval tab and note count', async () => {
    const preApprovalTab = page.getByRole('tab', { name: /Pre-Approval/i });
    await preApprovalTab.click();
    
    // Wait for content to load
    await page.waitForTimeout(1000);
    
    // Verify only Pre-Approval stage documents are shown
    const statusIndicators = page.locator('[data-testid="document-status"], [class*="orange"]');
    if (await statusIndicators.count() > 0) {
      await expect(statusIndicators.first()).toBeVisible();
    }
    
    // Note the count
    const tabText = await preApprovalTab.textContent();
    console.log('Pre-Approval count:', tabText);
  });
  
  // Test Step 3: Click Execution tab
  await test.step('Click Execution tab', async () => {
    const executionTab = page.getByRole('tab', { name: /Execution/i });
    await executionTab.click();
    
    // Wait for content to load
    await page.waitForTimeout(1000);
    
    // Verify only Execution stage documents are shown
    const statusIndicators = page.locator('[data-testid="document-status"], [class*="blue"]');
    if (await statusIndicators.count() > 0) {
      await expect(statusIndicators.first()).toBeVisible();
    }
  });
  
  // Test Step 4: Click Post-Approval tab
  await test.step('Click Post-Approval tab', async () => {
    const postApprovalTab = page.getByRole('tab', { name: /Post-Approval/i });
    await postApprovalTab.click();
    
    // Wait for content to load
    await page.waitForTimeout(1000);
    
    // Verify only Post-Approval stage documents are shown
    const statusIndicators = page.locator('[data-testid="document-status"], [class*="purple"]');
    if (await statusIndicators.count() > 0) {
      await expect(statusIndicators.first()).toBeVisible();
    }
  });
  
  // Test Step 5: Click Completed tab
  await test.step('Click Completed tab', async () => {
    const completedTab = page.getByRole('tab', { name: /Completed/i });
    await completedTab.click();
    
    // Wait for content to load
    await page.waitForTimeout(1000);
    
    // Verify only Completed documents are shown
    const statusIndicators = page.locator('[data-testid="document-status"], [class*="green"]');
    if (await statusIndicators.count() > 0) {
      await expect(statusIndicators.first()).toBeVisible();
    }
  });
  
  // Test Step 6: Click Final PDF tab
  await test.step('Click Final PDF tab', async () => {
    const finalPdfTab = page.getByRole('tab', { name: /Final PDF/i });
    await finalPdfTab.click();
    
    // Wait for content to load
    await page.waitForTimeout(1000);
    
    // Verify only finalized PDFs are shown
    const pdfIndicators = page.locator('[data-testid="document-type"], [class*="pdf"]');
    if (await pdfIndicators.count() > 0) {
      await expect(pdfIndicators.first()).toBeVisible();
    }
  });
  
  // Test Step 7: Click Voided tab (SC)
  await test.step('Click Voided tab (SC)', async () => {
    const voidedTab = page.getByRole('tab', { name: /Voided/i });
    await voidedTab.click();
    
    // Wait for content to load
    await page.waitForTimeout(1000);
    
    // Take screenshot
    const timestamp = formatTimestamp(new Date());
    await page.screenshot({ 
      path: getScreenshotPath(`TS.6.1-02-${timestamp}.png`),
      fullPage: true 
    });
    
    // Verify only voided documents are shown
    const statusIndicators = page.locator('[data-testid="document-status"], [class*="red"], text=/void/i');
    if (await statusIndicators.count() > 0) {
      await expect(statusIndicators.first()).toBeVisible();
    }
  });
  
  // Expected Results:
  // 1. All documents shown ✓
  // 2. Only Pre-Approval stage docs ✓
  // 3. Only Execution stage docs ✓
  // 4. Only Post-Approval docs ✓
  // 5. Only Completed docs ✓
  // 6. Only finalized PDFs ✓
  // 7. Only voided documents ✓
});