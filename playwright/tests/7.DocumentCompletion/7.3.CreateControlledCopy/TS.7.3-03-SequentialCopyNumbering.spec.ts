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

test('TS.7.3-03 Sequential Copy Numbering', async ({ page }) => {
  // Setup: Login as Creator
  const email = process.env.MS_EMAIL_MSPM36_DIEGO_SICILIANI!;
  const password = process.env.MS_PASSWORD!;
  await microsoftLogin(page, email, password);
  await handleERSDDialog(page);

  // Create a parent document first
  await page.goto('/documents');
  await page.waitForLoadState('networkidle');
  
  await page.getByTestId('lsb.nav-main.documents-newDocument').click();
  await page.getByTestId('createDocumentDialog.documentNameInput').fill('Sequential Numbering Test');
  await page.getByTestId('createDocumentDialog.createButton').click();
  await page.waitForURL(/.*\/editor\/.*/, { timeout: 10000 });

  // Step 1: Create first copy
  await test.step('Create first copy.', async () => {
    const copyButton = page.getByRole('button', { name: /Create Controlled Copy|Copy Document/i });
    await expect(copyButton).toBeVisible();
    await copyButton.click();
    
    // Wait for copy to be created
    await page.waitForURL(/.*\/editor\/.*/, { timeout: 10000 });
    await page.waitForLoadState('networkidle');
  });

  // Step 2: Check number "01"
  await test.step('Check number "01".', async () => {
    // Check document name or metadata for copy number
    const propertiesButton = page.getByRole('button', { name: /Properties|Metadata|Info/i });
    if (await propertiesButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await propertiesButton.click();
      await page.waitForTimeout(500);
    }
    
    // Look for copy number in document name or copy field
    const copyIndicator = page.getByText(/Copy.*01|Controlled Copy.*01|-01/i);
    await expect(copyIndicator).toBeVisible();
  });

  // Navigate back to parent document
  await page.goBack();
  await page.waitForLoadState('networkidle');

  // Step 3: Create second copy
  await test.step('Create second copy.', async () => {
    const copyButton = page.getByRole('button', { name: /Create Controlled Copy|Copy Document/i });
    await copyButton.click();
    
    // Wait for second copy to be created
    await page.waitForURL(/.*\/editor\/.*/, { timeout: 10000 });
    await page.waitForLoadState('networkidle');
  });

  // Step 4: Number is "02"
  await test.step('Number is "02".', async () => {
    // Check document name or metadata for copy number
    const propertiesButton = page.getByRole('button', { name: /Properties|Metadata|Info/i });
    if (await propertiesButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await propertiesButton.click();
      await page.waitForTimeout(500);
    }
    
    // Look for copy number in document name or copy field
    const copyIndicator = page.getByText(/Copy.*02|Controlled Copy.*02|-02/i);
    await expect(copyIndicator).toBeVisible();
  });

  // Step 5: Sequential order (SC)
  await test.step('Sequential order (SC)', async () => {
    // Take screenshot showing copy 02
    const timestamp = new Date();
    const formattedTimestamp = `${timestamp.getFullYear()}.${String(timestamp.getMonth() + 1).padStart(2, '0')}.${String(timestamp.getDate()).padStart(2, '0')}-${String(timestamp.getHours()).padStart(2, '0')}.${String(timestamp.getMinutes()).padStart(2, '0')}.${String(timestamp.getSeconds()).padStart(2, '0')}`;
    await page.screenshot({ 
      path: getScreenshotPath(`TS.7.3-03-5-${formattedTimestamp}.png`) 
    });
  });

  // Expected Results:
  // 1. Copy created ✓
  // 2. Shows "01" ✓
  // 3. Second created ✓
  // 4. Shows "02" ✓
  // 5. Auto-increment works ✓
});