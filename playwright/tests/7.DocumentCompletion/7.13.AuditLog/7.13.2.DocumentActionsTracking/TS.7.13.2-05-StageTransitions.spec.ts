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

test('TS.7.13.2-05 Stage Transitions', async ({ page }) => {
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
    
    // Setup: Navigate to a document where user is owner
    await page.goto(`${baseUrl}/documents`);
    await page.waitForLoadState('networkidle');
    
    // Find and click on a document where user is owner
    const documentCard = page.locator('.document-card').filter({ hasText: 'Owner' }).first();
    await documentCard.click();
    await page.waitForLoadState('networkidle');
    
    // Record current stage
    const currentStageElement = page.locator('[data-testid="document-stage"], .stage-indicator').first();
    const currentStage = await currentStageElement.textContent();
    
    // Step 1: Change stage
    await test.step('Change stage.', async () => {
      // Click on stage management button
      await page.getByRole('button', { name: /Stage|Workflow/i }).click();
      await page.waitForTimeout(500);
      
      // If in Draft, move to Pre-Approval
      if (currentStage?.includes('Draft')) {
        await page.getByRole('button', { name: 'Move to Pre-Approval' }).click();
      } 
      // If in Pre-Approval, try to move backward to Draft
      else if (currentStage?.includes('Pre-Approval')) {
        await page.getByRole('button', { name: 'Move Back to Draft' }).click();
        
        // Enter reason for backward movement
        const reasonDialog = page.getByRole('dialog', { name: /Reason|Explanation/i });
        if (await reasonDialog.isVisible({ timeout: 2000 })) {
          await page.getByLabel(/Reason|Explanation/i).fill('Testing stage transition audit');
          await page.getByRole('button', { name: 'Confirm' }).click();
        }
      }
      
      // Wait for stage change to complete
      await page.waitForLoadState('networkidle');
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
    
    // Step 3: Transition logged
    await test.step('Transition logged.', async () => {
      // Find stage transition audit entry
      const transitionEntry = page.locator('.audit-entry, [data-testid="audit-entry"]').filter({ hasText: /Stage|Transition|Moved/i }).first();
      await expect(transitionEntry).toBeVisible();
      
      // Verify it shows stage change
      await expect(transitionEntry).toContainText(/Stage Changed|Stage Transition|Moved to/i);
    });
    
    // Step 4: Both stages shown
    await test.step('Both stages shown.', async () => {
      // Click on transition entry to expand details
      const transitionEntry = page.locator('.audit-entry, [data-testid="audit-entry"]').filter({ hasText: /Stage|Transition|Moved/i }).first();
      await transitionEntry.click();
      await page.waitForTimeout(500);
      
      // Verify both from and to stages are shown
      const auditDetails = page.locator('.audit-details, [data-testid="audit-details"], .audit-entry-expanded').first();
      
      // Check for from/to stage information
      await expect(auditDetails).toContainText(/From:|Previous Stage:|Original Stage:/i);
      await expect(auditDetails).toContainText(/To:|New Stage:|Current Stage:/i);
      
      // Verify stage names are present
      await expect(auditDetails).toContainText(/Draft|Pre-Approval|Execution|Post-Approval/);
    });
    
    // Step 5: Reason if backward (SC)
    await test.step('Reason if backward (SC)', async () => {
      // Check if this was a backward transition
      const auditDetails = page.locator('.audit-details, [data-testid="audit-details"], .audit-entry-expanded').first();
      const detailsText = await auditDetails.textContent();
      
      // If it was a backward transition, verify reason is shown
      if (detailsText?.includes('Back') || detailsText?.includes('Previous') || detailsText?.includes('Revert')) {
        await expect(auditDetails).toContainText(/Reason:|Explanation:|Justification:/i);
        await expect(auditDetails).toContainText('Testing stage transition audit');
      }
      
      // Take screenshot showing stage transition audit details
      const now = new Date();
      const timestamp = `${now.getFullYear()}.${String(now.getMonth() + 1).padStart(2, '0')}.${String(now.getDate()).padStart(2, '0')}-${String(now.getHours()).padStart(2, '0')}.${String(now.getMinutes()).padStart(2, '0')}.${String(now.getSeconds()).padStart(2, '0')}`;
      await page.screenshot({ 
        path: getScreenshotPath(`TS.7.13.2-05-5-${timestamp}.png`) 
      });
    });
    
    // Expected Results:
    // 1. Stage changed. ✓
    // 2. Audit checked. ✓
    // 3. Entry found. ✓
    // 4. From/to recorded. ✓
    // 5. Reason captured ✓
});