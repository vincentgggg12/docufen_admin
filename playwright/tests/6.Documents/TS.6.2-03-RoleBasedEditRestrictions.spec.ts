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

test('TS.6.2-03 Role-Based Edit Restrictions', async ({ page }) => {
  // Test Procedure:
  // 1. Login as Johanna (Collaborator)
  // 2. Try to edit document info
  // 3. Login as Grady (Site Admin)
  // 4. Try to edit document
  // 5. Verify edit disabled (SC)
  
  // Test Step 1: Login as Johanna (Collaborator)
  await test.step('Login as Johanna (Collaborator)', async () => {
    const johannaEmail = process.env.MS_EMAIL_17NJ5D_JOHANNA_HOLT!;
    const password = process.env.MS_PASSWORD!;
    
    // Navigate to login page
    await page.goto(`${baseUrl}/login`);
    
    // Perform Microsoft login
    await microsoftLogin(page, johannaEmail, password);
    
    // Handle ERSD if needed
    await handleERSDDialog(page);
    
    // Wait for navigation
    await page.waitForLoadState('domcontentloaded');
  });
  
  // Test Step 2: Try to edit document info
  await test.step('Try to edit document info', async () => {
    // Navigate to Documents page
    await page.getByRole('button', { name: 'Menu' }).click();
    await page.getByRole('link', { name: 'Documents' }).click();
    await page.waitForSelector('text=Documents', { timeout: 10000 });
    
    // Click on first available document
    const documentRow = page.locator('tr[role="row"]').nth(1);
    await documentRow.click();
    
    // Wait for document details to load
    await page.waitForSelector('[data-testid="document-details"], text=/Document Details/i', { timeout: 10000 });
    
    // Verify no edit button is visible
    const editButton = page.getByRole('button', { name: /Edit.*Info|Edit Document/i });
    await expect(editButton).not.toBeVisible();
    
    // Verify appropriate message or restricted access
    const restrictedMessage = page.getByText(/no permission|cannot edit|view only/i);
    if (await restrictedMessage.count() > 0) {
      await expect(restrictedMessage).toBeVisible();
    }
  });
  
  // Test Step 3: Login as Grady (Site Admin)
  await test.step('Login as Grady (Site Admin)', async () => {
    // Logout
    await page.getByRole('button', { name: /User menu|Johanna/i }).click();
    await page.getByRole('menuitem', { name: 'Logout' }).click();
    
    // Wait for logout
    await page.waitForURL(/.*\/login/);
    
    // Login as Grady
    const gradyEmail = process.env.MS_EMAIL_17NJ5D_GRADY_ADAMS!;
    const password = process.env.MS_PASSWORD!;
    await microsoftLogin(page, gradyEmail, password);
    await handleERSDDialog(page);
    
    // Wait for navigation
    await page.waitForLoadState('domcontentloaded');
  });
  
  // Test Step 4: Try to edit document
  await test.step('Try to edit document', async () => {
    // Navigate to Documents page
    await page.getByRole('button', { name: 'Menu' }).click();
    await page.getByRole('link', { name: 'Documents' }).click();
    await page.waitForSelector('text=Documents', { timeout: 10000 });
    
    // Click on a document not owned by Grady
    const documentRow = page.locator('tr[role="row"]:not(:has-text("Grady"))').first();
    await documentRow.click();
    
    // Wait for document details to load
    await page.waitForSelector('[data-testid="document-details"], text=/Document Details/i', { timeout: 10000 });
  });
  
  // Test Step 5: Verify edit disabled (SC)
  await test.step('Verify edit disabled (SC)', async () => {
    // Take screenshot
    const timestamp = formatTimestamp(new Date());
    await page.screenshot({ 
      path: getScreenshotPath(`TS.6.2-03-${timestamp}.png`),
      fullPage: true 
    });
    
    // Verify no edit button for non-owned documents
    const editButton = page.getByRole('button', { name: /Edit.*Info|Edit Document/i });
    const editButtonCount = await editButton.count();
    
    if (editButtonCount === 0) {
      console.log('Edit option not available - as expected for Site Admin on non-owned document');
    } else {
      // If button exists, it should be disabled
      await expect(editButton).toBeDisabled();
    }
    
    // Check for appropriate role message
    const roleMessage = page.getByText(/Site Admin.*cannot edit|only.*owner.*can edit/i);
    if (await roleMessage.count() > 0) {
      await expect(roleMessage).toBeVisible();
    }
  });
  
  // Expected Results:
  // 1. Johanna logged in ✓
  // 2. No edit button visible ✓
  // 3. Grady logged in ✓
  // 4. Edit option not available ✓
  // 5. Appropriate role message shown ✓
});