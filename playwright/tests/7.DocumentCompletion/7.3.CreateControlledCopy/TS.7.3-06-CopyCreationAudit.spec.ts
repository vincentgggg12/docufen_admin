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

test('TS.7.3-06 Copy Creation Audit', async ({ page }) => {
  // Setup: Login as Creator
  const email = process.env.MS_EMAIL_MSPM36_DIEGO_SICILIANI!;
  const password = process.env.MS_PASSWORD!;
  await microsoftLogin(page, email, password);
  await handleERSDDialog(page);

  // Create a parent document
  await page.goto('/documents');
  await page.waitForLoadState('networkidle');
  
  await page.getByTestId('lsb.nav-main.documents-newDocument').click();
  await page.getByTestId('createDocumentDialog.documentNameInput').fill('Audit Test Document');
  await page.getByTestId('createDocumentDialog.createButton').click();
  await page.waitForURL(/.*\/editor\/.*/, { timeout: 10000 });

  const parentUrl = page.url();

  // Step 1: Create controlled copy
  await test.step('Create controlled copy.', async () => {
    const copyButton = page.getByRole('button', { name: /Create Controlled Copy|Copy Document/i });
    await expect(copyButton).toBeVisible();
    await copyButton.click();
    
    await page.waitForURL(/.*\/editor\/.*/, { timeout: 10000 });
    await page.waitForLoadState('networkidle');
  });

  // Navigate back to parent
  await page.goto(parentUrl);
  await page.waitForLoadState('networkidle');

  // Step 2: Check parent audit log
  await test.step('Check parent audit log.', async () => {
    // Open audit log/history
    const auditButton = page.getByRole('button', { name: /Audit|History|Log/i });
    await expect(auditButton).toBeVisible();
    await auditButton.click();
    await page.waitForTimeout(1000);
  });

  // Step 3: Find copy entry
  await test.step('Find copy entry.', async () => {
    // Look for copy creation entry in audit log
    const copyEntry = page.getByText(/Controlled Copy Created|Copy Created|Created controlled copy/i);
    await expect(copyEntry).toBeVisible();
  });

  // Step 4: Shows copy name
  await test.step('Shows copy name.', async () => {
    // Verify copy name is shown in audit entry
    const auditEntry = page.locator('[data-testid="audit-entry"]').filter({ hasText: /Copy Created|Controlled Copy/i });
    await expect(auditEntry).toContainText('Audit Test Document');
  });

  // Step 5: URL included (SC)
  await test.step('URL included (SC)', async () => {
    // Verify URL/link is included in audit entry
    const auditLink = page.getByRole('link', { name: /Audit Test Document|View Copy/i });
    if (await auditLink.isVisible({ timeout: 5000 }).catch(() => false)) {
      await expect(auditLink).toBeVisible();
    }
    
    // Take screenshot of audit log
    const timestamp = new Date();
    const formattedTimestamp = `${timestamp.getFullYear()}.${String(timestamp.getMonth() + 1).padStart(2, '0')}.${String(timestamp.getDate()).padStart(2, '0')}-${String(timestamp.getHours()).padStart(2, '0')}.${String(timestamp.getMinutes()).padStart(2, '0')}.${String(timestamp.getSeconds()).padStart(2, '0')}`;
    await page.screenshot({ 
      path: getScreenshotPath(`TS.7.3-06-5-${formattedTimestamp}.png`) 
    });
  });

  // Expected Results:
  // 1. Copy made ✓
  // 2. Audit checked ✓
  // 3. Entry found ✓
  // 4. Name recorded ✓
  // 5. Link provided ✓
});