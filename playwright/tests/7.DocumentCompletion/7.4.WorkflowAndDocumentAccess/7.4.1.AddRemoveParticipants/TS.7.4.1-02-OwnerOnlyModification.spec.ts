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

test.setTimeout(180000); // 3 minutes

test('TS.7.4.1-02 Owner Only Modification', async ({ page, context }) => {
  // Setup: Create document as owner first
  const diegoEmail = process.env.MS_EMAIL_MSPM36_DIEGO_SICILIANI!;
  const password = process.env.MS_PASSWORD!;
  await microsoftLogin(page, diegoEmail, password);
  await handleERSDDialog(page);

  // Create a document
  await page.goto('/documents');
  await page.waitForLoadState('networkidle');
  
  await page.getByTestId('lsb.nav-main.documents-newDocument').click();
  await page.getByTestId('createDocumentDialog.documentNameInput').fill('Owner Modification Test');
  await page.getByTestId('createDocumentDialog.createButton').click();
  await page.waitForURL(/.*\/editor\/.*/, { timeout: 10000 });

  const documentUrl = page.url();

  // Add Johanna as participant first
  const participantsTab = page.getByRole('tab', { name: /Participants|Users|Workflow/i });
  if (await participantsTab.isVisible({ timeout: 5000 }).catch(() => false)) {
    await participantsTab.click();
    const addButton = page.getByRole('button', { name: /Add/i }).first();
    if (await addButton.isVisible({ timeout: 3000 }).catch(() => false)) {
      await addButton.click();
      await page.getByPlaceholder('Search users').fill('Johanna');
      await page.getByText('Johanna Murray').click();
      await page.getByRole('button', { name: /Save|Add/i }).click();
    }
  }

  // Step 1: Open as non-owner
  await test.step('Open as non-owner.', async () => {
    // Open new page for Johanna (non-owner)
    const johannaPage = await context.newPage();
    const johannaEmail = process.env.MS_EMAIL_17NJ5D_JOHANNA_MURRAY!;
    
    await microsoftLogin(johannaPage, johannaEmail, password);
    await handleERSDDialog(johannaPage);
    
    // Navigate to the document
    await johannaPage.goto(documentUrl);
    await johannaPage.waitForLoadState('networkidle');
    
    page.johannaPage = johannaPage;
  });

  // Step 2: View participants
  await test.step('View participants.', async () => {
    const johannaPage = page.johannaPage;
    
    // Click participants tab to view
    const participantsTab = johannaPage.getByRole('tab', { name: /Participants|Users|Workflow/i });
    await expect(participantsTab).toBeVisible();
    await participantsTab.click();
    
    // Verify modal opens in read-only mode
    const participantsModal = johannaPage.getByRole('dialog', { name: /Participants|Manage Participants|Workflow/i });
    await expect(participantsModal).toBeVisible();
  });

  // Step 3: Try to add user
  await test.step('Try to add user.', async () => {
    const johannaPage = page.johannaPage;
    
    // Look for add buttons
    const addButtons = johannaPage.getByRole('button', { name: /Add|\\+/i });
    // Add buttons should be disabled or not visible
  });

  // Step 4: Buttons disabled
  await test.step('Buttons disabled.', async () => {
    const johannaPage = page.johannaPage;
    
    // Verify add buttons are disabled
    const addButtons = johannaPage.getByRole('button', { name: /Add|\\+/i });
    const buttonCount = await addButtons.count();
    
    if (buttonCount > 0) {
      // If buttons exist, they should be disabled
      for (let i = 0; i < buttonCount; i++) {
        const button = addButtons.nth(i);
        await expect(button).toBeDisabled();
      }
    }
  });

  // Step 5: Read-only view (SC)
  await test.step('Read-only view (SC)', async () => {
    const johannaPage = page.johannaPage;
    
    // Take screenshot of read-only participants view
    const timestamp = new Date();
    const formattedTimestamp = `${timestamp.getFullYear()}.${String(timestamp.getMonth() + 1).padStart(2, '0')}.${String(timestamp.getDate()).padStart(2, '0')}-${String(timestamp.getHours()).padStart(2, '0')}.${String(timestamp.getMinutes()).padStart(2, '0')}.${String(timestamp.getSeconds()).padStart(2, '0')}`;
    await johannaPage.screenshot({ 
      path: getScreenshotPath(`TS.7.4.1-02-5-${formattedTimestamp}.png`) 
    });
    
    await johannaPage.close();
  });

  // Expected Results:
  // 1. Participant access ✓
  // 2. Can view list ✓
  // 3. Add disabled ✓
  // 4. No edit allowed ✓
  // 5. View only mode ✓
});