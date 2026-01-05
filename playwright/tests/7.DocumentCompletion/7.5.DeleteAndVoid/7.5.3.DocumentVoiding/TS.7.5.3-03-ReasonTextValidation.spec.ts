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

test('TS.7.5.3-03 Reason Text Validation', async ({ page }) => {
  // Setup: Login as owner
  const email = process.env.MS_EMAIL_MSPM36_DIEGO_SICILIANI!;
  const password = process.env.MS_PASSWORD!;
  await microsoftLogin(page, email, password);
  await handleERSDDialog(page);

  // Create a document with content
  await page.goto('/documents');
  await page.waitForLoadState('networkidle');
  
  await page.getByTestId('lsb.nav-main.documents-newDocument').click();
  await page.getByTestId('createDocumentDialog.documentNameInput').fill('Reason Validation Test');
  await page.getByTestId('createDocumentDialog.createButton').click();
  await page.waitForURL(/.*\/editor\/.*/, { timeout: 10000 });

  // Add content to trigger void button
  const editor = page.getByTestId('editor-content');
  await editor.click();
  await page.keyboard.type('Test content for void validation');
  await page.waitForTimeout(1000);

  // Wait for Void button to appear
  await expect(page.getByRole('button', { name: 'Void' })).toBeVisible();

  // Click Void button to open dialog
  await page.getByRole('button', { name: 'Void' }).click();

  // Step 1: Leave reason empty
  await test.step('Leave reason empty.', async () => {
    // Verify the reason field is empty
    const reasonField = page.getByTestId('voidReasonDialog.reasonTextarea');
    await expect(reasonField).toBeEmpty();
  });

  // Step 2: Submit disabled
  await test.step('Submit disabled.', async () => {
    // Verify submit button is disabled when reason is empty
    const submitButton = page.getByTestId('voidReasonDialog.confirmButton');
    await expect(submitButton).toBeDisabled();
  });

  // Step 3: Enter "Test"
  await test.step('Enter "Test".', async () => {
    // Type a short reason
    const reasonField = page.getByTestId('voidReasonDialog.reasonTextarea');
    await reasonField.fill('Test');
  });

  // Step 4: Still disabled
  await test.step('Still disabled.', async () => {
    // Verify submit button is still disabled with short text
    const submitButton = page.getByTestId('voidReasonDialog.confirmButton');
    await expect(submitButton).toBeDisabled();
    
    // Check for validation message if visible
    const validationMessage = page.getByText(/minimum|at least|characters/i);
    if (await validationMessage.isVisible({ timeout: 1000 }).catch(() => false)) {
      await expect(validationMessage).toBeVisible();
    }
  });

  // Step 5: Enter valid reason (SC)
  await test.step('Enter valid reason (SC)', async () => {
    // Enter a valid reason with sufficient characters
    const reasonField = page.getByTestId('voidReasonDialog.reasonTextarea');
    await reasonField.fill('This document contains errors and needs to be voided for correction');
    
    // Verify submit button is now enabled
    const submitButton = page.getByTestId('voidReasonDialog.confirmButton');
    await expect(submitButton).toBeEnabled();
    
    // Take screenshot showing valid reason and enabled submit
    const timestamp = new Date();
    const formattedTimestamp = `${timestamp.getFullYear()}.${String(timestamp.getMonth() + 1).padStart(2, '0')}.${String(timestamp.getDate()).padStart(2, '0')}-${String(timestamp.getHours()).padStart(2, '0')}.${String(timestamp.getMinutes()).padStart(2, '0')}.${String(timestamp.getSeconds()).padStart(2, '0')}`;
    await page.screenshot({ 
      path: getScreenshotPath(`TS.7.5.3-03-5-${formattedTimestamp}.png`) 
    });
  });

  // Expected Results:
  // 1. Empty reason ✓
  // 2. Cannot submit ✓
  // 3. Too short ✓
  // 4. Still blocked ✓
  // 5. Min chars required ✓
});