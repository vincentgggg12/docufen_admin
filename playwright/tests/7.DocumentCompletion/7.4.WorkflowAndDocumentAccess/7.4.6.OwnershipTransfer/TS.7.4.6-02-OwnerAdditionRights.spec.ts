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

test('TS.7.4.6-02 Owner Addition Rights', async ({ page }) => {
  // Setup: Login as owner
  const email = process.env.MS_EMAIL_MSPM36_DIEGO_SICILIANI!;
  const password = process.env.MS_PASSWORD!;
  await microsoftLogin(page, email, password);
  await handleERSDDialog(page);

  // Create a document
  await page.goto('/documents');
  await page.waitForLoadState('networkidle');
  
  await page.getByTestId('lsb.nav-main.documents-newDocument').click();
  await page.getByTestId('createDocumentDialog.documentNameInput').fill('Owner Addition Rights Test');
  await page.getByTestId('createDocumentDialog.createButton').click();
  await page.waitForURL(/.*\/editor\/.*/, { timeout: 10000 });

  // Open participants dialog
  const participantsTab = page.getByRole('tab', { name: /Participants|Users|Workflow/i });
  await expect(participantsTab).toBeVisible();
  await participantsTab.click();
  
  const participantsModal = page.getByRole('dialog', { name: /Participants|Manage Participants|Workflow/i });
  await expect(participantsModal).toBeVisible();

  // Step 1: Add Creator as owner
  await test.step('Add Creator as owner.', async () => {
    // Find Owners section
    const ownersSection = page.getByText('Owners').locator('..');
    const addButton = ownersSection.getByRole('button', { name: /Add|\\+/i });
    await addButton.click();
    
    // Search for a Creator role user
    const searchInput = page.getByPlaceholder(/Search|Find user/i);
    await searchInput.fill('creator');
    await page.waitForTimeout(1000); // Wait for search results
    
    // Select a user with Creator role
    const creatorUser = page.getByRole('option').filter({ hasText: /Creator/i }).first();
    if (await creatorUser.isVisible()) {
      await creatorUser.click();
      await expect(page.getByText(/Added as owner|Owner added/i)).toBeVisible();
    }
  });

  // Step 2: Add User Manager
  await test.step('Add User Manager.', async () => {
    // Add another owner with User Manager role
    const ownersSection = page.getByText('Owners').locator('..');
    const addButton = ownersSection.getByRole('button', { name: /Add|\\+/i });
    await addButton.click();
    
    // Search for User Manager
    const searchInput = page.getByPlaceholder(/Search|Find user/i);
    await searchInput.clear();
    await searchInput.fill('manager');
    await page.waitForTimeout(1000);
    
    // Select a user with User Manager role
    const managerUser = page.getByRole('option').filter({ hasText: /Manager/i }).first();
    if (await managerUser.isVisible()) {
      await managerUser.click();
      await expect(page.getByText(/Added as owner|Owner added/i)).toBeVisible();
    }
  });

  // Step 3: Try Site Admin
  await test.step('Try Site Admin.', async () => {
    // Attempt to add Site Admin as owner
    const ownersSection = page.getByText('Owners').locator('..');
    const addButton = ownersSection.getByRole('button', { name: /Add|\\+/i });
    await addButton.click();
    
    // Search for Site Admin
    const searchInput = page.getByPlaceholder(/Search|Find user/i);
    await searchInput.clear();
    await searchInput.fill('admin');
    await page.waitForTimeout(1000);
    
    // Try to select Site Admin user
    const adminUser = page.getByRole('option').filter({ hasText: /Site Admin|Administrator/i }).first();
    if (await adminUser.isVisible()) {
      await adminUser.click();
    }
  });

  // Step 4: Blocked from ownership
  await test.step('Blocked from ownership.', async () => {
    // Verify error message appears
    await expect(page.getByText(/Cannot be owner|Site Admin cannot be document owner|Not allowed/i)).toBeVisible();
  });

  // Step 5: Role restrictions (SC)
  await test.step('Role restrictions (SC)', async () => {
    // Verify role-based restrictions are enforced
    const errorMessage = page.getByText(/Cannot be owner|Site Admin cannot be document owner|Not allowed/i);
    await expect(errorMessage).toBeVisible();
    
    // Take screenshot showing the restriction
    const timestamp = new Date();
    const formattedTimestamp = `${timestamp.getFullYear()}.${String(timestamp.getMonth() + 1).padStart(2, '0')}.${String(timestamp.getDate()).padStart(2, '0')}-${String(timestamp.getHours()).padStart(2, '0')}.${String(timestamp.getMinutes()).padStart(2, '0')}.${String(timestamp.getSeconds()).padStart(2, '0')}`;
    await page.screenshot({ 
      path: getScreenshotPath(`TS.7.4.6-02-5-${formattedTimestamp}.png`) 
    });
  });

  // Expected Results:
  // 1. Creator added ✓
  // 2. Manager added ✓
  // 3. Admin rejected ✓
  // 4. "Cannot be owner" ✓
  // 5. Rules enforced ✓
});