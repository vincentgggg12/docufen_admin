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

test('TS.7.6.1-05 Missing Signatures Modal', async ({ page }) => {
  // Setup: Login as owner
  const diegoEmail = process.env.MS_EMAIL_MSPM36_DIEGO_SICILIANI!;
  const password = process.env.MS_PASSWORD!;
  await microsoftLogin(page, diegoEmail, password);
  await handleERSDDialog(page);

  // Create document
  await page.goto('/documents');
  await page.waitForLoadState('networkidle');
  
  await page.getByTestId('lsb.nav-main.documents-newDocument').click();
  await page.getByTestId('createDocumentDialog.documentNameInput').fill('Missing Signatures Modal Test');
  await page.getByTestId('createDocumentDialog.createButton').click();
  await page.waitForURL(/.*\/editor\/.*/, { timeout: 10000 });

  // Add content
  await page.locator('[contenteditable="true"]').first().click();
  await page.keyboard.type('Missing Signatures Modal Test Document');
  
  // Configure Pre-Approval participants
  const participantsTab = page.getByRole('tab', { name: /Participants|Users|Workflow/i });
  await participantsTab.click();
  
  // Add multiple pre-approval participants
  const preApprovalSection = page.getByText('Pre-Approval').locator('..');
  
  // Add Henrietta
  await preApprovalSection.getByRole('button', { name: /Add/i }).click();
  await page.getByPlaceholder('Search users').fill('Henrietta');
  await page.getByText('Henrietta Moreno').click();
  await page.getByRole('button', { name: /Save|Add/i }).click();
  
  // Add Johanna
  await preApprovalSection.getByRole('button', { name: /Add/i }).click();
  await page.getByPlaceholder('Search users').fill('Johanna');
  await page.getByText('Johanna Murray').click();
  await page.getByRole('button', { name: /Save|Add/i }).click();
  
  // Add Thomas
  await preApprovalSection.getByRole('button', { name: /Add/i }).click();
  await page.getByPlaceholder('Search users').fill('Thomas');
  await page.getByText('Thomas Weber').click();
  await page.getByRole('button', { name: /Save|Add/i }).click();

  // Step 1: Try advance incomplete
  await test.step('Try advance incomplete.', async () => {
    // Try to advance to next stage without signatures
    const advanceButton = page.getByRole('button', { name: /Next Stage|Forward|Advance|To Execute/i });
    await expect(advanceButton).toBeVisible();
    await advanceButton.click();
  });

  // Step 2: Modal shows
  await test.step('Modal shows.', async () => {
    // Wait for modal to appear
    const modal = page.getByRole('dialog');
    await expect(modal).toBeVisible({ timeout: 5000 });
    
    // Verify modal title indicates missing signatures
    const modalTitle = modal.getByRole('heading', { name: /Missing Signatures|Signatures Required|Incomplete Signatures/i });
    await expect(modalTitle).toBeVisible();
  });

  // Step 3: Lists unsigned users
  await test.step('Lists unsigned users.', async () => {
    const modal = page.getByRole('dialog');
    
    // Check that unsigned users are listed
    await expect(modal.getByText('Henrietta Moreno')).toBeVisible();
    await expect(modal.getByText('Johanna Murray')).toBeVisible();
    await expect(modal.getByText('Thomas Weber')).toBeVisible();
    
    // Might also show status indicators
    const pendingIndicators = modal.locator('text=/pending|unsigned|required/i');
    const indicatorCount = await pendingIndicators.count();
    expect(indicatorCount).toBeGreaterThan(0);
  });

  // Step 4: Clear message
  await test.step('Clear message.', async () => {
    const modal = page.getByRole('dialog');
    
    // Look for clear message about what needs to be done
    const message = modal.locator('text=/must sign|signatures required|complete all signatures|sign before advancing/i');
    await expect(message.first()).toBeVisible();
    
    // Message should be clear and instructive
    const messageText = await message.first().textContent();
    expect(messageText).toBeTruthy();
    expect(messageText!.length).toBeGreaterThan(10); // Ensure it's not just a short error
  });

  // Step 5: Must complete first (SC)
  await test.step('Must complete first (SC)', async () => {
    const modal = page.getByRole('dialog');
    
    // Take screenshot of the modal showing missing signatures
    const timestamp = new Date();
    const formattedTimestamp = `${timestamp.getFullYear()}.${String(timestamp.getMonth() + 1).padStart(2, '0')}.${String(timestamp.getDate()).padStart(2, '0')}-${String(timestamp.getHours()).padStart(2, '0')}.${String(timestamp.getMinutes()).padStart(2, '0')}.${String(timestamp.getSeconds()).padStart(2, '0')}`;
    await page.screenshot({ 
      path: getScreenshotPath(`TS.7.6.1-05-5-${formattedTimestamp}.png`) 
    });
    
    // Modal should have a close or OK button
    const closeButton = modal.getByRole('button', { name: /OK|Close|Dismiss|Cancel/i });
    await expect(closeButton).toBeVisible();
    
    // Close the modal
    await closeButton.click();
    
    // Verify we're still in Pre-Approval stage (not advanced)
    await expect(page.getByText(/Pre-Approval|Pre Approval/i)).toBeVisible();
  });

  // Expected Results:
  // 1. Advance attempted ✓
  // 2. Modal appears ✓
  // 3. Users listed ✓
  // 4. "Must sign" shown ✓
  // 5. Guidance provided ✓
});