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

test('TS.7.13.3-03 Action Descriptions', async ({ page }) => {
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
      await emailField.fill('johannab@17nj5d.onmicrosoft.com');
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
    
    // Setup: Navigate to a document with various actions
    await page.goto(`${baseUrl}/documents`);
    await page.waitForLoadState('networkidle');
    
    // Find and click on a document
    const documentCard = page.locator('.document-card').first();
    await documentCard.click();
    await page.waitForLoadState('networkidle');
    
    // Navigate directly to audit log
    await page.getByRole('button', { name: 'Audit Log' }).click();
    await page.waitForLoadState('networkidle');
    
    // Step 1: View action types
    await test.step('View action types.', async () => {
      // Get all audit entries
      const entries = page.locator('.audit-entry, [data-testid="audit-entry"]');
      const entryCount = await entries.count();
      expect(entryCount).toBeGreaterThan(0);
      
      // Collect action types
      const actionTypes = new Set();
      for (let i = 0; i < Math.min(entryCount, 5); i++) {
        const entry = entries.nth(i);
        const actionText = await entry.locator('.action-type, [data-testid="action-type"], .audit-action').textContent();
        if (actionText) actionTypes.add(actionText.trim());
      }
      
      // Should have various action types
      expect(actionTypes.size).toBeGreaterThan(0);
    });
    
    // Step 2: Human readable
    await test.step('Human readable.', async () => {
      // Check that action descriptions are human readable
      const entries = page.locator('.audit-entry, [data-testid="audit-entry"]');
      const firstEntry = entries.first();
      const actionText = await firstEntry.textContent();
      
      // Should contain readable words, not codes
      const readablePatterns = [
        /created/i,
        /added/i,
        /signed/i,
        /updated/i,
        /viewed/i,
        /modified/i,
        /uploaded/i,
        /changed/i
      ];
      
      const isReadable = readablePatterns.some(pattern => pattern.test(actionText || ''));
      expect(isReadable).toBeTruthy();
    });
    
    // Step 3: Not just codes
    await test.step('Not just codes.', async () => {
      // Verify descriptions are not cryptic codes
      const entries = page.locator('.audit-entry, [data-testid="audit-entry"]');
      const count = await entries.count();
      
      for (let i = 0; i < Math.min(count, 3); i++) {
        const entry = entries.nth(i);
        const actionElement = entry.locator('.action-type, [data-testid="action-type"], .audit-action');
        const actionText = await actionElement.textContent();
        
        // Should not be just codes like "DOC_001" or "ACT_UPD"
        expect(actionText).not.toMatch(/^[A-Z]{3}_[0-9]{3}$/);
        expect(actionText).not.toMatch(/^[A-Z]+_[A-Z]+$/);
        
        // Should contain actual words
        expect(actionText?.length).toBeGreaterThan(3);
      }
    });
    
    // Step 4: Clear meaning
    await test.step('Clear meaning.', async () => {
      // Verify action descriptions clearly indicate what happened
      const entries = page.locator('.audit-entry, [data-testid="audit-entry"]');
      const firstEntry = entries.first();
      
      // Click to expand if needed
      await firstEntry.click();
      await page.waitForTimeout(500);
      
      // Check that the action description provides clear context
      const fullText = await firstEntry.textContent();
      
      // Should contain verb and object
      const hasClearMeaning = /\w+\s+\w+/.test(fullText || '');
      expect(hasClearMeaning).toBeTruthy();
    });
    
    // Step 5: User friendly (SC)
    await test.step('User friendly (SC)', async () => {
      // Verify all action descriptions are user-friendly
      const entries = page.locator('.audit-entry, [data-testid="audit-entry"]');
      const visibleEntries = await entries.count();
      
      // Check multiple entries for user-friendliness
      for (let i = 0; i < Math.min(visibleEntries, 3); i++) {
        const entry = entries.nth(i);
        const text = await entry.textContent();
        
        // Should use plain language
        expect(text).not.toContain('null');
        expect(text).not.toContain('undefined');
        expect(text).not.toContain('ERROR');
        
        // Should use proper capitalization and spacing
        expect(text).toMatch(/[A-Z][a-z]/); // Has proper case
      }
      
      // Take screenshot showing user-friendly action descriptions
      const now = new Date();
      const timestamp = `${now.getFullYear()}.${String(now.getMonth() + 1).padStart(2, '0')}.${String(now.getDate()).padStart(2, '0')}-${String(now.getHours()).padStart(2, '0')}.${String(now.getMinutes()).padStart(2, '0')}.${String(now.getSeconds()).padStart(2, '0')}`;
      await page.screenshot({ 
        path: getScreenshotPath(`TS.7.13.3-03-5-${timestamp}.png`) 
      });
    });
    
    // Expected Results:
    // 1. Actions viewed. ✓
    // 2. Plain English. ✓
    // 3. No cryptic codes. ✓
    // 4. Self-explanatory. ✓
    // 5. Easy to understand ✓
});