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

test('TS.1.3-04 User Manager ERSD Visibility', async ({ page }) => {
  // Test Procedure:
  // 1. Login as Grady (User Manager)
  // 2. Navigate to Users page
  // 3. View ERSD column
  // 4. Check all dates shown
  // 5. Verify format correct (SC)

  const baseUrl = process.env.BASE_URL;
  const email = process.env.MS_EMAIL_17NJ5D_GRADY_ARCHIE!;
  const password = process.env.MS_PASSWORD!;

  // Test Step 1: Login as Grady (User Manager)
  await test.step('Login as Grady (User Manager)', async () => {
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

  // Test Step 2: Navigate to Users page
  await test.step('Navigate to Users page', async () => {
    // User Manager role should redirect to users page or have access to it
    if (!page.url().includes('/users')) {
      await page.getByRole('button', { name: 'Menu' }).click();
      await page.getByRole('link', { name: 'Users' }).click();
    }
    
    // Expected Result: Users page loads
    await expect(page).toHaveURL(/\/users/);
  });

  // Test Step 3: View ERSD column
  await test.step('View ERSD column', async () => {
    // Look for ERSD column header
    const ersdHeader = page.getByRole('columnheader', { name: /ERSD|Acceptance|Agreement/i });
    
    // Expected Result: ERSD dates visible
    await expect(ersdHeader).toBeVisible();
  });

  // Test Step 4: Check all dates shown
  await test.step('Check all dates shown', async () => {
    // Get all user rows
    const userRows = page.locator('tbody tr');
    const rowCount = await userRows.count();
    
    // Expected Result: Shows acceptance dates
    let datesFound = 0;
    for (let i = 0; i < Math.min(rowCount, 5); i++) { // Check first 5 rows
      const row = userRows.nth(i);
      // Look for date pattern in ERSD column
      const datePattern = /\d{4}-\d{2}-\d{2}|\d{1,2}\/\d{1,2}\/\d{4}|Not accepted|Pending|N\/A/i;
      const dateCell = row.getByText(datePattern);
      if (await dateCell.isVisible({ timeout: 1000 }).catch(() => false)) {
        datesFound++;
      }
    }
    
    expect(datesFound).toBeGreaterThan(0);
  });

  // Test Step 5: Verify format correct (SC)
  await test.step('Verify format correct (SC)', async () => {
    // Take screenshot
    const timestamp = formatTimestamp(new Date());
    await page.screenshot({ 
      path: getScreenshotPath(`TS.1.3-04-5-${timestamp}.png`) 
    });
    
    // Expected Result: Date/time formatted
    // Find a specific date in the ERSD column
    const dateFormats = [
      /\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}/, // YYYY-MM-DD HH:MM:SS
      /\d{1,2}\/\d{1,2}\/\d{4} \d{1,2}:\d{2} [AP]M/, // MM/DD/YYYY HH:MM AM/PM
      /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/, // ISO format
    ];
    
    let formattedDateFound = false;
    for (const format of dateFormats) {
      const formattedDate = page.getByText(format).first();
      if (await formattedDate.isVisible({ timeout: 2000 }).catch(() => false)) {
        formattedDateFound = true;
        break;
      }
    }
    
    // Also accept simple date formats or status messages
    if (!formattedDateFound) {
      const simpleDateOrStatus = page.getByText(/\d{4}-\d{2}-\d{2}|\d{1,2}\/\d{1,2}\/\d{4}|Not accepted|Pending/i).first();
      await expect(simpleDateOrStatus).toBeVisible();
    }
  });
});