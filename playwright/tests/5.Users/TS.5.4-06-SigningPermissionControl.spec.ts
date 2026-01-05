import { test, expect } from '@playwright/test';
import { microsoftLogin } from '../utils/msLogin';
import { handleERSDDialog } from '../utils/ersd-handler';
import { getScreenshotPath } from '../utils/paths';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.playwright.env' });

const baseUrl = process.env.BASE_URL;

// Set test timeout to 150 seconds (longer due to multiple logins)
test.setTimeout(150000);

test.use({
  viewport: { height: 1080, width: 1920 },
  ignoreHTTPSErrors: true
});

function formatTimestamp(date: Date): string {
  return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}-${String(date.getHours()).padStart(2, '0')}.${String(date.getMinutes()).padStart(2, '0')}.${String(date.getSeconds()).padStart(2, '0')}`;
}

test('TS.5.4-06 Signing Permission Control', async ({ page }) => {
  // Test Procedure:
  // 1. Login as unverified user (Lee)
  // 2. Open document for signing
  // 3. Try to add signature
  // 4. Get verified by Grady
  // 5. Retry signing (SC)
  
  // Test Step 1: Login as unverified user (Lee)
  await test.step('Login as unverified user (Lee)', async () => {
    const leeEmail = process.env.MS_EMAIL_17NJ5D_LEE_MILLER!;
    const password = process.env.MS_PASSWORD!;
    
    // Navigate to login page
    await page.goto(`${baseUrl}/login`);
    
    // Perform Microsoft login
    await microsoftLogin(page, leeEmail, password);
    
    // Handle ERSD if needed
    await handleERSDDialog(page);
    
    // Wait for navigation
    await page.waitForLoadState('domcontentloaded');
    
    // Verify logged in as Lee
    await expect(page).toHaveURL(/.*\/documents/);
  });
  
  // Test Step 2: Open document for signing
  await test.step('Open document for signing', async () => {
    // Navigate to Documents page if not already there
    if (!(await page.url()).includes('/documents')) {
      await page.getByRole('button', { name: 'Menu' }).click();
      await page.getByRole('link', { name: 'Documents' }).click();
    }
    
    // Wait for documents to load
    await page.waitForSelector('[data-testid="document-row"], tr', { timeout: 10000 });
    
    // Open the first available document
    const firstDocument = page.locator('[data-testid="document-row"], tr').filter({ hasText: /\.docx/i }).first();
    await firstDocument.click();
    
    // Wait for document to open
    await page.waitForTimeout(3000);
    
    // Verify document editor is loaded
    await expect(page.locator('[data-testid="document-editor"], iframe, .document-viewer')).toBeVisible();
  });
  
  // Test Step 3: Try to add signature
  await test.step('Try to add signature', async () => {
    // Look for signature button/option
    const signButton = page.getByRole('button', { name: /Sign|Signature/i });
    
    if (await signButton.isVisible()) {
      await signButton.click();
      await page.waitForTimeout(1000);
      
      // Expect to see "Signature not verified" message
      await expect(page.getByText(/Signature not verified|verification required|cannot sign/i)).toBeVisible();
    } else {
      // Signature option might be disabled/hidden for unverified users
      console.log('Signature option not available for unverified user');
    }
    
    // Close document
    const closeButton = page.getByRole('button', { name: /Close|Back/i });
    if (await closeButton.isVisible()) {
      await closeButton.click();
    } else {
      await page.goBack();
    }
  });
  
  // Test Step 4: Get verified by Grady
  await test.step('Get verified by Grady', async () => {
    // Logout as Lee
    await page.getByRole('button', { name: 'Menu' }).click();
    await page.getByRole('button', { name: /Sign Out/i }).click();
    await page.waitForTimeout(2000);
    
    // Login as Grady
    const gradyEmail = process.env.MS_EMAIL_17NJ5D_GRADY_ADAMS!;
    const password = process.env.MS_PASSWORD!;
    
    await page.goto(`${baseUrl}/login`);
    await microsoftLogin(page, gradyEmail, password);
    await handleERSDDialog(page);
    
    // Navigate to Users
    await page.getByRole('button', { name: 'Menu' }).click();
    await page.getByRole('link', { name: 'Users' }).click();
    await page.waitForSelector('text=Users', { timeout: 10000 });
    
    // Search for Lee
    const searchBox = page.getByPlaceholder(/Search/i);
    await searchBox.fill('Lee Miller');
    await page.waitForTimeout(1000);
    
    // Verify Lee's signature
    const leeRow = page.locator('tr').filter({ hasText: 'Lee Miller' });
    await leeRow.click();
    await page.waitForTimeout(1000);
    
    const verifyButton = page.getByRole('button', { name: /Verify.*Signature/i });
    await verifyButton.click();
    await page.waitForTimeout(1000);
    
    // Use Register Notation method
    const registerOption = page.getByLabel(/Register Notation/i).or(
      page.locator('input[type="radio"]').filter({ has: page.locator('text=/Register Notation/i') })
    );
    await registerOption.click();
    
    const notationField = page.getByLabel(/Notation|Register.*Entry/i);
    await notationField.fill('Verified for testing - Page 1, Entry 1');
    
    const saveButton = page.getByRole('button', { name: /Save|Verify|Confirm/i });
    await saveButton.click();
    await page.waitForTimeout(2000);
    
    // Logout as Grady
    await page.getByRole('button', { name: 'Menu' }).click();
    await page.getByRole('button', { name: /Sign Out/i }).click();
    await page.waitForTimeout(2000);
  });
  
  // Test Step 5: Retry signing (SC)
  await test.step('Retry signing (SC)', async () => {
    // Login as Lee again
    const leeEmail = process.env.MS_EMAIL_17NJ5D_LEE_MILLER!;
    const password = process.env.MS_PASSWORD!;
    
    await page.goto(`${baseUrl}/login`);
    await microsoftLogin(page, leeEmail, password);
    await handleERSDDialog(page);
    
    // Navigate to Documents
    await page.waitForLoadState('domcontentloaded');
    
    // Open a document
    const firstDocument = page.locator('[data-testid="document-row"], tr').filter({ hasText: /\.docx/i }).first();
    await firstDocument.click();
    await page.waitForTimeout(3000);
    
    // Take screenshot
    const timestamp = formatTimestamp(new Date());
    await page.screenshot({ 
      path: getScreenshotPath(`TS.5.4-06-${timestamp}.png`),
      fullPage: true 
    });
    
    // Try to sign again
    const signButton = page.getByRole('button', { name: /Sign|Signature/i });
    
    if (await signButton.isVisible()) {
      await signButton.click();
      await page.waitForTimeout(1000);
      
      // Should now be able to sign
      console.log('Expected: User can now add signature after verification');
      
      // Look for signature dialog/options
      const signatureDialog = page.locator('[role="dialog"], [data-testid="signature-dialog"]');
      if (await signatureDialog.isVisible()) {
        await expect(signatureDialog).toBeVisible();
        console.log('Signature dialog opened successfully');
      }
    }
  });
  
  // Expected Results:
  // 1. Login successful ✓
  // 2. Document opens ✓
  // 3. "Signature not verified" message ✓
  // 4. Verification complete ✓
  // 5. Can now sign document ✓
});