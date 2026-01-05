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

test('TS.7.4.7-05 Viewer Restrictions', async ({ page, context }) => {
  // Setup: Login as owner first to create document and add viewer
  const ownerEmail = process.env.MS_EMAIL_MSPM36_DIEGO_SICILIANI!;
  const ownerPassword = process.env.MS_PASSWORD!;
  await microsoftLogin(page, ownerEmail, ownerPassword);
  await handleERSDDialog(page);

  // Create a document
  await page.goto('/documents');
  await page.waitForLoadState('networkidle');
  
  await page.getByTestId('lsb.nav-main.documents-newDocument').click();
  await page.getByTestId('createDocumentDialog.documentNameInput').fill('Viewer Restrictions Test');
  await page.getByTestId('createDocumentDialog.createButton').click();
  await page.waitForURL(/.*\/editor\/.*/, { timeout: 10000 });

  // Add some content
  await page.getByRole('textbox', { name: /editor|document/i }).click();
  await page.keyboard.type('This document tests viewer restrictions.');
  await page.waitForTimeout(1000);

  // Get document URL
  const documentUrl = page.url();

  // Add a viewer
  const participantsTab = page.getByRole('tab', { name: /Participants|Users|Workflow/i });
  await participantsTab.click();
  
  const participantsModal = page.getByRole('dialog', { name: /Participants|Manage Participants|Workflow/i });
  await expect(participantsModal).toBeVisible();

  const viewersSection = page.getByText('Viewers').locator('..');
  const addButton = viewersSection.getByRole('button', { name: /Add|\\+/i });
  await addButton.click();

  const userSelectionDialog = page.getByRole('dialog', { name: /Add.*Viewer|Select.*User/i });
  const searchInput = userSelectionDialog.getByRole('textbox', { name: /Search|Find/i });
  await searchInput.fill('Adriana');
  await page.waitForTimeout(500);

  const userOption = userSelectionDialog.getByText(/Adriana.*Terzaghi/i);
  await userOption.click();

  const confirmButton = userSelectionDialog.getByRole('button', { name: /Add|Confirm|OK/i });
  await confirmButton.click();

  // Close modal
  const closeButton = participantsModal.getByRole('button', { name: /Close|×/i });
  await closeButton.click();

  // Open new page for viewer
  const viewerPage = await context.newPage();

  // Step 1: Login as viewer
  await test.step('Login as viewer.', async () => {
    const viewerEmail = process.env.MS_EMAIL_MSPM26_ADRIANA_TERZAGHI!;
    const viewerPassword = process.env.MS_PASSWORD!;
    
    await microsoftLogin(viewerPage, viewerEmail, viewerPassword);
    await handleERSDDialog(viewerPage);
  });

  // Step 2: Open document
  await test.step('Open document.', async () => {
    await viewerPage.goto(documentUrl);
    await viewerPage.waitForLoadState('networkidle');
    
    // Verify document loaded
    await expect(viewerPage.getByText('This document tests viewer restrictions.')).toBeVisible();
    
    // Check for viewer indicator
    const viewerIndicator = viewerPage.getByText(/Viewer|View.?only|Read.?only/i);
    await expect(viewerIndicator).toBeVisible();
  });

  // Step 3: Try to edit
  await test.step('Try to edit.', async () => {
    // Try clicking on the editor
    const editor = viewerPage.getByRole('textbox', { name: /editor|document/i });
    await editor.click();
    
    // Try typing
    await viewerPage.keyboard.type('This should not appear');
    await viewerPage.waitForTimeout(1000);
    
    // Verify text was not added
    await expect(viewerPage.getByText('This should not appear')).not.toBeVisible();
    
    // Check if edit buttons are disabled
    const editButton = viewerPage.getByRole('button', { name: /Edit/i });
    if (await editButton.isVisible().catch(() => false)) {
      await expect(editButton).toBeDisabled();
    }
  });

  // Step 4: Try to sign
  await test.step('Try to sign.', async () => {
    // Look for sign button
    const signButton = viewerPage.getByRole('button', { name: /Sign/i });
    
    if (await signButton.isVisible().catch(() => false)) {
      // If visible, it should be disabled
      await expect(signButton).toBeDisabled();
      
      // Try clicking anyway
      await signButton.click({ force: true }).catch(() => {});
      
      // Verify no signature dialog opens
      const signDialog = viewerPage.getByRole('dialog', { name: /Sign/i });
      await expect(signDialog).not.toBeVisible();
    } else {
      // Sign button should not be visible at all for viewers
      await expect(signButton).not.toBeVisible();
    }
    
    // Check participants/workflow tab
    const workflowTab = viewerPage.getByRole('tab', { name: /Participants|Users|Workflow/i });
    if (await workflowTab.isVisible().catch(() => false)) {
      await workflowTab.click();
      
      // Should not see sign options in participants dialog
      const modal = viewerPage.getByRole('dialog', { name: /Participants|Manage Participants|Workflow/i });
      if (await modal.isVisible().catch(() => false)) {
        const modalSignButton = modal.getByRole('button', { name: /Sign/i });
        if (await modalSignButton.isVisible().catch(() => false)) {
          await expect(modalSignButton).toBeDisabled();
        }
      }
    }
  });

  // Step 5: All disabled (SC)
  await test.step('All disabled (SC)', async () => {
    // Verify all editing capabilities are blocked
    // Check for any enabled action buttons
    const actionButtons = viewerPage.getByRole('button', { name: /Sign|Text|Edit|Delete|Void/i });
    const count = await actionButtons.count();
    
    for (let i = 0; i < count; i++) {
      const button = actionButtons.nth(i);
      if (await button.isVisible()) {
        // Should be disabled
        await expect(button).toBeDisabled();
      }
    }
    
    // Verify read-only mode is enforced
    const readOnlyBadge = viewerPage.getByText(/Viewer|View.?only|Read.?only/i).first();
    await expect(readOnlyBadge).toBeVisible();
    
    // Take screenshot showing all restrictions
    const timestamp = new Date();
    const formattedTimestamp = `${timestamp.getFullYear()}.${String(timestamp.getMonth() + 1).padStart(2, '0')}.${String(timestamp.getDate()).padStart(2, '0')}-${String(timestamp.getHours()).padStart(2, '0')}.${String(timestamp.getMinutes()).padStart(2, '0')}.${String(timestamp.getSeconds()).padStart(2, '0')}`;
    await viewerPage.screenshot({ 
      path: getScreenshotPath(`TS.7.4.7-05-5-${formattedTimestamp}.png`) 
    });
  });

  // Cleanup
  await viewerPage.close();

  // Expected Results:
  // 1. Viewer logged in ✓
  // 2. Doc opened ✓
  // 3. Edit blocked ✓
  // 4. Sign blocked ✓
  // 5. Read-only confirmed ✓
});