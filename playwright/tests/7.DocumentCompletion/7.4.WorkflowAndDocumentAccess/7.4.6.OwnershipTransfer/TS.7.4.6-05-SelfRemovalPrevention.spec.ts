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

test('TS.7.4.6-05 Self Removal Prevention', async ({ page }) => {
  // Setup: Login as owner
  const email = process.env.MS_EMAIL_MSPM36_DIEGO_SICILIANI!;
  const password = process.env.MS_PASSWORD!;
  await microsoftLogin(page, email, password);
  await handleERSDDialog(page);

  // Create a document
  await page.goto('/documents');
  await page.waitForLoadState('networkidle');
  
  await page.getByTestId('lsb.nav-main.documents-newDocument').click();
  await page.getByTestId('createDocumentDialog.documentNameInput').fill('Self Removal Prevention Test');
  await page.getByTestId('createDocumentDialog.createButton').click();
  await page.waitForURL(/.*\/editor\/.*/, { timeout: 10000 });

  // Open participants dialog
  const participantsTab = page.getByRole('tab', { name: /Participants|Users|Workflow/i });
  await expect(participantsTab).toBeVisible();
  await participantsTab.click();
  
  const participantsModal = page.getByRole('dialog', { name: /Participants|Manage Participants|Workflow/i });
  await expect(participantsModal).toBeVisible();

  // Step 1: Single owner exists
  await test.step('Single owner exists.', async () => {
    // Verify only one owner in the list (current user)
    const ownersSection = page.getByText('Owners').locator('..');
    const ownerItems = ownersSection.locator('[role="listitem"]');
    const count = await ownerItems.count();
    expect(count).toBe(1);
    
    // Verify it's the current user
    await expect(ownersSection.getByText(/Diego.*Siciliani/i)).toBeVisible();
  });

  // Step 2: Try remove self
  await test.step('Try remove self.', async () => {
    // Find the remove button for current user (self)
    const ownersSection = page.getByText('Owners').locator('..');
    const selfItem = ownersSection.locator('[role="listitem"]').filter({ hasText: /Diego.*Siciliani/i });
    const removeButton = selfItem.getByRole('button', { name: /Remove|Delete|×/i });
    
    // Try to click remove button
    if (await removeButton.isVisible()) {
      // Button might be disabled
      const isDisabled = await removeButton.isDisabled();
      if (isDisabled) {
        // Button is correctly disabled
        await expect(removeButton).toBeDisabled();
      } else {
        // If enabled, click it to trigger error
        await removeButton.click();
      }
    }
  });

  // Step 3: Action blocked
  await test.step('Action blocked.', async () => {
    // Check if error message appears or button is disabled
    const errorMessage = page.getByText(/Cannot remove yourself|Add another owner first|Last owner cannot be removed/i);
    const removeButton = page.getByRole('button', { name: /Remove|Delete|×/i }).first();
    
    // Either error message is shown or button is disabled
    const hasError = await errorMessage.isVisible({ timeout: 2000 }).catch(() => false);
    const isDisabled = await removeButton.isDisabled().catch(() => false);
    
    expect(hasError || isDisabled).toBeTruthy();
  });

  // Step 4: Must add another first
  await test.step('Must add another first.', async () => {
    // Verify message indicates need to add another owner
    const helpMessage = page.getByText(/Add another owner first|Must add another owner|Cannot remove last owner/i);
    await expect(helpMessage).toBeVisible();
  });

  // Step 5: Continuity ensured (SC)
  await test.step('Continuity ensured (SC)', async () => {
    // Verify self-removal is prevented to ensure document continuity
    const ownersSection = page.getByText('Owners').locator('..');
    
    // Verify we still have exactly one owner
    const ownerCount = await ownersSection.locator('[role="listitem"]').count();
    expect(ownerCount).toBe(1);
    
    // Verify protection message is visible
    const protectionMessage = page.getByText(/Add another owner first|Must add another owner|Cannot remove last owner/i);
    await expect(protectionMessage).toBeVisible();
    
    // Take screenshot showing self-removal prevention
    const timestamp = new Date();
    const formattedTimestamp = `${timestamp.getFullYear()}.${String(timestamp.getMonth() + 1).padStart(2, '0')}.${String(timestamp.getDate()).padStart(2, '0')}-${String(timestamp.getHours()).padStart(2, '0')}.${String(timestamp.getMinutes()).padStart(2, '0')}.${String(timestamp.getSeconds()).padStart(2, '0')}`;
    await page.screenshot({ 
      path: getScreenshotPath(`TS.7.4.6-05-5-${formattedTimestamp}.png`) 
    });
  });

  // Expected Results:
  // 1. Only owner ✓
  // 2. Self-remove tried ✓
  // 3. Blocked ✓
  // 4. "Add owner first" ✓
  // 5. Protection works ✓
});