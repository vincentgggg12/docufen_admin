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

test('TS.7.13.1-02 User Identification', async ({ page }) => {
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
      await emailField.fill('gradya@17nj5d.onmicrosoft.com');
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
    await page.keyboard.type('Test user identification');
    await page.locator('body').click({ position: { x: 100, y: 100 } });
    await page.waitForTimeout(1000);
    
    // Navigate to audit log
    await page.getByRole('button', { name: 'Audit Log' }).click();
    await page.waitForLoadState('networkidle');
    
    // Step 1: Check audit entry
    await test.step('Check audit entry.', async () => {
      // Find the most recent audit entry
      const auditEntry = page.locator('.audit-entry, [data-testid="audit-entry"]').first();
      await expect(auditEntry).toBeVisible();
    });
    
    // Step 2: Legal name shown
    await test.step('Legal name shown.', async () => {
      // Verify full legal name is displayed
      const auditEntry = page.locator('.audit-entry, [data-testid="audit-entry"]').first();
      await expect(auditEntry).toContainText('Grady Archie');
    });
    
    // Step 3: Initials shown
    await test.step('Initials shown.', async () => {
      // Verify initials are displayed
      const auditEntry = page.locator('.audit-entry, [data-testid="audit-entry"]').first();
      const initialsElement = auditEntry.locator('.initials, [data-testid="user-initials"]');
      await expect(initialsElement).toContainText('GA');
    });
    
    // Step 4: Email shown
    await test.step('Email shown.', async () => {
      // Verify email is displayed
      const auditEntry = page.locator('.audit-entry, [data-testid="audit-entry"]').first();
      await expect(auditEntry).toContainText('gradya@17nj5d.onmicrosoft.com');
    });
    
    // Step 5: MS ID shown (SC)
    await test.step('MS ID shown (SC)', async () => {
      // Click on the audit entry to see details if needed
      const auditEntry = page.locator('.audit-entry, [data-testid="audit-entry"]').first();
      await auditEntry.click();
      await page.waitForTimeout(500);
      
      // Look for Microsoft Object ID in the details
      const objectIdElement = page.locator('text=/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i');
      await expect(objectIdElement).toBeVisible();
      
      // Take screenshot showing user identification details
      const now = new Date();
      const timestamp = `${now.getFullYear()}.${String(now.getMonth() + 1).padStart(2, '0')}.${String(now.getDate()).padStart(2, '0')}-${String(now.getHours()).padStart(2, '0')}.${String(now.getMinutes()).padStart(2, '0')}.${String(now.getSeconds()).padStart(2, '0')}`;
      await page.screenshot({ 
        path: getScreenshotPath(`TS.7.13.1-02-5-${timestamp}.png`) 
      });
    });
    
    // Expected Results:
    // 1. Entry viewed. ✓
    // 2. Full name. ✓
    // 3. Initials present. ✓
    // 4. Email included. ✓
    // 5. Object ID recorded ✓
});