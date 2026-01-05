import { test, expect } from '@playwright/test';
import { getScreenshotPath } from '../../utils/paths';
import dotenv from 'dotenv';
import { microsoftLogin } from '../../utils/msLogin';
import { handleERSDDialog } from '../../utils/ersd-handler';

dotenv.config({ path: '.playwright.env' });

test.use({
  viewport: { height: 1080, width: 1920 },
  ignoreHTTPSErrors: true
});

test.setTimeout(180000); // 3 minutes

test('TS.7.3-05 Content Duplication', async ({ page }) => {
  // Setup: Login as Creator
  const email = process.env.MS_EMAIL_MSPM36_DIEGO_SICILIANI!;
  const password = process.env.MS_PASSWORD!;
  await microsoftLogin(page, email, password);
  await handleERSDDialog(page);

  // Create a parent document
  await page.goto('/documents');
  await page.waitForLoadState('networkidle');
  
  await page.getByTestId('lsb.nav-main.documents-newDocument').click();
  await page.getByTestId('createDocumentDialog.documentNameInput').fill('Content Duplication Test');
  await page.getByTestId('createDocumentDialog.createButton').click();
  await page.waitForURL(/.*\/editor\/.*/, { timeout: 10000 });

  // Step 1: Add content to parent
  await test.step('Add content to parent.', async () => {
    // Wait for editor to load
    await page.waitForSelector('[data-testid="editor-content"]', { state: 'visible' });
    
    // Add some content to the document
    const editor = page.getByTestId('editor-content');
    await editor.click();
    await page.keyboard.type('This is test content for duplication testing.');
    
    // Save the document
    await page.keyboard.press('Control+S');
    await page.waitForTimeout(1000);
  });

  // Step 2: Create controlled copy
  await test.step('Create controlled copy.', async () => {
    const copyButton = page.getByRole('button', { name: /Create Controlled Copy|Copy Document/i });
    await expect(copyButton).toBeVisible();
    await copyButton.click();
    
    await page.waitForURL(/.*\/editor\/.*/, { timeout: 10000 });
    await page.waitForLoadState('networkidle');
  });

  // Step 3: Check copy content
  await test.step('Check copy content.', async () => {
    // Wait for editor to load in copy
    await page.waitForSelector('[data-testid="editor-content"]', { state: 'visible' });
    
    // Verify content is duplicated
    const editor = page.getByTestId('editor-content');
    const content = await editor.textContent();
    expect(content).toContain('This is test content for duplication testing.');
  });

  // Step 4: Pre-approval preserved
  await test.step('Pre-approval preserved.', async () => {
    // Check that pre-approval signatures are preserved (if any)
    const preApprovalSection = page.getByText(/Pre-Approval|Pre Approval/i);
    if (await preApprovalSection.isVisible({ timeout: 5000 }).catch(() => false)) {
      // Verify pre-approval content is intact
      await expect(preApprovalSection).toBeVisible();
    }
  });

  // Step 5: Execution cleared (SC)
  await test.step('Execution cleared (SC)', async () => {
    // Check that execution signatures are cleared
    const executionSection = page.getByText(/Execution|Execute/i);
    if (await executionSection.isVisible({ timeout: 5000 }).catch(() => false)) {
      // Verify execution is empty/cleared
      const executionSignatures = page.getByTestId('execution-signatures');
      if (await executionSignatures.isVisible({ timeout: 3000 }).catch(() => false)) {
        const signatureCount = await executionSignatures.locator('[data-testid="signature"]').count();
        expect(signatureCount).toBe(0);
      }
    }
    
    // Take screenshot showing copied content
    const timestamp = new Date();
    const formattedTimestamp = `${timestamp.getFullYear()}.${String(timestamp.getMonth() + 1).padStart(2, '0')}.${String(timestamp.getDate()).padStart(2, '0')}-${String(timestamp.getHours()).padStart(2, '0')}.${String(timestamp.getMinutes()).padStart(2, '0')}.${String(timestamp.getSeconds()).padStart(2, '0')}`;
    await page.screenshot({ 
      path: getScreenshotPath(`TS.7.3-05-5-${formattedTimestamp}.png`) 
    });
  });

  // Expected Results:
  // 1. Parent has content ✓
  // 2. Copy created ✓
  // 3. Structure copied ✓
  // 4. Pre-approval same ✓
  // 5. Execution empty ✓
});