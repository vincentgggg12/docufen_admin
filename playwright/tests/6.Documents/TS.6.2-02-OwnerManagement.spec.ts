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

test('TS.6.2-02 Owner Management', async ({ page }) => {
  // Test Procedure:
  // 1. As Diego, edit own document
  // 2. Click "Add Owner" button
  // 3. Select Henrietta as co-owner
  // 4. Save changes
  // 5. Login as Henrietta and verify full access (SC)
  
  // Setup: Login as Diego (not reported as test step)
  const diegoEmail = process.env.MS_EMAIL_17NJ5D_DIEGO_MOLINA!;
  const password = process.env.MS_PASSWORD!;
  
  // Navigate to login page
  await page.goto(`${baseUrl}/login`);
  
  // Perform Microsoft login
  await microsoftLogin(page, diegoEmail, password);
  
  // Handle ERSD if needed
  await handleERSDDialog(page);
  
  // Wait for navigation
  await page.waitForLoadState('domcontentloaded');
  
  // Navigate to Documents page
  await page.getByRole('button', { name: 'Menu' }).click();
  await page.getByRole('link', { name: 'Documents' }).click();
  await page.waitForSelector('text=Documents', { timeout: 10000 });
  
  // Test Step 1: As Diego, edit own document
  let documentName: string | null = '';
  await test.step('As Diego, edit own document', async () => {
    // Find a document owned by Diego
    const documentRow = page.locator('tr[role="row"]:has-text("Diego")').first();
    
    // Get document name for later verification
    const docNameElement = documentRow.locator('[data-testid="document-name"]');
    documentName = await docNameElement.textContent();
    console.log('Document name:', documentName);
    
    // Click on the document
    await documentRow.click();
    
    // Wait for document details to load
    await page.waitForSelector('[data-testid="document-details"], text=/Document Details/i', { timeout: 10000 });
    
    // Click edit button
    const editButton = page.getByRole('button', { name: /Edit.*Info|Edit Document/i });
    await editButton.click();
    
    // Wait for edit dialog
    await page.waitForSelector('[role="dialog"], [data-testid="edit-document-dialog"]', { timeout: 5000 });
  });
  
  // Test Step 2: Click "Add Owner" button
  await test.step('Click "Add Owner" button', async () => {
    const addOwnerButton = page.getByRole('button', { name: /Add Owner/i });
    await addOwnerButton.click();
    
    // Wait for owner section to expand or become active
    await page.waitForTimeout(500);
  });
  
  // Test Step 3: Select Henrietta as co-owner
  await test.step('Select Henrietta as co-owner', async () => {
    // Click on user selector dropdown
    const userSelector = page.locator('[data-testid="owner-selector"], [aria-label*="Select user"]');
    await userSelector.click();
    
    // Select Henrietta from dropdown
    await page.getByRole('option', { name: /Henrietta/i }).click();
  });
  
  // Test Step 4: Save changes
  await test.step('Save changes', async () => {
    const saveButton = page.getByRole('button', { name: /Save/i });
    await saveButton.click();
    
    // Wait for dialog to close
    await page.waitForSelector('[role="dialog"]', { state: 'hidden', timeout: 5000 });
    
    // Verify Henrietta is listed as owner
    await expect(page.getByText(/Henrietta.*Owner/i)).toBeVisible();
  });
  
  // Test Step 5: Login as Henrietta and verify full access (SC)
  await test.step('Login as Henrietta and verify full access (SC)', async () => {
    // Logout
    await page.getByRole('button', { name: /User menu|Diego/i }).click();
    await page.getByRole('menuitem', { name: 'Logout' }).click();
    
    // Wait for logout
    await page.waitForURL(/.*\/login/);
    
    // Login as Henrietta
    const henriettaEmail = process.env.MS_EMAIL_17NJ5D_HENRIETTA_VASQUEZ!;
    await microsoftLogin(page, henriettaEmail, password);
    await handleERSDDialog(page);
    
    // Navigate to Documents page
    await page.getByRole('button', { name: 'Menu' }).click();
    await page.getByRole('link', { name: 'Documents' }).click();
    await page.waitForSelector('text=Documents', { timeout: 10000 });
    
    // Find and open the document
    const documentRow = page.locator(`tr[role="row"]:has-text("${documentName}")`).first();
    await documentRow.click();
    
    // Wait for document to load
    await page.waitForSelector('[data-testid="document-details"]', { timeout: 10000 });
    
    // Verify edit button is visible (full access)
    const editButton = page.getByRole('button', { name: /Edit.*Info|Edit Document/i });
    await expect(editButton).toBeVisible();
    
    // Take screenshot
    const timestamp = formatTimestamp(new Date());
    await page.screenshot({ 
      path: getScreenshotPath(`TS.6.2-02-${timestamp}.png`),
      fullPage: true 
    });
  });
  
  // Expected Results:
  // 1. Edit dialog opens ✓
  // 2. Owner section visible ✓
  // 3. User selector shows ✓
  // 4. Owner added successfully ✓
  // 5. Henrietta can edit document ✓
});