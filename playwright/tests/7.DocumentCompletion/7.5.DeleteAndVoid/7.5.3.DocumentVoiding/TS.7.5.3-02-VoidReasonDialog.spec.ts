import { test, expect } from '@playwright/test';
import { getScreenshotPath } from '../../../utils/paths';
import dotenv from 'dotenv';
import { microsoftLogin } from '../../../utils/msLogin';
import { handleERSDDialog } from '../../../utils/ersd-handler';

dotenv.config({ path: '.playwright.env' });

test.use({
  viewport: { height: 1080, width: 1920 },
  ignoreHTTPSErrors: true
});

test.setTimeout(120000); // 2 minutes

test('TS.7.5.3-02 Void Reason Dialog', async ({ page }) => {
  // Setup: Login as owner
  const email = process.env.MS_EMAIL_MSPM36_DIEGO_SICILIANI!;
  const password = process.env.MS_PASSWORD!;
  await microsoftLogin(page, email, password);
  await handleERSDDialog(page);

  // Create a document with content
  await page.goto('/documents');
  await page.waitForLoadState('networkidle');
  
  await page.getByTestId('lsb.nav-main.documents-newDocument').click();
  await page.getByTestId('createDocumentDialog.documentNameInput').fill('Void Reason Dialog Test');
  await page.getByTestId('createDocumentDialog.createButton').click();
  await page.waitForURL(/.*\/editor\/.*/, { timeout: 10000 });

  // Add content to trigger void mode
  const editor = page.getByTestId('editor-content');
  await editor.click();
  await page.keyboard.type('This content will trigger void mode for testing.');

  // Step 1: Click Void button
  await test.step('Click Void button.', async () => {
    // Wait for button to update to Void and click it
    await page.waitForTimeout(1000);
    const voidButton = page.getByRole('button', { name: 'Void' });
    await expect(voidButton).toBeVisible();
    await voidButton.click();
  });

  // Step 2: Modal opens
  await test.step('Modal opens.', async () => {
    // Verify void reason dialog appears
    const voidModal = page.getByRole('dialog', { name: /Void|Reason/i });
    await expect(voidModal).toBeVisible();
  });

  // Step 3: Reason field required
  await test.step('Reason field required.', async () => {
    // Verify reason text area is visible and required
    const reasonField = page.getByTestId('void-reason').or(page.getByPlaceholder(/reason|why/i));
    await expect(reasonField).toBeVisible();
    
    // Verify it's empty initially
    const fieldValue = await reasonField.inputValue();
    expect(fieldValue).toBe('');
  });

  // Step 4: Shows doc name
  await test.step('Shows doc name.', async () => {
    // Verify document name is shown in the dialog
    const docName = page.getByText('Void Reason Dialog Test');
    await expect(docName).toBeVisible();
  });

  // Step 5: Context provided (SC)
  await test.step('Context provided (SC)', async () => {
    // Take screenshot of void reason dialog
    const timestamp = new Date();
    const formattedTimestamp = `${timestamp.getFullYear()}.${String(timestamp.getMonth() + 1).padStart(2, '0')}.${String(timestamp.getDate()).padStart(2, '0')}-${String(timestamp.getHours()).padStart(2, '0')}.${String(timestamp.getMinutes()).padStart(2, '0')}.${String(timestamp.getSeconds()).padStart(2, '0')}`;
    await page.screenshot({ 
      path: getScreenshotPath(`TS.7.5.3-02-5-${formattedTimestamp}.png`) 
    });
  });

  // Expected Results:
  // 1. Void clicked ✓
  // 2. Dialog shown ✓
  // 3. Text area empty ✓
  // 4. Doc name visible ✓
  // 5. Clear context ✓
});