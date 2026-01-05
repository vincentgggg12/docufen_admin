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

test('TS.7.13.2-06 Late Entry Tracking', async ({ page }) => {
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
    
    // Setup: Navigate to a document
    await page.goto(`${baseUrl}/documents`);
    await page.waitForLoadState('networkidle');
    
    // Find and click on a document
    const documentCard = page.locator('.document-card').first();
    await documentCard.click();
    await page.waitForLoadState('networkidle');
    
    // Step 1: Make late entry
    await test.step('Make late entry.', async () => {
      // Click on Add Text for late entry
      await page.getByRole('button', { name: 'Add Text' }).click();
      await page.waitForTimeout(500);
      
      // Check for late entry option
      const lateEntryCheckbox = page.getByLabel(/Late Entry|Backdate/i);
      if (await lateEntryCheckbox.isVisible({ timeout: 2000 })) {
        await lateEntryCheckbox.check();
        
        // Select a past date
        const dateInput = page.getByLabel(/Date|When/i);
        await dateInput.fill('2024-01-15');
        
        // Enter reason for late entry
        const reasonField = page.getByLabel(/Reason|Explanation/i);
        await reasonField.fill('Entry was missed during initial documentation');
      }
      
      // Click on document to place text
      const documentViewer = page.locator('.document-viewer, #viewer-container, [data-testid="document-viewer"]').first();
      await documentViewer.click({ position: { x: 300, y: 400 } });
      
      // Type the late entry text
      await page.keyboard.type('Late entry: Temperature reading 21.5°C');
      
      // Save the entry
      await page.locator('body').click({ position: { x: 100, y: 100 } });
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
    
    // Step 3: Original date shown
    await test.step('Original date shown.', async () => {
      // Find late entry audit entry
      const lateEntry = page.locator('.audit-entry, [data-testid="audit-entry"]').filter({ hasText: /Late Entry|Backdated/i }).first();
      await lateEntry.click();
      await page.waitForTimeout(500);
      
      // Verify original date is shown
      const auditDetails = page.locator('.audit-details, [data-testid="audit-details"], .audit-entry-expanded').first();
      await expect(auditDetails).toContainText('2024-01-15');
      await expect(auditDetails).toContainText(/Original Date:|Entry Date:|Backdated to:/i);
    });
    
    // Step 4: Actual time shown
    await test.step('Actual time shown.', async () => {
      // Verify actual entry time is also shown
      const auditDetails = page.locator('.audit-details, [data-testid="audit-details"], .audit-entry-expanded').first();
      
      // Check for actual/current timestamp
      await expect(auditDetails).toContainText(/Actual Time:|Entry Time:|Created at:/i);
      
      // Verify today's date is shown as actual time
      const today = new Date();
      const todayFormatted = today.toISOString().split('T')[0];
      const hasToday = (await auditDetails.textContent())?.includes(todayFormatted.substring(0, 7)); // Check year-month
      expect(hasToday).toBeTruthy();
    });
    
    // Step 5: Reason included (SC)
    await test.step('Reason included (SC)', async () => {
      // Verify late entry reason is recorded
      const auditDetails = page.locator('.audit-details, [data-testid="audit-details"], .audit-entry-expanded').first();
      
      // Check for reason
      await expect(auditDetails).toContainText(/Reason:|Explanation:|Justification:/i);
      await expect(auditDetails).toContainText('Entry was missed during initial documentation');
      
      // Verify late entry indicator
      await expect(auditDetails).toContainText(/Late Entry|Backdated|Retroactive/i);
      
      // Take screenshot showing late entry audit details
      const now = new Date();
      const timestamp = `${now.getFullYear()}.${String(now.getMonth() + 1).padStart(2, '0')}.${String(now.getDate()).padStart(2, '0')}-${String(now.getHours()).padStart(2, '0')}.${String(now.getMinutes()).padStart(2, '0')}.${String(now.getSeconds()).padStart(2, '0')}`;
      await page.screenshot({ 
        path: getScreenshotPath(`TS.7.13.2-06-5-${timestamp}.png`) 
      });
    });
    
    // Expected Results:
    // 1. Late entry made. ✓
    // 2. Audit viewed. ✓
    // 3. Past date logged. ✓
    // 4. Current time logged. ✓
    // 5. Reason present ✓
});