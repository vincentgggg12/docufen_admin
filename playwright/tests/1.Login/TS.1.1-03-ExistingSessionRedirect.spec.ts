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

test('TS.1.1-03 Existing Session Redirect', async ({ page, context }) => {
  // Test Procedure:
  // 1. Login as Diego (Creator)
  // 2. Note landing on Documents page
  // 3. Open new tab, go to login URL
  // 4. Verify auto-redirect without login (SC)

  const baseUrl = process.env.BASE_URL;
  const email = process.env.MS_EMAIL_17NJ5D_DIEGO_SICILIANI!;
  const password = process.env.MS_PASSWORD!;

  // Test Step 1: Login as Diego (Creator)
  await test.step('Login as Diego (Creator)', async () => {
    await page.goto(`${baseUrl}/login`);
    await microsoftLogin(page, email, password);
    await handleERSDDialog(page);
    
    // Expected Result: Initial login successful
    await page.waitForLoadState('domcontentloaded');
  });

  // Test Step 2: Note landing on Documents page
  await test.step('Note landing on Documents page', async () => {
    // Creator role should land on Documents page
    await expect(page).toHaveURL(/.*\/documents/);
    
    // Expected Result: Documents page shown
    await expect(page.getByRole('link', { name: 'Documents' })).toBeVisible();
  });

  // Test Step 3: Open new tab, go to /documents URL
  const newPage = await context.newPage();
  
  await test.step('Open new tab, go to /documents URL', async () => {
    // Navigate to /documents URL in new tab
    await newPage.goto(`${baseUrl}/documents`);
    
    // Expected Result: New tab opened
    expect(newPage).toBeTruthy();
  });

  // Test Step 4: Verify auto-redirect without login (SC)
  await test.step('Verify auto-redirect without login (SC)', async () => {
    // Wait for automatic redirect due to existing session
    await newPage.waitForURL(/.*\/documents/, { timeout: 10000 });
    
    // Take screenshot
    const timestamp = formatTimestamp(new Date());
    await newPage.screenshot({ 
      path: getScreenshotPath(`TS.1.1-03-4-${timestamp}.png`) 
    });
    
    // Expected Result: Bypasses login, goes to Documents
    await expect(newPage).toHaveURL(/.*\/documents/);
    await expect(newPage.getByRole('link', { name: 'Documents' })).toBeVisible();
    
    // Verify no login button is shown
    await expect(newPage.getByTestId('loginPage.loginButton')).not.toBeVisible();
  });
  
  // Cleanup
  await newPage.close();
});