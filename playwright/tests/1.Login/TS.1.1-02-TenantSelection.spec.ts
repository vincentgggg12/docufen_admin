import { test, expect } from '@playwright/test';
import * as dotenv from 'dotenv';
import { microsoftLogin } from '../utils/msLogin';
import { handleERSDDialog } from '../utils/ersd-handler';
import { getScreenshotPath } from '../utils/paths';

dotenv.config({ path: '.playwright.env' });

test.use({
  viewport: { height: 1080, width: 1920 },
  ignoreHTTPSErrors: true
});

test.setTimeout(120000); // 2 minutes

function formatTimestamp(date: Date): string {
  return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}-${String(date.getHours()).padStart(2, '0')}.${String(date.getMinutes()).padStart(2, '0')}.${String(date.getSeconds()).padStart(2, '0')}`;
}

test('TS.1.1-02 Tenant Selection', async ({ page }) => {
  // Test Procedure:
  // 1. Login as Julia (has access to both tenants)
  // 2. View tenant selection dropdown
  // 3. Select Pharma 17NJ5D
  // 4. Verify access to 17NJ5D
  // 5. Switch to Biotech XMWKB (SC)

  const baseUrl = process.env.BASE_URL;
  const email = process.env.MS_EMAIL_XMWKB_JULIA_SMITH!;
  const password = process.env.MS_PASSWORD!;

  // Setup: Login
  await page.goto(`${baseUrl}/login`);
  await microsoftLogin(page, email, password);
  // await handleERSDDialog(page);

  // Test Step 1: View tenant selection dropdown
  await test.step('View tenant selection dropdown', async () => {
    // Wait for page to load
    await page.waitForLoadState('domcontentloaded');
    
    // Look for tenant switcher - it may be in different places depending on the UI
    const tenantSelector = page.getByTestId('lsb.tenant-switcher.trigger')
    
    await expect(tenantSelector).toBeVisible({ timeout: 10000 });
    await tenantSelector.click();
    
    // Expected Result: Dropdown shows both tenants
    await expect(page.getByTestId('lsb.tenant-switcher.organization.xmwkb')).toBeVisible();
    await expect(page.getByTestId('lsb.tenant-switcher.organization.17nj5d')).toBeVisible();
  });

  // Test Step 2: Select Pharma 17NJ5D
  await test.step('Select Pharma 17NJ5D', async () => {
    await page.getByTestId('lsb.tenant-switcher.organization.17nj5d').click();
    
    // Wait for tenant switch to complete
    await page.waitForLoadState('networkidle');
    
    // Expected Result: 17NJ5D selected
    const selectedTenantButton = page.getByTestId('lsb.tenant-switcher.trigger');
    await expect(selectedTenantButton).toBeVisible();
    await expect(selectedTenantButton).toHaveText(/Pharma 17NJ5D/i);
  });

  // Test Step 4: Switch to Biotech XMWKB (SC)
  await test.step('Switch to Biotech XMWKB (SC)', async () => {
    // Open tenant switcher again
    const tenantSelector = page.getByTestId('lsb.tenant-switcher.trigger')
    
    await tenantSelector.click();
    await page.getByTestId('lsb.tenant-switcher.organization.xmwkb').click();
    
    // Wait for tenant switch
    await page.waitForLoadState('networkidle');
    
    // Take screenshot
    const timestamp = formatTimestamp(new Date());
    await page.screenshot({ 
      path: getScreenshotPath(`TS.1.1-02-5-${timestamp}.png`) 
    });
    
    // Expected Result: Successfully switches tenant
    const selectedTenantButton = page.getByTestId('lsb.tenant-switcher.trigger');
    await expect(selectedTenantButton).toBeVisible();
    await expect(selectedTenantButton).toHaveText(/Biotech XMWKB/i);
  });
});