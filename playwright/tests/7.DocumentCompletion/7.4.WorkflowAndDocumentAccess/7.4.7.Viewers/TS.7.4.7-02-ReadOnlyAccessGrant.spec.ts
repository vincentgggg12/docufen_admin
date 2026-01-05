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

test('TS.7.4.7-02 Read Only Access Grant', async ({ page, context }) => {
  // Setup: Login as owner
  const ownerEmail = process.env.MS_EMAIL_MSPM36_DIEGO_SICILIANI!;
  const ownerPassword = process.env.MS_PASSWORD!;
  await microsoftLogin(page, ownerEmail, ownerPassword);
  await handleERSDDialog(page);

  // Create a document with some content
  await page.goto('/documents');
  await page.waitForLoadState('networkidle');
  
  await page.getByTestId('lsb.nav-main.documents-newDocument').click();
  await page.getByTestId('createDocumentDialog.documentNameInput').fill('Read Only Access Test');
  await page.getByTestId('createDocumentDialog.createButton').click();
  await page.waitForURL(/.*\/editor\/.*/, { timeout: 10000 });

  // Add some content to the document
  await page.getByRole('textbox', { name: /editor|document/i }).click();
  await page.keyboard.type('This is test content for read-only verification.');
  await page.waitForTimeout(1000); // Allow content to save

  // Get the document URL
  const documentUrl = page.url();

  // Step 1: Add user as viewer
  await test.step('Add user as viewer.', async () => {
    // Open participants dialog
    const participantsTab = page.getByRole('tab', { name: /Participants|Users|Workflow/i });
    await participantsTab.click();
    
    const participantsModal = page.getByRole('dialog', { name: /Participants|Manage Participants|Workflow/i });
    await expect(participantsModal).toBeVisible();
    
    // Find Viewers section and add button
    const viewersSection = page.getByText('Viewers').locator('..');
    const addButton = viewersSection.getByRole('button', { name: /Add|\\+/i });
    await addButton.click();
    
    // Select a user (using second test user)
    const userSelectionDialog = page.getByRole('dialog', { name: /Add.*Viewer|Select.*User/i });
    await expect(userSelectionDialog).toBeVisible();
    
    // Search for and select Belen Lozada
    const searchInput = userSelectionDialog.getByRole('textbox', { name: /Search|Find/i });
    await searchInput.fill('Belen Lozada');
    await page.waitForTimeout(500); // Wait for search results
    
    const userOption = userSelectionDialog.getByText(/Belen.*Lozada/i);
    await userOption.click();
    
    // Confirm addition
    const confirmButton = userSelectionDialog.getByRole('button', { name: /Add|Confirm|OK/i });
    await confirmButton.click();
    
    // Verify user was added to viewers
    await expect(viewersSection.getByText(/Belen.*Lozada/i)).toBeVisible();
  });

  // Close the participants modal
  const closeButton = page.getByRole('button', { name: /Close|×/i });
  await closeButton.click();

  // Step 2: User opens document (requires second browser context)
  const viewerPage = await context.newPage();
  
  await test.step('User opens document.', async () => {
    // Login as viewer in new page
    const viewerEmail = process.env.MS_EMAIL_MSPM20_BELEN_LOZADA!;
    const viewerPassword = process.env.MS_PASSWORD!;
    await microsoftLogin(viewerPage, viewerEmail, viewerPassword);
    await handleERSDDialog(viewerPage);
    
    // Navigate to the document
    await viewerPage.goto(documentUrl);
    await viewerPage.waitForLoadState('networkidle');
  });

  // Step 3: Can view content
  await test.step('Can view content.', async () => {
    // Verify document loads
    await expect(viewerPage.getByRole('textbox', { name: /editor|document/i })).toBeVisible();
    
    // Verify content is visible
    await expect(viewerPage.getByText('This is test content for read-only verification.')).toBeVisible();
  });

  // Step 4: Cannot edit
  await test.step('Cannot edit.', async () => {
    // Try to click on the editor
    const editor = viewerPage.getByRole('textbox', { name: /editor|document/i });
    await editor.click();
    
    // Try to type
    await viewerPage.keyboard.type('Attempting to edit');
    await viewerPage.waitForTimeout(1000);
    
    // Verify the new text was not added
    await expect(viewerPage.getByText('Attempting to edit')).not.toBeVisible();
    
    // Check for read-only indicators
    const readOnlyIndicator = viewerPage.getByText(/read.?only|view.?only|viewer/i);
    await expect(readOnlyIndicator).toBeVisible();
  });

  // Step 5: Read-only enforced (SC)
  await test.step('Read-only enforced (SC)', async () => {
    // Verify all editing controls are disabled or hidden
    // Check that signature buttons are not available
    const signButton = viewerPage.getByRole('button', { name: /Sign/i });
    if (await signButton.isVisible().catch(() => false)) {
      await expect(signButton).toBeDisabled();
    }
    
    // Check that text entry buttons are not available
    const textButton = viewerPage.getByRole('button', { name: /Text|Add Text/i });
    if (await textButton.isVisible().catch(() => false)) {
      await expect(textButton).toBeDisabled();
    }
    
    // Take screenshot showing read-only view
    const timestamp = new Date();
    const formattedTimestamp = `${timestamp.getFullYear()}.${String(timestamp.getMonth() + 1).padStart(2, '0')}.${String(timestamp.getDate()).padStart(2, '0')}-${String(timestamp.getHours()).padStart(2, '0')}.${String(timestamp.getMinutes()).padStart(2, '0')}.${String(timestamp.getSeconds()).padStart(2, '0')}`;
    await viewerPage.screenshot({ 
      path: getScreenshotPath(`TS.7.4.7-02-5-${formattedTimestamp}.png`) 
    });
  });

  // Cleanup
  await viewerPage.close();

  // Expected Results:
  // 1. Viewer added ✓
  // 2. Document accessed ✓
  // 3. Content visible ✓
  // 4. Edit disabled ✓
  // 5. View only mode ✓
});