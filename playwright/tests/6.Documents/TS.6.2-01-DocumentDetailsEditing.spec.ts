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

test('TS.6.2-01 Document Details Editing', async ({ page }) => {
  // Test Procedure:
  // 1. Open document owned by Diego
  // 2. Click edit document info
  // 3. Change name to "Updated Protocol v2"
  // 4. Change external ref to "EXT-2025-001"
  // 5. Change category to "validation"
  // 6. Verify ID unchanged (SC)
  
  // Setup: Login as Diego (not reported as test step)
  const email = process.env.MS_EMAIL_17NJ5D_DIEGO_MOLINA!;
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
  
  // Test Step 1: Open document owned by Diego
  let originalDocId: string | null = '';
  await test.step('Open document owned by Diego', async () => {
    // Find a document owned by Diego
    const documentRow = page.locator('tr[role="row"]:has-text("Diego")').first();
    
    // Get the document ID before clicking
    const docIdElement = documentRow.locator('[data-testid="document-id"], td:first-child');
    originalDocId = await docIdElement.textContent();
    console.log('Original document ID:', originalDocId);
    
    // Click on the document
    await documentRow.click();
    
    // Wait for document details to load
    await page.waitForSelector('[data-testid="document-details"], text=/Document Details/i', { timeout: 10000 });
  });
  
  // Test Step 2: Click edit document info
  await test.step('Click edit document info', async () => {
    const editButton = page.getByRole('button', { name: /Edit.*Info|Edit Document/i });
    await editButton.click();
    
    // Wait for edit dialog to appear
    await page.waitForSelector('[role="dialog"], [data-testid="edit-document-dialog"]', { timeout: 5000 });
  });
  
  // Test Step 3: Change name to "Updated Protocol v2"
  await test.step('Change name to "Updated Protocol v2"', async () => {
    const nameInput = page.getByLabel(/Document Name/i);
    await nameInput.clear();
    await nameInput.fill('Updated Protocol v2');
  });
  
  // Test Step 4: Change external ref to "EXT-2025-001"
  await test.step('Change external ref to "EXT-2025-001"', async () => {
    const externalRefInput = page.getByLabel(/External Reference/i);
    await externalRefInput.clear();
    await externalRefInput.fill('EXT-2025-001');
  });
  
  // Test Step 5: Change category to "validation"
  await test.step('Change category to "validation"', async () => {
    // Click category dropdown
    const categoryDropdown = page.getByLabel(/Category/i);
    await categoryDropdown.click();
    
    // Select validation option
    await page.getByRole('option', { name: /validation/i }).click();
  });
  
  // Test Step 6: Verify ID unchanged (SC)
  await test.step('Verify ID unchanged (SC)', async () => {
    // Save changes
    const saveButton = page.getByRole('button', { name: /Save/i });
    await saveButton.click();
    
    // Wait for dialog to close
    await page.waitForSelector('[role="dialog"]', { state: 'hidden', timeout: 5000 });
    
    // Take screenshot showing updated document
    const timestamp = formatTimestamp(new Date());
    await page.screenshot({ 
      path: getScreenshotPath(`TS.6.2-01-${timestamp}.png`),
      fullPage: true 
    });
    
    // Verify document ID is unchanged
    const currentDocId = await page.locator('[data-testid="document-id"]').first().textContent();
    expect(currentDocId).toBe(originalDocId);
    
    // Verify changes were saved
    await expect(page.getByText('Updated Protocol v2')).toBeVisible();
    await expect(page.getByText('EXT-2025-001')).toBeVisible();
    await expect(page.getByText(/validation/i)).toBeVisible();
  });
  
  // Expected Results:
  // 1. Document opens ✓
  // 2. Edit dialog appears ✓
  // 3. Name field editable ✓
  // 4. External ref editable ✓
  // 5. Category updates ✓
  // 6. Document ID remains same ✓
});