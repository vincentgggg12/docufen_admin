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

test('TS.7.12.1-01 Owner Only Re-Open', async ({ page, context }) => {
  // Setup: Create and finalize a document as owner
  const diegoEmail = process.env.MS_EMAIL_MSPM36_DIEGO_SICILIANI!;
  const password = process.env.MS_PASSWORD!;
  await microsoftLogin(page, diegoEmail, password);
  await handleERSDDialog(page);

  // Create a document
  await page.goto('/documents');
  await page.waitForLoadState('networkidle');
  
  await page.getByTestId('lsb.nav-main.documents-newDocument').click();
  await page.getByTestId('createDocumentDialog.documentNameInput').fill('Re-Open Test Document');
  await page.getByTestId('createDocumentDialog.createButton').click();
  await page.waitForURL(/.*\/editor\/.*/, { timeout: 10000 });

  const documentUrl = page.url();

  // Add some content and finalize the document
  await page.getByRole('button', { name: /Sign/i }).first().click();
  await page.getByRole('option', { name: /Author/i }).click();
  await page.getByRole('button', { name: /Apply/i }).click();
  await page.waitForTimeout(2000);

  // Move through stages to finalize
  await page.getByRole('button', { name: /To Execution/i }).click();
  await page.waitForTimeout(2000);
  await page.getByRole('button', { name: /To Post-Approval/i }).click();
  await page.waitForTimeout(2000);
  await page.getByRole('button', { name: /Finalise/i }).click();
  await page.waitForTimeout(3000);

  // Step 1: Non-owner views finalized.
  await test.step('Non-owner views finalized.', async () => {
    // Open new page for Johanna (non-owner)
    const johannaPage = await context.newPage();
    const johannaEmail = process.env.MS_EMAIL_17NJ5D_JOHANNA_MURRAY!;
    
    await microsoftLogin(johannaPage, johannaEmail, password);
    await handleERSDDialog(johannaPage);
    
    // Navigate to the finalized document
    await johannaPage.goto(documentUrl);
    await johannaPage.waitForLoadState('networkidle');
    
    page.johannaPage = johannaPage;
  });

  // Step 2: No re-open button.
  await test.step('No re-open button.', async () => {
    const johannaPage = page.johannaPage;
    
    // Verify re-open button is not visible for non-owner
    const reopenButton = johannaPage.getByRole('button', { name: /Re-open/i });
    await expect(reopenButton).not.toBeVisible();
  });

  // Step 3: Owner views.
  await test.step('Owner views.', async () => {
    // Switch back to owner's page
    await page.bringToFront();
    await page.reload();
    await page.waitForLoadState('networkidle');
  });

  // Step 4: Re-open visible.
  await test.step('Re-open visible.', async () => {
    // Verify re-open button is visible for owner
    const reopenButton = page.getByRole('button', { name: /Re-open/i });
    await expect(reopenButton).toBeVisible();
  });

  // Step 5: Owner restricted (SC)
  await test.step('Owner restricted (SC)', async () => {
    // Take screenshot showing re-open button visible only for owner
    const timestamp = new Date();
    const formattedTimestamp = `${timestamp.getFullYear()}.${String(timestamp.getMonth() + 1).padStart(2, '0')}.${String(timestamp.getDate()).padStart(2, '0')}-${String(timestamp.getHours()).padStart(2, '0')}.${String(timestamp.getMinutes()).padStart(2, '0')}.${String(timestamp.getSeconds()).padStart(2, '0')}`;
    await page.screenshot({ 
      path: getScreenshotPath(`TS.7.12.1-01-5-${formattedTimestamp}.png`) 
    });
    
    await page.johannaPage.close();
  });

  // Expected Results:
  // 1. Non-owner access ✓
  // 2. Button hidden ✓
  // 3. Owner access ✓
  // 4. Button shown ✓
  // 5. Permission enforced ✓
});