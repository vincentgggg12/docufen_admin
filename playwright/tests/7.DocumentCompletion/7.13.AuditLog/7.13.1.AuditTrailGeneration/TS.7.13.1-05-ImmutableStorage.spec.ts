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

test('TS.7.13.1-05 Immutable Storage', async ({ page }) => {
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
    
    // Setup: Navigate to a document with existing audit log
    await page.goto(`${baseUrl}/documents`);
    await page.waitForLoadState('networkidle');
    
    // Find and click on a document
    const documentCard = page.locator('.document-card').first();
    await documentCard.click();
    await page.waitForLoadState('networkidle');
    
    // Navigate to audit log
    await page.getByRole('button', { name: 'Audit Log' }).click();
    await page.waitForLoadState('networkidle');
    
    // Step 1: Try edit audit
    await test.step('Try edit audit.', async () => {
      // Find an audit entry
      const auditEntry = page.locator('.audit-entry, [data-testid="audit-entry"]').first();
      await expect(auditEntry).toBeVisible();
      
      // Try to click on the entry
      await auditEntry.click();
      await page.waitForTimeout(500);
      
      // Try double-clicking to edit
      await auditEntry.dblclick();
      await page.waitForTimeout(500);
      
      // Try right-clicking for context menu
      await auditEntry.click({ button: 'right' });
      await page.waitForTimeout(500);
    });
    
    // Step 2: No edit option
    await test.step('No edit option.', async () => {
      // Verify no edit button or option is available
      await expect(page.getByRole('button', { name: 'Edit' })).not.toBeVisible();
      await expect(page.getByRole('menuitem', { name: 'Edit' })).not.toBeVisible();
      await expect(page.locator('text=/Edit Audit|Modify Entry/i')).not.toBeVisible();
      
      // Verify no editable fields
      const editableFields = page.locator('input[contenteditable="true"], textarea[contenteditable="true"], [contenteditable="true"]');
      await expect(editableFields).toHaveCount(0);
    });
    
    // Step 3: Try delete
    await test.step('Try delete.', async () => {
      // Look for any delete options
      const auditEntry = page.locator('.audit-entry, [data-testid="audit-entry"]').first();
      
      // Hover over entry to check for delete button
      await auditEntry.hover();
      await page.waitForTimeout(500);
      
      // Check for delete button in toolbar or menu
      const deleteButtons = page.locator('[aria-label*="delete" i], [aria-label*="remove" i], button:has-text("Delete")');
      const visibleDeleteButtons = await deleteButtons.filter({ hasText: /delete|remove/i }).count();
      
      // There should be no delete options for audit entries
      expect(visibleDeleteButtons).toBe(0);
    });
    
    // Step 4: No delete option
    await test.step('No delete option.', async () => {
      // Verify no delete functionality is available
      await expect(page.getByRole('button', { name: 'Delete' })).not.toBeVisible();
      await expect(page.getByRole('menuitem', { name: 'Delete' })).not.toBeVisible();
      await expect(page.locator('text=/Delete Audit|Remove Entry/i')).not.toBeVisible();
      
      // Check keyboard shortcuts don't work
      await page.keyboard.press('Delete');
      await page.waitForTimeout(500);
      
      // Verify entry still exists
      const auditEntry = page.locator('.audit-entry, [data-testid="audit-entry"]').first();
      await expect(auditEntry).toBeVisible();
    });
    
    // Step 5: Read-only audit (SC)
    await test.step('Read-only audit (SC)', async () => {
      // Verify audit log is read-only
      const auditContainer = page.locator('.audit-trail, [data-testid="audit-trail"], .audit-log-container');
      await expect(auditContainer).toBeVisible();
      
      // Check for read-only indicators
      const readOnlyIndicator = page.locator('text=/Read.?Only|Immutable|Cannot be modified/i');
      const hasReadOnlyIndicator = await readOnlyIndicator.count() > 0;
      
      // Verify no action buttons for modification
      const modifyButtons = page.locator('button').filter({ hasText: /edit|delete|modify|remove/i });
      const modifyButtonCount = await modifyButtons.count();
      expect(modifyButtonCount).toBe(0);
      
      // Take screenshot showing immutable audit log
      const now = new Date();
      const timestamp = `${now.getFullYear()}.${String(now.getMonth() + 1).padStart(2, '0')}.${String(now.getDate()).padStart(2, '0')}-${String(now.getHours()).padStart(2, '0')}.${String(now.getMinutes()).padStart(2, '0')}.${String(now.getSeconds()).padStart(2, '0')}`;
      await page.screenshot({ 
        path: getScreenshotPath(`TS.7.13.1-05-5-${timestamp}.png`) 
      });
    });
    
    // Expected Results:
    // 1. Edit attempted. ✓
    // 2. Cannot edit. ✓
    // 3. Delete tried. ✓
    // 4. Cannot delete. ✓
    // 5. Immutable confirmed ✓
});