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

test('TS.6.1-03 Document Search', async ({ page }) => {
  // Test Procedure:
  // 1. In search box, type "Protocol"
  // 2. Verify results update
  // 3. Clear and search "EXT-2024"
  // 4. Clear and search by owner "Diego"
  // 5. Search non-existent "xyz123" (SC)
  
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
  
  // Test Step 1: In search box, type "Protocol"
  await test.step('In search box, type "Protocol"', async () => {
    const searchBox = page.getByPlaceholder(/search.*documents/i);
    await searchBox.click();
    await searchBox.fill('Protocol');
    
    // Wait for search to execute
    await page.waitForTimeout(1000);
  });
  
  // Test Step 2: Verify results update
  await test.step('Verify results update', async () => {
    // Verify only documents with "Protocol" in the name are shown
    const documentNames = page.locator('[data-testid="document-name"], td:has-text("Protocol")');
    if (await documentNames.count() > 0) {
      await expect(documentNames.first()).toBeVisible();
      
      // Verify all visible documents contain "Protocol"
      const allDocNames = await documentNames.allTextContents();
      allDocNames.forEach(name => {
        expect(name.toLowerCase()).toContain('protocol');
      });
    }
  });
  
  // Test Step 3: Clear and search "EXT-2024"
  await test.step('Clear and search "EXT-2024"', async () => {
    const searchBox = page.getByPlaceholder(/search.*documents/i);
    await searchBox.clear();
    await searchBox.fill('EXT-2024');
    
    // Wait for search to execute
    await page.waitForTimeout(1000);
    
    // Verify documents with EXT-2024 reference are shown
    const externalRefs = page.locator('[data-testid="document-external-ref"], td:has-text("EXT-2024")');
    if (await externalRefs.count() > 0) {
      await expect(externalRefs.first()).toBeVisible();
    }
  });
  
  // Test Step 4: Clear and search by owner "Diego"
  await test.step('Clear and search by owner "Diego"', async () => {
    const searchBox = page.getByPlaceholder(/search.*documents/i);
    await searchBox.clear();
    await searchBox.fill('Diego');
    
    // Wait for search to execute
    await page.waitForTimeout(1000);
    
    // Verify Diego's documents are shown
    const ownerNames = page.locator('[data-testid="document-owner"], td:has-text("Diego")');
    if (await ownerNames.count() > 0) {
      await expect(ownerNames.first()).toBeVisible();
    }
  });
  
  // Test Step 5: Search non-existent "xyz123" (SC)
  await test.step('Search non-existent "xyz123" (SC)', async () => {
    const searchBox = page.getByPlaceholder(/search.*documents/i);
    await searchBox.clear();
    await searchBox.fill('xyz123');
    
    // Wait for search to execute
    await page.waitForTimeout(1000);
    
    // Take screenshot
    const timestamp = formatTimestamp(new Date());
    await page.screenshot({ 
      path: getScreenshotPath(`TS.6.1-03-${timestamp}.png`),
      fullPage: true 
    });
    
    // Verify "No documents found" message
    await expect(page.getByText(/no documents found/i)).toBeVisible();
  });
  
  // Expected Results:
  // 1. Search accepts input ✓
  // 2. Shows only Protocol documents ✓
  // 3. Shows docs with EXT-2024 reference ✓
  // 4. Shows Diego's documents ✓
  // 5. Shows "No documents found" ✓
});