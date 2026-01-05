import { test, expect } from '@playwright/test';
import { getScreenshotPath } from '../../utils/paths';
import dotenv from 'dotenv';
import { microsoftLogin } from '../../utils/msLogin';
import { handleERSDDialog } from '../../utils/ersd-handler';

dotenv.config({ path: '.playwright.env' });

test.use({
  viewport: { height: 1080, width: 1920 },
  ignoreHTTPSErrors: true
});

test.setTimeout(180000); // 3 minutes

test('TS.7.3-02 Role Based Creation', async ({ page, context }) => {
  // Create a document with Diego first
  const diegoEmail = process.env.MS_EMAIL_MSPM36_DIEGO_SICILIANI!;
  const password = process.env.MS_PASSWORD!;
  
  await microsoftLogin(page, diegoEmail, password);
  await handleERSDDialog(page);
  
  // Create a document
  await page.goto('/documents');
  await page.waitForLoadState('networkidle');
  await page.getByTestId('lsb.nav-main.documents-newDocument').click();
  await page.getByTestId('createDocumentDialog.documentNameInput').fill('Role Based Copy Test Document');
  await page.getByTestId('createDocumentDialog.createButton').click();
  await page.waitForURL(/.*\/editor\/.*/, { timeout: 10000 });
  
  const documentUrl = page.url();
  const documentId = documentUrl.split('/').pop();

  // Step 1: Login as Johanna (Collaborator)
  await test.step('Login as Johanna (Collaborator).', async () => {
    // Open new page for Johanna
    const johannaPage = await context.newPage();
    const johannaEmail = process.env.MS_EMAIL_17NJ5D_JOHANNA_MURRAY!;
    
    await microsoftLogin(johannaPage, johannaEmail, password);
    await handleERSDDialog(johannaPage);
    
    // Navigate to the document
    await johannaPage.goto(documentUrl);
    await johannaPage.waitForLoadState('networkidle');
    
    // Store page reference for next steps
    page.johannaPage = johannaPage;
  });

  // Step 2: No copy option
  await test.step('No copy option.', async () => {
    const johannaPage = page.johannaPage;
    // Look for copy button - it should not be visible for Collaborator
    const copyButton = johannaPage.getByRole('button', { name: /Create Controlled Copy|Copy Document/i });
    await expect(copyButton).not.toBeVisible({ timeout: 5000 });
  });

  // Step 3: Login as Diego (Creator)
  await test.step('Login as Diego (Creator).', async () => {
    // Switch back to Diego's page
    await page.bringToFront();
    await page.reload();
    await page.waitForLoadState('networkidle');
  });

  // Step 4: Copy button visible
  await test.step('Copy button visible.', async () => {
    // Verify copy button is visible for Creator
    const copyButton = page.getByRole('button', { name: /Create Controlled Copy|Copy Document/i });
    await expect(copyButton).toBeVisible();
  });

  // Step 5: Role restricted (SC)
  await test.step('Role restricted (SC)', async () => {
    // Take screenshot showing copy button for Creator
    const timestamp = new Date();
    const formattedTimestamp = `${timestamp.getFullYear()}.${String(timestamp.getMonth() + 1).padStart(2, '0')}.${String(timestamp.getDate()).padStart(2, '0')}-${String(timestamp.getHours()).padStart(2, '0')}.${String(timestamp.getMinutes()).padStart(2, '0')}.${String(timestamp.getSeconds()).padStart(2, '0')}`;
    await page.screenshot({ 
      path: getScreenshotPath(`TS.7.3-02-5-${formattedTimestamp}.png`) 
    });
    
    // Close Johanna's page
    if (page.johannaPage) {
      await page.johannaPage.close();
    }
  });

  // Expected Results:
  // 1. Collaborator login ✓
  // 2. Button hidden ✓
  // 3. Creator login ✓
  // 4. Button shown ✓
  // 5. Permission enforced ✓
});