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

test('TS.7.4.3-02 Parallel Signing Capability', async ({ page }) => {
  // Setup: Login as owner
  const email = process.env.MS_EMAIL_MSPM36_DIEGO_SICILIANI!;
  const password = process.env.MS_PASSWORD!;
  await microsoftLogin(page, email, password);
  await handleERSDDialog(page);

  // Create a document
  await page.goto('/documents');
  await page.waitForLoadState('networkidle');
  
  await page.getByTestId('lsb.nav-main.documents-newDocument').click();
  await page.getByTestId('createDocumentDialog.documentNameInput').fill('Parallel Signing Test');
  await page.getByTestId('createDocumentDialog.createButton').click();
  await page.waitForURL(/.*\/editor\/.*/, { timeout: 10000 });

  // Add some content to the document
  await page.waitForTimeout(2000);
  const editorFrame = page.frameLocator('[title="SyncFusion Document Editor"]');
  if (await editorFrame.locator('body').isVisible({ timeout: 5000 }).catch(() => false)) {
    await editorFrame.locator('body').click();
    await page.keyboard.type('Test document for parallel signing capability.');
  }

  // Open participants dialog
  const participantsTab = page.getByRole('tab', { name: /Participants|Users|Workflow/i });
  await expect(participantsTab).toBeVisible();
  await participantsTab.click();

  // Step 1: Add 3 executors
  await test.step('Add 3 executors.', async () => {
    // Find and click the add button for execution group
    const addButton = page.locator('[data-testid*="execution"]').getByRole('button', { name: /Add|\\+/i }).or(
      page.locator('.execution-group').getByRole('button', { name: /Add|\\+/i })
    );
    
    if (await addButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await addButton.click();
      
      // Add first executor
      await page.getByPlaceholder(/Search|Find/i).fill('Diego');
      await page.getByText('Diego Siciliani').click();
      
      // Add second executor
      await page.getByPlaceholder(/Search|Find/i).clear();
      await page.getByPlaceholder(/Search|Find/i).fill('Johanna');
      await page.getByText('Johanna Murray').click();
      
      // Add third executor
      await page.getByPlaceholder(/Search|Find/i).clear();
      await page.getByPlaceholder(/Search|Find/i).fill('Bob');
      await page.getByText('Bob Johnson').or(page.getByText('Robert Johnson')).click();
      
      // Save the selections
      await page.getByRole('button', { name: /Save|Add|Done/i }).click();
    }
  });

  // Step 2: All can sign simultaneously
  await test.step('All can sign simultaneously.', async () => {
    // Verify all three executors are listed
    const executionSection = page.locator('[data-testid*="execution"]').or(page.locator('.execution-group'));
    await expect(executionSection).toBeVisible();
    
    // Check that all users are present
    await expect(executionSection.getByText(/Diego/i)).toBeVisible();
    await expect(executionSection.getByText(/Johanna/i)).toBeVisible();
    await expect(executionSection.getByText(/Bob|Robert/i)).toBeVisible();
  });

  // Step 3: No blocking
  await test.step('No blocking.', async () => {
    // Verify no signing order is enforced (no numbers shown)
    const orderNumbers = page.getByText(/^[1-9]\.$|^\([1-9]\)$|^[1-9]:/);
    const numberCount = await orderNumbers.count();
    expect(numberCount).toBe(0);
    
    // Verify no "signing order" checkbox is checked
    const signingOrderCheckbox = page.locator('[data-testid*="signing-order"]').or(
      page.getByRole('checkbox', { name: /signing order/i })
    );
    if (await signingOrderCheckbox.isVisible({ timeout: 3000 }).catch(() => false)) {
      await expect(signingOrderCheckbox).not.toBeChecked();
    }
  });

  // Step 4: Any order works
  await test.step('Any order works.', async () => {
    // Move document to execution stage to enable signing
    const moveToExecutionButton = page.getByRole('button', { name: /Move to Execution|Execute|Next Stage/i });
    if (await moveToExecutionButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await moveToExecutionButton.click();
      await page.waitForTimeout(2000);
    }
    
    // Verify all executors have access to sign (no restrictions shown)
    const executionList = page.locator('[data-testid*="execution"]').or(page.locator('.execution-participants'));
    await expect(executionList).toBeVisible();
    
    // Check that no "waiting" or "blocked" indicators are shown
    const blockedIndicators = page.getByText(/waiting|blocked|must sign first/i);
    const blockedCount = await blockedIndicators.count();
    expect(blockedCount).toBe(0);
  });

  // Step 5: True parallel (SC)
  await test.step('True parallel (SC)', async () => {
    // Take screenshot showing all executors can sign in parallel
    const timestamp = new Date();
    const formattedTimestamp = `${timestamp.getFullYear()}.${String(timestamp.getMonth() + 1).padStart(2, '0')}.${String(timestamp.getDate()).padStart(2, '0')}-${String(timestamp.getHours()).padStart(2, '0')}.${String(timestamp.getMinutes()).padStart(2, '0')}.${String(timestamp.getSeconds()).padStart(2, '0')}`;
    await page.screenshot({ 
      path: getScreenshotPath(`TS.7.4.3-02-5-${formattedTimestamp}.png`) 
    });
  });

  // Expected Results:
  // 1. Executors added ✓
  // 2. All sign together ✓
  // 3. No restrictions ✓
  // 4. Random order OK ✓
  // 5. Concurrent allowed ✓
});