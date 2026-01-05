import { test, expect } from '@playwright/test';
import * as dotenv from 'dotenv';
import { microsoftLogin, handleERSDDialog } from '../../../../../src/utils/microsoftLogin';
import { getScreenshotPath, formatTimestamp } from '../../../../../src/utils/screenshotUtils';

dotenv.config({ path: '.playwright.env' });

test.use({
  viewport: { height: 1080, width: 1920 },
  ignoreHTTPSErrors: true
});

test.setTimeout(120000); // 2 minutes

test('TS.7.11.1-02 Loading State Display', async ({ page }) => {
  // Setup: Login as Trial Administrator (Owner)
  const email = process.env.MS_EMAIL_17NJ5D_MEGAN_BOWEN!;
  const password = process.env.MS_PASSWORD!;
  await microsoftLogin(page, email, password);
  await handleERSDDialog(page);

  // Navigate to a document in Closed stage
  await page.getByRole('button', { name: 'Menu' }).click();
  await page.getByRole('link', { name: 'Tracking' }).click();
  
  // Find document in Closed stage
  await page.waitForSelector('[data-testid="document-list"]', { timeout: 10000 });
  const closedDoc = page.locator('[data-testid="document-item"]').filter({ hasText: 'Closed' }).first();
  await closedDoc.click();
  
  // Wait for document to load
  await page.waitForSelector('[data-testid="document-content"]', { timeout: 10000 });

  // Trigger PDF generation
  const finalPDFButton = page.getByRole('button', { name: 'Final PDF' });
  await finalPDFButton.click();

  // Test Step 1: During generation
  await test.step('During generation', async () => {
    // Verify we are in the generation phase
    await expect(page.getByText(/Creating PDF|Generating PDF|Processing/i)).toBeVisible({ timeout: 5000 });
  });

  // Test Step 2: Spinner shown
  await test.step('Spinner shown', async () => {
    // Verify loading spinner is displayed
    const spinner = page.locator('[role="progressbar"], [data-testid="spinner"], .spinner, .loading-spinner');
    await expect(spinner).toBeVisible();
  });

  // Test Step 3: "Creating PDF..." message
  await test.step('"Creating PDF..." message', async () => {
    // Verify appropriate loading message is shown
    await expect(page.getByText(/Creating PDF|Generating PDF|Processing your document/i)).toBeVisible();
  });

  // Test Step 4: Progress indication
  await test.step('Progress indication', async () => {
    // Verify some form of progress indication exists
    const progressIndicator = page.locator('[role="progressbar"], [data-testid="progress"], .progress');
    await expect(progressIndicator).toBeVisible();
  });

  // Test Step 5: User feedback (SC)
  await test.step('User feedback (SC)', async () => {
    // Verify clear user feedback is provided during generation
    await expect(page.getByText(/Creating PDF|Generating PDF/i)).toBeVisible();
    const spinner = page.locator('[role="progressbar"], [data-testid="spinner"], .spinner');
    await expect(spinner).toBeVisible();
    
    // Take screenshot of loading state
    const timestamp = formatTimestamp(new Date());
    await page.screenshot({ 
      path: getScreenshotPath(`TS.7.11.1-02-5-${timestamp}.png`) 
    });
  });

  // Expected Results:
  // 1. Processing ✓
  // 2. Spinner visible ✓
  // 3. Message displayed ✓
  // 4. Loading state ✓
  // 5. Clear feedback ✓
});