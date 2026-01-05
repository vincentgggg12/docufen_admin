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

test('TS.7.13.3-01 Three Log Structure', async ({ page }) => {
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
    
    // Setup: Navigate to a document with audit history
    await page.goto(`${baseUrl}/documents`);
    await page.waitForLoadState('networkidle');
    
    // Find and click on a document with activity
    const documentCard = page.locator('.document-card').first();
    await documentCard.click();
    await page.waitForLoadState('networkidle');
    
    // Step 1: View audit page
    await test.step('View audit page.', async () => {
      // Click on Audit Log button
      await page.getByRole('button', { name: 'Audit Log' }).click();
      await page.waitForLoadState('networkidle');
      
      // Wait for audit page to load
      await page.waitForSelector('.audit-page, [data-testid="audit-page"], .audit-container', { state: 'visible' });
    });
    
    // Step 2: Document trail shown
    await test.step('Document trail shown.', async () => {
      // Look for document audit trail section
      const docTrailSection = page.locator('section, div').filter({ hasText: /Document Trail|Document Audit|Document History/i }).first();
      await expect(docTrailSection).toBeVisible();
      
      // Verify it contains audit entries
      const docEntries = docTrailSection.locator('.audit-entry, [data-testid="audit-entry"]');
      await expect(docEntries.first()).toBeVisible();
    });
    
    // Step 3: Attachment log shown
    await test.step('Attachment log shown.', async () => {
      // Look for attachment log section
      const attachmentSection = page.locator('section, div').filter({ hasText: /Attachment Log|Attachment History|File History/i }).first();
      await expect(attachmentSection).toBeVisible();
      
      // Verify section exists even if empty
      await expect(attachmentSection).toContainText(/Attachment|File/i);
    });
    
    // Step 4: User log shown
    await test.step('User log shown.', async () => {
      // Look for user access log section
      const userSection = page.locator('section, div').filter({ hasText: /User Log|Access Log|User Activity/i }).first();
      await expect(userSection).toBeVisible();
      
      // Verify section contains user-related entries
      await expect(userSection).toContainText(/User|Access|Login/i);
    });
    
    // Step 5: Three sections (SC)
    await test.step('Three sections (SC)', async () => {
      // Verify all three sections are visible on the page
      const sections = page.locator('.audit-section, [data-testid*="audit-section"], .log-section');
      const sectionCount = await sections.count();
      
      // Should have at least 3 distinct sections
      expect(sectionCount).toBeGreaterThanOrEqual(3);
      
      // Verify section headers
      await expect(page.locator('text=/Document Trail|Document Audit/i')).toBeVisible();
      await expect(page.locator('text=/Attachment|File/i')).toBeVisible();
      await expect(page.locator('text=/User|Access/i')).toBeVisible();
      
      // Take screenshot showing three-section structure
      const now = new Date();
      const timestamp = `${now.getFullYear()}.${String(now.getMonth() + 1).padStart(2, '0')}.${String(now.getDate()).padStart(2, '0')}-${String(now.getHours()).padStart(2, '0')}.${String(now.getMinutes()).padStart(2, '0')}.${String(now.getSeconds()).padStart(2, '0')}`;
      await page.screenshot({ 
        path: getScreenshotPath(`TS.7.13.3-01-5-${timestamp}.png`) 
      });
    });
    
    // Expected Results:
    // 1. Page viewed. ✓
    // 2. Doc section present. ✓
    // 3. Attachment section. ✓
    // 4. User section. ✓
    // 5. All three visible ✓
});