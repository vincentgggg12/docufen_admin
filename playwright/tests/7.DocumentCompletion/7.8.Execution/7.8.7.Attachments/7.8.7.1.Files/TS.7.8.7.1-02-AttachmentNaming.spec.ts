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

test('TS.7.8.7.1-02 Attachment Naming', async ({ page }) => {
  // Login as an executor
  const email = process.env.MS_EMAIL_17NJ5D_DAVID_SEAGAL!;
  const password = process.env.MS_PASSWORD!;
  await microsoftLogin(page, email, password);
  await handleERSDDialog(page);

  // Test Steps
  await test.step('1. Upload file', async () => {
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
  });

  await test.step('2. Name field required', async () => {
    // Wait for attachment dialog/form to appear
    await expect(page.getByLabel('Attachment Name', { exact: false })).toBeVisible();
    
    // Verify name field is empty initially
    const nameField = page.getByLabel('Attachment Name', { exact: false });
    const value = await nameField.inputValue();
    expect(value).toBe('');
  });

  await test.step('3. Enter "Test Results"', async () => {
    // Enter descriptive name
    await page.getByLabel('Attachment Name', { exact: false }).fill('Test Results');
  });

  await test.step('4. Name saved', async () => {
    // Save the attachment
    await page.getByRole('button', { name: 'Save' }).click();
    
    // Verify attachment is listed with the given name
    await expect(page.getByText('Test Results')).toBeVisible();
  });

  await test.step('5. Descriptive naming (SC)', async () => {
    // Take screenshot showing attachment with custom name
    const timestamp = formatTimestamp(new Date());
    await page.screenshot({ 
      path: getScreenshotPath(`TS.7.8.7.1-02-5-${timestamp}.png`) 
    });
  });

  // Expected Results:
  // 1. File uploaded ✓
  // 2. Name empty ✓
  // 3. Description entered ✓
  // 4. Name stored ✓
  // 5. Named properly ✓
});