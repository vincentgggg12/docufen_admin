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

test('TS.7.4.6-03 Minimum Owner Requirement', async ({ page }) => {
  // Setup: Login as owner
  const email = process.env.MS_EMAIL_MSPM36_DIEGO_SICILIANI!;
  const password = process.env.MS_PASSWORD!;
  await microsoftLogin(page, email, password);
  await handleERSDDialog(page);

  // Create a document
  await page.goto('/documents');
  await page.waitForLoadState('networkidle');
  
  await page.getByTestId('lsb.nav-main.documents-newDocument').click();
  await page.getByTestId('createDocumentDialog.documentNameInput').fill('Minimum Owner Test');
  await page.getByTestId('createDocumentDialog.createButton').click();
  await page.waitForURL(/.*\/editor\/.*/, { timeout: 10000 });

  // Open participants dialog
  const participantsTab = page.getByRole('tab', { name: /Participants|Users|Workflow/i });
  await expect(participantsTab).toBeVisible();
  await participantsTab.click();
  
  const participantsModal = page.getByRole('dialog', { name: /Participants|Manage Participants|Workflow/i });
  await expect(participantsModal).toBeVisible();

  // First, add a second owner
  const ownersSection = page.getByText('Owners').locator('..');
  const addButton = ownersSection.getByRole('button', { name: /Add|\\+/i });
  await addButton.click();
  
  // Search and add another user as owner
  const searchInput = page.getByPlaceholder(/Search|Find user/i);
  await searchInput.fill('henrietta');
  await page.waitForTimeout(1000);
  
  const userOption = page.getByRole('option').first();
  if (await userOption.isVisible()) {
    await userOption.click();
    await page.waitForTimeout(1000); // Wait for user to be added
  }

  // Step 1: Two owners exist
  await test.step('Two owners exist.', async () => {
    // Verify we have two owners in the list
    const ownerItems = ownersSection.locator('[role="listitem"]');
    const count = await ownerItems.count();
    expect(count).toBe(2);
  });

  // Step 2: Remove first owner
  await test.step('Remove first owner.', async () => {
    // Find and click remove button for first owner
    const firstOwnerItem = ownersSection.locator('[role="listitem"]').first();
    const removeButton = firstOwnerItem.getByRole('button', { name: /Remove|Delete|×/i });
    await removeButton.click();
    
    // Confirm removal if dialog appears
    const confirmButton = page.getByRole('button', { name: /Confirm|Yes|Remove/i });
    if (await confirmButton.isVisible({ timeout: 2000 })) {
      await confirmButton.click();
    }
    
    // Verify owner was removed
    await page.waitForTimeout(1000);
    const remainingOwners = await ownersSection.locator('[role="listitem"]').count();
    expect(remainingOwners).toBe(1);
  });

  // Step 3: Try remove last owner
  await test.step('Try remove last owner.', async () => {
    // Attempt to remove the last remaining owner
    const lastOwnerItem = ownersSection.locator('[role="listitem"]').first();
    const removeButton = lastOwnerItem.getByRole('button', { name: /Remove|Delete|×/i });
    
    // Button might be disabled or clicking it shows error
    if (await removeButton.isEnabled()) {
      await removeButton.click();
    }
  });

  // Step 4: Error shown
  await test.step('Error shown.', async () => {
    // Verify error message appears
    await expect(page.getByText(/Cannot remove last owner|At least one owner required|Must have at least one owner/i)).toBeVisible();
  });

  // Step 5: One required (SC)
  await test.step('One required (SC)', async () => {
    // Verify minimum owner requirement is enforced
    const errorMessage = page.getByText(/Cannot remove last owner|At least one owner required|Must have at least one owner/i);
    await expect(errorMessage).toBeVisible();
    
    // Verify we still have one owner
    const ownerCount = await ownersSection.locator('[role="listitem"]').count();
    expect(ownerCount).toBe(1);
    
    // Take screenshot showing the minimum owner requirement
    const timestamp = new Date();
    const formattedTimestamp = `${timestamp.getFullYear()}.${String(timestamp.getMonth() + 1).padStart(2, '0')}.${String(timestamp.getDate()).padStart(2, '0')}-${String(timestamp.getHours()).padStart(2, '0')}.${String(timestamp.getMinutes()).padStart(2, '0')}.${String(timestamp.getSeconds()).padStart(2, '0')}`;
    await page.screenshot({ 
      path: getScreenshotPath(`TS.7.4.6-03-5-${formattedTimestamp}.png`) 
    });
  });

  // Expected Results:
  // 1. Two present ✓
  // 2. First removed ✓
  // 3. Last remove attempted ✓
  // 4. "Cannot remove last" ✓
  // 5. Minimum enforced ✓
});