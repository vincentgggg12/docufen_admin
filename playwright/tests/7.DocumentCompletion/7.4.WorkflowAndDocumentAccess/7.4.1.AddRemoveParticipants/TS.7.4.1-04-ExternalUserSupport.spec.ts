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

test('TS.7.4.1-04 External User Support', async ({ page }) => {
  // Setup: Login
  const email = process.env.MS_EMAIL_MSPM36_DIEGO_SICILIANI!;
  const password = process.env.MS_PASSWORD!;
  await microsoftLogin(page, email, password);
  await handleERSDDialog(page);

  // Navigate to documents and create/open a test document
  await page.goto('/documents');
  await page.waitForLoadState('networkidle');
  
  
  // Step 1: Add Julia (external)
  await test.step('Add Julia (external)', async () => {
    // Add external user logic
await page.getByTestId("add-user-button").click();
await page.getByPlaceholder("Search users").fill("Julia");
// Select external user
  });
  // Step 2: See External badge
  await test.step('See External badge', async () => {
    // Verify external badge
const badge = page.getByText("External");
await expect(badge).toBeVisible();
  });
  // Step 3: Company shown
  await test.step('Company shown', async () => {
    // Verify company name
const company = page.getByText("Biotech XMWKB");
await expect(company).toBeVisible();
  });
  // Step 4: Add to group
  await test.step('Add to group', async () => {
    // Add to group
await page.getByRole("button", { name: "Add" }).click();
  });

  // Final step: Screenshot (SC)
  await test.step('Take screenshot (SC)', async () => {
    const timestamp = new Date();
    const formattedTimestamp = `${timestamp.getFullYear()}.${String(timestamp.getMonth() + 1).padStart(2, '0')}.${String(timestamp.getDate()).padStart(2, '0')}-${String(timestamp.getHours()).padStart(2, '0')}.${String(timestamp.getMinutes()).padStart(2, '0')}.${String(timestamp.getSeconds()).padStart(2, '0')}`;
    await page.screenshot({ 
      path: getScreenshotPath(`TS.7.4.1-04-final-${formattedTimestamp}.png`) 
    });
  });

  // Expected Results: External User Support functionality verified
});