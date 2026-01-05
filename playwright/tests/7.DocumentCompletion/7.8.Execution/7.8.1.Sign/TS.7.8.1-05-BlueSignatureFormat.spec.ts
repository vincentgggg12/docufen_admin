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

test('TS.7.8.1-05 Blue Signature Format', async ({ page }) => {
  // Login as an executor
  const email = process.env.MS_EMAIL_17NJ5D_DAVID_SEAGAL!;
  const password = process.env.MS_PASSWORD!;
  await microsoftLogin(page, email, password);
  await handleERSDDialog(page);

  // Test Steps
  await test.step('1. Place signature', async () => {
    // Navigate to a document in Execution stage
    await page.getByRole('button', { name: 'Menu' }).click();
    await page.getByRole('link', { name: 'Documents' }).click();
    await page.waitForLoadState('networkidle');
    
    // Find and open a document in Execution stage
    await page.getByText('Execution').first().click();
    
    // Sign the document
    await page.getByRole('button', { name: 'Sign' }).click();
    await page.getByLabel('Performed By').check();
    await page.getByRole('button', { name: 'Sign', exact: true }).click();
    
    // Wait for signature to be placed
    await page.waitForTimeout(2000);
  });

  await test.step('2. Blue font used', async () => {
    // Find signature element and verify it has blue color
    const signature = page.locator('text=/David Seagal/i').first();
    await expect(signature).toBeVisible();
    
    // Check CSS color property
    const color = await signature.evaluate(el => 
      window.getComputedStyle(el).color
    );
    expect(color).toMatch(/blue|rgb\(0,\s*0,\s*255\)/i);
  });

  await test.step('3. In table cell', async () => {
    // Verify signature is within a table cell
    const signatureCell = page.locator('td').filter({ hasText: /David Seagal/i });
    await expect(signatureCell).toBeVisible();
  });

  await test.step('4. Shows all details', async () => {
    // Verify signature contains name, role, and timestamp
    const signatureText = await page.locator('text=/David Seagal/i').first().textContent();
    expect(signatureText).toContain('David Seagal');
    expect(signatureText).toMatch(/Performed By/i);
    expect(signatureText).toMatch(/\d{1,2}-\w{3}-\d{4}/); // Date format
  });

  await test.step('5. Formatted correctly (SC)', async () => {
    // Take screenshot showing blue signature format
    const timestamp = formatTimestamp(new Date());
    await page.screenshot({ 
      path: getScreenshotPath(`TS.7.8.1-05-5-${timestamp}.png`) 
    });
  });

  // Expected Results:
  // 1. Signed ✓
  // 2. Blue color ✓
  // 3. Cell location ✓
  // 4. Name/role/time ✓
  // 5. Proper format ✓
});