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

test('TS.7.5.1-01 Owner Only Access', async ({ page, context }) => {
  // Setup: Create document as owner
  const diegoEmail = process.env.MS_EMAIL_MSPM36_DIEGO_SICILIANI!;
  const password = process.env.MS_PASSWORD!;
  await microsoftLogin(page, diegoEmail, password);
  await handleERSDDialog(page);

  // Create a document
  await page.goto('/documents');
  await page.waitForLoadState('networkidle');
  
  await page.getByTestId('lsb.nav-main.documents-newDocument').click();
  await page.getByTestId('createDocumentDialog.documentNameInput').fill('Delete Void Access Test');
  await page.getByTestId('createDocumentDialog.createButton').click();
  await page.waitForURL(/.*\/editor\/.*/, { timeout: 10000 });

  const documentUrl = page.url();

  // Step 1: Open doc as owner
  await test.step('Open doc as owner.', async () => {
    // Document is already open as owner
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(/.*\/editor\/.*/);
  });

  // Step 2: See Delete/Void button
  await test.step('See Delete/Void button.', async () => {
    // Look for Delete or Void button (initially Delete for empty doc)
    const deleteButton = page.getByRole('button', { name: /Delete|Void/i });
    await expect(deleteButton).toBeVisible();
    
    // Verify it shows "Delete" for empty document
    await expect(page.getByRole('button', { name: /Delete/i })).toBeVisible();
  });

  // Add Johanna as participant and open document as her
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

  // Step 3: Open as participant
  await test.step('Open as participant.', async () => {
    // Open new page for Johanna (participant)
    const johannaPage = await context.newPage();
    const johannaEmail = process.env.MS_EMAIL_17NJ5D_JOHANNA_MURRAY!;
    
    await microsoftLogin(johannaPage, johannaEmail, password);
    await handleERSDDialog(johannaPage);
    
    // Navigate to the document
    await johannaPage.goto(documentUrl);
    await johannaPage.waitForLoadState('networkidle');
    
    page.johannaPage = johannaPage;
  });

  // Step 4: No button shown
  await test.step('No button shown.', async () => {
    const johannaPage = page.johannaPage;
    
    // Verify Delete/Void button is not visible for participant
    const deleteButton = johannaPage.getByRole('button', { name: /Delete|Void/i });
    await expect(deleteButton).not.toBeVisible();
  });

  // Step 5: Owner restricted (SC)
  await test.step('Owner restricted (SC)', async () => {
    const johannaPage = page.johannaPage;
    
    // Take screenshot showing absence of Delete/Void button for participant
    const timestamp = new Date();
    const formattedTimestamp = `${timestamp.getFullYear()}.${String(timestamp.getMonth() + 1).padStart(2, '0')}.${String(timestamp.getDate()).padStart(2, '0')}-${String(timestamp.getHours()).padStart(2, '0')}.${String(timestamp.getMinutes()).padStart(2, '0')}.${String(timestamp.getSeconds()).padStart(2, '0')}`;
    await johannaPage.screenshot({ 
      path: getScreenshotPath(`TS.7.5.1-01-5-${formattedTimestamp}.png`) 
    });
    
    await johannaPage.close();
  });

  // Expected Results:
  // 1. Owner view ✓
  // 2. Button visible ✓
  // 3. Participant view ✓
  // 4. Button hidden ✓
  // 5. Access controlled ✓
});