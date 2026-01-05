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

test('TS.7.7.2-04 Late Entry Text', async ({ page }) => {
  // Login as a Pre-Approval participant
  const email = process.env.MS_EMAIL_ORG_USERNAME!;
  const password = process.env.MS_PASSWORD!;
  await microsoftLogin(page, email, password);
  await handleERSDDialog(page);

  // Navigate to a document in Pre-Approval stage
  await page.getByRole('button', { name: 'Menu' }).click();
  await page.getByRole('link', { name: 'Documents' }).click();
  await page.waitForLoadState('networkidle');
  
  // Find and open a document in Pre-Approval stage
  await page.getByText('Pre-Approval').first().click();
  await page.waitForLoadState('networkidle');

  // Test Steps
  await test.step('1. Enable late entry', async () => {
    // Click on the late entry toggle or button
    const lateEntryButton = page.getByRole('button', { name: 'Late Entry' });
    const lateEntryToggle = page.getByLabel('Late Entry Mode');
    
    if (await lateEntryButton.isVisible()) {
      await lateEntryButton.click();
    } else if (await lateEntryToggle.isVisible()) {
      await lateEntryToggle.click();
    }
    
    // Wait for late entry dialog to appear
    await expect(page.getByRole('dialog').filter({ hasText: 'Late Entry' })).toBeVisible();
    
    // Select a past date
    const dateInput = page.getByLabel('Date', { exact: true });
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const dateString = yesterday.toISOString().split('T')[0];
    await dateInput.fill(dateString);
    
    // Enter reason for late entry
    await page.getByLabel('Reason').fill('Document was reviewed yesterday but not annotated');
    
    // Confirm late entry mode
    await page.getByRole('button', { name: 'Enable Late Entry' }).click();
    
    // Verify late entry mode is active
    await expect(page.getByText('Late Entry Mode Active')).toBeVisible();
  });

  await test.step('2. Add text', async () => {
    // Click on the text annotation tool
    await page.getByRole('button', { name: 'Text', exact: true }).click();
    
    // Click on the document and add text
    const documentArea = page.locator('.document-viewer, canvas').first();
    await documentArea.click({ position: { x: 400, y: 300 } });
    
    // Type late entry text
    await page.keyboard.type('Late entry review completed');
    await page.keyboard.press('Enter');
    
    // Wait for text to be saved
    await page.waitForTimeout(2000);
  });

  await test.step('3. Clock icon shown', async () => {
    // Verify clock icon is displayed with the late entry text
    const textAnnotation = page.locator('text=Late entry review completed').first();
    await expect(textAnnotation).toBeVisible();
    
    // Look for clock icon near the text
    const clockIcon = page.locator('[data-testid="clock-icon"], .clock-icon, svg[aria-label="Late Entry"]');
    await expect(clockIcon).toBeVisible();
  });

  await test.step('4. Original date recorded', async () => {
    // Open audit log to verify the original date
    await page.getByRole('button', { name: 'Audit Log' }).click();
    await page.waitForLoadState('networkidle');
    
    // Find the late entry audit record
    const auditEntry = page.locator('tr').filter({ hasText: 'PreApproveText' }).first();
    
    // Expand details if needed
    const expandButton = auditEntry.locator('button[aria-label="Expand"]');
    if (await expandButton.isVisible()) {
      await expandButton.click();
    }
    
    // Verify the past date is recorded
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const expectedDate = yesterday.toLocaleDateString();
    
    await expect(page.locator(`text=${expectedDate}`)).toBeVisible();
  });

  await test.step('5. Reason captured (SC)', async () => {
    // Verify the late entry reason is captured
    await expect(page.locator('text=Document was reviewed yesterday but not annotated')).toBeVisible();
    
    // Take screenshot showing late entry details
    const timestamp = formatTimestamp(new Date());
    await page.screenshot({ 
      path: getScreenshotPath(`TS.7.7.2-04-5-${timestamp}.png`) 
    });
  });

  // Expected Results:
  // 1. Late mode on ✓
  // 2. Text added ✓
  // 3. Clock visible ✓
  // 4. Past date saved ✓
  // 5. Reason logged ✓
});