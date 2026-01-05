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

test('TS.7.8.10-04 Checkbox Tracking', async ({ page }) => {
  // Login as an executor
  const email = process.env.MS_EMAIL_17NJ5D_DAVID_SEAGAL!;
  const password = process.env.MS_PASSWORD!;
  await microsoftLogin(page, email, password);
  await handleERSDDialog(page);

  // Test Steps
  await test.step('1. Check box', async () => {
    // Navigate to a document in Execution stage
    await page.getByRole('button', { name: 'Menu' }).click();
    await page.getByRole('link', { name: 'Documents' }).click();
    await page.waitForLoadState('networkidle');
    
    // Find and open a document in Execution stage
    await page.getByText('Execution').first().click();
    
    // Find and click an unchecked checkbox
    const checkbox = page.locator('text=☐').first();
    await checkbox.click();
    
    // Wait for action to be processed
    await page.waitForTimeout(1000);
  });

  await test.step('2. View audit log', async () => {
    // Open audit log
    await page.getByRole('button', { name: 'Audit' }).click();
  });

  await test.step('3. Checkbox action logged', async () => {
    // Look for checkbox action in audit
    await expect(page.getByText('Checkbox checked')).toBeVisible();
  });

  await test.step('4. Location recorded', async () => {
    // Verify location/position information is recorded
    const auditEntry = page.locator('tr').filter({ hasText: 'Checkbox checked' });
    
    // Look for position or location details
    const hasLocation = await auditEntry.getByText(/position|location|cell/i).isVisible().catch(() => false);
    expect(hasLocation).toBe(true);
  });

  await test.step('5. User identified (SC)', async () => {
    // Verify user is shown in audit
    const auditEntry = page.locator('tr').filter({ hasText: 'Checkbox checked' });
    await expect(auditEntry.getByText('David Seagal')).toBeVisible();
    
    // Take screenshot showing audit entry
    const timestamp = formatTimestamp(new Date());
    await page.screenshot({ 
      path: getScreenshotPath(`TS.7.8.10-04-5-${timestamp}.png`) 
    });
  });

  // Expected Results:
  // 1. Checked ✓
  // 2. Audit viewed ✓
  // 3. Entry found ✓
  // 4. Position saved ✓
  // 5. Checker shown ✓
});