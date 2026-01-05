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

test('TS.7.5.1-05 Icon Differentiation', async ({ page }) => {
  // Setup: Login
  const email = process.env.MS_EMAIL_MSPM36_DIEGO_SICILIANI!;
  const password = process.env.MS_PASSWORD!;
  await microsoftLogin(page, email, password);
  await handleERSDDialog(page);

  // Navigate to documents and create/open a test document
  await page.goto('/documents');
  await page.waitForLoadState('networkidle');
  
  
  // Step 1: View Delete button
  await test.step('View Delete button', async () => {
    // View delete button
const deleteBtn = page.getByRole("button", { name: "Delete" });
await expect(deleteBtn).toBeVisible();
  });
  // Step 2: Trash icon shown
  await test.step('Trash icon shown', async () => {
    // Verify trash icon
const trashIcon = page.getByTestId("trash-icon");
await expect(trashIcon).toBeVisible();
  });
  // Step 3: Add content for Void
  await test.step('Add content for Void', async () => {
    // Add content
const editor = page.getByTestId("editor-content");
await editor.click();
await page.keyboard.type("Content");
  });
  // Step 4: Ban icon shown
  await test.step('Ban icon shown', async () => {
    // Verify ban icon
const banIcon = page.getByTestId("ban-icon");
await expect(banIcon).toBeVisible();
  });

  // Final step: Screenshot (SC)
  await test.step('Take screenshot (SC)', async () => {
    const timestamp = new Date();
    const formattedTimestamp = `${timestamp.getFullYear()}.${String(timestamp.getMonth() + 1).padStart(2, '0')}.${String(timestamp.getDate()).padStart(2, '0')}-${String(timestamp.getHours()).padStart(2, '0')}.${String(timestamp.getMinutes()).padStart(2, '0')}.${String(timestamp.getSeconds()).padStart(2, '0')}`;
    await page.screenshot({ 
      path: getScreenshotPath(`TS.7.5.1-05-final-${formattedTimestamp}.png`) 
    });
  });

  // Expected Results: Icon Differentiation functionality verified
});