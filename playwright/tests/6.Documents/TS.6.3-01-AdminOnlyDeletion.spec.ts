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

test('TS.6.3-01 Admin-Only Deletion', async ({ page }) => {
  // Test Procedure:
  // 1. Login as Diego (Creator)
  // 2. Open own finalized document
  // 3. Verify no delete option
  // 4. Login as Megan (Admin)
  // 5. Verify delete button visible (SC)
  
  // Test Step 1: Login as Diego (Creator)
  await test.step('Login as Diego (Creator)', async () => {
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
  });
  
  // Test Step 2: Open own finalized document
  await test.step('Open own finalized document', async () => {
    // Navigate to Documents page
    await page.getByRole('button', { name: 'Menu' }).click();
    await page.getByRole('link', { name: 'Documents' }).click();
    await page.waitForSelector('text=Documents', { timeout: 10000 });
    
    // Navigate to Final PDF tab
    const finalPdfTab = page.getByRole('tab', { name: /Final PDF/i });
    await finalPdfTab.click();
    await page.waitForTimeout(2000);
    
    // Open a finalized document owned by Diego
    const documentRow = page.locator('tr[role="row"]:has-text("Diego")').first();
    if (await documentRow.count() === 0) {
      // If no Diego documents in Final PDF, try to find any finalized document
      const anyDocument = page.locator('tr[role="row"]').nth(1);
      await anyDocument.click();
    } else {
      await documentRow.click();
    }
    
    // Wait for document details to load
    await page.waitForSelector('[data-testid="document-details"]', { timeout: 10000 });
  });
  
  // Test Step 3: Verify no delete option
  await test.step('Verify no delete option', async () => {
    // Look for delete button
    const deleteButton = page.getByRole('button', { name: /Delete/i });
    const deleteButtonCount = await deleteButton.count();
    
    // Verify no delete button is shown for creator
    expect(deleteButtonCount).toBe(0);
    console.log('No delete button shown for document creator - as expected');
  });
  
  // Test Step 4: Login as Megan (Admin)
  await test.step('Login as Megan (Admin)', async () => {
    // Logout
    await page.getByRole('button', { name: /User menu|Diego/i }).click();
    await page.getByRole('menuitem', { name: 'Logout' }).click();
    
    // Wait for logout
    await page.waitForURL(/.*\/login/);
    
    // Login as Megan
    const meganEmail = process.env.MS_EMAIL_17NJ5D_MEGAN_BOWEN!;
    const password = process.env.MS_PASSWORD!;
    await microsoftLogin(page, meganEmail, password);
    await handleERSDDialog(page);
    
    // Wait for navigation
    await page.waitForLoadState('domcontentloaded');
  });
  
  // Test Step 5: Verify delete button visible (SC)
  await test.step('Verify delete button visible (SC)', async () => {
    // Navigate to Documents page
    await page.getByRole('button', { name: 'Menu' }).click();
    await page.getByRole('link', { name: 'Documents' }).click();
    await page.waitForSelector('text=Documents', { timeout: 10000 });
    
    // Navigate to Final PDF tab
    const finalPdfTab = page.getByRole('tab', { name: /Final PDF/i });
    await finalPdfTab.click();
    await page.waitForTimeout(2000);
    
    // Open any finalized document
    const documentRow = page.locator('tr[role="row"]').nth(1);
    await documentRow.click();
    
    // Wait for document details to load
    await page.waitForSelector('[data-testid="document-details"]', { timeout: 10000 });
    
    // Take screenshot
    const timestamp = formatTimestamp(new Date());
    await page.screenshot({ 
      path: getScreenshotPath(`TS.6.3-01-${timestamp}.png`),
      fullPage: true 
    });
    
    // Verify delete button is visible for admin
    const deleteButton = page.getByRole('button', { name: /Delete/i });
    await expect(deleteButton).toBeVisible();
    console.log('Delete button is visible for Trial Administrator');
  });
  
  // Expected Results:
  // 1. Creator logged in ✓
  // 2. Document opens ✓
  // 3. No delete button shown ✓
  // 4. Admin logged in ✓
  // 5. Delete button available ✓
});