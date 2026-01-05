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

test('TS.7.13.1-01 Automatic Capture', async ({ page }) => {
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
    
    // Setup: Navigate to a document in Pre-Approval stage
    await page.goto(`${baseUrl}/documents`);
    await page.waitForLoadState('networkidle');
    
    // Find and click on a document in Pre-Approval stage
    const documentCard = page.locator('.document-card').filter({ hasText: 'Pre-Approval' }).first();
    await documentCard.click();
    await page.waitForLoadState('networkidle');
    
    // Step 1: Perform any action
    await test.step('Perform any action.', async () => {
      // Add a text entry as the action
      await page.getByRole('button', { name: 'Add Text' }).click();
      await page.waitForTimeout(500);
      
      // Click somewhere on the document to place text
      const documentViewer = page.locator('.document-viewer, #viewer-container, [data-testid="document-viewer"]').first();
      await documentViewer.click({ position: { x: 300, y: 400 } });
      
      // Type some text
      await page.keyboard.type('Test automatic audit capture');
      
      // Click outside to save
      await page.locator('body').click({ position: { x: 100, y: 100 } });
      await page.waitForTimeout(1000);
    });
    
    // Step 2: No manual logging
    await test.step('No manual logging.', async () => {
      // Verify no manual logging dialog or prompt appears
      await expect(page.getByRole('dialog', { name: 'Log Entry' })).not.toBeVisible();
      await expect(page.getByText('Enter audit log')).not.toBeVisible();
    });
    
    // Step 3: Check audit
    await test.step('Check audit.', async () => {
      // Navigate to audit log
      await page.getByRole('button', { name: 'Audit Log' }).click();
      await page.waitForLoadState('networkidle');
      
      // Wait for audit log to load
      await page.waitForSelector('.audit-trail, [data-testid="audit-trail"]', { state: 'visible' });
    });
    
    // Step 4: Action recorded
    await test.step('Action recorded.', async () => {
      // Verify the text entry action is recorded in the audit log
      const auditEntry = page.locator('.audit-entry, [data-testid="audit-entry"]').filter({ hasText: 'Text Added' }).first();
      await expect(auditEntry).toBeVisible();
      
      // Verify it shows the recent timestamp
      const timestamp = await auditEntry.locator('.timestamp, [data-testid="timestamp"]').textContent();
      expect(timestamp).toBeTruthy();
    });
    
    // Step 5: Automatic tracking (SC)
    await test.step('Automatic tracking (SC)', async () => {
      // Verify automatic tracking is working
      await expect(page.locator('.audit-trail, [data-testid="audit-trail"]')).toBeVisible();
      
      // Verify the most recent entry is our text addition
      const firstEntry = page.locator('.audit-entry, [data-testid="audit-entry"]').first();
      await expect(firstEntry).toContainText('Text Added');
      
      // Take screenshot showing automatic audit capture
      const now = new Date();
      const timestamp = `${now.getFullYear()}.${String(now.getMonth() + 1).padStart(2, '0')}.${String(now.getDate()).padStart(2, '0')}-${String(now.getHours()).padStart(2, '0')}.${String(now.getMinutes()).padStart(2, '0')}.${String(now.getSeconds()).padStart(2, '0')}`;
      await page.screenshot({ 
        path: getScreenshotPath(`TS.7.13.1-01-5-${timestamp}.png`) 
      });
    });
    
    // Expected Results:
    // 1. Action done. ✓
    // 2. No user input. ✓
    // 3. Audit checked. ✓
    // 4. Entry present. ✓
    // 5. Auto-captured ✓
});