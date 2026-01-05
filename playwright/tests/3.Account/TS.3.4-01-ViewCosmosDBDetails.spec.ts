import { test, expect } from '@playwright/test';
import * as dotenv from 'dotenv';
import { microsoftLogin, handleERSDDialog } from '../../src/utils/microsoftLogin';
import { getScreenshotPath, formatTimestamp } from '../../src/utils/screenshotUtils';

dotenv.config({ path: '.playwright.env' });

test.use({
  viewport: { height: 1080, width: 1920 },
  ignoreHTTPSErrors: true
});

test.setTimeout(120000); // 2 minutes

test('TS.3.4-01 View Cosmos DB Details', async ({ page }) => {
  // Login as Megan (Admin)
  const email = process.env.MS_EMAIL_17NJ5D_MEGAN_BOWEN!;
  const password = process.env.MS_PASSWORD!;
  await microsoftLogin(page, email, password);
  await handleERSDDialog(page);

  // Test Step 1: Navigate to Account page
  await test.step('Navigate to Account page', async () => {
    await page.getByRole('button', { name: 'Menu' }).click();
    await page.getByRole('link', { name: 'Account' }).click();
  });

  // Test Step 2: View CosmosDB panel (SC)
  await test.step('View CosmosDB panel (SC)', async () => {
    // Wait for the page to load
    await page.waitForSelector('[data-testid="cosmosdb-panel"], .cosmosdb-section, text=/CosmosDB/i', { timeout: 10000 });
    
    // Take screenshot
    const timestamp = formatTimestamp(new Date());
    await page.screenshot({ 
      path: getScreenshotPath(`TS.3.4-01-2-${timestamp}.png`) 
    });
  });

  // Expected Results:
  // 1. CosmosDB tab visible ✓
  await expect(page.locator('text=/CosmosDB/i').first()).toBeVisible();

  // 2. Shows database id <tenant name>-MS-Cosmos-db (17nj5d-MS-Cosmos-db) ✓
  await expect(page.getByText('17nj5d-MS-Cosmos-db')).toBeVisible();
});