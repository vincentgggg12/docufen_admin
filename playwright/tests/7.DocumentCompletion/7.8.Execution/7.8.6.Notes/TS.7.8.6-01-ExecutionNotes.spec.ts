import { test, expect } from '@playwright/test';
import * as dotenv from 'dotenv';
import { microsoftLogin, handleERSDDialog } from '../../../src/utils/microsoftLogin';
import { getScreenshotPath, formatTimestamp } from '../../../src/utils/screenshotUtils';

dotenv.config({ path: '.playwright.env' });

test.use({
  viewport: { height: 1080, width: 1920 },
  ignoreHTTPSErrors: true
});

test.setTimeout(120000); // 2 minutes

test('TS.7.8.6-01 Execution Notes', async ({ page }) => {
  // Login as an executor
  const email = process.env.MS_EMAIL_17NJ5D_DAVID_SEAGAL!;
  const password = process.env.MS_PASSWORD!;
  await microsoftLogin(page, email, password);
  await handleERSDDialog(page);

  // Test Steps
  await test.step('1. Add note in execution', async () => {
    // Navigate to a document in Execution stage
    await page.getByRole('button', { name: 'Menu' }).click();
    await page.getByRole('link', { name: 'Documents' }).click();
    await page.waitForLoadState('networkidle');
    
    // Find and open a document in Execution stage
    await page.getByText('Execution').first().click();
    
    // Click on notes/chat button
    await page.getByRole('button', { name: 'Notes' }).click();
  });

  await test.step('2. Type comment', async () => {
    // Type a comment in the notes field
    await page.getByPlaceholder('Add a note...').fill('Test execution completed successfully');
  });

  await test.step('3. Save note', async () => {
    // Save the note
    await page.getByRole('button', { name: 'Send' }).click();
  });

  await test.step('4. Shows in chat', async () => {
    // Verify note appears in the chat/notes sidebar
    await expect(page.getByText('Test execution completed successfully')).toBeVisible();
  });

  await test.step('5. Note functional (SC)', async () => {
    // Take screenshot showing note in chat sidebar
    const timestamp = formatTimestamp(new Date());
    await page.screenshot({ 
      path: getScreenshotPath(`TS.7.8.6-01-5-${timestamp}.png`) 
    });
  });

  // Expected Results:
  // 1. Note added ✓
  // 2. Comment entered ✓
  // 3. Saved ✓
  // 4. In sidebar ✓
  // 5. Works correctly ✓
});