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

test('TS.7.4.1-03 User Search Selection', async ({ page }) => {
  // Setup: Login as owner
  const email = process.env.MS_EMAIL_MSPM36_DIEGO_SICILIANI!;
  const password = process.env.MS_PASSWORD!;
  await microsoftLogin(page, email, password);
  await handleERSDDialog(page);

  // Create a document
  await page.goto('/documents');
  await page.waitForLoadState('networkidle');
  
  await page.getByTestId('lsb.nav-main.documents-newDocument').click();
  await page.getByTestId('createDocumentDialog.documentNameInput').fill('User Search Test');
  await page.getByTestId('createDocumentDialog.createButton').click();
  await page.waitForURL(/.*\/editor\/.*/, { timeout: 10000 });

  // Open participants dialog
  const participantsTab = page.getByRole('tab', { name: /Participants|Users|Workflow/i });
  await expect(participantsTab).toBeVisible();
  await participantsTab.click();

  // Step 1: Click add user
  await test.step('Click add user.', async () => {
    // Find and click add user button for any group
    const addButton = page.getByRole('button', { name: /Add|\\+/i }).first();
    await expect(addButton).toBeVisible();
    await addButton.click();
  });

  // Step 2: Type "Diego"
  await test.step('Type "Diego".', async () => {
    // Find search input and type "Diego"
    const searchInput = page.getByPlaceholder(/Search|Find|Type/i);
    await expect(searchInput).toBeVisible();
    await searchInput.fill('Diego');
    await page.waitForTimeout(1000); // Wait for search results
  });

  // Step 3: See filtered results
  await test.step('See filtered results.', async () => {
    // Verify Diego appears in search results
    const diegoResult = page.getByText(/Diego/i);
    await expect(diegoResult).toBeVisible();
  });

  // Step 4: Select Diego
  await test.step('Select Diego.', async () => {
    // Click on Diego in the search results
    const diegoOption = page.getByText('Diego Siciliani').or(page.getByText(/Diego/i)).first();
    await diegoOption.click();
  });

  // Step 5: User added (SC)
  await test.step('User added (SC)', async () => {
    // Confirm the addition
    const confirmButton = page.getByRole('button', { name: /Add|Confirm|Save/i });
    if (await confirmButton.isVisible({ timeout: 3000 }).catch(() => false)) {
      await confirmButton.click();
    }
    
    // Verify Diego is added to the group
    await expect(page.getByText('Diego Siciliani')).toBeVisible();
    
    // Take screenshot showing user added
    const timestamp = new Date();
    const formattedTimestamp = `${timestamp.getFullYear()}.${String(timestamp.getMonth() + 1).padStart(2, '0')}.${String(timestamp.getDate()).padStart(2, '0')}-${String(timestamp.getHours()).padStart(2, '0')}.${String(timestamp.getMinutes()).padStart(2, '0')}.${String(timestamp.getSeconds()).padStart(2, '0')}`;
    await page.screenshot({ 
      path: getScreenshotPath(`TS.7.4.1-03-5-${formattedTimestamp}.png`) 
    });
  });

  // Expected Results:
  // 1. Add clicked ✓
  // 2. Search works ✓
  // 3. Diego shown ✓
  // 4. Selected ✓
  // 5. Added to group ✓
});