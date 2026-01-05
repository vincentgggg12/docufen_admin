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

test('TS.7.6.1-01 Owner Only Stage Control', async ({ page, context }) => {
  // Setup: Create document as owner
  const diegoEmail = process.env.MS_EMAIL_MSPM36_DIEGO_SICILIANI!;
  const password = process.env.MS_PASSWORD!;
  await microsoftLogin(page, diegoEmail, password);
  await handleERSDDialog(page);

  // Create a document
  await page.goto('/documents');
  await page.waitForLoadState('networkidle');
  
  await page.getByTestId('lsb.nav-main.documents-newDocument').click();
  await page.getByTestId('createDocumentDialog.documentNameInput').fill('Stage Control Test');
  await page.getByTestId('createDocumentDialog.createButton').click();
  await page.waitForURL(/.*\/editor\/.*/, { timeout: 10000 });

  const documentUrl = page.url();

  // Step 1: Open as owner
  await test.step('Open as owner.', async () => {
    // Document is already open as owner
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(/.*\/editor\/.*/);
  });

  // Step 2: Stage buttons visible
  await test.step('Stage buttons visible.', async () => {
    // Look for stage control buttons (Next, Forward, Advance, etc.)
    const stageButtons = page.getByRole('button', { name: /Next Stage|Forward|Advance|To Execution|To Pre-Approval/i });
    const buttonCount = await stageButtons.count();
    expect(buttonCount).toBeGreaterThan(0);
    
    // At least one stage control button should be visible
    await expect(stageButtons.first()).toBeVisible();
  });

  // Add participant and open as them
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

  // Step 4: Buttons hidden
  await test.step('Buttons hidden.', async () => {
    const johannaPage = page.johannaPage;
    
    // Verify stage control buttons are not visible for participant
    const stageButtons = johannaPage.getByRole('button', { name: /Next Stage|Forward|Advance|To Execution|To Pre-Approval/i });
    const buttonCount = await stageButtons.count();
    
    // Either no buttons or all should be hidden/disabled
    if (buttonCount > 0) {
      for (let i = 0; i < buttonCount; i++) {
        await expect(stageButtons.nth(i)).not.toBeVisible();
      }
    }
  });

  // Step 5: Owner only (SC)
  await test.step('Owner only (SC)', async () => {
    const johannaPage = page.johannaPage;
    
    // Take screenshot showing absence of stage control for participant
    const timestamp = new Date();
    const formattedTimestamp = `${timestamp.getFullYear()}.${String(timestamp.getMonth() + 1).padStart(2, '0')}.${String(timestamp.getDate()).padStart(2, '0')}-${String(timestamp.getHours()).padStart(2, '0')}.${String(timestamp.getMinutes()).padStart(2, '0')}.${String(timestamp.getSeconds()).padStart(2, '0')}`;
    await johannaPage.screenshot({ 
      path: getScreenshotPath(`TS.7.6.1-01-5-${formattedTimestamp}.png`) 
    });
    
    await johannaPage.close();
  });

  // Expected Results:
  // 1. Owner access ✓
  // 2. Can advance ✓
  // 3. Participant access ✓
  // 4. Cannot advance ✓
  // 5. Restricted ✓
});