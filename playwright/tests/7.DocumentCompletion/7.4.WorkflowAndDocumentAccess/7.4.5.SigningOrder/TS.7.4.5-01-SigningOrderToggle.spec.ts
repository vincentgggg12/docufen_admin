import { test, expect } from '@playwright/test';
import { microsoftLogin } from '../../../utils/msLogin';
import { handleERSDDialog } from '../../../utils/ersd-handler';
import { getScreenshotPath } from '../../../utils/paths';
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

test('TS.7.4.5-01 Signing Order Toggle', async ({ page }) => {
  // Test Procedure:
  // 1. Find order checkbox
  // 2. Check Pre-Approval
  // 3. Order enabled
  // 4. Uncheck Execution
  // 5. Independent control (SC)
  
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
  
  // Navigate to documents and create/open a document with participants
  await test.step('Navigate to document with participants', async () => {
    // Navigate to documents
    await page.getByRole('link', { name: 'Documents' }).click();
    await page.waitForLoadState('domcontentloaded');
    
    // Find or create a document with participants
    // For test purposes, assume we have a document ready
    const documentCard = page.locator('.document-card').first();
    if (await documentCard.count() > 0) {
      await documentCard.click();
    } else {
      // Create new document if needed
      await page.getByRole('button', { name: 'New Document' }).click();
      await page.waitForLoadState('domcontentloaded');
    }
    
    // Wait for document editor to load
    await page.waitForSelector('.document-editor', { timeout: 30000 });
  });
  
  // Test Step 1: Find order checkbox
  await test.step('Find order checkbox', async () => {
    // Open workflow/participants panel
    await page.getByRole('button', { name: 'Workflow' }).click();
    await page.waitForTimeout(1000);
    
    // Look for signing order checkbox
    const orderCheckbox = page.locator('input[type="checkbox"]').filter({ hasText: /signing order/i });
    await expect(orderCheckbox).toBeVisible();
  });
  
  // Test Step 2: Check Pre-Approval
  await test.step('Check Pre-Approval', async () => {
    // Find Pre-Approval signing order checkbox
    const preApprovalCheckbox = page.locator('.pre-approval-group input[type="checkbox"]');
    await preApprovalCheckbox.check();
    
    // Verify it's checked
    await expect(preApprovalCheckbox).toBeChecked();
  });
  
  // Test Step 3: Order enabled
  await test.step('Order enabled', async () => {
    // Verify that numbers appear next to participants in Pre-Approval
    const preApprovalParticipants = page.locator('.pre-approval-group .participant-item');
    
    // Check for order numbers (1, 2, 3, etc.)
    await expect(preApprovalParticipants.first()).toContainText('1');
    
    // Verify drag handles are visible for reordering
    const dragHandles = page.locator('.pre-approval-group .drag-handle');
    await expect(dragHandles.first()).toBeVisible();
  });
  
  // Test Step 4: Uncheck Execution
  await test.step('Uncheck Execution', async () => {
    // Find Execution signing order checkbox
    const executionCheckbox = page.locator('.execution-group input[type="checkbox"]');
    
    // Ensure it's unchecked
    if (await executionCheckbox.isChecked()) {
      await executionCheckbox.uncheck();
    }
    
    // Verify it's unchecked
    await expect(executionCheckbox).not.toBeChecked();
    
    // Verify no order numbers in Execution group
    const executionParticipants = page.locator('.execution-group .participant-item');
    await expect(executionParticipants.first()).not.toContainText(/^\d+$/);
  });
  
  // Test Step 5: Independent control (SC)
  await test.step('Independent control (SC)', async () => {
    // Verify Pre-Approval still has order enabled
    const preApprovalCheckbox = page.locator('.pre-approval-group input[type="checkbox"]');
    await expect(preApprovalCheckbox).toBeChecked();
    
    // Verify Execution has order disabled
    const executionCheckbox = page.locator('.execution-group input[type="checkbox"]');
    await expect(executionCheckbox).not.toBeChecked();
    
    // Take screenshot showing independent control
    const timestamp = formatTimestamp(new Date());
    await page.screenshot({ 
      path: getScreenshotPath(`TS.7.4.5-01-${timestamp}.png`),
      fullPage: true 
    });
    
    // Verify each group maintains its own signing order setting
    await expect(page.locator('.pre-approval-group .participant-item').first()).toContainText('1');
    await expect(page.locator('.execution-group .participant-item').first()).not.toContainText(/^\d+$/);
  });
  
  // Expected Results:
  // 1. Checkbox found ✓
  // 2. Pre-Approval ordered ✓
  // 3. Numbers appear ✓
  // 4. Execution parallel ✓
  // 5. Per-group setting ✓
});