import { test, expect } from '@playwright/test';
import { getScreenshotPath } from '../../utils/paths';
import dotenv from 'dotenv';
import { microsoftLogin } from '../../utils/msLogin';
import { handleERSDDialog } from '../../utils/ersd-handler';

dotenv.config({ path: '.playwright.env' });

test.use({
  viewport: { height: 1080, width: 1920 },
  ignoreHTTPSErrors: true
});

test.setTimeout(180000); // 3 minutes - trial activation may take time

test('TS.7.2-01 Trial Only Availability', async ({ page }) => {
  // Setup: Login during trial period
  const email = process.env.MS_EMAIL_17NJ5D_MEGAN_BOWEN!;
  const password = process.env.MS_PASSWORD!;
  await microsoftLogin(page, email, password);
  await handleERSDDialog(page);

  // Step 1: Login during trial period
  await test.step('Login during trial period.', async () => {
    // Navigate to documents page
    await page.goto('/documents');
    await page.waitForLoadState('networkidle');
  });

  // Step 2: See "Create Demo Doc"
  await test.step('See "Create Demo Doc".', async () => {
    // Verify Create Demo Doc button is visible
    await expect(page.getByTestId('lsb.nav-main.documents-demoDocument')).toBeVisible();
  });

  // Step 3: Activate full license
  await test.step('Activate full license.', async () => {
    // Navigate to account page
    await page.getByRole('button', { name: 'Menu' }).click();
    await page.getByRole('link', { name: 'Account' }).click();
    await page.waitForLoadState('networkidle');

    // Activate license if trial mode
    const activateButton = page.getByRole('button', { name: 'Activate License' });
    if (await activateButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await activateButton.click();
      // Wait for activation to complete
      await page.waitForTimeout(3000);
    }
  });

  // Step 4: Button disappears
  await test.step('Button disappears.', async () => {
    // Navigate back to documents
    await page.goto('/documents');
    await page.waitForLoadState('networkidle');
    
    // Verify Create Demo Doc button is not visible
    await expect(page.getByTestId('lsb.nav-main.documents-demoDocument')).not.toBeVisible();
  });

  // Step 5: Trial-only feature (SC)
  await test.step('Trial-only feature (SC)', async () => {
    // Take screenshot showing absence of demo doc button
    const timestamp = new Date();
    const formattedTimestamp = `${timestamp.getFullYear()}.${String(timestamp.getMonth() + 1).padStart(2, '0')}.${String(timestamp.getDate()).padStart(2, '0')}-${String(timestamp.getHours()).padStart(2, '0')}.${String(timestamp.getMinutes()).padStart(2, '0')}.${String(timestamp.getSeconds()).padStart(2, '0')}`;
    await page.screenshot({ 
      path: getScreenshotPath(`TS.7.2-01-5-${formattedTimestamp}.png`) 
    });
  });

  // Expected Results:
  // 1. Trial active ✓
  // 2. Demo button visible ✓
  // 3. License activated ✓
  // 4. Button removed ✓
  // 5. Feature restricted ✓
});