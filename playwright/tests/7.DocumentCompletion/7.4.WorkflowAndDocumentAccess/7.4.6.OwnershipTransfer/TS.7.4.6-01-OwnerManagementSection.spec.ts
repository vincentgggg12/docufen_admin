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

test('TS.7.4.6-01 Owner Management Section', async ({ page }) => {
  // Setup: Login as owner
  const email = process.env.MS_EMAIL_MSPM36_DIEGO_SICILIANI!;
  const password = process.env.MS_PASSWORD!;
  await microsoftLogin(page, email, password);
  await handleERSDDialog(page);

  // Create a document
  await page.goto('/documents');
  await page.waitForLoadState('networkidle');
  
  await page.getByTestId('lsb.nav-main.documents-newDocument').click();
  await page.getByTestId('createDocumentDialog.documentNameInput').fill('Owner Management Test');
  await page.getByTestId('createDocumentDialog.createButton').click();
  await page.waitForURL(/.*\/editor\/.*/, { timeout: 10000 });

  // Step 1: View Owners group
  await test.step('View Owners group.', async () => {
    // Open participants/workflow dialog
    const participantsTab = page.getByRole('tab', { name: /Participants|Users|Workflow/i });
    await expect(participantsTab).toBeVisible();
    await participantsTab.click();
    
    // Verify participants modal opens
    const participantsModal = page.getByRole('dialog', { name: /Participants|Manage Participants|Workflow/i });
    await expect(participantsModal).toBeVisible();
    
    // Find Owners section
    const ownersSection = page.getByText('Owners').locator('..');
    await expect(ownersSection).toBeVisible();
  });

  // Step 2: Current owners listed
  await test.step('Current owners listed.', async () => {
    // Check current user (Diego Siciliani) is listed as owner
    const ownersList = page.locator('[role="list"]').filter({ has: page.getByText('Owners') });
    await expect(ownersList.getByText(/Diego.*Siciliani/i)).toBeVisible();
  });

  // Step 3: Can add/remove
  await test.step('Can add/remove.', async () => {
    // Find add button near Owners section
    const ownersSection = page.getByText('Owners').locator('..');
    const addButton = ownersSection.getByRole('button', { name: /Add|\\+/i });
    await expect(addButton).toBeVisible();
    await expect(addButton).toBeEnabled();
    
    // Check for remove capability (if there are multiple owners)
    const removeButtons = ownersSection.getByRole('button', { name: /Remove|Delete|×/i });
    const count = await removeButtons.count();
    if (count > 0) {
      // If only one owner, remove should be disabled
      const ownerCount = await ownersSection.locator('[role="listitem"]').count();
      if (ownerCount === 1) {
        await expect(removeButtons.first()).toBeDisabled();
      } else {
        await expect(removeButtons.first()).toBeEnabled();
      }
    }
  });

  // Step 4: Full control shown
  await test.step('Full control shown.', async () => {
    // Verify permissions are displayed for owners
    const ownersSection = page.getByText('Owners').locator('..');
    await expect(ownersSection.getByText(/Full control|All permissions|Owner/i)).toBeVisible();
  });

  // Step 5: Section available (SC)
  await test.step('Section available (SC)', async () => {
    // Verify all owner management controls are accessible
    const ownersSection = page.getByText('Owners').locator('..');
    await expect(ownersSection).toBeVisible();
    
    // Take screenshot of owner management section
    const timestamp = new Date();
    const formattedTimestamp = `${timestamp.getFullYear()}.${String(timestamp.getMonth() + 1).padStart(2, '0')}.${String(timestamp.getDate()).padStart(2, '0')}-${String(timestamp.getHours()).padStart(2, '0')}.${String(timestamp.getMinutes()).padStart(2, '0')}.${String(timestamp.getSeconds()).padStart(2, '0')}`;
    await page.screenshot({ 
      path: getScreenshotPath(`TS.7.4.6-01-5-${formattedTimestamp}.png`) 
    });
  });

  // Expected Results:
  // 1. Group visible ✓
  // 2. Owners displayed ✓
  // 3. Buttons active ✓
  // 4. Permissions clear ✓
  // 5. Management enabled ✓
});