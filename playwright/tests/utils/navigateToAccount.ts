export const navigateToAccount = async (page) => {
    try {
      // Look for the tenant switcher
      // await page.waitForSelector('[data-testid="lsb.tenant-switcher.trigger"]', { timeout: 5000 });
      await page.waitForLoadState("domcontentloaded")
      await page.getByTestId("lsb.tenant-switcher.trigger").first().click({ timeout: 5000 });
      
      // Wait for the organization menu to appear
      await page.waitForSelector('[data-testid*="lsb.tenant-switcher.organization"]', { timeout: 5000 });
      
      // Click on the organization
      await page.getByTestId("lsb.tenant-switcher.organization.17nj5d").first().click({ timeout: 5000 });
      
      // Look for Account option in the navigation
      await page.getByTestId('lsb.nav-main.nav-account').click({ timeout: 5000 });
    } catch {
      // If that doesn't work, try direct navigation
      await page.goto('/account');
    }
    
    // Wait for the account page to load
    await page.waitForLoadState('domcontentloaded');
  }
