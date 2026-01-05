import { test, expect } from '@playwright/test';
import { getScreenshotPath } from '../../../utils/paths';
import dotenv from 'dotenv';
import path from 'path';

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

test('TS.7.13.2-03 Attachment Actions', async ({ page }) => {
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
    
    // Setup: Navigate to a document
    await page.goto(`${baseUrl}/documents`);
    await page.waitForLoadState('networkidle');
    
    // Find and click on a document
    const documentCard = page.locator('.document-card').first();
    await documentCard.click();
    await page.waitForLoadState('networkidle');
    
    // Step 1: Upload file
    await test.step('Upload file.', async () => {
      // Click on Attachments or Add Attachment button
      await page.getByRole('button', { name: /Attachment|Attach File/i }).click();
      await page.waitForTimeout(500);
      
      // Set up file path
      const filePath = path.join(process.cwd(), 'playwright/tests/WordDocuments/SOP Template.docx');
      
      // Upload file
      const fileInput = page.locator('input[type="file"]');
      await fileInput.setInputFiles(filePath);
      
      // Wait for upload to complete
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
    
    // Step 3: Upload logged
    await test.step('Upload logged.', async () => {
      // Find attachment audit entry
      const attachmentEntry = page.locator('.audit-entry, [data-testid="audit-entry"]').filter({ hasText: /Attachment|Upload|File/i }).first();
      await expect(attachmentEntry).toBeVisible();
      
      // Verify it shows file upload
      await expect(attachmentEntry).toContainText(/File Uploaded|Attachment Added|Document Attached/i);
    });
    
    // Step 4: File details shown
    await test.step('File details shown.', async () => {
      // Click on attachment entry to expand details
      const attachmentEntry = page.locator('.audit-entry, [data-testid="audit-entry"]').filter({ hasText: /Attachment|Upload|File/i }).first();
      await attachmentEntry.click();
      await page.waitForTimeout(500);
      
      // Verify file details are shown
      const auditDetails = page.locator('.audit-details, [data-testid="audit-details"], .audit-entry-expanded').first();
      
      // Check for filename
      await expect(auditDetails).toContainText('SOP Template.docx');
      
      // Check for file size
      await expect(auditDetails).toContainText(/\d+(\.\d+)?\s*(KB|MB|bytes)/i);
      
      // Check for file hash or checksum
      const hasHash = await auditDetails.locator('text=/hash|checksum|sha|md5/i').count() > 0;
      expect(hasHash).toBeTruthy();
    });
    
    // Step 5: Complete record (SC)
    await test.step('Complete record (SC)', async () => {
      // Verify complete attachment details are recorded
      const auditDetails = page.locator('.audit-details, [data-testid="audit-details"], .audit-entry-expanded').first();
      
      // Verify all key details are present
      await expect(auditDetails).toContainText('SOP Template.docx'); // Filename
      await expect(auditDetails).toContainText(/\d+(\.\d+)?\s*(KB|MB|bytes)/i); // Size
      
      // Look for additional metadata
      const hasFileType = await auditDetails.locator('text=/docx|document|type/i').count() > 0;
      const hasTimestamp = await auditDetails.locator('text=/\d{1,2}:\d{2}/').count() > 0;
      
      expect(hasFileType || hasTimestamp).toBeTruthy();
      
      // Take screenshot showing attachment audit details
      const now = new Date();
      const timestamp = `${now.getFullYear()}.${String(now.getMonth() + 1).padStart(2, '0')}.${String(now.getDate()).padStart(2, '0')}-${String(now.getHours()).padStart(2, '0')}.${String(now.getMinutes()).padStart(2, '0')}.${String(now.getSeconds()).padStart(2, '0')}`;
      await page.screenshot({ 
        path: getScreenshotPath(`TS.7.13.2-03-5-${timestamp}.png`) 
      });
    });
    
    // Expected Results:
    // 1. File uploaded. ✓
    // 2. Audit checked. ✓
    // 3. Entry present. ✓
    // 4. Name/size/hash. ✓
    // 5. Full details ✓
});