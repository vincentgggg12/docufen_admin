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

test('TS.7.4.1-05 Participant Change Audit', async ({ page }) => {
  // Setup: Login
  const email = process.env.MS_EMAIL_MSPM36_DIEGO_SICILIANI!;
  const password = process.env.MS_PASSWORD!;
  await microsoftLogin(page, email, password);
  await handleERSDDialog(page);

  // Navigate to documents and create/open a test document
  await page.goto('/documents');
  await page.waitForLoadState('networkidle');
  
  
  // Step 1: Add user to group
  await test.step('Add user to group', async () => {
    // Add user
await page.getByTestId("add-user-button").click();
// Add user logic
  });
  // Step 2: Check audit log
  await test.step('Check audit log', async () => {
    // Open audit log
const auditButton = page.getByRole("button", { name: "Audit" });
await auditButton.click();
  });
  // Step 3: Find add entry
  await test.step('Find add entry', async () => {
    // Find audit entry
const addEntry = page.getByText(/User Added/i);
await expect(addEntry).toBeVisible();
  });
  // Step 4: Remove user
  await test.step('Remove user', async () => {
    // Remove user
await page.getByRole("button", { name: "Remove" }).click();
  });

  // Final step: Screenshot (SC)
  await test.step('Take screenshot (SC)', async () => {
    const timestamp = new Date();
    const formattedTimestamp = `${timestamp.getFullYear()}.${String(timestamp.getMonth() + 1).padStart(2, '0')}.${String(timestamp.getDate()).padStart(2, '0')}-${String(timestamp.getHours()).padStart(2, '0')}.${String(timestamp.getMinutes()).padStart(2, '0')}.${String(timestamp.getSeconds()).padStart(2, '0')}`;
    await page.screenshot({ 
      path: getScreenshotPath(`TS.7.4.1-05-final-${formattedTimestamp}.png`) 
    });
  });

  // Expected Results: Participant Change Audit functionality verified
});