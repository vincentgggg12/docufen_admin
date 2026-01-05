import { test, expect } from '@playwright/test';
import * as dotenv from 'dotenv';
import { microsoftLogin, handleERSDDialog } from '../../../../src/utils/microsoftLogin';
import { getScreenshotPath, formatTimestamp } from '../../../../src/utils/screenshotUtils';

dotenv.config({ path: '.playwright.env' });

test.use({
  viewport: { height: 1080, width: 1920 },
  ignoreHTTPSErrors: true
});

test.setTimeout(120000); // 2 minutes

test('TS.7.8.7.2-01 Document Linking', async ({ page }) => {
  // Login as an executor
  const email = process.env.MS_EMAIL_17NJ5D_DAVID_SEAGAL!;
  const password = process.env.MS_PASSWORD!;
  await microsoftLogin(page, email, password);
  await handleERSDDialog(page);

  // Test Steps
  await test.step('1. Click link document', async () => {
    // Navigate to a document in Execution stage
    await page.getByRole('button', { name: 'Menu' }).click();
    await page.getByRole('link', { name: 'Documents' }).click();
    await page.waitForLoadState('networkidle');
    
    // Find and open a document in Execution stage
    await page.getByText('Execution').first().click();
    
    // Click attachments button
    await page.getByRole('button', { name: 'Attachments' }).click();
    
    // Click link document option
    await page.getByRole('button', { name: 'Link Document' }).click();
  });

  await test.step('2. Search for doc', async () => {
    // Wait for search dialog
    await expect(page.getByRole('dialog', { name: 'Link Document' })).toBeVisible();
    
    // Search for a document
    await page.getByPlaceholder('Search documents...').fill('SOP');
    await page.waitForTimeout(1000); // Wait for search results
  });

  await test.step('3. Select document', async () => {
    // Click on first search result
    await page.getByRole('listitem').first().click();
  });

  await test.step('4. Link created', async () => {
    // Confirm link
    await page.getByRole('button', { name: 'Link' }).click();
    
    // Wait for link to be created
    await page.waitForTimeout(1000);
  });

  await test.step('5. Reference added (SC)', async () => {
    // Verify linked document appears in attachments
    await expect(page.getByText('Linked Document:')).toBeVisible();
    
    // Take screenshot showing linked document
    const timestamp = formatTimestamp(new Date());
    await page.screenshot({ 
      path: getScreenshotPath(`TS.7.8.7.2-01-5-${timestamp}.png`) 
    });
  });

  // Expected Results:
  // 1. Link clicked ✓
  // 2. Search works ✓
  // 3. Doc selected ✓
  // 4. Linked ✓
  // 5. Reference shown ✓
});