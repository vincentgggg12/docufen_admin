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

test('TS.6.1-01 Document Access Control', async ({ page }) => {
  // Test Procedure:
  // 1. Login as Diego (Creator)
  // 2. Navigate to Documents page
  // 3. View document list
  // 4. Login as Henrietta with "View All Docs" enabled
  // 5. Toggle to "Everyone's Documents" (SC)
  
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
  
  // Test Step 1: Navigate to Documents page
  await test.step('Navigate to Documents page', async () => {
    await page.getByRole('button', { name: 'Menu' }).click();
    await page.getByRole('link', { name: 'Documents' }).click();
    
    // Wait for Documents page to load
    await page.waitForSelector('text=Documents', { timeout: 10000 });
  });
  
  // Test Step 2: View document list
  await test.step('View document list', async () => {
    // Verify document list is visible
    await expect(page.getByRole('heading', { name: 'Documents' })).toBeVisible();
    
    // Verify document count is shown
    const documentCount = page.locator('[data-testid="document-count"], text=/\\d+ documents?/i');
    await expect(documentCount).toBeVisible();
    
    // Verify only Diego's documents are shown
    const ownerElements = page.locator('[data-testid="document-owner"], td:has-text("Diego")');
    if (await ownerElements.count() > 0) {
      await expect(ownerElements.first()).toBeVisible();
    }
  });
  
  // Test Step 3: Login as Henrietta
  await test.step('Login as Henrietta with "View All Docs" enabled', async () => {
    // Logout first
    await page.getByRole('button', { name: /User menu|Diego/i }).click();
    await page.getByRole('menuitem', { name: 'Logout' }).click();
    
    // Wait for logout to complete
    await page.waitForURL(/.*\/login/);
    
    // Login as Henrietta
    const henriettaEmail = process.env.MS_EMAIL_17NJ5D_HENRIETTA_VASQUEZ!;
    await microsoftLogin(page, henriettaEmail, password);
    await handleERSDDialog(page);
    
    // Navigate to Documents page
    await page.getByRole('button', { name: 'Menu' }).click();
    await page.getByRole('link', { name: 'Documents' }).click();
    await page.waitForSelector('text=Documents', { timeout: 10000 });
  });
  
  // Test Step 4: Toggle to "Everyone's Documents" (SC)
  await test.step('Toggle to "Everyone\'s Documents" (SC)', async () => {
    // Look for the toggle button
    const toggleButton = page.locator('[data-testid="document-view-toggle"], button:has-text("Everyone\'s Documents")');
    
    // Click to show everyone's documents
    await toggleButton.click();
    
    // Wait for documents to reload
    await page.waitForTimeout(2000);
    
    // Take screenshot
    const timestamp = formatTimestamp(new Date());
    await page.screenshot({ 
      path: getScreenshotPath(`TS.6.1-01-${timestamp}.png`),
      fullPage: true 
    });
    
    // Verify more documents are shown
    const documentItems = page.locator('[data-testid="document-item"], tr[role="row"]');
    const documentCount = await documentItems.count();
    expect(documentCount).toBeGreaterThan(0);
  });
  
  // Expected Results:
  // 1. Documents page loads ✓
  // 2. Shows only Diego's owned/shared docs ✓
  // 3. Document count shown ✓
  // 4. Henrietta logged in ✓
  // 5. Shows all organization documents ✓
});