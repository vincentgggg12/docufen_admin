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

test('TS.7.5.2-01 Delete Empty Document', async ({ page }) => {
  // Setup: Login as owner
  const email = process.env.MS_EMAIL_MSPM36_DIEGO_SICILIANI!;
  const password = process.env.MS_PASSWORD!;
  await microsoftLogin(page, email, password);
  await handleERSDDialog(page);

  // Step 1: Create new document
  await test.step('Create new document.', async () => {
    await page.goto('/documents');
    await page.waitForLoadState('networkidle');
    
    await page.getByTestId('lsb.nav-main.documents-newDocument').click();
    await page.getByTestId('createDocumentDialog.documentNameInput').fill('Document to Delete');
    await page.getByTestId('createDocumentDialog.createButton').click();
    await page.waitForURL(/.*\/editor\/.*/, { timeout: 10000 });
  });

  // Step 2: Click Delete
  await test.step('Click Delete.', async () => {
    // Find and click Delete button (should show Delete for empty doc)
    const deleteButton = page.getByRole('button', { name: 'Delete' });
    await expect(deleteButton).toBeVisible();
    await deleteButton.click();
  });

  // Step 3: Confirm deletion
  await test.step('Confirm deletion.', async () => {
    // Wait for confirmation dialog
    const confirmDialog = page.getByRole('dialog', { name: /Delete|Confirm/i });
    await expect(confirmDialog).toBeVisible();
    
    // Click confirm button
    const confirmButton = page.getByRole('button', { name: /Delete|Confirm|Yes/i });
    await expect(confirmButton).toBeVisible();
    await confirmButton.click();
  });

  // Step 4: Document removed
  await test.step('Document removed.', async () => {
    // Wait for redirect to documents list
    await page.waitForURL(/.*\/documents/, { timeout: 10000 });
    await page.waitForLoadState('networkidle');
    
    // Verify we're back on documents page
    await expect(page).toHaveURL(/.*\/documents/);
  });

  // Step 5: Database cleaned (SC)
  await test.step('Database cleaned (SC)', async () => {
    // Verify document is not in the list
    const documentName = page.getByText('Document to Delete');
    await expect(documentName).not.toBeVisible();
    
    // Take screenshot showing documents list without deleted document
    const timestamp = new Date();
    const formattedTimestamp = `${timestamp.getFullYear()}.${String(timestamp.getMonth() + 1).padStart(2, '0')}.${String(timestamp.getDate()).padStart(2, '0')}-${String(timestamp.getHours()).padStart(2, '0')}.${String(timestamp.getMinutes()).padStart(2, '0')}.${String(timestamp.getSeconds()).padStart(2, '0')}`;
    await page.screenshot({ 
      path: getScreenshotPath(`TS.7.5.2-01-5-${formattedTimestamp}.png`) 
    });
  });

  // Expected Results:
  // 1. Doc created ✓
  // 2. Delete clicked ✓
  // 3. Confirmed ✓
  // 4. Doc gone ✓
  // 5. No traces remain ✓
});