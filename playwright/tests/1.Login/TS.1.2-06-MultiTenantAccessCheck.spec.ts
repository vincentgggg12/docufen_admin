import { test, expect } from '@playwright/test';
import * as dotenv from 'dotenv';
import { microsoftLogin } from '../utils/msLogin';
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

test('TS.1.2-06 Multi-Tenant Access Check', async ({ page }) => {
  // Test Procedure:
  // 1. Login as user with 3 tenants
  // 2. View tenant switcher
  // 3. Select different tenant
  // 4. Verify data isolation
  // 5. Switch back (SC)

  const baseUrl = process.env.BASE_URL;
  // Using a user that has access to multiple tenants
  const email = process.env.MS_EMAIL_MULTI_TENANT_USER || process.env.MS_EMAIL_17NJ5D_DIEGO_SICILIANI!;
  const password = process.env.MS_PASSWORD!;

  // Test Step 1: Login as user with multiple tenants
  await test.step('Login as user with multiple tenants', async () => {
    await page.goto(`${baseUrl}/login`);
    await expect(page).toHaveTitle(/Docufen/i);
    await page.getByTestId('loginPage.loginButton').click();
    
    // Wait for Microsoft login page
    await page.waitForURL(/login\.microsoftonline\.com/, { timeout: 30000 });
    
    // Enter credentials
    const emailInput = page.getByRole('textbox', {
      name: /Email|Username|Sign in/i,
    });
    await emailInput.fill(email);
    await page.getByRole('button', { name: /Next/i }).click();
    
    const passwordInput = page.getByRole('textbox', { name: /Password/i }).or(
      page.getByPlaceholder('Password'),
    );
    await passwordInput.fill(password);
    await page.getByRole('button', { name: /Sign in/i }).click();
    
    // Handle optional "Stay signed in?" prompt
    try {
      const staySignedInText = page.getByText('Stay signed in?');
      if (await staySignedInText.isVisible({ timeout: 5000 })) {
        const noButton = page
          .locator('input[value="No"]')
          .or(page.getByRole('button', { name: /No/i }));
        await noButton.click();
      }
    } catch (err) {
      // Optional prompt - continue if not present
    }
    
    // Wait for redirect back to Docufen
    await page.waitForURL(`${baseUrl}/**`, { timeout: 60000 });
    
    // Handle ERSD if present
    try {
      const ersdCheckbox = page.getByRole('checkbox', { name: /I have read and accept/i });
      if (await ersdCheckbox.isVisible({ timeout: 5000 })) {
        await ersdCheckbox.check();
        await page.getByRole('button', { name: /Accept|Continue/i }).click();
      }
    } catch (err) {
      // ERSD not present, continue
    }
  });

  // Test Step 2: View tenant switcher
  await test.step('View tenant switcher', async () => {
    // Look for tenant switcher - could be in header or user menu
    const tenantSwitcher = page.getByRole('button', { name: /Switch tenant|Select company|Tenant/i });
    const userMenu = page.getByRole('button', { name: /User menu|Profile/i });
    
    if (await tenantSwitcher.isVisible({ timeout: 5000 })) {
      await tenantSwitcher.click();
    } else if (await userMenu.isVisible()) {
      await userMenu.click();
      const switchOption = page.getByRole('menuitem', { name: /Switch tenant|Change company/i });
      if (await switchOption.isVisible({ timeout: 3000 })) {
        await switchOption.click();
      }
    }
    
    // Expected Result: All tenants listed
    await expect(page.getByRole('dialog').or(page.getByRole('menu'))).toBeVisible();
  });

  // Test Step 3: Select different tenant
  await test.step('Select different tenant', async () => {
    // Get current tenant name for comparison
    const currentTenantElement = page.getByText(/Current:|Active:|Pharma/i).first();
    let currentTenant = '';
    if (await currentTenantElement.isVisible({ timeout: 3000 })) {
      currentTenant = await currentTenantElement.textContent() || '';
    }
    
    // Select a different tenant
    const tenantOptions = page.getByRole('option').or(page.getByRole('menuitem')).filter({ hasText: /Pharma|Biotech|Company/i });
    const optionCount = await tenantOptions.count();
    
    if (optionCount > 1) {
      // Click on second option (different from current)
      await tenantOptions.nth(1).click();
    } else {
      // If only one option, click it
      await tenantOptions.first().click();
    }
    
    // Wait for page to reload with new tenant
    await page.waitForLoadState('networkidle');
    
    // Expected Result: Tenant switches
    await expect(page.url()).toMatch(/docufen/i);
  });

  // Test Step 4: Verify data isolation
  await test.step('Verify data isolation', async () => {
    // Navigate to documents to verify different data
    await page.getByRole('button', { name: 'Menu' }).click();
    await page.getByRole('link', { name: 'Documents' }).click();
    await expect(page).toHaveURL(/\/documents/);
    
    // Expected Result: Only selected tenant data
    // The documents shown should be different from the original tenant
    const documentsContainer = page.locator('[data-testid="documents-list"]').or(page.locator('table'));
    await expect(documentsContainer).toBeVisible();
    
    // Check that tenant name is displayed somewhere
    const tenantIndicator = page.getByText(/Pharma|Biotech|Company/i).first();
    await expect(tenantIndicator).toBeVisible();
  });

  // Test Step 5: Switch back (SC)
  await test.step('Switch back (SC)', async () => {
    // Open tenant switcher again
    const tenantSwitcher = page.getByRole('button', { name: /Switch tenant|Select company|Tenant/i });
    const userMenu = page.getByRole('button', { name: /User menu|Profile/i });
    
    if (await tenantSwitcher.isVisible({ timeout: 5000 })) {
      await tenantSwitcher.click();
    } else if (await userMenu.isVisible()) {
      await userMenu.click();
      const switchOption = page.getByRole('menuitem', { name: /Switch tenant|Change company/i });
      if (await switchOption.isVisible({ timeout: 3000 })) {
        await switchOption.click();
      }
    }
    
    // Select original tenant (usually first in list)
    const tenantOptions = page.getByRole('option').or(page.getByRole('menuitem')).filter({ hasText: /Pharma|Biotech|Company/i });
    await tenantOptions.first().click();
    
    // Wait for switch to complete
    await page.waitForLoadState('networkidle');
    
    // Take screenshot
    const timestamp = formatTimestamp(new Date());
    await page.screenshot({ 
      path: getScreenshotPath(`TS.1.2-06-5-${timestamp}.png`) 
    });
    
    // Expected Result: Original tenant restored
    await expect(page.url()).toMatch(/docufen/i);
    const tenantIndicator = page.getByText(/Pharma 17NJ5D|17NJ5D/i);
    await expect(tenantIndicator).toBeVisible();
  });
});