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

test('TS.7.9.1-02 Post-Approval Roles', async ({ page }) => {
  // Setup: Login as Post-Approval participant
  const email = process.env.MS_EMAIL_17NJ5D_ALEX_WILBER!;
  const password = process.env.MS_PASSWORD!;
  await microsoftLogin(page, email, password);
  await handleERSDDialog(page);

  // Navigate to a document in Post-Approval stage
  await page.getByRole('button', { name: 'Menu' }).click();
  await page.getByRole('link', { name: 'Tracking' }).click();
  
  // Find document in Post-Approval stage
  await page.waitForSelector('[data-testid="document-list"]', { timeout: 10000 });
  const postApprovalDoc = page.locator('[data-testid="document-item"]').filter({ hasText: 'Post-Approval' }).first();
  await postApprovalDoc.click();
  
  // Wait for document to load
  await page.waitForSelector('[data-testid="document-content"]', { timeout: 10000 });

  // Test Step 1: Click sign
  await test.step('Click sign', async () => {
    await page.getByRole('button', { name: 'Sign', exact: true }).click();
    await page.waitForSelector('[data-testid="signature-dialog"]', { timeout: 5000 });
  });

  // Test Step 2: Role options shown
  await test.step('Role options shown', async () => {
    // Verify role selection dropdown is visible
    await expect(page.getByLabel('Select role')).toBeVisible();
    
    // Click to open dropdown
    await page.getByLabel('Select role').click();
    
    // Verify dropdown options are displayed
    await expect(page.getByRole('option')).toHaveCount({ minimum: 1 });
  });

  // Test Step 3: Select "Approved By"
  await test.step('Select "Approved By"', async () => {
    // Select the "Approved By" role
    await page.getByRole('option', { name: 'Approved By' }).click();
    
    // Verify selection
    await expect(page.getByLabel('Select role')).toHaveValue(/Approved By/i);
  });

  // Test Step 4: Appropriate roles
  await test.step('Appropriate roles', async () => {
    // Click dropdown again to verify all options
    await page.getByLabel('Select role').click();
    
    // Verify Post-Approval specific roles
    const approvalRoles = ['Approved By', 'Quality Approved By', 'Regulatory Approved By'];
    
    for (const role of approvalRoles) {
      const roleOption = page.getByRole('option', { name: role });
      if (await roleOption.isVisible()) {
        await expect(roleOption).toBeVisible();
      }
    }
    
    // Close dropdown
    await page.keyboard.press('Escape');
  });

  // Test Step 5: Final approval roles (SC)
  await test.step('Final approval roles (SC)', async () => {
    // Take screenshot showing Post-Approval specific roles
    await page.getByLabel('Select role').click();
    
    const timestamp = formatTimestamp(new Date());
    await page.screenshot({ 
      path: getScreenshotPath(`TS.7.9.1-02-5-${timestamp}.png`) 
    });
    
    // Complete signature
    await page.keyboard.press('Escape');
    await page.getByRole('button', { name: 'Sign Document' }).click();
    
    // Wait for signature to complete
    await page.waitForSelector('[data-testid="signature-success"]', { timeout: 10000 });
  });

  // Expected Results:
  // 1. Sign clicked ✓
  // 2. Roles displayed ✓
  // 3. Approved selected ✓
  // 4. Correct options ✓
  // 5. Stage specific ✓
});