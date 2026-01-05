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

test('TS.7.4.7-04 Viewer Removal', async ({ page, context }) => {
  // Setup: Login as owner
  const ownerEmail = process.env.MS_EMAIL_MSPM36_DIEGO_SICILIANI!;
  const ownerPassword = process.env.MS_PASSWORD!;
  await microsoftLogin(page, ownerEmail, ownerPassword);
  await handleERSDDialog(page);

  // Create a document
  await page.goto('/documents');
  await page.waitForLoadState('networkidle');
  
  await page.getByTestId('lsb.nav-main.documents-newDocument').click();
  await page.getByTestId('createDocumentDialog.documentNameInput').fill('Viewer Removal Test');
  await page.getByTestId('createDocumentDialog.createButton').click();
  await page.waitForURL(/.*\/editor\/.*/, { timeout: 10000 });

  const documentName = 'Viewer Removal Test';

  // First, add a viewer
  const participantsTab = page.getByRole('tab', { name: /Participants|Users|Workflow/i });
  await participantsTab.click();
  
  const participantsModal = page.getByRole('dialog', { name: /Participants|Manage Participants|Workflow/i });
  await expect(participantsModal).toBeVisible();

  // Add a viewer
  const viewersSection = page.getByText('Viewers').locator('..');
  const addButton = viewersSection.getByRole('button', { name: /Add|\\+/i });
  await addButton.click();

  const userSelectionDialog = page.getByRole('dialog', { name: /Add.*Viewer|Select.*User/i });
  const searchInput = userSelectionDialog.getByRole('textbox', { name: /Search|Find/i });
  await searchInput.fill('Belen Lozada');
  await page.waitForTimeout(500);

  const userOption = userSelectionDialog.getByText(/Belen.*Lozada/i);
  await userOption.click();

  const confirmButton = userSelectionDialog.getByRole('button', { name: /Add|Confirm|OK/i });
  await confirmButton.click();

  // Verify viewer was added
  await expect(viewersSection.getByText(/Belen.*Lozada/i)).toBeVisible();

  // Close modal temporarily
  const closeButton = participantsModal.getByRole('button', { name: /Close|×/i });
  await closeButton.click();

  // Step 1: Remove viewer
  await test.step('Remove viewer.', async () => {
    // Re-open participants dialog
    await participantsTab.click();
    const participantsModal2 = page.getByRole('dialog', { name: /Participants|Manage Participants|Workflow/i });
    await expect(participantsModal2).toBeVisible();

    // Find the viewer and remove button
    const viewersSection2 = page.getByText('Viewers').locator('..');
    const viewerItem = viewersSection2.getByText(/Belen.*Lozada/i).locator('..');
    const removeButton = viewerItem.getByRole('button', { name: /Remove|Delete|×/i });
    
    await expect(removeButton).toBeVisible();
    await removeButton.click();
  });

  // Step 2: Confirm removal
  await test.step('Confirm removal.', async () => {
    // Check if confirmation dialog appears
    const confirmDialog = page.getByRole('dialog', { name: /Confirm|Remove/i });
    if (await confirmDialog.isVisible().catch(() => false)) {
      const confirmButton = confirmDialog.getByRole('button', { name: /Confirm|Remove|Yes/i });
      await confirmButton.click();
    }
    
    // Verify viewer is removed from the list
    const viewersSection2 = page.getByText('Viewers').locator('..');
    await expect(viewersSection2.getByText(/Belen.*Lozada/i)).not.toBeVisible();
  });

  // Close the participants modal
  const participantsModal2 = page.getByRole('dialog', { name: /Participants|Manage Participants|Workflow/i });
  const closeButton2 = participantsModal2.getByRole('button', { name: /Close|×/i });
  await closeButton2.click();

  // Step 3: Check user's list
  await test.step("Check user's list.", async () => {
    // Open a new page and login as the removed viewer
    const viewerPage = await context.newPage();
    const viewerEmail = process.env.MS_EMAIL_MSPM20_BELEN_LOZADA!;
    const viewerPassword = process.env.MS_PASSWORD!;
    
    await microsoftLogin(viewerPage, viewerEmail, viewerPassword);
    await handleERSDDialog(viewerPage);
    
    // Navigate to documents list
    await viewerPage.goto('/documents');
    await viewerPage.waitForLoadState('networkidle');
    
    // Search for the document
    const searchInput = viewerPage.getByRole('textbox', { name: /Search/i });
    if (await searchInput.isVisible().catch(() => false)) {
      await searchInput.fill(documentName);
      await viewerPage.waitForTimeout(1000);
    }
    
    // Store page reference for later steps
    page.context().viewerPage = viewerPage;
  });

  // Step 4: Document gone
  await test.step('Document gone.', async () => {
    const viewerPage = page.context().viewerPage;
    
    // Verify document is not visible in the list
    await expect(viewerPage.getByText(documentName, { exact: true })).not.toBeVisible();
    
    // Check if "No documents found" or similar message appears
    const noDocsMessage = viewerPage.getByText(/No documents|No results|Empty/i);
    if (await noDocsMessage.isVisible().catch(() => false)) {
      await expect(noDocsMessage).toBeVisible();
    }
  });

  // Step 5: Access revoked (SC)
  await test.step('Access revoked (SC)', async () => {
    const viewerPage = page.context().viewerPage;
    
    // Try to navigate directly to the document URL
    const documentUrl = page.url();
    await viewerPage.goto(documentUrl);
    await viewerPage.waitForLoadState('networkidle');
    
    // Verify access is denied
    const accessDenied = viewerPage.getByText(/Access denied|Unauthorized|Not found|Permission/i);
    await expect(accessDenied).toBeVisible();
    
    // Take screenshot showing access revoked
    const timestamp = new Date();
    const formattedTimestamp = `${timestamp.getFullYear()}.${String(timestamp.getMonth() + 1).padStart(2, '0')}.${String(timestamp.getDate()).padStart(2, '0')}-${String(timestamp.getHours()).padStart(2, '0')}.${String(timestamp.getMinutes()).padStart(2, '0')}.${String(timestamp.getSeconds()).padStart(2, '0')}`;
    await viewerPage.screenshot({ 
      path: getScreenshotPath(`TS.7.4.7-04-5-${formattedTimestamp}.png`) 
    });
    
    // Close viewer page
    await viewerPage.close();
  });

  // Expected Results:
  // 1. Remove clicked ✓
  // 2. Confirmed ✓
  // 3. List checked ✓
  // 4. Not visible ✓
  // 5. Fully removed ✓
});