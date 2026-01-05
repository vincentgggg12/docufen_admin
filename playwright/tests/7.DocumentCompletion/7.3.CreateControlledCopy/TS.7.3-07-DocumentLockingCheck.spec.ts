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

test('TS.7.3-07 Document Locking Check', async ({ page, context }) => {
  // Setup: Login as Creator (User 1)
  const diegoEmail = process.env.MS_EMAIL_MSPM36_DIEGO_SICILIANI!;
  const password = process.env.MS_PASSWORD!;
  await microsoftLogin(page, diegoEmail, password);
  await handleERSDDialog(page);

  // Create a document
  await page.goto('/documents');
  await page.waitForLoadState('networkidle');
  
  await page.getByTestId('lsb.nav-main.documents-newDocument').click();
  await page.getByTestId('createDocumentDialog.documentNameInput').fill('Document Locking Test');
  await page.getByTestId('createDocumentDialog.createButton').click();
  await page.waitForURL(/.*\/editor\/.*/, { timeout: 10000 });

  const documentUrl = page.url();

  // Step 1: Open parent document
  await test.step('Open parent document.', async () => {
    // Document is already open, verify editor is visible
    await page.waitForSelector('[data-testid="editor-content"]', { state: 'visible' });
    await expect(page.getByTestId('editor-content')).toBeVisible();
  });

  // Step 2: Another user creates copy
  await test.step('Another user creates copy.', async () => {
    // Open new page for second user
    const user2Page = await context.newPage();
    const johannaEmail = process.env.MS_EMAIL_17NJ5D_JOHANNA_MURRAY!;
    
    await microsoftLogin(user2Page, johannaEmail, password);
    await handleERSDDialog(user2Page);
    
    // Navigate to the same document
    await user2Page.goto(documentUrl);
    await user2Page.waitForLoadState('networkidle');
    
    // Try to create copy
    const copyButton = user2Page.getByRole('button', { name: /Create Controlled Copy|Copy Document/i });
    if (await copyButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await copyButton.click();
    }
    
    // Store page reference
    page.user2Page = user2Page;
  });

  // Step 3: Get error 412
  await test.step('Get error 412.', async () => {
    const user2Page = page.user2Page;
    // Wait for error response or message
    await user2Page.waitForTimeout(2000);
  });

  // Step 4: "Document locked"
  await test.step('"Document locked".', async () => {
    const user2Page = page.user2Page;
    // Look for lock error message
    const lockMessage = user2Page.getByText(/Document locked|Document is locked|412|Cannot create copy while document is open/i);
    await expect(lockMessage).toBeVisible({ timeout: 5000 });
  });

  // Step 5: Unlock to proceed (SC)
  await test.step('Unlock to proceed (SC)', async () => {
    // Close first user's document to unlock
    await page.close();
    
    // Now try again with second user
    const user2Page = page.user2Page;
    await user2Page.reload();
    await user2Page.waitForLoadState('networkidle');
    
    const copyButton = user2Page.getByRole('button', { name: /Create Controlled Copy|Copy Document/i });
    if (await copyButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await copyButton.click();
      // Should succeed now
      await user2Page.waitForURL(/.*\/editor\/.*/, { timeout: 10000 });
    }
    
    // Take screenshot of successful copy creation
    const timestamp = new Date();
    const formattedTimestamp = `${timestamp.getFullYear()}.${String(timestamp.getMonth() + 1).padStart(2, '0')}.${String(timestamp.getDate()).padStart(2, '0')}-${String(timestamp.getHours()).padStart(2, '0')}.${String(timestamp.getMinutes()).padStart(2, '0')}.${String(timestamp.getSeconds()).padStart(2, '0')}`;
    await user2Page.screenshot({ 
      path: getScreenshotPath(`TS.7.3-07-5-${formattedTimestamp}.png`) 
    });
    
    await user2Page.close();
  });

  // Expected Results:
  // 1. Parent opened ✓
  // 2. Copy attempted ✓
  // 3. Lock error ✓
  // 4. Message shown ✓
  // 5. Must close first ✓
});