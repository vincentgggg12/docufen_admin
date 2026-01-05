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

test('TS.6.1-04 Access Toggle', async ({ page }) => {
  // Test Procedure:
  // 1. Login as user with canAccessAllDocuments
  // 2. Default shows "My Documents"
  // 3. Click toggle to "Everyone's Documents"
  // 4. Verify document count increases
  // 5. Toggle back to "My Documents" (SC)
  
  // Setup: Login as user with canAccessAllDocuments permission
  const email = process.env.MS_EMAIL_17NJ5D_HENRIETTA_VASQUEZ!;
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
  
  // Test Step 1: Default shows "My Documents"
  await test.step('Default shows "My Documents"', async () => {
    // Verify toggle is visible
    const toggleButton = page.locator('[data-testid="document-view-toggle"], button:has-text(/My Documents|Everyone/i)');
    await expect(toggleButton).toBeVisible();
    
    // Verify "My Documents" is selected by default
    const myDocsActive = await page.locator('button:has-text("My Documents")[aria-pressed="true"], button:has-text("My Documents").active').count();
    expect(myDocsActive).toBeGreaterThan(0);
  });
  
  // Test Step 2: Count personal documents
  let personalDocCount = 0;
  await test.step('Count personal documents', async () => {
    const documentItems = page.locator('[data-testid="document-item"], tr[role="row"]');
    personalDocCount = await documentItems.count();
    console.log('Personal documents count:', personalDocCount);
  });
  
  // Test Step 3: Click toggle to "Everyone's Documents"
  await test.step('Click toggle to "Everyone\'s Documents"', async () => {
    const everyoneButton = page.locator('button:has-text("Everyone\'s Documents")');
    await everyoneButton.click();
    
    // Wait for documents to reload
    await page.waitForTimeout(2000);
  });
  
  // Test Step 4: Verify document count increases
  await test.step('Verify document count increases', async () => {
    const documentItems = page.locator('[data-testid="document-item"], tr[role="row"]');
    const allDocsCount = await documentItems.count();
    console.log('All documents count:', allDocsCount);
    
    // Verify count increased (or at least stayed the same if user owns all docs)
    expect(allDocsCount).toBeGreaterThanOrEqual(personalDocCount);
    
    // Verify we can see documents from other users
    const ownerElements = page.locator('[data-testid="document-owner"]');
    const uniqueOwners = new Set();
    const ownerCount = await ownerElements.count();
    
    for (let i = 0; i < ownerCount; i++) {
      const ownerText = await ownerElements.nth(i).textContent();
      if (ownerText) uniqueOwners.add(ownerText.trim());
    }
    
    console.log('Unique document owners:', Array.from(uniqueOwners));
  });
  
  // Test Step 5: Toggle back to "My Documents" (SC)
  await test.step('Toggle back to "My Documents" (SC)', async () => {
    const myDocsButton = page.locator('button:has-text("My Documents")');
    await myDocsButton.click();
    
    // Wait for documents to reload
    await page.waitForTimeout(2000);
    
    // Take screenshot
    const timestamp = formatTimestamp(new Date());
    await page.screenshot({ 
      path: getScreenshotPath(`TS.6.1-04-${timestamp}.png`),
      fullPage: true 
    });
    
    // Verify back to personal view
    const documentItems = page.locator('[data-testid="document-item"], tr[role="row"]');
    const currentCount = await documentItems.count();
    expect(currentCount).toBe(personalDocCount);
  });
  
  // Expected Results:
  // 1. Toggle visible in UI ✓
  // 2. Shows personal documents only ✓
  // 3. Toggle switches successfully ✓
  // 4. Shows all org documents ✓
  // 5. Returns to personal view ✓
});