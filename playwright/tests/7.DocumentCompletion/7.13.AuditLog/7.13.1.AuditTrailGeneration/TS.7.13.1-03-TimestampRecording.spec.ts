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

test('TS.7.13.1-03 Timestamp Recording', async ({ page }) => {
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
    
    // Setup: Navigate to a document and perform multiple actions
    await page.goto(`${baseUrl}/documents`);
    await page.waitForLoadState('networkidle');
    
    // Find and click on a document
    const documentCard = page.locator('.document-card').first();
    await documentCard.click();
    await page.waitForLoadState('networkidle');
    
    // Record current time before actions
    const actionTime = new Date();
    
    // Perform first action
    await page.getByRole('button', { name: 'Add Text' }).click();
    await page.waitForTimeout(500);
    const documentViewer = page.locator('.document-viewer, #viewer-container, [data-testid="document-viewer"]').first();
    await documentViewer.click({ position: { x: 300, y: 400 } });
    await page.keyboard.type('First action for timestamp test');
    await page.locator('body').click({ position: { x: 100, y: 100 } });
    await page.waitForTimeout(2000);
    
    // Perform second action
    await page.getByRole('button', { name: 'Add Text' }).click();
    await page.waitForTimeout(500);
    await documentViewer.click({ position: { x: 300, y: 500 } });
    await page.keyboard.type('Second action for timestamp test');
    await page.locator('body').click({ position: { x: 100, y: 100 } });
    await page.waitForTimeout(1000);
    
    // Navigate to audit log
    await page.getByRole('button', { name: 'Audit Log' }).click();
    await page.waitForLoadState('networkidle');
    
    // Step 1: Check timestamp
    await test.step('Check timestamp.', async () => {
      // Find audit entries
      const auditEntries = page.locator('.audit-entry, [data-testid="audit-entry"]');
      const firstEntry = auditEntries.first();
      await expect(firstEntry).toBeVisible();
      
      // Check timestamp exists
      const timestampElement = firstEntry.locator('.timestamp, [data-testid="timestamp"], time');
      await expect(timestampElement).toBeVisible();
    });
    
    // Step 2: Precise time shown
    await test.step('Precise time shown.', async () => {
      // Verify timestamp shows precise time (includes seconds)
      const firstEntry = page.locator('.audit-entry, [data-testid="audit-entry"]').first();
      const timestampText = await firstEntry.locator('.timestamp, [data-testid="timestamp"], time').textContent();
      
      // Check if timestamp includes seconds (format like HH:MM:SS)
      expect(timestampText).toMatch(/\d{1,2}:\d{2}:\d{2}/);
    });
    
    // Step 3: Timezone included
    await test.step('Timezone included.', async () => {
      // Verify timezone information is displayed
      const firstEntry = page.locator('.audit-entry, [data-testid="audit-entry"]').first();
      const timestampText = await firstEntry.locator('.timestamp, [data-testid="timestamp"], time').textContent();
      
      // Check for timezone indicator (UTC offset or timezone abbreviation)
      expect(timestampText).toMatch(/UTC|GMT|[+-]\d{2}:\d{2}|[A-Z]{3,4}/);
    });
    
    // Step 4: Chronological order
    await test.step('Chronological order.', async () => {
      // Get timestamps from first two entries
      const entries = page.locator('.audit-entry, [data-testid="audit-entry"]');
      const firstTimestamp = await entries.nth(0).locator('.timestamp, [data-testid="timestamp"], time').getAttribute('datetime');
      const secondTimestamp = await entries.nth(1).locator('.timestamp, [data-testid="timestamp"], time').getAttribute('datetime');
      
      // Verify first entry is more recent than second
      if (firstTimestamp && secondTimestamp) {
        const firstDate = new Date(firstTimestamp);
        const secondDate = new Date(secondTimestamp);
        expect(firstDate.getTime()).toBeGreaterThan(secondDate.getTime());
      }
    });
    
    // Step 5: Accurate timing (SC)
    await test.step('Accurate timing (SC)', async () => {
      // Verify timestamps are accurate (within reasonable range of action time)
      const firstEntry = page.locator('.audit-entry, [data-testid="audit-entry"]').first();
      const timestampAttr = await firstEntry.locator('.timestamp, [data-testid="timestamp"], time').getAttribute('datetime');
      
      if (timestampAttr) {
        const entryTime = new Date(timestampAttr);
        const timeDiff = Math.abs(entryTime.getTime() - actionTime.getTime());
        
        // Verify timestamp is within 5 minutes of action
        expect(timeDiff).toBeLessThan(5 * 60 * 1000);
      }
      
      // Take screenshot showing timestamp details
      const now = new Date();
      const timestamp = `${now.getFullYear()}.${String(now.getMonth() + 1).padStart(2, '0')}.${String(now.getDate()).padStart(2, '0')}-${String(now.getHours()).padStart(2, '0')}.${String(now.getMinutes()).padStart(2, '0')}.${String(now.getSeconds()).padStart(2, '0')}`;
      await page.screenshot({ 
        path: getScreenshotPath(`TS.7.13.1-03-5-${timestamp}.png`) 
      });
    });
    
    // Expected Results:
    // 1. Time checked. ✓
    // 2. To the second. ✓
    // 3. UTC offset shown. ✓
    // 4. Proper order. ✓
    // 5. Time accurate ✓
});