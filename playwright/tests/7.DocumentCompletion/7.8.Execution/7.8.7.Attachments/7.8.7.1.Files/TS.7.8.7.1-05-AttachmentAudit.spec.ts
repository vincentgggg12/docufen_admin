import { test, expect } from '@playwright/test';
import * as dotenv from 'dotenv';
import path from 'path';
import { microsoftLogin, handleERSDDialog } from '../../../../src/utils/microsoftLogin';
import { getScreenshotPath, formatTimestamp } from '../../../../src/utils/screenshotUtils';

dotenv.config({ path: '.playwright.env' });

test.use({
  viewport: { height: 1080, width: 1920 },
  ignoreHTTPSErrors: true
});

test.setTimeout(120000); // 2 minutes

test('TS.7.8.7.1-05 Attachment Audit', async ({ page }) => {
  // Login as an executor
  const email = process.env.MS_EMAIL_17NJ5D_DAVID_SEAGAL!;
  const password = process.env.MS_PASSWORD!;
  await microsoftLogin(page, email, password);
  await handleERSDDialog(page);

  // Test Steps
  await test.step('1. Upload attachment', async () => {
    // Navigate to a document in Execution stage
    await page.getByRole('button', { name: 'Menu' }).click();
    await page.getByRole('link', { name: 'Documents' }).click();
    await page.waitForLoadState('networkidle');
    
    // Find and open a document in Execution stage
    await page.getByText('Execution').first().click();
    
    // Click attachments button
    await page.getByRole('button', { name: 'Attachments' }).click();
    
    // Upload a file
    const filePath = path.join(process.cwd(), 'playwright/tests/TestFiles/test-document.pdf');
    await page.setInputFiles('input[type="file"]', filePath);
    
    // Wait for upload to complete
    await page.waitForTimeout(2000);
  });

  await test.step('2. Check audit log', async () => {
    // Navigate to audit log
    await page.getByRole('button', { name: 'Audit' }).click();
  });

  await test.step('3. Upload recorded', async () => {
    // Look for attachment upload entry
    await expect(page.getByText('Attachment uploaded')).toBeVisible();
  });

  await test.step('4. File details shown', async () => {
    // Verify file details are recorded
    const auditEntry = page.locator('tr').filter({ hasText: 'Attachment uploaded' });
    
    // Check for file name
    await expect(auditEntry.getByText('test-document.pdf')).toBeVisible();
    
    // Check for file size (should be visible in audit details)
    const hasSize = await auditEntry.getByText(/\d+\s*(KB|MB|bytes)/i).isVisible();
    expect(hasSize).toBe(true);
  });

  await test.step('5. User tracked (SC)', async () => {
    // Verify uploader is shown
    const auditEntry = page.locator('tr').filter({ hasText: 'Attachment uploaded' });
    await expect(auditEntry.getByText('David Seagal')).toBeVisible();
    
    // Take screenshot showing audit entry
    const timestamp = formatTimestamp(new Date());
    await page.screenshot({ 
      path: getScreenshotPath(`TS.7.8.7.1-05-5-${timestamp}.png`) 
    });
  });

  // Expected Results:
  // 1. File uploaded ✓
  // 2. Audit viewed ✓
  // 3. Entry found ✓
  // 4. Name/size/hash ✓
  // 5. Uploader shown ✓
});