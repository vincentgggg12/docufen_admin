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

test('TS.7.5.1-02 Dynamic Button Label', async ({ page }) => {
  // Setup: Login as owner
  const email = process.env.MS_EMAIL_MSPM36_DIEGO_SICILIANI!;
  const password = process.env.MS_PASSWORD!;
  await microsoftLogin(page, email, password);
  await handleERSDDialog(page);

  // Create a document
  await page.goto('/documents');
  await page.waitForLoadState('networkidle');
  
  await page.getByTestId('lsb.nav-main.documents-newDocument').click();
  await page.getByTestId('createDocumentDialog.documentNameInput').fill('Dynamic Button Test');
  await page.getByTestId('createDocumentDialog.createButton').click();
  await page.waitForURL(/.*\/editor\/.*/, { timeout: 10000 });

  // Step 1: New empty document
  await test.step('New empty document.', async () => {
    // Wait for editor to load
    await page.waitForSelector('[data-testid="editor-content"]', { state: 'visible' });
    await expect(page.getByTestId('editor-content')).toBeVisible();
  });

  // Step 2: Shows "Delete"
  await test.step('Shows "Delete".', async () => {
    // Verify button shows "Delete" for empty document
    const deleteButton = page.getByRole('button', { name: /Delete/i });
    await expect(deleteButton).toBeVisible();
    
    // Verify it's specifically "Delete" and not "Void"
    await expect(page.getByRole('button', { name: 'Delete' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Void' })).not.toBeVisible();
  });

  // Step 3: Add content
  await test.step('Add content.', async () => {
    // Add some content to the document
    const editor = page.getByTestId('editor-content');
    await editor.click();
    await page.keyboard.type('This is test content to trigger void mode.');
    
    // Wait a moment for the button to update
    await page.waitForTimeout(1000);
  });

  // Step 4: Changes to "Void"
  await test.step('Changes to "Void".', async () => {
    // Verify button now shows "Void" after adding content
    const voidButton = page.getByRole('button', { name: /Void/i });
    await expect(voidButton).toBeVisible();
    
    // Verify it's specifically "Void" and not "Delete"
    await expect(page.getByRole('button', { name: 'Void' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Delete' })).not.toBeVisible();
  });

  // Step 5: Dynamic update (SC)
  await test.step('Dynamic update (SC)', async () => {
    // Take screenshot showing Void button
    const timestamp = new Date();
    const formattedTimestamp = `${timestamp.getFullYear()}.${String(timestamp.getMonth() + 1).padStart(2, '0')}.${String(timestamp.getDate()).padStart(2, '0')}-${String(timestamp.getHours()).padStart(2, '0')}.${String(timestamp.getMinutes()).padStart(2, '0')}.${String(timestamp.getSeconds()).padStart(2, '0')}`;
    await page.screenshot({ 
      path: getScreenshotPath(`TS.7.5.1-02-5-${formattedTimestamp}.png`) 
    });
  });

  // Expected Results:
  // 1. Empty doc ✓
  // 2. Delete label ✓
  // 3. Content added ✓
  // 4. Void label ✓
  // 5. Real-time change ✓
});