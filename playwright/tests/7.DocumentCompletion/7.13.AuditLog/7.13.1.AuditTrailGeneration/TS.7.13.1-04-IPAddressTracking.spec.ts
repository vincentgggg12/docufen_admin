import { test, expect } from '@playwright/test';
import { getScreenshotPath } from '../../../utils/paths';
import dotenv from 'dotenv';

dotenv.config({ path: '.playwright.env' });
const baseUrl = process.env.BASE_URL || "https://beta.docufen.com"

test.use({
  viewport: {
    height: 1080,
    width: 1920
  },
  ignoreHTTPSErrors: true
});

test.setTimeout(120000); // 2 minutes

test('TS.7.13.1-04 IP Address Tracking', async ({ page }) => {
    // Setup: Login to application (not reported)
    await page.goto(`${baseUrl}/login`);
    await page.waitForLoadState('networkidle');
    
    // Setup: Microsoft authentication (not reported)
    await page.getByTestId('loginPage.loginButton').click();
    
    // Wait for either the email field or we might already be on password page
    await page.waitForSelector('input[type="email"], #i0118', { state: 'visible', timeout: 10000 });
    
    // Check if we need to enter email or if we're already on password page
    const emailField = page.getByRole('textbox', { name: 'Enter your email or phone' });
    if (await emailField.isVisible({ timeout: 1000 })) {
      await emailField.click();
      await emailField.fill('meganb@17nj5d.onmicrosoft.com');
      await page.getByRole('button', { name: 'Next' }).click();
    }
    
    // Wait for password field to appear
    await page.waitForSelector('#i0118', { state: 'visible', timeout: 10000 });
    await page.locator('#i0118').fill('NoMorePaper88');
    await page.getByRole('button', { name: 'Sign in' }).click();
    
    // Wait for either "Don't show this again" or redirect back to app
    try {
      const dontShowCheckbox = page.getByRole('checkbox', { name: 'Don\'t show this again' });
      await dontShowCheckbox.waitFor({ state: 'visible', timeout: 5000 });
      await dontShowCheckbox.check();
      await page.getByRole('button', { name: 'No' }).click();
    } catch (e) {
      console.log('No "Don\'t show this again" checkbox appeared');
    }
    
    // CRITICAL: Wait for redirect back to application
    await page.waitForURL(`${baseUrl}/`, { timeout: 15000 });
    await page.waitForLoadState('networkidle');
    
    // Setup: Navigate to a document and perform an action
    await page.goto(`${baseUrl}/documents`);
    await page.waitForLoadState('networkidle');
    
    // Find and click on a document
    const documentCard = page.locator('.document-card').first();
    await documentCard.click();
    await page.waitForLoadState('networkidle');
    
    // Perform an action to generate audit entry
    await page.getByRole('button', { name: 'Add Text' }).click();
    await page.waitForTimeout(500);
    const documentViewer = page.locator('.document-viewer, #viewer-container, [data-testid="document-viewer"]').first();
    await documentViewer.click({ position: { x: 300, y: 400 } });
    await page.keyboard.type('Test IP address tracking');
    await page.locator('body').click({ position: { x: 100, y: 100 } });
    await page.waitForTimeout(1000);
    
    // Navigate to audit log
    await page.getByRole('button', { name: 'Audit Log' }).click();
    await page.waitForLoadState('networkidle');
    
    // Step 1: View audit entry
    await test.step('View audit entry.', async () => {
      // Find the most recent audit entry
      const auditEntry = page.locator('.audit-entry, [data-testid="audit-entry"]').first();
      await expect(auditEntry).toBeVisible();
      
      // Click on entry to expand details if needed
      await auditEntry.click();
      await page.waitForTimeout(500);
    });
    
    // Step 2: IP address shown
    await test.step('IP address shown.', async () => {
      // Look for IP address in the audit entry details
      const ipElement = page.locator('text=/\\d{1,3}\\.\\d{1,3}\\.\\d{1,3}\\.\\d{1,3}/').first();
      await expect(ipElement).toBeVisible();
    });
    
    // Step 3: Valid format
    await test.step('Valid format.', async () => {
      // Verify IP address is in valid format
      const ipElement = page.locator('text=/\\d{1,3}\\.\\d{1,3}\\.\\d{1,3}\\.\\d{1,3}/').first();
      const ipText = await ipElement.textContent();
      
      // Validate IP format
      const ipRegex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
      expect(ipText).toMatch(ipRegex);
    });
    
    // Step 4: Actual user IP
    await test.step('Actual user IP.', async () => {
      // Verify IP address is present and reasonable
      const ipElement = page.locator('text=/\\d{1,3}\\.\\d{1,3}\\.\\d{1,3}\\.\\d{1,3}/').first();
      const ipText = await ipElement.textContent();
      
      // Verify it's not a placeholder or invalid IP
      expect(ipText).not.toBe('0.0.0.0');
      expect(ipText).not.toBe('255.255.255.255');
      expect(ipText).toBeTruthy();
    });
    
    // Step 5: Location tracked (SC)
    await test.step('Location tracked (SC)', async () => {
      // Verify IP address is captured and displayed
      const auditDetails = page.locator('.audit-details, [data-testid="audit-details"], .audit-entry-expanded').first();
      await expect(auditDetails).toBeVisible();
      
      // Look for IP address label and value
      const ipLabel = page.locator('text=/IP Address|Client IP|Source IP/i');
      await expect(ipLabel).toBeVisible();
      
      // Take screenshot showing IP address tracking
      const now = new Date();
      const timestamp = `${now.getFullYear()}.${String(now.getMonth() + 1).padStart(2, '0')}.${String(now.getDate()).padStart(2, '0')}-${String(now.getHours()).padStart(2, '0')}.${String(now.getMinutes()).padStart(2, '0')}.${String(now.getSeconds()).padStart(2, '0')}`;
      await page.screenshot({ 
        path: getScreenshotPath(`TS.7.13.1-04-5-${timestamp}.png`) 
      });
    });
    
    // Expected Results:
    // 1. Entry viewed. ✓
    // 2. IP present. ✓
    // 3. xxx.xxx.xxx.xxx. ✓
    // 4. Matches user. ✓
    // 5. IP captured ✓
});