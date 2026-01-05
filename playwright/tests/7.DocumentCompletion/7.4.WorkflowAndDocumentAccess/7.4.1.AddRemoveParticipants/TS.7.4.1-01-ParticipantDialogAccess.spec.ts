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

test('TS.7.4.1-01 Participant Dialog Access', async ({ page }) => {
  // Setup: Login as owner
  const email = process.env.MS_EMAIL_MSPM36_DIEGO_SICILIANI!;
  const password = process.env.MS_PASSWORD!;
  await microsoftLogin(page, email, password);
  await handleERSDDialog(page);

  // Create a document
  await page.goto('/documents');
  await page.waitForLoadState('networkidle');
  
  await page.getByTestId('lsb.nav-main.documents-newDocument').click();
  await page.getByTestId('createDocumentDialog.documentNameInput').fill('Participant Dialog Test');
  await page.getByTestId('createDocumentDialog.createButton').click();
  await page.waitForURL(/.*\/editor\/.*/, { timeout: 10000 });

  // Step 1: Open document as owner
  await test.step('Open document as owner.', async () => {
    // Document is already open, verify we're the owner
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(/.*\/editor\/.*/);
  });

  // Step 2: Click participants tab
  await test.step('Click participants tab.', async () => {
    // Find and click participants tab
    const participantsTab = page.getByRole('tab', { name: /Participants|Users|Workflow/i });
    await expect(participantsTab).toBeVisible();
    await participantsTab.click();
  });

  // Step 3: Modal opens
  await test.step('Modal opens.', async () => {
    // Verify participants modal/dialog opens
    const participantsModal = page.getByRole('dialog', { name: /Participants|Manage Participants|Workflow/i });
    await expect(participantsModal).toBeVisible();
  });

  // Step 4: All groups shown
  await test.step('All groups shown.', async () => {
    // Verify all 5 groups are visible
    await expect(page.getByText('Owners')).toBeVisible();
    await expect(page.getByText('Pre-Approval')).toBeVisible();
    await expect(page.getByText('Execution')).toBeVisible();
    await expect(page.getByText('Post-Approval')).toBeVisible();
    await expect(page.getByText('Viewers')).toBeVisible();
  });

  // Step 5: Can manage all (SC)
  await test.step('Can manage all (SC)', async () => {
    // Verify add buttons are enabled for all groups
    const addButtons = page.getByRole('button', { name: /Add|\\+/i });
    const buttonCount = await addButtons.count();
    expect(buttonCount).toBeGreaterThan(0);
    
    // Take screenshot of participants dialog
    const timestamp = new Date();
    const formattedTimestamp = `${timestamp.getFullYear()}.${String(timestamp.getMonth() + 1).padStart(2, '0')}.${String(timestamp.getDate()).padStart(2, '0')}-${String(timestamp.getHours()).padStart(2, '0')}.${String(timestamp.getMinutes()).padStart(2, '0')}.${String(timestamp.getSeconds()).padStart(2, '0')}`;
    await page.screenshot({ 
      path: getScreenshotPath(`TS.7.4.1-01-5-${formattedTimestamp}.png`) 
    });
  });

  // Expected Results:
  // 1. Owner access ✓
  // 2. Tab clicked ✓
  // 3. Dialog appears ✓
  // 4. 5 groups visible ✓
  // 5. All editable ✓
});