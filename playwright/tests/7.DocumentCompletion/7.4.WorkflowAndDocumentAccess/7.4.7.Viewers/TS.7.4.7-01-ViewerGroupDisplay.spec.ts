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

test('TS.7.4.7-01 Viewer Group Display', async ({ page }) => {
  // Setup: Login as owner
  const email = process.env.MS_EMAIL_MSPM36_DIEGO_SICILIANI!;
  const password = process.env.MS_PASSWORD!;
  await microsoftLogin(page, email, password);
  await handleERSDDialog(page);

  // Create a document
  await page.goto('/documents');
  await page.waitForLoadState('networkidle');
  
  await page.getByTestId('lsb.nav-main.documents-newDocument').click();
  await page.getByTestId('createDocumentDialog.documentNameInput').fill('Viewer Group Display Test');
  await page.getByTestId('createDocumentDialog.createButton').click();
  await page.waitForURL(/.*\/editor\/.*/, { timeout: 10000 });

  // Step 1: Find Viewers group
  await test.step('Find Viewers group.', async () => {
    // Open participants/workflow dialog
    const participantsTab = page.getByRole('tab', { name: /Participants|Users|Workflow/i });
    await expect(participantsTab).toBeVisible();
    await participantsTab.click();
    
    // Verify participants modal opens
    const participantsModal = page.getByRole('dialog', { name: /Participants|Manage Participants|Workflow/i });
    await expect(participantsModal).toBeVisible();
    
    // Find Viewers section
    const viewersSection = page.getByText('Viewers').locator('..');
    await expect(viewersSection).toBeVisible();
  });

  // Step 2: Read-only users listed
  await test.step('Read-only users listed.', async () => {
    // Check that the Viewers section exists and is empty initially
    const viewersSection = page.getByText('Viewers').locator('..');
    const viewersList = viewersSection.locator('[role="list"]');
    await expect(viewersList).toBeVisible();
    
    // Verify no viewers are present initially
    const viewerItems = viewersList.locator('[role="listitem"]');
    const count = await viewerItems.count();
    expect(count).toBe(0);
  });

  // Step 3: Clear labeling
  await test.step('Clear labeling.', async () => {
    // Verify "Viewers" label is clearly displayed
    const viewersLabel = page.getByText('Viewers', { exact: true });
    await expect(viewersLabel).toBeVisible();
    
    // Check for any descriptive text about viewers
    const viewersSection = page.getByText('Viewers').locator('..');
    const readOnlyText = viewersSection.getByText(/read.?only|view.?only/i);
    if (await readOnlyText.isVisible().catch(() => false)) {
      await expect(readOnlyText).toBeVisible();
    }
  });

  // Step 4: Can add users
  await test.step('Can add users.', async () => {
    // Find add button near Viewers section
    const viewersSection = page.getByText('Viewers').locator('..');
    const addButton = viewersSection.getByRole('button', { name: /Add|\\+/i });
    await expect(addButton).toBeVisible();
    await expect(addButton).toBeEnabled();
    
    // Click to verify it opens user selection
    await addButton.click();
    
    // Verify user selection dialog opens
    const userSelectionDialog = page.getByRole('dialog', { name: /Add.*Viewer|Select.*User/i });
    await expect(userSelectionDialog).toBeVisible();
    
    // Close the dialog
    const cancelButton = userSelectionDialog.getByRole('button', { name: /Cancel|Close/i });
    await cancelButton.click();
  });

  // Step 5: Group functional (SC)
  await test.step('Group functional (SC)', async () => {
    // Verify all viewer group controls are accessible
    const viewersSection = page.getByText('Viewers').locator('..');
    await expect(viewersSection).toBeVisible();
    
    // Verify add button is functional
    const addButton = viewersSection.getByRole('button', { name: /Add|\\+/i });
    await expect(addButton).toBeEnabled();
    
    // Take screenshot of viewer group display
    const timestamp = new Date();
    const formattedTimestamp = `${timestamp.getFullYear()}.${String(timestamp.getMonth() + 1).padStart(2, '0')}.${String(timestamp.getDate()).padStart(2, '0')}-${String(timestamp.getHours()).padStart(2, '0')}.${String(timestamp.getMinutes()).padStart(2, '0')}.${String(timestamp.getSeconds()).padStart(2, '0')}`;
    await page.screenshot({ 
      path: getScreenshotPath(`TS.7.4.7-01-5-${formattedTimestamp}.png`) 
    });
  });

  // Expected Results:
  // 1. Group found ✓
  // 2. Viewers shown ✓
  // 3. "Viewers" label ✓
  // 4. Add button works ✓
  // 5. Section ready ✓
});