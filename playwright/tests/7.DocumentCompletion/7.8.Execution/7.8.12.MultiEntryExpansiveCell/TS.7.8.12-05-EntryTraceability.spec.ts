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

test('TS.7.8.12-05 Entry Traceability', async ({ page }) => {
  // Login as an executor
  const email = process.env.MS_EMAIL_17NJ5D_DAVID_SEAGAL!;
  const password = process.env.MS_PASSWORD!;
  await microsoftLogin(page, email, password);
  await handleERSDDialog(page);

  // Test Steps
  await test.step('1. Check audit for cell', async () => {
    // Navigate to a document in Execution stage
    await page.getByRole('button', { name: 'Menu' }).click();
    await page.getByRole('link', { name: 'Documents' }).click();
    await page.waitForLoadState('networkidle');
    
    // Find and open a document in Execution stage
    await page.getByText('Execution').first().click();
    
    // Add multiple entries to track
    const cell = page.locator('td[contenteditable="true"]').first();
    
    // First entry
    await cell.click();
    await page.getByPlaceholder('Enter custom text').fill('Entry 1 for audit tracking');
    await page.getByRole('button', { name: 'Insert' }).click();
    await page.waitForTimeout(1000);
    
    // Second entry
    await cell.click();
    await page.getByPlaceholder('Enter custom text').fill('Entry 2 for audit tracking');
    await page.getByRole('button', { name: 'Insert' }).click();
    await page.waitForTimeout(1000);
    
    // Open audit log
    await page.getByRole('button', { name: 'Audit' }).click();
  });

  await test.step('2. All entries logged', async () => {
    // Verify both entries appear in audit
    await expect(page.getByText('Entry 1 for audit tracking')).toBeVisible();
    await expect(page.getByText('Entry 2 for audit tracking')).toBeVisible();
  });

  await test.step('3. Sequence preserved', async () => {
    // Verify entries are in chronological order
    const auditEntries = page.locator('tr').filter({ hasText: /Entry \d for audit tracking/ });
    const count = await auditEntries.count();
    expect(count).toBe(2);
    
    // First entry should appear before second in the audit trail
    const firstEntryIndex = await page.locator('text=Entry 1 for audit tracking').first().evaluate(el => {
      const row = el.closest('tr');
      return Array.from(row?.parentElement?.children || []).indexOf(row as Element);
    });
    
    const secondEntryIndex = await page.locator('text=Entry 2 for audit tracking').first().evaluate(el => {
      const row = el.closest('tr');
      return Array.from(row?.parentElement?.children || []).indexOf(row as Element);
    });
    
    // In audit logs, newer entries typically appear first
    expect(secondEntryIndex).toBeLessThan(firstEntryIndex);
  });

  await test.step('4. Users identified', async () => {
    // Verify user is shown for each entry
    const auditEntries = page.locator('tr').filter({ hasText: /Entry \d for audit tracking/ });
    
    for (let i = 0; i < 2; i++) {
      const entry = auditEntries.nth(i);
      await expect(entry.getByText('David Seagal')).toBeVisible();
    }
  });

  await test.step('5. Full history (SC)', async () => {
    // Take screenshot showing complete audit trail
    const timestamp = formatTimestamp(new Date());
    await page.screenshot({ 
      path: getScreenshotPath(`TS.7.8.12-05-5-${timestamp}.png`) 
    });
  });

  // Expected Results:
  // 1. Audit checked ✓
  // 2. Each entry found ✓
  // 3. Order correct ✓
  // 4. Authors shown ✓
  // 5. Complete trail ✓
});