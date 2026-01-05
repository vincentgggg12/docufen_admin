import { test, expect, Page } from '@playwright/test';
import * as dotenv from 'dotenv';
import { microsoftLogin, handleERSDDialog } from '../../../src/utils/microsoftLogin';
import { getScreenshotPath, formatTimestamp } from '../../../src/utils/screenshotUtils';

dotenv.config({ path: '.playwright.env' });

test.use({
  viewport: { height: 1080, width: 1920 },
  ignoreHTTPSErrors: true
});

test.setTimeout(120000); // 2 minutes

test('TS.7.7.1-05 Signing Order Enforce', async ({ browser }) => {
  // Create two browser contexts for two different users
  const context1 = await browser.newContext({ ignoreHTTPSErrors: true });
  const context2 = await browser.newContext({ ignoreHTTPSErrors: true });
  
  const page1 = await context1.newPage();
  const page2 = await context2.newPage();

  // Login as User 1
  const email1 = process.env.MS_EMAIL_ORG_USER1!;
  const password = process.env.MS_PASSWORD!;
  await microsoftLogin(page1, email1, password);
  await handleERSDDialog(page1);

  // Login as User 2
  const email2 = process.env.MS_EMAIL_ORG_USER2!;
  await microsoftLogin(page2, email2, password);
  await handleERSDDialog(page2);

  // Test Steps
  await test.step('1. Enable signing order', async () => {
    // User 1 navigates to document settings
    await page1.getByRole('button', { name: 'Menu' }).click();
    await page1.getByRole('link', { name: 'Documents' }).click();
    await page1.waitForLoadState('networkidle');
    
    // Open document in Pre-Approval
    await page1.getByText('Pre-Approval').first().click();
    
    // Enable signing order
    await page1.getByRole('button', { name: 'Settings' }).click();
    await page1.getByLabel('Enable Signing Order').check();
    await page1.getByRole('button', { name: 'Save' }).click();
  });

  await test.step('2. User 2 tries first', async () => {
    // User 2 navigates to same document
    await page2.getByRole('button', { name: 'Menu' }).click();
    await page2.getByRole('link', { name: 'Documents' }).click();
    await page2.waitForLoadState('networkidle');
    
    // Open same document
    await page2.getByText('Pre-Approval').first().click();
    
    // Try to sign
    await page2.getByRole('button', { name: 'Sign' }).click();
  });

  await test.step('3. Blocked message', async () => {
    // Verify blocked message
    await expect(page2.getByText('Wait for User 1')).toBeVisible();
    await expect(page2.getByText('You must wait for previous signers')).toBeVisible();
  });

  await test.step('4. User 1 signs', async () => {
    // User 1 signs the document
    await page1.getByRole('button', { name: 'Sign' }).click();
    await page1.getByRole('combobox', { name: 'Role' }).selectOption('Reviewed By');
    await page1.getByRole('button', { name: 'Sign' }).click();
    
    // Wait for signature to be processed
    await page1.waitForTimeout(2000);
  });

  await test.step('5. User 2 can sign (SC)', async () => {
    // Refresh User 2's page
    await page2.reload();
    
    // User 2 can now sign
    await page2.getByRole('button', { name: 'Sign' }).click();
    await expect(page2.getByText('Digital Signature')).toBeVisible();
    
    // Take screenshot
    const timestamp = formatTimestamp(new Date());
    await page2.screenshot({ 
      path: getScreenshotPath(`TS.7.7.1-05-5-${timestamp}.png`) 
    });
  });

  // Cleanup
  await context1.close();
  await context2.close();

  // Expected Results:
  // 1. Order enabled ✓
  // 2. Out of order ✓
  // 3. "Wait for User 1" ✓
  // 4. First signs ✓
  // 5. Second allowed ✓
});