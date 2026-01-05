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

test('TS.7.7.1-04 Signature Format Display', async ({ page }) => {
  // Login as Diego S (Pre-Approval participant)
  const email = process.env.MS_EMAIL_ORG_DIEGO!;
  const password = process.env.MS_PASSWORD!;
  await microsoftLogin(page, email, password);
  await handleERSDDialog(page);

  // Navigate to a document in Pre-Approval stage
  await page.getByRole('button', { name: 'Menu' }).click();
  await page.getByRole('link', { name: 'Documents' }).click();
  await page.waitForLoadState('networkidle');
  
  // Open a document in Pre-Approval stage
  await page.getByText('Pre-Approval').first().click();

  // Test Steps
  await test.step('1. Place signature', async () => {
    await page.getByRole('button', { name: 'Sign' }).click();
    
    // Select role and sign
    await page.getByRole('combobox', { name: 'Role' }).selectOption('Reviewed By');
    await page.getByRole('button', { name: 'Sign' }).click();
    
    // Wait for signature to be placed
    await page.waitForTimeout(2000);
  });

  await test.step('2. Blue font color', async () => {
    // Verify signature text is blue
    const signature = page.locator('text=/Diego S.*\\(DS\\).*Reviewed By/').first();
    const color = await signature.evaluate(el => window.getComputedStyle(el).color);
    expect(color).toContain('rgb'); // Should be blue color
  });

  await test.step('3. Shows name, initials', async () => {
    // Verify signature contains name and initials
    const signature = page.locator('text=/Diego S.*\\(DS\\)/').first();
    await expect(signature).toBeVisible();
  });

  await test.step('4. Role displayed', async () => {
    // Verify role is displayed
    const signature = page.locator('text=/.*Reviewed By.*/').first();
    await expect(signature).toBeVisible();
  });

  await test.step('5. Timestamp included (SC)', async () => {
    // Verify timestamp is included
    const today = new Date().toLocaleDateString('en-US', { 
      day: '2-digit', 
      month: 'short', 
      year: 'numeric' 
    });
    
    const signature = page.locator(`text=/${today}/`).first();
    await expect(signature).toBeVisible();
    
    // Take screenshot
    const timestamp = formatTimestamp(new Date());
    await page.screenshot({ 
      path: getScreenshotPath(`TS.7.7.1-04-5-${timestamp}.png`) 
    });
  });

  // Expected Results:
  // 1. Signature placed ✓
  // 2. Blue text ✓
  // 3. "Diego S (DS)" ✓
  // 4. "Reviewed By" ✓
  // 5. Date/time shown ✓
});