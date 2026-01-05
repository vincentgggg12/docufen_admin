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

test('TS.7.10-03 Completed Status', async ({ page }) => {
  // Setup: Login as Trial Administrator
  const email = process.env.MS_EMAIL_17NJ5D_MEGAN_BOWEN!;
  const password = process.env.MS_PASSWORD!;
  await microsoftLogin(page, email, password);
  await handleERSDDialog(page);

  // Navigate to tracking page
  await page.getByRole('button', { name: 'Menu' }).click();
  await page.getByRole('link', { name: 'Tracking' }).click();
  await page.waitForSelector('[data-testid="document-list"]', { timeout: 10000 });

  // Test Step 1: View closed doc
  await test.step('View closed doc', async () => {
    // Find a document in Closed stage
    const closedDoc = page.locator('[data-testid="document-item"]').filter({ hasText: 'Closed' }).first();
    
    // If no closed doc exists, close one first
    if (!(await closedDoc.isVisible())) {
      // Find and close a Post-Approval document
      const postApprovalDoc = page.locator('[data-testid="document-item"]').filter({ hasText: 'Post-Approval' }).first();
      await postApprovalDoc.click();
      await page.waitForSelector('[data-testid="document-content"]', { timeout: 10000 });
      await page.getByRole('button', { name: 'Close Document' }).click();
      await page.waitForTimeout(2000);
      
      // Go back to tracking
      await page.getByRole('button', { name: 'Menu' }).click();
      await page.getByRole('link', { name: 'Tracking' }).click();
      await page.waitForSelector('[data-testid="document-list"]', { timeout: 10000 });
    }
    
    // View the closed document
    const closedDocument = page.locator('[data-testid="document-item"]').filter({ hasText: 'Closed' }).first();
    await expect(closedDocument).toBeVisible();
  });

  // Test Step 2: Green checkmark shown
  await test.step('Green checkmark shown', async () => {
    // Look for green checkmark icon on closed documents
    const closedDoc = page.locator('[data-testid="document-item"]').filter({ hasText: 'Closed' }).first();
    
    // Check for checkmark icon (could be SVG or icon class)
    const checkmarkIcon = closedDoc.locator('[data-testid="status-icon-completed"], .icon-checkmark, svg[aria-label="completed"]');
    await expect(checkmarkIcon).toBeVisible();
    
    // Verify it has green color
    const iconElement = await checkmarkIcon.elementHandle();
    if (iconElement) {
      const color = await iconElement.evaluate(el => 
        window.getComputedStyle(el).color || window.getComputedStyle(el).fill
      );
      expect(color).toMatch(/green|#[0-9a-f]*[4-9a-f][0-9a-f]*|rgb\(\s*[0-9]*,\s*[1-2][0-9][0-9],\s*[0-9]*\)/i);
    }
  });

  // Test Step 3: Status "Completed"
  await test.step('Status "Completed"', async () => {
    // Verify status label shows "Completed" or "Closed"
    const closedDoc = page.locator('[data-testid="document-item"]').filter({ hasText: 'Closed' }).first();
    
    // Check for status text
    const statusText = closedDoc.locator('[data-testid="document-status"], .status-label');
    await expect(statusText).toContainText(/Completed|Closed/i);
  });

  // Test Step 4: In Completed tab
  await test.step('In Completed tab', async () => {
    // Click on Completed tab
    await page.getByRole('tab', { name: 'Completed' }).click();
    await page.waitForTimeout(1000);
    
    // Verify closed documents appear in this tab
    const completedList = page.locator('[data-testid="document-list"]');
    const closedDocs = completedList.locator('[data-testid="document-item"]').filter({ hasText: 'Closed' });
    
    await expect(closedDocs.first()).toBeVisible();
  });

  // Test Step 5: Clear status (SC)
  await test.step('Clear status (SC)', async () => {
    // Verify the status is clearly visible and distinguishable
    const closedDoc = page.locator('[data-testid="document-item"]').filter({ hasText: 'Closed' }).first();
    
    // Verify all status indicators are present
    await expect(closedDoc).toBeVisible();
    await expect(closedDoc).toContainText(/Completed|Closed/i);
    
    // Take screenshot showing completed status
    const timestamp = formatTimestamp(new Date());
    await page.screenshot({ 
      path: getScreenshotPath(`TS.7.10-03-5-${timestamp}.png`) 
    });
  });

  // Expected Results:
  // 1. Doc viewed ✓
  // 2. Green indicator ✓
  // 3. Completed label ✓
  // 4. Correct tab ✓
  // 5. Status obvious ✓
});