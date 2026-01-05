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

test('TS.7.8.7.2-03 Link Display', async ({ page }) => {
  // Login as an executor
  const email = process.env.MS_EMAIL_17NJ5D_DAVID_SEAGAL!;
  const password = process.env.MS_PASSWORD!;
  await microsoftLogin(page, email, password);
  await handleERSDDialog(page);

  // Test Steps
  await test.step('1. View linked doc', async () => {
    // Navigate to a document in Execution stage
    await page.getByRole('button', { name: 'Menu' }).click();
    await page.getByRole('link', { name: 'Documents' }).click();
    await page.waitForLoadState('networkidle');
    
    // Find and open a document that has linked documents
    await page.getByText('Execution').first().click();
    
    // Open attachments panel
    await page.getByRole('button', { name: 'Attachments' }).click();
    
    // Look for linked documents section
    const linkedDocsSection = page.getByText('Linked Documents');
    await expect(linkedDocsSection).toBeVisible();
  });

  await test.step('2. Shows doc name', async () => {
    // Verify document name is displayed
    const linkedDoc = page.locator('.linked-document, [data-testid="linked-doc"]').first();
    const docName = await linkedDoc.getByText(/SOP|Protocol|Form/i).textContent();
    expect(docName).toBeTruthy();
  });

  await test.step('3. Shows doc ID', async () => {
    // Verify document ID is displayed
    const linkedDoc = page.locator('.linked-document, [data-testid="linked-doc"]').first();
    const docId = await linkedDoc.getByText(/DOC-\d+|[A-Z]+-\d+/i).textContent();
    expect(docId).toBeTruthy();
  });

  await test.step('4. Clickable link', async () => {
    // Verify link is clickable
    const link = page.locator('a[href*="document"], [role="link"]').filter({ hasText: /SOP|Protocol|Form/i }).first();
    await expect(link).toBeVisible();
    await expect(link).toHaveAttribute('href', /.+/);
  });

  await test.step('5. Clear reference (SC)', async () => {
    // Take screenshot showing linked document display
    const timestamp = formatTimestamp(new Date());
    await page.screenshot({ 
      path: getScreenshotPath(`TS.7.8.7.2-03-5-${timestamp}.png`) 
    });
  });

  // Expected Results:
  // 1. Link viewed ✓
  // 2. Name visible ✓
  // 3. ID shown ✓
  // 4. Can click ✓
  // 5. Good display ✓
});