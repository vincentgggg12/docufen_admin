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

test.setTimeout(120000); // 2 minutes

test('TS.7.2-03 Pre-configured Metadata', async ({ page }) => {
  // Setup: Login during trial period
  const email = process.env.MS_EMAIL_17NJ5D_MEGAN_BOWEN!;
  const password = process.env.MS_PASSWORD!;
  await microsoftLogin(page, email, password);
  await handleERSDDialog(page);

  // Navigate to documents page
  await page.goto('/documents');
  await page.waitForLoadState('networkidle');

  // Create demo document
  const demoButton = page.getByTestId('lsb.nav-main.documents-demoDocument');
  await expect(demoButton).toBeVisible();
  await demoButton.click();

  // Wait for navigation to editor
  await page.waitForURL(/.*\/editor\/.*/, { timeout: 10000 });
  await page.waitForLoadState('networkidle');

  // Step 1: Check document name
  await test.step('Check document name.', async () => {
    // Open document properties/metadata
    const propertiesButton = page.getByRole('button', { name: /Properties|Metadata|Info/i });
    if (await propertiesButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await propertiesButton.click();
      await page.waitForTimeout(500);
    }
  });

  // Step 2: Verify "Docufen Practice Document"
  await test.step('Verify "Docufen Practice Document".', async () => {
    // Check document name field
    const nameField = page.getByTestId('document-name').or(page.getByLabel('Document Name'));
    await expect(nameField).toHaveValue('Docufen Practice Document');
  });

  // Step 3: Check reference "PD-001"
  await test.step('Check reference "PD-001".', async () => {
    // Check external reference field
    const referenceField = page.getByTestId('external-reference').or(page.getByLabel('External Reference'));
    await expect(referenceField).toHaveValue('PD-001');
  });

  // Step 4: Category is "validation"
  await test.step('Category is "validation".', async () => {
    // Check category field
    const categoryField = page.getByTestId('document-category').or(page.getByLabel('Category'));
    await expect(categoryField).toHaveValue('validation');
  });

  // Step 5: All preset (SC)
  await test.step('All preset (SC)', async () => {
    // Take screenshot of metadata panel
    const timestamp = new Date();
    const formattedTimestamp = `${timestamp.getFullYear()}.${String(timestamp.getMonth() + 1).padStart(2, '0')}.${String(timestamp.getDate()).padStart(2, '0')}-${String(timestamp.getHours()).padStart(2, '0')}.${String(timestamp.getMinutes()).padStart(2, '0')}.${String(timestamp.getSeconds()).padStart(2, '0')}`;
    await page.screenshot({ 
      path: getScreenshotPath(`TS.7.2-03-5-${formattedTimestamp}.png`) 
    });
  });

  // Expected Results:
  // 1. Name field checked ✓
  // 2. Correct name ✓
  // 3. Reference set ✓
  // 4. Category assigned ✓
  // 5. Metadata configured ✓
});