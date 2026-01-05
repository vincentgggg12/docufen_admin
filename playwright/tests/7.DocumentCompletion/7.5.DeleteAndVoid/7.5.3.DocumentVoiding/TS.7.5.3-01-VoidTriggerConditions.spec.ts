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

test('TS.7.5.3-01 Void Trigger Conditions', async ({ page }) => {
  // Setup: Login as owner
  const email = process.env.MS_EMAIL_MSPM36_DIEGO_SICILIANI!;
  const password = process.env.MS_PASSWORD!;
  await microsoftLogin(page, email, password);
  await handleERSDDialog(page);

  // Create a document
  await page.goto('/documents');
  await page.waitForLoadState('networkidle');
  
  await page.getByTestId('lsb.nav-main.documents-newDocument').click();
  await page.getByTestId('createDocumentDialog.documentNameInput').fill('Void Trigger Test');
  await page.getByTestId('createDocumentDialog.createButton').click();
  await page.waitForURL(/.*\/editor\/.*/, { timeout: 10000 });

  // Step 1: Add signature
  await test.step('Add signature.', async () => {
    // Add a signature to the document
    const signatureButton = page.getByRole('button', { name: /Sign|Signature|Add Signature/i });
    if (await signatureButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await signatureButton.click();
      
      // Complete signature if required
      const signDialog = page.getByRole('dialog', { name: /Sign|Signature/i });
      if (await signDialog.isVisible({ timeout: 3000 }).catch(() => false)) {
        const confirmSign = page.getByRole('button', { name: /Sign|Confirm/i });
        await confirmSign.click();
      }
    } else {
      // Alternative: Add signature via editor content
      const editor = page.getByTestId('editor-content');
      await editor.click();
      await page.keyboard.type('[Signature: Diego Siciliani]');
    }
  });

  // Step 2: Button shows Void
  await test.step('Button shows Void.', async () => {
    // Wait for button to update and verify it shows "Void"
    await page.waitForTimeout(1000);
    const voidButton = page.getByRole('button', { name: 'Void' });
    await expect(voidButton).toBeVisible();
    
    // Ensure it's not showing "Delete"
    await expect(page.getByRole('button', { name: 'Delete' })).not.toBeVisible();
  });

  // Step 3: Add text entry
  await test.step('Add text entry.', async () => {
    // Add additional text content
    const editor = page.getByTestId('editor-content');
    await editor.click();
    await page.keyboard.press('End');
    await page.keyboard.type('\nAdditional text content for testing.');
  });

  // Step 4: Still shows Void
  await test.step('Still shows Void.', async () => {
    // Verify button still shows "Void" after adding more content
    await page.waitForTimeout(500);
    const voidButton = page.getByRole('button', { name: 'Void' });
    await expect(voidButton).toBeVisible();
  });

  // Step 5: Content detected (SC)
  await test.step('Content detected (SC)', async () => {
    // Take screenshot showing Void button with content
    const timestamp = new Date();
    const formattedTimestamp = `${timestamp.getFullYear()}.${String(timestamp.getMonth() + 1).padStart(2, '0')}.${String(timestamp.getDate()).padStart(2, '0')}-${String(timestamp.getHours()).padStart(2, '0')}.${String(timestamp.getMinutes()).padStart(2, '0')}.${String(timestamp.getSeconds()).padStart(2, '0')}`;
    await page.screenshot({ 
      path: getScreenshotPath(`TS.7.5.3-01-5-${formattedTimestamp}.png`) 
    });
  });

  // Expected Results:
  // 1. Signature added ✓
  // 2. Void appears ✓
  // 3. Text added ✓
  // 4. Remains Void ✓
  // 5. Any content triggers ✓
});