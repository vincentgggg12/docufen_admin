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

test('TS.7.8.7.1-01 File Upload Support', async ({ page }) => {
  // Login as an executor
  const email = process.env.MS_EMAIL_17NJ5D_DAVID_SEAGAL!;
  const password = process.env.MS_PASSWORD!;
  await microsoftLogin(page, email, password);
  await handleERSDDialog(page);

  // Test Steps
  await test.step('1. Upload JPG image', async () => {
    // Navigate to a document in Execution stage
    await page.getByRole('button', { name: 'Menu' }).click();
    await page.getByRole('link', { name: 'Documents' }).click();
    await page.waitForLoadState('networkidle');
    
    // Find and open a document in Execution stage
    await page.getByText('Execution').first().click();
    
    // Click attachments button
    await page.getByRole('button', { name: 'Attachments' }).click();
    
    // Upload JPG file
    const jpgPath = path.join(process.cwd(), 'playwright/tests/TestFiles/test-image.jpg');
    await page.setInputFiles('input[type="file"]', jpgPath);
    
    // Wait for upload
    await page.waitForTimeout(2000);
  });

  await test.step('2. Upload PDF document', async () => {
    // Upload PDF file
    const pdfPath = path.join(process.cwd(), 'playwright/tests/TestFiles/test-document.pdf');
    await page.setInputFiles('input[type="file"]', pdfPath);
    
    // Wait for upload
    await page.waitForTimeout(2000);
  });

  await test.step('3. Upload MP4 video', async () => {
    // Upload MP4 file
    const mp4Path = path.join(process.cwd(), 'playwright/tests/TestFiles/test-video.mp4');
    await page.setInputFiles('input[type="file"]', mp4Path);
    
    // Wait for upload
    await page.waitForTimeout(2000);
  });

  await test.step('4. All accepted', async () => {
    // Verify all files are listed
    await expect(page.getByText('test-image.jpg')).toBeVisible();
    await expect(page.getByText('test-document.pdf')).toBeVisible();
    await expect(page.getByText('test-video.mp4')).toBeVisible();
  });

  await test.step('5. Multiple types (SC)', async () => {
    // Take screenshot showing different file types uploaded
    const timestamp = formatTimestamp(new Date());
    await page.screenshot({ 
      path: getScreenshotPath(`TS.7.8.7.1-01-5-${timestamp}.png`) 
    });
  });

  // Expected Results:
  // 1. JPG uploaded ✓
  // 2. PDF uploaded ✓
  // 3. MP4 uploaded ✓
  // 4. All successful ✓
  // 5. Types supported ✓
});