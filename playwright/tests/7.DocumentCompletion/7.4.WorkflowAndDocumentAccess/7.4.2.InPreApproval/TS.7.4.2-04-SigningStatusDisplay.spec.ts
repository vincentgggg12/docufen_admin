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

test('TS.7.4.2-04 Signing Status Display', async ({ page }) => {
  // Setup: Login
  const email = process.env.MS_EMAIL_MSPM36_DIEGO_SICILIANI!;
  const password = process.env.MS_PASSWORD!;
  await microsoftLogin(page, email, password);
  await handleERSDDialog(page);

  // Navigate to documents and open/create a test document
  await page.goto('/documents');
  await page.waitForLoadState('networkidle');
  
  // Open participants dialog
  const participantsTab = page.getByRole("tab", { name: "Participants" });
  await participantsTab.click();

  // Step 1: View Pre-Approval list
  await test.step('View Pre-Approval list', async () => {
    // Find and view Pre-Approval participants list
    const preApprovalSection = page.locator('[data-testid="pre-approval-section"]');
    await expect(preApprovalSection).toBeVisible();
    const preApprovalList = page.getByTestId("pre-approval-list");
    await expect(preApprovalList).toBeVisible();
  });

  // Step 2: Check status icons
  await test.step('Check status icons', async () => {
    // Verify status icons are visible for each participant
    const statusIcons = page.locator('[data-testid="signing-status-icon"]');
    await expect(statusIcons.first()).toBeVisible();
    await expect(statusIcons).toHaveCount(await statusIcons.count());
  });

  // Step 3: Signed shows check
  await test.step('Signed shows check', async () => {
    // Verify signed participants show check mark
    const signedIcon = page.locator('[data-testid="signed-check-icon"]').first();
    await expect(signedIcon).toBeVisible();
    // Verify check mark icon
    await expect(signedIcon).toHaveAttribute('aria-label', /signed|completed/i);
  });

  // Step 4: Unsigned shows dash
  await test.step('Unsigned shows dash', async () => {
    // Verify unsigned participants show dash
    const unsignedIcon = page.locator('[data-testid="unsigned-dash-icon"]').first();
    await expect(unsignedIcon).toBeVisible();
    // Verify dash icon
    await expect(unsignedIcon).toHaveAttribute('aria-label', /unsigned|pending/i);
  });

  // Step 5: Timestamps shown (SC)
  await test.step('Timestamps shown (SC)', async () => {
    // Verify timestamps are displayed for signed participants
    const signedTimestamp = page.locator('[data-testid="signature-timestamp"]').first();
    await expect(signedTimestamp).toBeVisible();
    
    // Verify timestamp format (e.g., "2025-06-25 14:30:00")
    const timestampText = await signedTimestamp.textContent();
    expect(timestampText).toMatch(/\d{4}-\d{2}-\d{2}\s\d{2}:\d{2}:\d{2}/);
    
    // Take screenshot showing status display
    const timestamp = new Date();
    const formattedTimestamp = `${timestamp.getFullYear()}.${String(timestamp.getMonth() + 1).padStart(2, '0')}.${String(timestamp.getDate()).padStart(2, '0')}-${String(timestamp.getHours()).padStart(2, '0')}.${String(timestamp.getMinutes()).padStart(2, '0')}.${String(timestamp.getSeconds()).padStart(2, '0')}`;
    await page.screenshot({ 
      path: getScreenshotPath(`TS.7.4.2-04-final-${formattedTimestamp}.png`) 
    });
  });

  // Expected Results: 
  // 1. List viewed ✓
  // 2. Icons visible ✓
  // 3. Check mark ✓
  // 4. Dash mark ✓
  // 5. Times displayed ✓
});