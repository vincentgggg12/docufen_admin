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

test('TS.7.6.2-06 State Preservation', async ({ page }) => {
  // Setup: Login as owner
  const diegoEmail = process.env.MS_EMAIL_MSPM36_DIEGO_SICILIANI!;
  const password = process.env.MS_PASSWORD!;
  await microsoftLogin(page, diegoEmail, password);
  await handleERSDDialog(page);

  // Create a document
  await page.goto('/documents');
  await page.waitForLoadState('networkidle');
  
  await page.getByTestId('lsb.nav-main.documents-newDocument').click();
  await page.getByTestId('createDocumentDialog.documentNameInput').fill('State Preservation Test');
  await page.getByTestId('createDocumentDialog.createButton').click();
  await page.waitForURL(/.*\/editor\/.*/, { timeout: 10000 });

  // Advance document to Execute/Execution stage
  let currentStage = 'initial';
  while (currentStage !== 'execute') {
    const forwardButton = page.getByRole('button', { name: /Next Stage|Forward|Advance|To Execute|To Execution/i });
    if (await forwardButton.isVisible({ timeout: 3000 }).catch(() => false)) {
      await forwardButton.click();
      await page.waitForTimeout(2000);
      
      // Handle any confirmation dialogs
      const confirmButton = page.getByRole('button', { name: /Confirm|Yes|Continue/i });
      if (await confirmButton.isVisible({ timeout: 2000 }).catch(() => false)) {
        await confirmButton.click();
        await page.waitForTimeout(1000);
      }
      
      // Check if we're in Execute stage
      const stageIndicator = page.locator('[data-testid*="stage"], [class*="stage"]').first();
      const stageText = await stageIndicator.textContent().catch(() => '');
      if (stageText.toLowerCase().includes('execute') || stageText.toLowerCase().includes('execution')) {
        currentStage = 'execute';
      }
    } else {
      break;
    }
  }

  const testContent = 'Important content added during execution phase - must be preserved';

  // Step 1: Add content in Execute
  await test.step('Add content in Execute.', async () => {
    // Click into the editor
    const editor = page.locator('[class*="editor"], [data-testid*="editor"], .syncfusion-editor, iframe').first();
    
    if (await editor.frameLocator && await page.locator('iframe').isVisible({ timeout: 3000 }).catch(() => false)) {
      // Handle iframe-based editor
      const editorFrame = page.frameLocator('iframe').first();
      await editorFrame.locator('body').click();
      await page.keyboard.type(testContent);
    } else {
      // Handle regular editor
      await editor.click();
      await page.keyboard.type(testContent);
    }
    
    await page.waitForTimeout(1000);
  });

  // Step 2: Revert to Pre-Approval
  await test.step('Revert to Pre-Approval.', async () => {
    // Click back button
    const backButton = page.getByRole('button', { name: /Back|Previous|Revert|Previous Stage/i });
    await backButton.click();
    
    // Select Pre-Approval stage
    const preApprovalOption = page.getByText(/Pre-Approval/i);
    await preApprovalOption.click();
    
    // Enter reason
    const reasonInput = page.getByPlaceholder(/reason|explanation/i);
    await reasonInput.fill('Testing content preservation during stage reversion');
    
    // Submit the reversion
    const submitButton = page.getByRole('button', { name: /Submit|Confirm|Revert/i });
    await submitButton.click();
    
    await page.waitForTimeout(2000);
  });

  // Step 3: Content preserved
  await test.step('Content preserved.', async () => {
    // Verify the content is still present
    const contentLocator = page.getByText(testContent);
    await expect(contentLocator).toBeVisible();
  });

  // Step 4: Nothing lost
  await test.step('Nothing lost.', async () => {
    // Double-check by searching for specific parts of the content
    const partialContent = page.getByText('Important content added during execution');
    await expect(partialContent).toBeVisible();
    
    const moreContent = page.getByText('must be preserved');
    await expect(moreContent).toBeVisible();
  });

  // Step 5: Data intact (SC)
  await test.step('Data intact (SC)', async () => {
    // Take screenshot showing the preserved content after reversion
    const timestamp = new Date();
    const formattedTimestamp = `${timestamp.getFullYear()}.${String(timestamp.getMonth() + 1).padStart(2, '0')}.${String(timestamp.getDate()).padStart(2, '0')}-${String(timestamp.getHours()).padStart(2, '0')}.${String(timestamp.getMinutes()).padStart(2, '0')}.${String(timestamp.getSeconds()).padStart(2, '0')}`;
    await page.screenshot({ 
      path: getScreenshotPath(`TS.7.6.2-06-5-${formattedTimestamp}.png`) 
    });
  });

  // Expected Results:
  // 1. Content added ✓
  // 2. Stage reverted ✓
  // 3. Content remains ✓
  // 4. All preserved ✓
  // 5. No data loss ✓
});