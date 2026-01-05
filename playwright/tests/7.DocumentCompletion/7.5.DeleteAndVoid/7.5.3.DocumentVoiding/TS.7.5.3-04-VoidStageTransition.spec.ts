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

test('TS.7.5.3-04 Void Stage Transition', async ({ page }) => {
  // Setup: Login as owner
  const email = process.env.MS_EMAIL_MSPM36_DIEGO_SICILIANI!;
  const password = process.env.MS_PASSWORD!;
  await microsoftLogin(page, email, password);
  await handleERSDDialog(page);

  // Create a document
  await page.goto('/documents');
  await page.waitForLoadState('networkidle');
  
  await page.getByTestId('lsb.nav-main.documents-newDocument').click();
  await page.getByTestId('createDocumentDialog.documentNameInput').fill('Void Stage Test');
  await page.getByTestId('createDocumentDialog.createButton').click();
  await page.waitForURL(/.*\/editor\/.*/, { timeout: 10000 });

  // Add content to trigger void button
  const editor = page.getByTestId('editor-content');
  await editor.click();
  await page.keyboard.type('Document content for stage transition test');
  await page.waitForTimeout(1000);

  // Step 1: Document in Execution
  await test.step('Document in Execution.', async () => {
    // Verify document is in Execution stage
    const stageIndicator = page.getByTestId('document.stageIndicator');
    await expect(stageIndicator).toContainText('Execution');
    
    // Alternative selectors if needed
    const executionBadge = page.getByRole('status').filter({ hasText: 'Execution' });
    if (await executionBadge.isVisible({ timeout: 1000 }).catch(() => false)) {
      await expect(executionBadge).toBeVisible();
    }
  });

  // Step 2: Void with reason
  await test.step('Void with reason.', async () => {
    // Click Void button
    await page.getByRole('button', { name: 'Void' }).click();
    
    // Enter void reason
    const reasonField = page.getByTestId('voidReasonDialog.reasonTextarea');
    await reasonField.fill('Document contains incorrect information and needs to be voided');
    
    // Confirm void
    const confirmButton = page.getByTestId('voidReasonDialog.confirmButton');
    await confirmButton.click();
    
    // Wait for void process to complete
    await page.waitForTimeout(2000);
  });

  // Step 3: Stage changes to Voided
  await test.step('Stage changes to Voided.', async () => {
    // Verify stage has changed to Voided
    const stageIndicator = page.getByTestId('document.stageIndicator');
    await expect(stageIndicator).toContainText('Voided');
    
    // Alternative check
    const voidedBadge = page.getByRole('status').filter({ hasText: 'Voided' });
    if (await voidedBadge.isVisible({ timeout: 1000 }).catch(() => false)) {
      await expect(voidedBadge).toBeVisible();
    }
  });

  // Step 4: Red indicator
  await test.step('Red indicator.', async () => {
    // Verify red indicator/badge is shown
    const voidedIndicator = page.getByTestId('document.stageIndicator');
    
    // Check for red color class or style
    const hasRedClass = await voidedIndicator.evaluate(el => {
      const classList = el.classList.toString();
      const style = window.getComputedStyle(el);
      return classList.includes('red') || classList.includes('danger') || 
             classList.includes('error') || style.backgroundColor.includes('rgb(239, 68, 68)') ||
             style.color.includes('rgb(239, 68, 68)');
    });
    
    expect(hasRedClass).toBeTruthy();
  });

  // Step 5: Status updated (SC)
  await test.step('Status updated (SC)', async () => {
    // Take screenshot showing voided status
    const timestamp = new Date();
    const formattedTimestamp = `${timestamp.getFullYear()}.${String(timestamp.getMonth() + 1).padStart(2, '0')}.${String(timestamp.getDate()).padStart(2, '0')}-${String(timestamp.getHours()).padStart(2, '0')}.${String(timestamp.getMinutes()).padStart(2, '0')}.${String(timestamp.getSeconds()).padStart(2, '0')}`;
    await page.screenshot({ 
      path: getScreenshotPath(`TS.7.5.3-04-5-${formattedTimestamp}.png`) 
    });
    
    // Additional verification - document should be read-only
    const editor = page.getByTestId('editor-content');
    const isReadOnly = await editor.evaluate(el => {
      return el.getAttribute('contenteditable') === 'false' || 
             el.hasAttribute('readonly') || 
             el.classList.contains('read-only');
    });
    expect(isReadOnly).toBeTruthy();
  });

  // Expected Results:
  // 1. Execution stage ✓
  // 2. Voided ✓
  // 3. Stage = Voided ✓
  // 4. Red badge shown ✓
  // 5. Properly marked ✓
});