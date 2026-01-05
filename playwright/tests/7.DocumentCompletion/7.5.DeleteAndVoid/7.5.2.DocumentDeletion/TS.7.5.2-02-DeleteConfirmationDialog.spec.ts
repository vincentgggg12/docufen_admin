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

test('TS.7.5.2-02 Delete Confirmation Dialog', async ({ page }) => {
  // Setup: Login
  const email = process.env.MS_EMAIL_MSPM36_DIEGO_SICILIANI!;
  const password = process.env.MS_PASSWORD!;
  await microsoftLogin(page, email, password);
  await handleERSDDialog(page);

  // Navigate to documents and create/open a test document
  await page.goto('/documents');
  await page.waitForLoadState('networkidle');
  
  
  // Step 1: Click Delete button
  await test.step('Click Delete button', async () => {
    // Click delete
const deleteBtn = page.getByRole("button", { name: "Delete" });
await deleteBtn.click();
  });
  // Step 2: Dialog appears
  await test.step('Dialog appears', async () => {
    // Verify dialog
const dialog = page.getByRole("dialog");
await expect(dialog).toBeVisible();
  });
  // Step 3: Shows "Delete this document?"
  await test.step('Shows "Delete this document?"', async () => {
    // Verify message
const message = page.getByText("Delete this document?");
await expect(message).toBeVisible();
  });

  // Final step: Screenshot (SC)
  await test.step('Take screenshot (SC)', async () => {
    const timestamp = new Date();
    const formattedTimestamp = `${timestamp.getFullYear()}.${String(timestamp.getMonth() + 1).padStart(2, '0')}.${String(timestamp.getDate()).padStart(2, '0')}-${String(timestamp.getHours()).padStart(2, '0')}.${String(timestamp.getMinutes()).padStart(2, '0')}.${String(timestamp.getSeconds()).padStart(2, '0')}`;
    await page.screenshot({ 
      path: getScreenshotPath(`TS.7.5.2-02-final-${formattedTimestamp}.png`) 
    });
  });

  // Expected Results: Delete Confirmation Dialog functionality verified
});