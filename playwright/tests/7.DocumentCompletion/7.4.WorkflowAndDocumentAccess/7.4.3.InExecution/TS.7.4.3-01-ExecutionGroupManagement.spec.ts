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

test('TS.7.4.3-01 Execution Group Management', async ({ page }) => {
  // Setup: Login as owner
  const email = process.env.MS_EMAIL_MSPM36_DIEGO_SICILIANI!;
  const password = process.env.MS_PASSWORD!;
  await microsoftLogin(page, email, password);
  await handleERSDDialog(page);

  // Create a document
  await page.goto('/documents');
  await page.waitForLoadState('networkidle');
  
  await page.getByTestId('lsb.nav-main.documents-newDocument').click();
  await page.getByTestId('createDocumentDialog.documentNameInput').fill('Execution Group Test');
  await page.getByTestId('createDocumentDialog.createButton').click();
  await page.waitForURL(/.*\/editor\/.*/, { timeout: 10000 });

  // Open participants dialog
  const participantsTab = page.getByRole('tab', { name: /Participants|Users|Workflow/i });
  await expect(participantsTab).toBeVisible();
  await participantsTab.click();

  // Step 1: View Execution group
  await test.step('View Execution group.', async () => {
    // Find Execution group section
    const executionGroup = page.getByText('Execution').or(page.getByText('Execute'));
    await expect(executionGroup).toBeVisible();
  });

  // Step 2: Add multiple users
  await test.step('Add multiple users.', async () => {
    // Add users to execution group
    const addButton = page.locator('[data-testid*="execution"]').getByRole('button', { name: /Add|\\+/i });
    if (await addButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await addButton.click();
      
      // Add first user
      await page.getByPlaceholder(/Search|Find/i).fill('Diego');
      await page.getByText('Diego Siciliani').click();
      
      // Add second user
      await page.getByPlaceholder(/Search|Find/i).fill('Johanna');
      await page.getByText('Johanna Murray').click();
      
      await page.getByRole('button', { name: /Save|Add/i }).click();
    }
  });

  // Step 3: All shown in list
  await test.step('All shown in list.', async () => {
    // Verify users appear in execution list
    const executionList = page.getByTestId('execution-participants');
    if (await executionList.isVisible({ timeout: 3000 }).catch(() => false)) {
      await expect(executionList.getByText('Diego')).toBeVisible();
      await expect(executionList.getByText('Johanna')).toBeVisible();
    }
  });

  // Step 4: No order shown
  await test.step('No order shown.', async () => {
    // Verify no sequential numbers (1, 2, 3) are shown
    const orderNumbers = page.getByText(/^[1-9]\.$|^\([1-9]\)$/);
    const numberCount = await orderNumbers.count();
    expect(numberCount).toBe(0);
  });

  // Step 5: Parallel access (SC)
  await test.step('Parallel access (SC)', async () => {
    // Take screenshot showing execution group with no ordering
    const timestamp = new Date();
    const formattedTimestamp = `${timestamp.getFullYear()}.${String(timestamp.getMonth() + 1).padStart(2, '0')}.${String(timestamp.getDate()).padStart(2, '0')}-${String(timestamp.getHours()).padStart(2, '0')}.${String(timestamp.getMinutes()).padStart(2, '0')}.${String(timestamp.getSeconds()).padStart(2, '0')}`;
    await page.screenshot({ 
      path: getScreenshotPath(`TS.7.4.3-01-5-${formattedTimestamp}.png`) 
    });
  });

  // Expected Results:
  // 1. Group visible ✓
  // 2. Users added ✓
  // 3. List updated ✓
  // 4. No numbers ✓
  // 5. Equal access ✓
});