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

test('TS.7.13.2-04 Correction Actions', async ({ page }) => {
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
    
    // Setup: Navigate to a document with existing text
    await page.goto(`${baseUrl}/documents`);
    await page.waitForLoadState('networkidle');
    
    // Find and click on a document
    const documentCard = page.locator('.document-card').first();
    await documentCard.click();
    await page.waitForLoadState('networkidle');
    
    // First add some text to correct later
    await page.getByRole('button', { name: 'Add Text' }).click();
    await page.waitForTimeout(500);
    const documentViewer = page.locator('.document-viewer, #viewer-container, [data-testid="document-viewer"]').first();
    await documentViewer.click({ position: { x: 300, y: 400 } });
    await page.keyboard.type('Original text with typo');
    await page.locator('body').click({ position: { x: 100, y: 100 } });
    await page.waitForTimeout(1000);
    
    // Step 1: Make correction
    await test.step('Make correction.', async () => {
      // Find and click on the text to correct
      const textElement = page.locator('text=Original text with typo').first();
      await textElement.click();
      await page.waitForTimeout(500);
      
      // Right-click for correction option
      await textElement.click({ button: 'right' });
      await page.waitForTimeout(500);
      
      // Click on Correct or Edit option
      await page.getByRole('menuitem', { name: /Correct|Edit/i }).click();
      await page.waitForTimeout(500);
      
      // Enter corrected text
      await page.keyboard.type('Original text without typo - corrected');
      
      // Enter reason for correction
      const reasonField = page.getByLabel(/Reason|Explanation/i);
      if (await reasonField.isVisible({ timeout: 2000 })) {
        await reasonField.fill('Correcting typographical error');
      }
      
      // Submit correction
      await page.getByRole('button', { name: /Submit|Save|Apply/i }).click();
      await page.waitForTimeout(1000);
    });
    
    // Step 2: Check audit
    await test.step('Check audit.', async () => {
      // Navigate to audit log
      await page.getByRole('button', { name: 'Audit Log' }).click();
      await page.waitForLoadState('networkidle');
      
      // Wait for audit log to load
      await page.waitForSelector('.audit-trail, [data-testid="audit-trail"]', { state: 'visible' });
    });
    
    // Step 3: Original preserved
    await test.step('Original preserved.', async () => {
      // Find correction audit entry
      const correctionEntry = page.locator('.audit-entry, [data-testid="audit-entry"]').filter({ hasText: /Correction|Corrected|Modified/i }).first();
      await correctionEntry.click();
      await page.waitForTimeout(500);
      
      // Verify original text is preserved
      const auditDetails = page.locator('.audit-details, [data-testid="audit-details"], .audit-entry-expanded').first();
      await expect(auditDetails).toContainText('Original text with typo');
    });
    
    // Step 4: New text shown
    await test.step('New text shown.', async () => {
      // Verify corrected text is shown
      const auditDetails = page.locator('.audit-details, [data-testid="audit-details"], .audit-entry-expanded').first();
      await expect(auditDetails).toContainText('Original text without typo - corrected');
      
      // Verify both original and new are visible
      await expect(auditDetails).toContainText(/Original:|Previous:|Before:/i);
      await expect(auditDetails).toContainText(/New:|Corrected:|After:/i);
    });
    
    // Step 5: Reason recorded (SC)
    await test.step('Reason recorded (SC)', async () => {
      // Verify correction reason is recorded
      const auditDetails = page.locator('.audit-details, [data-testid="audit-details"], .audit-entry-expanded').first();
      
      // Check for reason label and text
      await expect(auditDetails).toContainText(/Reason:|Explanation:|Justification:/i);
      await expect(auditDetails).toContainText('Correcting typographical error');
      
      // Take screenshot showing correction audit details
      const now = new Date();
      const timestamp = `${now.getFullYear()}.${String(now.getMonth() + 1).padStart(2, '0')}.${String(now.getDate()).padStart(2, '0')}-${String(now.getHours()).padStart(2, '0')}.${String(now.getMinutes()).padStart(2, '0')}.${String(now.getSeconds()).padStart(2, '0')}`;
      await page.screenshot({ 
        path: getScreenshotPath(`TS.7.13.2-04-5-${timestamp}.png`) 
      });
    });
    
    // Expected Results:
    // 1. Corrected. ✓
    // 2. Audit viewed. ✓
    // 3. Original text saved. ✓
    // 4. Correction shown. ✓
    // 5. Reason included ✓
});