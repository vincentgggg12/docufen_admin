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

test('TS.7.13.2-01 Signature Actions', async ({ page }) => {
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
    
    // Step 1: Sign document
    await test.step('Sign document.', async () => {
      // Click on Sign button
      await page.getByRole('button', { name: 'Sign' }).click();
      await page.waitForTimeout(500);
      
      // Select signature role if prompted
      const roleDialog = page.getByRole('dialog', { name: 'Select Role' });
      if (await roleDialog.isVisible({ timeout: 2000 })) {
        await page.getByRole('button', { name: 'Pre-Approval' }).click();
      }
      
      // Complete authentication
      await page.locator('#i0118').fill('NoMorePaper88');
      await page.getByRole('button', { name: 'Sign in' }).click();
      
      // Wait for signature to be applied
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);
    });
    
    // Step 2: Check audit
    await test.step('Check audit.', async () => {
      // Navigate to audit log
      await page.getByRole('button', { name: 'Audit Log' }).click();
      await page.waitForLoadState('networkidle');
      
      // Wait for audit log to load
      await page.waitForSelector('.audit-trail, [data-testid="audit-trail"]', { state: 'visible' });
    });
    
    // Step 3: Signature tracked
    await test.step('Signature tracked.', async () => {
      // Find signature audit entry
      const signatureEntry = page.locator('.audit-entry, [data-testid="audit-entry"]').filter({ hasText: /Sign|Signature/i }).first();
      await expect(signatureEntry).toBeVisible();
      
      // Verify it shows signature action
      await expect(signatureEntry).toContainText(/Document Signed|Signature Added|Signed/i);
    });
    
    // Step 4: Role recorded
    await test.step('Role recorded.', async () => {
      // Click on signature entry to expand details
      const signatureEntry = page.locator('.audit-entry, [data-testid="audit-entry"]').filter({ hasText: /Sign|Signature/i }).first();
      await signatureEntry.click();
      await page.waitForTimeout(500);
      
      // Verify role is recorded
      await expect(page.locator('text=/Pre-Approval|Approval|Role:/i')).toBeVisible();
    });
    
    // Step 5: Auth time shown (SC)
    await test.step('Auth time shown (SC)', async () => {
      // Verify authentication timestamp is shown
      const auditDetails = page.locator('.audit-details, [data-testid="audit-details"], .audit-entry-expanded').first();
      await expect(auditDetails).toBeVisible();
      
      // Look for authentication time
      await expect(auditDetails).toContainText(/Authentication Time|Auth Time|Authenticated at/i);
      
      // Verify timestamp format
      const authTimeElement = auditDetails.locator('text=/\d{1,2}:\d{2}:\d{2}/');
      await expect(authTimeElement).toBeVisible();
      
      // Take screenshot showing signature audit details
      const now = new Date();
      const timestamp = `${now.getFullYear()}.${String(now.getMonth() + 1).padStart(2, '0')}.${String(now.getDate()).padStart(2, '0')}-${String(now.getHours()).padStart(2, '0')}.${String(now.getMinutes()).padStart(2, '0')}.${String(now.getSeconds()).padStart(2, '0')}`;
      await page.screenshot({ 
        path: getScreenshotPath(`TS.7.13.2-01-5-${timestamp}.png`) 
      });
    });
    
    // Expected Results:
    // 1. Signed. ✓
    // 2. Audit checked. ✓
    // 3. Sign entry found. ✓
    // 4. Role captured. ✓
    // 5. Auth timestamp ✓
});