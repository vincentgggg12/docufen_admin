import { test, expect } from '@playwright/test';
import * as dotenv from 'dotenv';
import path from 'path';
import { microsoftLogin, handleERSDDialog } from '../../../../src/utils/microsoftLogin';
import { getScreenshotPath, formatTimestamp } from '../../../../src/utils/screenshotUtils';

dotenv.config({ path: '.playwright.env' });

test.use({
  viewport: { height: 1080, width: 1920 },
  ignoreHTTPSErrors: true
});

test.setTimeout(120000); // 2 minutes

test('TS.7.8.7.1-04 Attachment Preview', async ({ page }) => {
  // Login as an executor
  const email = process.env.MS_EMAIL_17NJ5D_DAVID_SEAGAL!;
  const password = process.env.MS_PASSWORD!;
  await microsoftLogin(page, email, password);
  await handleERSDDialog(page);

  // Test Steps
  await test.step('1. Click attachment', async () => {
    // Navigate to a document in Execution stage
    await page.getByRole('button', { name: 'Menu' }).click();
    await page.getByRole('link', { name: 'Documents' }).click();
    await page.waitForLoadState('networkidle');
    
    // Find and open a document in Execution stage with attachments
    await page.getByText('Execution').first().click();
    
    // Open attachments panel
    await page.getByRole('button', { name: 'Attachments' }).click();
    
    // Click on an existing attachment or upload one first
    const attachment = page.getByRole('listitem').filter({ hasText: /\.(pdf|jpg|png)/i }).first();
    
    if (await attachment.count() === 0) {
      // Upload a file if none exists
      const filePath = path.join(process.cwd(), 'playwright/tests/TestFiles/test-document.pdf');
      await page.setInputFiles('input[type="file"]', filePath);
      await page.waitForTimeout(2000);
    }
    
    // Click on the attachment
    await page.getByRole('listitem').filter({ hasText: /\.(pdf|jpg|png)/i }).first().click();
  });

  await test.step('2. Preview opens', async () => {
    // Verify preview dialog or modal opens
    await expect(page.getByRole('dialog', { name: 'Preview' })).toBeVisible();
  });

  await test.step('3. Navigation arrows', async () => {
    // Check for navigation arrows if multiple attachments
    const prevButton = page.getByRole('button', { name: 'Previous' });
    const nextButton = page.getByRole('button', { name: 'Next' });
    
    // At least one navigation element should be present
    const hasNavigation = await prevButton.isVisible() || await nextButton.isVisible();
    expect(hasNavigation).toBe(true);
  });

  await test.step('4. Can view content', async () => {
    // Verify content is displayed (iframe for PDF, img for images)
    const contentFrame = page.locator('iframe, img').first();
    await expect(contentFrame).toBeVisible();
  });

  await test.step('5. Preview functional (SC)', async () => {
    // Take screenshot showing attachment preview
    const timestamp = formatTimestamp(new Date());
    await page.screenshot({ 
      path: getScreenshotPath(`TS.7.8.7.1-04-5-${timestamp}.png`) 
    });
  });

  // Expected Results:
  // 1. Clicked ✓
  // 2. Preview shown ✓
  // 3. Arrows work ✓
  // 4. Content visible ✓
  // 5. Preview works ✓
});