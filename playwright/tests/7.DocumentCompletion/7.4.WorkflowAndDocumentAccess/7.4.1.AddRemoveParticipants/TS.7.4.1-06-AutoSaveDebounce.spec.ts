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

test('TS.7.4.1-06 Auto Save Debounce', async ({ page }) => {
  // Setup: Login
  const email = process.env.MS_EMAIL_MSPM36_DIEGO_SICILIANI!;
  const password = process.env.MS_PASSWORD!;
  await microsoftLogin(page, email, password);
  await handleERSDDialog(page);

  // Navigate to documents and create/open a test document
  await page.goto('/documents');
  await page.waitForLoadState('networkidle');
  
  
  // Step 1: Add multiple users quickly
  await test.step('Add multiple users quickly', async () => {
    // Add users rapidly
for(let i = 0; i < 3; i++) {
  await page.getByTestId("add-user-button").click();
  await page.getByText(`User ${i}`).click();
}
  });
  // Step 2: Watch network
  await test.step('Watch network', async () => {
    // Monitor network requests
const requests = [];
page.on("request", req => requests.push(req));
  });
  // Step 3: Single API call
  await test.step('Single API call', async () => {
    // Verify debounced save
await page.waitForTimeout(3000);
const saveRequests = requests.filter(r => r.url().includes("participants"));
expect(saveRequests.length).toBeLessThanOrEqual(1);
  });

  // Final step: Screenshot (SC)
  await test.step('Take screenshot (SC)', async () => {
    const timestamp = new Date();
    const formattedTimestamp = `${timestamp.getFullYear()}.${String(timestamp.getMonth() + 1).padStart(2, '0')}.${String(timestamp.getDate()).padStart(2, '0')}-${String(timestamp.getHours()).padStart(2, '0')}.${String(timestamp.getMinutes()).padStart(2, '0')}.${String(timestamp.getSeconds()).padStart(2, '0')}`;
    await page.screenshot({ 
      path: getScreenshotPath(`TS.7.4.1-06-final-${formattedTimestamp}.png`) 
    });
  });

  // Expected Results: Auto Save Debounce functionality verified
});