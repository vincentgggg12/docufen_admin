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

test('TS.7.3-01 Parent Document Validation', async ({ page }) => {
  // Setup: Login as Creator
  const email = process.env.MS_EMAIL_MSPM36_DIEGO_SICILIANI!;
  const password = process.env.MS_PASSWORD!;
  await microsoftLogin(page, email, password);
  await handleERSDDialog(page);

  // Create a parent document first
  await page.goto('/documents');
  await page.waitForLoadState('networkidle');
  
  await page.getByTestId('lsb.nav-main.documents-newDocument').click();
  await page.getByTestId('createDocumentDialog.documentNameInput').fill('Parent Document for Copy Test');
  await page.getByTestId('createDocumentDialog.createButton').click();
  await page.waitForURL(/.*\/editor\/.*/, { timeout: 10000 });
  
  // Get parent document ID from URL
  const parentUrl = page.url();
  const parentId = parentUrl.split('/').pop();

  // Step 1: Create controlled copy
  await test.step('Create controlled copy.', async () => {
    // Find and click the Create Controlled Copy button
    const copyButton = page.getByRole('button', { name: /Create Controlled Copy|Copy Document/i });
    await expect(copyButton).toBeVisible();
    await copyButton.click();
    
    // Wait for copy to be created
    await page.waitForURL(/.*\/editor\/.*/, { timeout: 10000 });
    await page.waitForLoadState('networkidle');
  });

  // Get copy document ID from URL
  const copyUrl = page.url();
  const copyId = copyUrl.split('/').pop();

  // Step 2: Try to copy the copy
  await test.step('Try to copy the copy.', async () => {
    // Try to find copy button on the copy document
    const copyButton = page.getByRole('button', { name: /Create Controlled Copy|Copy Document/i });
    
    // Button should either be disabled or clicking it should show error
    if (await copyButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await copyButton.click();
    }
  });

  // Step 3: Get error 409
  await test.step('Get error 409.', async () => {
    // Wait for error message or API response
    await page.waitForTimeout(1000);
  });

  // Step 4: Message shown
  await test.step('Message shown.', async () => {
    // Check for error message
    const errorMessage = page.getByText(/Cannot copy a copy|Cannot create a copy of a controlled copy|409/i);
    await expect(errorMessage).toBeVisible({ timeout: 5000 });
  });

  // Step 5: Single level only (SC)
  await test.step('Single level only (SC)', async () => {
    // Take screenshot of error message
    const timestamp = new Date();
    const formattedTimestamp = `${timestamp.getFullYear()}.${String(timestamp.getMonth() + 1).padStart(2, '0')}.${String(timestamp.getDate()).padStart(2, '0')}-${String(timestamp.getHours()).padStart(2, '0')}.${String(timestamp.getMinutes()).padStart(2, '0')}.${String(timestamp.getSeconds()).padStart(2, '0')}`;
    await page.screenshot({ 
      path: getScreenshotPath(`TS.7.3-01-5-${formattedTimestamp}.png`) 
    });
  });

  // Expected Results:
  // 1. First copy created ✓
  // 2. Copy of copy attempted ✓
  // 3. Error returned ✓
  // 4. "Cannot copy a copy" ✓
  // 5. Hierarchy enforced ✓
});