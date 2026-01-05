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

test('TS.7.14-10 Future Date Prevention', async ({ page }) => {
  // Login
  const email = process.env.MS_EMAIL_17NJ5D_EMILY_MARTIN!;
  const password = process.env.MS_PASSWORD!;
  await microsoftLogin(page, email, password);
  await handleERSDDialog(page);

  // Navigate to Sign page
  await page.getByRole('button', { name: 'Menu' }).click();
  await page.getByRole('link', { name: 'Sign' }).click();
  await page.waitForLoadState('networkidle');

  // Select a document with late entry capability
  const firstDocument = page.locator('[data-testid="sign-document-row"], tbody tr').first();
  await firstDocument.click();
  await page.waitForSelector('[data-testid="document-viewer"], iframe, .document-container');

  // Find a date field that allows late entry
  let documentFrame = page;
  const iframe = page.locator('iframe').first();
  if (await iframe.isVisible()) {
    documentFrame = page.frameLocator('iframe').first();
  }

  // Look for late entry option or correction with date
  await page.getByRole('button', { name: /Late Entry|Correction|Edit/i }).click();
  await page.waitForSelector('[data-testid="late-entry-modal"], [data-testid="correction-modal"], .date-picker-container');

  // Test Step 1: Try late entry tomorrow
  await test.step('Try late entry tomorrow', async () => {
    // Find date input
    const dateInput = page.locator('[data-testid="late-entry-date"], input[type="date"], input[type="datetime-local"], .date-picker-input');
    await dateInput.click();
    
    // Calculate tomorrow's date
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowString = tomorrow.toISOString().split('T')[0];
    
    // Try to input tomorrow's date
    await dateInput.fill(tomorrowString);
    
    // Try to move focus away to trigger validation
    await page.keyboard.press('Tab');
  });

  // Test Step 2: Date picker blocks
  await test.step('Date picker blocks', async () => {
    // Check if the date was rejected
    const dateInput = page.locator('[data-testid="late-entry-date"], input[type="date"], input[type="datetime-local"], .date-picker-input');
    const currentValue = await dateInput.inputValue();
    
    // The value should either be empty or today's date or earlier
    const today = new Date().toISOString().split('T')[0];
    if (currentValue) {
      expect(new Date(currentValue).getTime()).toBeLessThanOrEqual(new Date(today).getTime());
    }
    
    // Check for validation error
    const validationError = await page.getByText(/cannot.*future|future.*not allowed|must be.*past|invalid.*date/i).isVisible().catch(() => false);
    expect(validationError).toBeTruthy();
  });

  // Test Step 3: Cannot select future
  await test.step('Cannot select future', async () => {
    // If there's a calendar widget, check future dates are disabled
    const calendarButton = page.locator('[data-testid="calendar-button"], .calendar-icon, button[aria-label*="calendar" i]');
    if (await calendarButton.isVisible()) {
      await calendarButton.click();
      await page.waitForSelector('.calendar-popup, [role="dialog"][aria-label*="calendar" i], .date-picker-calendar');
      
      // Find tomorrow's date in calendar
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowDay = tomorrow.getDate().toString();
      
      // Check if future dates are disabled
      const futureDateButton = page.locator(`button:has-text("${tomorrowDay}"), [aria-label*="${tomorrowDay}"]`).first();
      if (await futureDateButton.isVisible()) {
        const isDisabled = await futureDateButton.isDisabled() || 
                          await futureDateButton.getAttribute('aria-disabled') === 'true';
        expect(isDisabled).toBeTruthy();
      }
      
      // Close calendar
      await page.keyboard.press('Escape');
    }
  });

  // Test Step 4: Only past dates
  await test.step('Only past dates', async () => {
    // Select a past date
    const dateInput = page.locator('[data-testid="late-entry-date"], input[type="date"], input[type="datetime-local"], .date-picker-input');
    
    // Set to yesterday
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayString = yesterday.toISOString().split('T')[0];
    
    await dateInput.fill(yesterdayString);
    await page.keyboard.press('Tab');
    
    // Verify it was accepted
    const currentValue = await dateInput.inputValue();
    expect(currentValue).toBe(yesterdayString);
    
    // No validation errors for past date
    const validationError = await page.getByText(/cannot.*future|future.*not allowed|must be.*past|invalid.*date/i).isVisible().catch(() => false);
    expect(validationError).toBeFalsy();
  });

  // Test Step 5: Logic enforced with screenshot
  await test.step('Logic enforced (SC)', async () => {
    // Try one more time with a far future date
    const dateInput = page.locator('[data-testid="late-entry-date"], input[type="date"], input[type="datetime-local"], .date-picker-input');
    
    const nextYear = new Date();
    nextYear.setFullYear(nextYear.getFullYear() + 1);
    const nextYearString = nextYear.toISOString().split('T')[0];
    
    await dateInput.fill(nextYearString);
    await page.keyboard.press('Tab');
    
    // Verify it's still not accepted
    const finalValue = await dateInput.inputValue();
    expect(new Date(finalValue).getTime()).toBeLessThanOrEqual(new Date().getTime());
    
    // Verify max attribute or validation
    const maxDate = await dateInput.getAttribute('max');
    if (maxDate) {
      const today = new Date().toISOString().split('T')[0];
      expect(maxDate).toBe(today);
    }
    
    // Take screenshot showing date restriction
    const timestamp = formatTimestamp(new Date());
    await page.screenshot({ 
      path: getScreenshotPath(`TS.7.14-10-5-${timestamp}.png`),
      fullPage: true
    });
  });

  // Expected Results:
  // 1. Future attempted ✓
  // 2. Selection blocked ✓
  // 3. Future disabled ✓
  // 4. Past only ✓
  // 5. Properly restricted ✓
});