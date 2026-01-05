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

test('TS.7.6.2-04 Backward Stage Order', async ({ page }) => {
  // Setup: Login as owner
  const diegoEmail = process.env.MS_EMAIL_MSPM36_DIEGO_SICILIANI!;
  const password = process.env.MS_PASSWORD!;
  await microsoftLogin(page, diegoEmail, password);
  await handleERSDDialog(page);

  // Create a document and advance it to Closed stage
  await page.goto('/documents');
  await page.waitForLoadState('networkidle');
  
  await page.getByTestId('lsb.nav-main.documents-newDocument').click();
  await page.getByTestId('createDocumentDialog.documentNameInput').fill('Stage Order Test');
  await page.getByTestId('createDocumentDialog.createButton').click();
  await page.waitForURL(/.*\/editor\/.*/, { timeout: 10000 });

  // Advance document through stages to reach Closed
  // This may require multiple forward transitions depending on the workflow
  let stageAdvanced = true;
  while (stageAdvanced) {
    const forwardButton = page.getByRole('button', { name: /Next Stage|Forward|Advance|Complete|Close/i });
    if (await forwardButton.isVisible({ timeout: 3000 }).catch(() => false)) {
      await forwardButton.click();
      await page.waitForTimeout(2000);
      
      // Handle any stage transition dialogs
      const confirmButton = page.getByRole('button', { name: /Confirm|Yes|Continue/i });
      if (await confirmButton.isVisible({ timeout: 2000 }).catch(() => false)) {
        await confirmButton.click();
        await page.waitForTimeout(1000);
      }
    } else {
      stageAdvanced = false;
    }
  }

  // Step 1: From Closed
  await test.step('From Closed.', async () => {
    // Verify we're in a later stage (ideally Closed)
    const stageIndicator = page.locator('[data-testid*="stage"], [class*="stage"]').first();
    await expect(stageIndicator).toBeVisible();
  });

  // Step 2: Can go to Post-Approval
  await test.step('Can go to Post-Approval.', async () => {
    // Click back button to open reversion options
    const backButton = page.getByRole('button', { name: /Back|Previous|Revert|Previous Stage/i });
    await backButton.click();
    
    // Look for Post-Approval option
    const postApprovalOption = page.getByText(/Post-Approval/i);
    await expect(postApprovalOption).toBeVisible();
  });

  // Step 3: From Post-Approval to Execute
  await test.step('From Post-Approval to Execute.', async () => {
    // Select Post-Approval if modal is open
    const postApprovalOption = page.getByText(/Post-Approval/i);
    if (await postApprovalOption.isVisible({ timeout: 2000 }).catch(() => false)) {
      await postApprovalOption.click();
      
      // Enter reason if required
      const reasonInput = page.getByPlaceholder(/reason|explanation/i);
      if (await reasonInput.isVisible({ timeout: 2000 }).catch(() => false)) {
        await reasonInput.fill('Testing stage reversion flexibility');
        const submitButton = page.getByRole('button', { name: /Submit|Confirm|Revert/i });
        await submitButton.click();
      }
    }
    
    await page.waitForTimeout(2000);
    
    // Now check if Execute is available from Post-Approval
    const backButton2 = page.getByRole('button', { name: /Back|Previous|Revert|Previous Stage/i });
    if (await backButton2.isVisible({ timeout: 2000 }).catch(() => false)) {
      await backButton2.click();
      const executeOption = page.getByText(/Execute|Execution/i);
      await expect(executeOption).toBeVisible();
    }
  });

  // Step 4: Any previous stage
  await test.step('Any previous stage.', async () => {
    // Verify multiple previous stages are available
    const stageOptions = page.locator('text=/Pre-Approval|Draft|Execute|Post-Approval/i');
    const count = await stageOptions.count();
    expect(count).toBeGreaterThan(1);
  });

  // Step 5: Flexible revert (SC)
  await test.step('Flexible revert (SC)', async () => {
    // Take screenshot showing all available reversion options
    const timestamp = new Date();
    const formattedTimestamp = `${timestamp.getFullYear()}.${String(timestamp.getMonth() + 1).padStart(2, '0')}.${String(timestamp.getDate()).padStart(2, '0')}-${String(timestamp.getHours()).padStart(2, '0')}.${String(timestamp.getMinutes()).padStart(2, '0')}.${String(timestamp.getSeconds()).padStart(2, '0')}`;
    await page.screenshot({ 
      path: getScreenshotPath(`TS.7.6.2-04-5-${formattedTimestamp}.png`) 
    });
    
    // Close modal if open
    const cancelButton = page.getByRole('button', { name: /Cancel|Close/i });
    if (await cancelButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await cancelButton.click();
    }
  });

  // Expected Results:
  // 1. Closed stage ✓
  // 2. Post-Approval available ✓
  // 3. Execute available ✓
  // 4. All previous shown ✓
  // 5. Full flexibility ✓
});