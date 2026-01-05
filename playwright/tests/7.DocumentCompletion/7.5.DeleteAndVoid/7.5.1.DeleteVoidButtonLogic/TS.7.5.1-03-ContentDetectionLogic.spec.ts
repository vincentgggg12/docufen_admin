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

test('TS.7.5.1-03 Content Detection Logic', async ({ page }) => {
  // Setup: Login
  const email = process.env.MS_EMAIL_MSPM36_DIEGO_SICILIANI!;
  const password = process.env.MS_PASSWORD!;
  await microsoftLogin(page, email, password);
  await handleERSDDialog(page);

  // Navigate to documents and create/open a test document
  await page.goto('/documents');
  await page.waitForLoadState('networkidle');
  
  
  // Step 1: Check empty doc
  await test.step('Check empty doc', async () => {
    // Check empty state
const editor = page.getByTestId("editor-content");
const isEmpty = await editor.textContent() === "";
  });
  // Step 2: hasContent = false
  await test.step('hasContent = false', async () => {
    // Verify hasContent false
expect(isEmpty).toBe(true);
  });
  // Step 3: Add text
  await test.step('Add text', async () => {
    // Add content
await editor.click();
await page.keyboard.type("Test content");
  });
  // Step 4: hasContent = true
  await test.step('hasContent = true', async () => {
    // Verify hasContent true
const hasContent = await editor.textContent() !== "";
expected(hasContent).toBe(true);
  });

  // Final step: Screenshot (SC)
  await test.step('Take screenshot (SC)', async () => {
    const timestamp = new Date();
    const formattedTimestamp = `${timestamp.getFullYear()}.${String(timestamp.getMonth() + 1).padStart(2, '0')}.${String(timestamp.getDate()).padStart(2, '0')}-${String(timestamp.getHours()).padStart(2, '0')}.${String(timestamp.getMinutes()).padStart(2, '0')}.${String(timestamp.getSeconds()).padStart(2, '0')}`;
    await page.screenshot({ 
      path: getScreenshotPath(`TS.7.5.1-03-final-${formattedTimestamp}.png`) 
    });
  });

  // Expected Results: Content Detection Logic functionality verified
});