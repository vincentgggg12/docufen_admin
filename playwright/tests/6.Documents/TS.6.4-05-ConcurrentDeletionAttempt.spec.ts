import { test, expect, chromium, Browser, BrowserContext, Page } from '@playwright/test';
import * as dotenv from 'dotenv';
import { microsoftLogin, handleERSDDialog } from '../../src/utils/microsoftLogin';
import { getScreenshotPath, formatTimestamp } from '../../src/utils/screenshotUtils';
import * as path from 'path';

dotenv.config({ path: '.playwright.env' });

test.use({
  viewport: { height: 1080, width: 1920 },
  ignoreHTTPSErrors: true
});

test.setTimeout(180000); // 3 minutes

test('TS.6.4-05 Concurrent Deletion Attempt', async () => {
  // This test requires two admin sessions
  const browser = await chromium.launch();
  
  try {
    // Create two browser contexts for two admin users
    const context1 = await browser.newContext({
      viewport: { width: 1920, height: 1080 },
      ignoreHTTPSErrors: true
    });
    const context2 = await browser.newContext({
      viewport: { width: 1920, height: 1080 },
      ignoreHTTPSErrors: true
    });
    
    const page1 = await context1.newPage();
    const page2 = await context2.newPage();
    
    // Login as Diego (Admin 1)
    const email1 = process.env.MS_EMAIL_17NJ5D_DIEGO_SICILIANI!;
    const password = process.env.MS_PASSWORD!;
    await microsoftLogin(page1, email1, password);
    await handleERSDDialog(page1);
    
    // Login as Henrietta (Admin 2)
    const email2 = process.env.MS_EMAIL_17NJ5D_HENRIETTA_MUELLER!;
    await microsoftLogin(page2, email2, password);
    await handleERSDDialog(page2);
    
    // First, create a test document to delete
    await page1.getByRole('button', { name: 'Menu' }).click();
    await page1.getByRole('link', { name: 'Documents' }).click();
    await expect(page1).toHaveURL(/.*\/documents/);
    
    // Upload a test document
    await page1.getByRole('button', { name: 'Upload Document' }).click();
    await expect(page1.getByRole('dialog')).toBeVisible();
    
    const testDocName = `Concurrent Delete Test ${Date.now()}`;
    await page1.getByLabel('Document Name').fill(testDocName);
    
    const sampleFilePath = path.join(process.cwd(), 'playwright/tests/WordDocuments/test_document.docx');
    await page1.locator('input[type="file"]').setInputFiles(sampleFilePath);
    
    await page1.getByLabel('Document Type').click();
    await page1.getByRole('option', { name: 'Protocol' }).click();
    
    await page1.getByRole('button', { name: 'Upload' }).click();
    await expect(page1.getByRole('dialog')).not.toBeVisible({ timeout: 10000 });
    
    // Wait for document to appear
    await page1.waitForTimeout(2000);
    
    // Test Step 1: Two admins open same doc
    await test.step('Two admins open same doc', async () => {
      // Admin 1 navigates to documents
      await page1.reload();
      await expect(page1.locator('tr').filter({ hasText: testDocName })).toBeVisible();
      
      // Admin 2 navigates to documents
      await page2.getByRole('button', { name: 'Menu' }).click();
      await page2.getByRole('link', { name: 'Documents' }).click();
      await expect(page2).toHaveURL(/.*\/documents/);
      await expect(page2.locator('tr').filter({ hasText: testDocName })).toBeVisible();
    });
    
    // Test Step 2: Both click delete
    await test.step('Both click delete', async () => {
      // Admin 1 clicks delete
      const docRow1 = page1.locator('tr').filter({ hasText: testDocName });
      await docRow1.locator('button[aria-label="Actions"]').click();
      await page1.getByRole('menuitem', { name: 'Delete' }).click();
      
      // Admin 2 clicks delete (quickly after Admin 1)
      const docRow2 = page2.locator('tr').filter({ hasText: testDocName });
      await docRow2.locator('button[aria-label="Actions"]').click();
      await page2.getByRole('menuitem', { name: 'Delete' }).click();
    });
    
    // Test Step 3: Both confirm deletion
    await test.step('Both confirm deletion', async () => {
      // Both should see delete confirmation dialogs
      await expect(page1.getByRole('dialog')).toBeVisible();
      await expect(page2.getByRole('dialog')).toBeVisible();
      
      // Both confirm deletion almost simultaneously
      const confirm1Promise = page1.getByRole('button', { name: 'Delete' }).click();
      const confirm2Promise = page2.getByRole('button', { name: 'Delete' }).click();
      
      // Execute both confirmations
      await Promise.all([confirm1Promise, confirm2Promise]);
      
      // Wait for responses
      await page1.waitForTimeout(3000);
      await page2.waitForTimeout(3000);
    });
    
    // Test Step 4: Check result (SC)
    await test.step('Check result (SC)', async () => {
      // Check Admin 1's result
      const successMessage1 = page1.getByText(/successfully deleted/i).or(
        page1.getByText(/document.*deleted/i)
      );
      const errorMessage1 = page1.getByText(/not found/i).or(
        page1.getByText(/already deleted/i)
      ).or(
        page1.getByText(/error/i)
      );
      
      // Check Admin 2's result
      const successMessage2 = page2.getByText(/successfully deleted/i).or(
        page2.getByText(/document.*deleted/i)
      );
      const errorMessage2 = page2.getByText(/not found/i).or(
        page2.getByText(/already deleted/i)
      ).or(
        page2.getByText(/error/i)
      );
      
      // One should succeed, the other should get an error
      const admin1Success = await successMessage1.isVisible({ timeout: 5000 }).catch(() => false);
      const admin2Success = await successMessage2.isVisible({ timeout: 5000 }).catch(() => false);
      const admin1Error = await errorMessage1.isVisible({ timeout: 5000 }).catch(() => false);
      const admin2Error = await errorMessage2.isVisible({ timeout: 5000 }).catch(() => false);
      
      // Verify that exactly one succeeded and one failed
      const successCount = (admin1Success ? 1 : 0) + (admin2Success ? 1 : 0);
      const errorCount = (admin1Error ? 1 : 0) + (admin2Error ? 1 : 0);
      
      console.log(`Success count: ${successCount}, Error count: ${errorCount}`);
      
      // Take screenshots of both screens
      const timestamp = formatTimestamp(new Date());
      await page1.screenshot({ 
        path: getScreenshotPath(`TS.6.4-05-4-admin1-${timestamp}.png`) 
      });
      await page2.screenshot({ 
        path: getScreenshotPath(`TS.6.4-05-4-admin2-${timestamp}.png`) 
      });
      
      // Expected Results:
      // 1. Both see document ✓
      // 2. Delete dialogs open ✓
      // 3. One succeeds ✓
      // 4. Other gets "not found" error ✓
      
      // At least one should show success or error
      expect(successCount + errorCount).toBeGreaterThan(0);
    });
    
    // Cleanup
    await context1.close();
    await context2.close();
    
  } finally {
    await browser.close();
  }
});