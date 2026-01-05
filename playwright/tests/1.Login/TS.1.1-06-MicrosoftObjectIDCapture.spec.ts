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

test.setTimeout(60000); // 1 minute - medium complexity test

function formatTimestamp(date: Date): string {
  return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}-${String(date.getHours()).padStart(2, '0')}.${String(date.getMinutes()).padStart(2, '0')}.${String(date.getSeconds()).padStart(2, '0')}`;
}

test('TS.1.1-06 Microsoft Object ID Capture', async ({ page }) => {
  // Test Procedure:
  // 1. Login as Henrietta
  // 2. Navigate to Users page
  // 3. Expand Henrietta's details
  // 4. Verify Azure Object ID displayed
  // 5. Check ID format (SC)

  const baseUrl = process.env.BASE_URL;
  const email = process.env.MS_EMAIL_17NJ5D_HENRIETTA_MUELLER!;
  const password = process.env.MS_PASSWORD!;

  // Test Step 1: Login as Henrietta
  await test.step('Login as Henrietta', async () => {
    await page.goto(`${baseUrl}/login`);
    await microsoftLogin(page, email, password);
    await handleERSDDialog(page);
    
    // Expected Result: Login successful
    await expect(page.url()).not.toContain('/login');
  });

  // Test Step 2: Navigate to Users page
  await test.step('Navigate to Users page', async () => {
    // Click menu button
    await page.getByRole('button', { name: 'Menu' }).click();
    
    // Click Users link
    await page.getByRole('link', { name: 'Users' }).click();
    
    // Expected Result: Users page loads
    await expect(page).toHaveURL(/\/users/);
    await expect(page.getByRole('heading', { name: /Users/i })).toBeVisible();
  });

  // Test Step 3: Expand Henrietta's details
  await test.step("Expand Henrietta's details", async () => {
    // Find Henrietta in the users list
    const henriettaRow = page.locator('tr', { has: page.getByText('Henrietta Roberta') })
      .or(page.locator('[data-testid*="henrietta"]'))
      .or(page.locator('text=Henrietta Roberta').locator('..'));
    
    // Click to expand details
    // Look for expand button, chevron icon, or click the row itself
    const expandButton = henriettaRow.locator('button[aria-label*="expand"]')
      .or(henriettaRow.locator('svg[class*="chevron"]'))
      .or(henriettaRow.locator('[data-testid*="expand"]'));
    
    if (await expandButton.isVisible({ timeout: 5000 })) {
      await expandButton.click();
    } else {
      // Some implementations expand on row click
      await henriettaRow.click();
    }
    
    // Expected Result: User details expand
    await page.waitForTimeout(1000); // Allow expansion animation
  });

  // Test Step 4: Verify Azure Object ID displayed
  await test.step('Verify Azure Object ID displayed', async () => {
    // Look for Azure Object ID in various possible locations
    const objectIdLabel = page.getByText(/Azure Object ID|Object ID|Microsoft ID/i);
    
    // Expected Result: Object ID visible
    await expect(objectIdLabel).toBeVisible({ timeout: 10000 });
    
    // Find the actual ID value (usually next to or below the label)
    const objectIdValue = objectIdLabel.locator('..').locator('text=/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i')
      .or(page.getByText(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i));
    
    await expect(objectIdValue).toBeVisible();
  });

  // Test Step 5: Check ID format (SC)
  await test.step('Check ID format (SC)', async () => {
    // Take screenshot
    const timestamp = formatTimestamp(new Date());
    await page.screenshot({ 
      path: getScreenshotPath(`TS.1.1-06-5-${timestamp}.png`) 
    });
    
    // Get the Object ID value
    const objectIdValue = await page.getByText(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i).textContent();
    
    // Expected Result: Valid GUID format
    // GUID format: 8-4-4-4-12 hexadecimal characters
    const guidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    expect(objectIdValue).toBeTruthy();
    expect(objectIdValue!.trim()).toMatch(guidRegex);
  });
});