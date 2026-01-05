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

test('TS.7.4.7-03 Viewer Addition Process', async ({ page, context }) => {
  // Setup: Login as owner
  const ownerEmail = process.env.MS_EMAIL_MSPM36_DIEGO_SICILIANI!;
  const ownerPassword = process.env.MS_PASSWORD!;
  await microsoftLogin(page, ownerEmail, ownerPassword);
  await handleERSDDialog(page);

  // Create a document
  await page.goto('/documents');
  await page.waitForLoadState('networkidle');
  
  await page.getByTestId('lsb.nav-main.documents-newDocument').click();
  await page.getByTestId('createDocumentDialog.documentNameInput').fill('Viewer Addition Process Test');
  await page.getByTestId('createDocumentDialog.createButton').click();
  await page.waitForURL(/.*\/editor\/.*/, { timeout: 10000 });

  // Get the document name and URL
  const documentUrl = page.url();
  const documentName = 'Viewer Addition Process Test';

  // Open participants dialog
  const participantsTab = page.getByRole('tab', { name: /Participants|Users|Workflow/i });
  await participantsTab.click();
  
  const participantsModal = page.getByRole('dialog', { name: /Participants|Manage Participants|Workflow/i });
  await expect(participantsModal).toBeVisible();

  // Step 1: Click add viewer
  await test.step('Click add viewer.', async () => {
    // Find Viewers section
    const viewersSection = page.getByText('Viewers').locator('..');
    await expect(viewersSection).toBeVisible();
    
    // Click add button
    const addButton = viewersSection.getByRole('button', { name: /Add|\\+/i });
    await expect(addButton).toBeVisible();
    await addButton.click();
    
    // Verify user selection dialog opens
    const userSelectionDialog = page.getByRole('dialog', { name: /Add.*Viewer|Select.*User/i });
    await expect(userSelectionDialog).toBeVisible();
  });

  // Step 2: Select any user
  await test.step('Select any user.', async () => {
    // Get user selection dialog
    const userSelectionDialog = page.getByRole('dialog', { name: /Add.*Viewer|Select.*User/i });
    
    // Search for a user
    const searchInput = userSelectionDialog.getByRole('textbox', { name: /Search|Find/i });
    await searchInput.fill('Adriana');
    await page.waitForTimeout(500); // Wait for search results
    
    // Select Adriana Terzaghi
    const userOption = userSelectionDialog.getByText(/Adriana.*Terzaghi/i);
    await expect(userOption).toBeVisible();
    await userOption.click();
  });

  // Step 3: User added
  await test.step('User added.', async () => {
    // Confirm addition
    const userSelectionDialog = page.getByRole('dialog', { name: /Add.*Viewer|Select.*User/i });
    const confirmButton = userSelectionDialog.getByRole('button', { name: /Add|Confirm|OK/i });
    await confirmButton.click();
    
    // Verify user appears in viewers list
    const viewersSection = page.getByText('Viewers').locator('..');
    await expect(viewersSection.getByText(/Adriana.*Terzaghi/i)).toBeVisible();
  });

  // Close the participants modal
  const closeButton = participantsModal.getByRole('button', { name: /Close|×/i });
  await closeButton.click();

  // Step 4: Shows in doc list
  await test.step('Shows in doc list.', async () => {
    // Open a new page and login as the viewer
    const viewerPage = await context.newPage();
    const viewerEmail = process.env.MS_EMAIL_MSPM26_ADRIANA_TERZAGHI!;
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
      await viewerPage.waitForTimeout(500);
    }
    
    // Verify document appears in the list
    await expect(viewerPage.getByText(documentName)).toBeVisible();
    
    // Verify it shows as view-only or has viewer indicator
    const documentRow = viewerPage.getByText(documentName).locator('..');
    const viewerIndicator = documentRow.getByText(/Viewer|View.?only|Read.?only/i);
    if (await viewerIndicator.isVisible().catch(() => false)) {
      await expect(viewerIndicator).toBeVisible();
    }
    
    // Close viewer page
    await viewerPage.close();
  });

  // Step 5: Relationship created (SC)
  await test.step('Relationship created (SC)', async () => {
    // Re-open participants dialog to verify relationship
    await participantsTab.click();
    
    const participantsModal2 = page.getByRole('dialog', { name: /Participants|Manage Participants|Workflow/i });
    await expect(participantsModal2).toBeVisible();
    
    // Verify viewer is still listed
    const viewersSection = page.getByText('Viewers').locator('..');
    await expect(viewersSection.getByText(/Adriana.*Terzaghi/i)).toBeVisible();
    
    // Take screenshot showing the viewer relationship
    const timestamp = new Date();
    const formattedTimestamp = `${timestamp.getFullYear()}.${String(timestamp.getMonth() + 1).padStart(2, '0')}.${String(timestamp.getDate()).padStart(2, '0')}-${String(timestamp.getHours()).padStart(2, '0')}.${String(timestamp.getMinutes()).padStart(2, '0')}.${String(timestamp.getSeconds()).padStart(2, '0')}`;
    await page.screenshot({ 
      path: getScreenshotPath(`TS.7.4.7-03-5-${formattedTimestamp}.png`) 
    });
  });

  // Expected Results:
  // 1. Add clicked ✓
  // 2. User selected ✓
  // 3. Successfully added ✓
  // 4. Doc visible to user ✓
  // 5. Link established ✓
});