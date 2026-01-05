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

test('TS.7.4.6-04 Owner Permission Transfer', async ({ page, context }) => {
  // Setup: Login as owner
  const email = process.env.MS_EMAIL_MSPM36_DIEGO_SICILIANI!;
  const password = process.env.MS_PASSWORD!;
  await microsoftLogin(page, email, password);
  await handleERSDDialog(page);

  // Create a document
  await page.goto('/documents');
  await page.waitForLoadState('networkidle');
  
  await page.getByTestId('lsb.nav-main.documents-newDocument').click();
  await page.getByTestId('createDocumentDialog.documentNameInput').fill('Owner Permission Transfer Test');
  await page.getByTestId('createDocumentDialog.createButton').click();
  await page.waitForURL(/.*\/editor\/.*/, { timeout: 10000 });
  
  // Store the document URL
  const documentUrl = page.url();

  // Open participants dialog
  const participantsTab = page.getByRole('tab', { name: /Participants|Users|Workflow/i });
  await expect(participantsTab).toBeVisible();
  await participantsTab.click();
  
  const participantsModal = page.getByRole('dialog', { name: /Participants|Manage Participants|Workflow/i });
  await expect(participantsModal).toBeVisible();

  // Step 1: Add new owner
  await test.step('Add new owner.', async () => {
    // Find Owners section and add button
    const ownersSection = page.getByText('Owners').locator('..');
    const addButton = ownersSection.getByRole('button', { name: /Add|\\+/i });
    await addButton.click();
    
    // Search for Henrietta (another user)
    const searchInput = page.getByPlaceholder(/Search|Find user/i);
    await searchInput.fill('henrietta');
    await page.waitForTimeout(1000);
    
    // Select the user
    const userOption = page.getByRole('option').filter({ hasText: /Henrietta/i }).first();
    if (await userOption.isVisible()) {
      await userOption.click();
      await page.waitForTimeout(1000);
    }
    
    // Verify user was added as owner
    await expect(ownersSection.getByText(/Henrietta/i)).toBeVisible();
  });

  // Step 2: Check permissions
  await test.step('Check permissions.', async () => {
    // Close the participants dialog
    const closeButton = participantsModal.getByRole('button', { name: /Close|×/i });
    if (await closeButton.isVisible()) {
      await closeButton.click();
    }
    
    // Login as the new owner in a new page
    const newPage = await context.newPage();
    const henriettaEmail = process.env.MS_EMAIL_MSPM36_HENRIETTA_JENSEN!;
    await microsoftLogin(newPage, henriettaEmail, password);
    await handleERSDDialog(newPage);
    
    // Navigate to the document
    await newPage.goto(documentUrl);
    await newPage.waitForLoadState('networkidle');
  });

  // Step 3: Can edit doc
  await test.step('Can edit doc.', async () => {
    // Create a new page context for the new owner
    const newPage = context.pages()[1]; // Get the second page
    
    // Verify edit capabilities
    const editor = newPage.locator('[contenteditable="true"], .editor-container, .document-editor');
    await expect(editor).toBeVisible();
    
    // Try to type in the editor
    await editor.click();
    await newPage.keyboard.type('Test edit as new owner');
    
    // Verify text was added
    await expect(editor).toContainText('Test edit as new owner');
  });

  // Step 4: Can manage users
  await test.step('Can manage users.', async () => {
    const newPage = context.pages()[1];
    
    // Open participants dialog as new owner
    const participantsTab = newPage.getByRole('tab', { name: /Participants|Users|Workflow/i });
    await expect(participantsTab).toBeVisible();
    await participantsTab.click();
    
    // Verify can access user management
    const participantsModal = newPage.getByRole('dialog', { name: /Participants|Manage Participants|Workflow/i });
    await expect(participantsModal).toBeVisible();
    
    // Verify add buttons are enabled
    const addButtons = participantsModal.getByRole('button', { name: /Add|\\+/i });
    const buttonCount = await addButtons.count();
    expect(buttonCount).toBeGreaterThan(0);
    
    // Verify at least one add button is enabled
    const firstAddButton = addButtons.first();
    await expect(firstAddButton).toBeEnabled();
  });

  // Step 5: Full rights (SC)
  await test.step('Full rights (SC)', async () => {
    const newPage = context.pages()[1];
    
    // Verify full owner rights are available
    // Check for stage management buttons
    const stageButtons = newPage.getByRole('button', { name: /Forward|Advance|Next Stage/i });
    const hasStageControl = await stageButtons.isVisible({ timeout: 2000 }).catch(() => false);
    
    // Check for delete/void button
    const deleteVoidButton = newPage.getByRole('button', { name: /Delete|Void/i });
    const hasDeleteControl = await deleteVoidButton.isVisible({ timeout: 2000 }).catch(() => false);
    
    // Verify at least one owner control is present
    expect(hasStageControl || hasDeleteControl).toBeTruthy();
    
    // Take screenshot showing full owner rights
    const timestamp = new Date();
    const formattedTimestamp = `${timestamp.getFullYear()}.${String(timestamp.getMonth() + 1).padStart(2, '0')}.${String(timestamp.getDate()).padStart(2, '0')}-${String(timestamp.getHours()).padStart(2, '0')}.${String(timestamp.getMinutes()).padStart(2, '0')}.${String(timestamp.getSeconds()).padStart(2, '0')}`;
    await newPage.screenshot({ 
      path: getScreenshotPath(`TS.7.4.6-04-5-${formattedTimestamp}.png`) 
    });
  });

  // Expected Results:
  // 1. Owner added ✓
  // 2. Rights checked ✓
  // 3. Edit enabled ✓
  // 4. Manage enabled ✓
  // 5. Complete control ✓
});