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

test('TS.7.7.1-03 Signature Role Selection', async ({ page }) => {
  // Login as a Pre-Approval participant
  const email = process.env.MS_EMAIL_ORG_USERNAME!;
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
  await test.step('1. Sign dialog opens', async () => {
    await page.getByRole('button', { name: 'Sign' }).click();
    await expect(page.getByText('Digital Signature')).toBeVisible();
  });

  await test.step('2. Role dropdown shown', async () => {
    const roleDropdown = page.getByRole('combobox', { name: 'Role' });
    await expect(roleDropdown).toBeVisible();
  });

  await test.step('3. Select "Reviewed By"', async () => {
    const roleDropdown = page.getByRole('combobox', { name: 'Role' });
    await roleDropdown.selectOption('Reviewed By');
    await expect(roleDropdown).toHaveValue('Reviewed By');
  });

  await test.step('4. Change to "Approved By"', async () => {
    const roleDropdown = page.getByRole('combobox', { name: 'Role' });
    await roleDropdown.selectOption('Approved By');
    await expect(roleDropdown).toHaveValue('Approved By');
  });

  await test.step('5. Custom reason option (SC)', async () => {
    // Check for custom reason field
    const customReasonField = page.getByLabel('Custom Reason');
    await expect(customReasonField).toBeVisible();
    
    // Verify other role options are available
    const roleDropdown = page.getByRole('combobox', { name: 'Role' });
    await roleDropdown.click();
    
    // Take screenshot showing role options
    const timestamp = formatTimestamp(new Date());
    await page.screenshot({ 
      path: getScreenshotPath(`TS.7.7.1-03-5-${timestamp}.png`) 
    });
  });

  // Expected Results:
  // 1. Dialog shown ✓
  // 2. Roles available ✓
  // 3. Reviewed selected ✓
  // 4. Changed role ✓
  // 5. Custom available ✓
});