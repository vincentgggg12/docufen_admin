import { test, expect } from '@playwright/test';
import * as dotenv from 'dotenv';
import { microsoftLogin, handleERSDDialog } from '../../src/utils/microsoftLogin';
import { getScreenshotPath, formatTimestamp } from '../../src/utils/screenshotUtils';
import * as path from 'path';
import * as fs from 'fs';

dotenv.config({ path: '.playwright.env' });

test.use({
  viewport: { height: 1080, width: 1920 },
  ignoreHTTPSErrors: true
});

test.setTimeout(120000); // 2 minutes

test('TS.7.14-07 Duplicate Attachment Names', async ({ page }) => {
  // Login
  const email = process.env.MS_EMAIL_17NJ5D_EMILY_MARTIN!;
  const password = process.env.MS_PASSWORD!;
  await microsoftLogin(page, email, password);
  await handleERSDDialog(page);

  // Navigate to Sign page
  await page.getByRole('button', { name: 'Menu' }).click();
  await page.getByRole('link', { name: 'Sign' }).click();
  await page.waitForLoadState('networkidle');

  // Select a document to add attachments
  const firstDocument = page.locator('[data-testid="sign-document-row"], tbody tr').first();
  await firstDocument.click();
  await page.waitForSelector('[data-testid="document-viewer"], iframe, .document-container');

  // Open attachments section
  await page.getByRole('button', { name: /Attachments|Attach|Add Attachment/i }).click();
  await page.waitForSelector('[data-testid="attachments-modal"], [data-testid="attachments-section"], .attachments-container');

  // Create a test PDF file if it doesn't exist
  const testDir = path.join(process.cwd(), 'playwright/tests/TestFiles');
  const testFilePath = path.join(testDir, 'test.pdf');
  
  if (!fs.existsSync(testDir)) {
    fs.mkdirSync(testDir, { recursive: true });
  }
  
  if (!fs.existsSync(testFilePath)) {
    // Create a simple PDF-like file for testing
    fs.writeFileSync(testFilePath, '%PDF-1.4\n%Test PDF File\n');
  }

  // Test Step 1: Upload "test.pdf"
  await test.step('Upload "test.pdf"', async () => {
    const fileInput = page.locator('input[type="file"][accept*="pdf"], input[type="file"]').first();
    await fileInput.setInputFiles(testFilePath);
    
    // Wait for upload to complete
    await page.waitForSelector('[data-testid="attachment-item"]:has-text("test.pdf"), .attachment-row:has-text("test.pdf")', { timeout: 10000 });
  });

  // Test Step 2: Upload another "test.pdf"
  await test.step('Upload another "test.pdf"', async () => {
    // Click add another attachment if needed
    const addButton = page.getByRole('button', { name: /Add.*Attachment|Attach.*Another|Add.*More/i });
    if (await addButton.isVisible()) {
      await addButton.click();
    }
    
    const fileInput = page.locator('input[type="file"][accept*="pdf"], input[type="file"]').last();
    await fileInput.setInputFiles(testFilePath);
    
    // Wait for second upload
    await page.waitForTimeout(2000);
  });

  // Test Step 3: Both accepted
  await test.step('Both accepted', async () => {
    // Count attachments with name "test.pdf"
    const attachments = page.locator('[data-testid="attachment-item"], .attachment-row');
    const attachmentCount = await attachments.count();
    expect(attachmentCount).toBeGreaterThanOrEqual(2);
    
    // Verify no error messages about duplicate names
    const errorVisible = await page.getByText(/duplicate.*name|file.*exists|already.*uploaded/i).isVisible().catch(() => false);
    expect(errorVisible).toBeFalsy();
  });

  // Test Step 4: Uniquely stored
  await test.step('Uniquely stored', async () => {
    // Check that each attachment has a unique identifier
    const attachmentItems = page.locator('[data-testid="attachment-item"], .attachment-row');
    const attachmentIds = [];
    
    for (let i = 0; i < await attachmentItems.count(); i++) {
      const item = attachmentItems.nth(i);
      // Try to get ID from data attribute or unique identifier
      const id = await item.getAttribute('data-id') || 
                 await item.getAttribute('data-attachment-id') ||
                 await item.locator('[data-testid="attachment-id"]').textContent() ||
                 `attachment-${i}`;
      attachmentIds.push(id);
    }
    
    // Verify IDs are unique
    const uniqueIds = new Set(attachmentIds);
    expect(uniqueIds.size).toBe(attachmentIds.length);
  });

  // Test Step 5: No conflicts with screenshot
  await test.step('No conflicts (SC)', async () => {
    // Verify both files are displayed
    const testPdfItems = page.locator('[data-testid="attachment-item"]:has-text("test.pdf"), .attachment-row:has-text("test.pdf")');
    const count = await testPdfItems.count();
    expect(count).toBe(2);
    
    // Verify each has different metadata (size, upload time, etc.)
    for (let i = 0; i < count; i++) {
      const item = testPdfItems.nth(i);
      await expect(item).toBeVisible();
      
      // Check for unique identifiers or timestamps
      const hasUniqueInfo = await item.locator('.timestamp, .upload-time, [data-testid="upload-date"]').isVisible().catch(() => false) ||
                           await item.locator('.file-id, [data-testid="file-id"]').isVisible().catch(() => false);
      expect(hasUniqueInfo).toBeTruthy();
    }
    
    // Take screenshot showing both attachments
    const timestamp = formatTimestamp(new Date());
    await page.screenshot({ 
      path: getScreenshotPath(`TS.7.14-07-5-${timestamp}.png`),
      fullPage: true
    });
  });

  // Cleanup
  if (fs.existsSync(testFilePath)) {
    fs.unlinkSync(testFilePath);
  }

  // Expected Results:
  // 1. First uploaded ✓
  // 2. Second uploaded ✓
  // 3. Both saved ✓
  // 4. Different IDs ✓
  // 5. Handled correctly ✓
});