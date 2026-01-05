import { test, expect } from '@playwright/test';
import * as dotenv from 'dotenv';
import { microsoftLogin } from '../utils/msLogin';
import { handleERSDDialog } from '../utils/ersd-handler';
import { getScreenshotPath } from '../utils/paths';

dotenv.config({ path: '.playwright.env' });

test.use({
  viewport: { height: 1080, width: 1920 },
  ignoreHTTPSErrors: true
});

test.setTimeout(120000); // 2 minutes

function formatTimestamp(date: Date): string {
  return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}-${String(date.getHours()).padStart(2, '0')}.${String(date.getMinutes()).padStart(2, '0')}.${String(date.getSeconds()).padStart(2, '0')}`;
}

test('TS.1.2-02 Digital Signature Verification Check', async ({ page }) => {
  // Test Procedure:
  // 1. Login as unverified Ethan
  // 2. Complete authentication
  // 3. Open a document that has been shared with Ethan
  // 4. Try to enter a signature (SC)

  const baseUrl = process.env.BASE_URL;
  const email = process.env.MS_EMAIL_XMWKB_ETHAN_BROWN!;
  const password = process.env.MS_PASSWORD!;

  // Test Step 1: Login as unverified Ethan
  await test.step('Login as unverified Ethan', async () => {
    await page.goto(`${baseUrl}/login`);
    await microsoftLogin(page, email, password);
    // await handleERSDDialog(page);
    
    // Expected Result: Login initiated
  });

  // Test Step 2: Complete authentication
  await test.step('Complete authentication', async () => {
    // Wait for redirect back to Docufen
    await page.waitForURL(`${baseUrl}/**`, { timeout: 60000 });
    
    // Expected Result: Auth successful
    await expect(page).not.toHaveURL(/\/login/);
    await page.waitForLoadState('networkidle');
  });

  // Test Step 3: Open a document that has been shared with Ethan
  await test.step('Open a document that has been shared with Ethan', async () => {
    // Navigate to documents using the correct testId
    const documentsButton = page.getByTestId('lsb.nav-main.documents-title');
    await documentsButton.click({ timeout: 10000 });
    
    // Wait for documents page to load
    await page.waitForURL(/\/documents/);
    
    // Look for a document that has been shared with Ethan using the correct testId
    const documentRow = page.getByTestId('documentsTable.documentRow').first();
    await expect(documentRow).toBeVisible({ timeout: 10000 });
    
    // Click to open the document
    await documentRow.click();
    
    // Wait for document to load
    await page.waitForLoadState('networkidle', { timeout: 10000 });
    
    // Expected Result: Document opens
    await expect(page).toHaveURL(/\/documents\/.*/, { timeout: 10000 });
  });

  // Test Step 4: Try to enter a signature (SC)
  await test.step('Try to enter a signature (SC)', async () => {
    // Wait for Syncfusion document editor to load
    const canvas = page.locator('canvas').first();
    await expect(canvas).toBeVisible({ timeout: 10000 });
    
    // Click on the document canvas at the specified coordinates to position cursor and trigger popup
    await canvas.click({ position: { x: 793, y: 242 } });
    
    // Wait for popup to appear and click on signature tab
    const signatureTab = page.getByTestId('editor.execution.tabButton.sign');
    await expect(signatureTab).toBeVisible({ timeout: 10000 });
    await signatureTab.click();
    
    // Wait for signature panel to load
    await page.waitForTimeout(1000);
    
    // Take screenshot as required (SC)
    const timestamp = formatTimestamp(new Date());
    await page.screenshot({ 
      path: getScreenshotPath(`TS.1.2-02-4-${timestamp}.png`) 
    });
    
    // Expected Result: Signing disabled with message about "signature not verified"
    // The error message will appear in the popup and there will be no sign button
    const signatureNotVerifiedMessage = page.getByText(/signature not verified|Digital signature verification required|Cannot sign|Signature verification pending|verify your signature/i);
    await expect(signatureNotVerifiedMessage).toBeVisible({ timeout: 10000 });
    
    // Verify that the sign button is NOT present (since verification is enforced)
    const signButton = page.getByTestId('editor.execution.sign.signButton');
    await expect(signButton).not.toBeVisible();
  });
});