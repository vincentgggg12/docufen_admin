import { test, expect } from '@playwright/test';
import { getScreenshotPath } from '../../utils/paths';
import dotenv from 'dotenv';
import { microsoftLogin } from '../../utils/msLogin';
import { handleERSDDialog } from '../../utils/ersd-handler';

dotenv.config({ path: '.playwright.env' });

test.use({
  viewport: { height: 1080, width: 1920 },
  ignoreHTTPSErrors: true
});

test.setTimeout(120000); // 2 minutes

test('TS.7.2-02 One Click Creation', async ({ page }) => {
  // Setup: Login during trial period
  const email = process.env.MS_EMAIL_17NJ5D_MEGAN_BOWEN!;
  const password = process.env.MS_PASSWORD!;
  await microsoftLogin(page, email, password);
  await handleERSDDialog(page);

  // Navigate to documents page
  await page.goto('/documents');
  await page.waitForLoadState('networkidle');

  // Step 1: Click "Create Demo Doc"
  await test.step('Click "Create Demo Doc".', async () => {
    // Verify button is visible and click it
    const demoButton = page.getByTestId('lsb.nav-main.documents-demoDocument');
    await expect(demoButton).toBeVisible();
    await demoButton.click();
  });

  // Step 2: No dialog shown
  await test.step('No dialog shown.', async () => {
    // Verify no dialog appears
    await page.waitForTimeout(1000);
    const dialog = page.getByRole('dialog');
    await expect(dialog).not.toBeVisible();
  });

  // Step 3: Document creates instantly
  await test.step('Document creates instantly.', async () => {
    // Wait for navigation to editor
    await page.waitForURL(/.*\/editor\/.*/, { timeout: 10000 });
  });

  // Step 4: Uses template
  await test.step('Uses template.', async () => {
    // Verify template content is loaded
    await page.waitForSelector('[data-testid="editor-content"]', { state: 'visible' });
    // Template should have some predefined content
    const editorContent = page.getByTestId('editor-content');
    await expect(editorContent).toBeVisible();
  });

  // Step 5: Opens in editor (SC)
  await test.step('Opens in editor (SC)', async () => {
    // Verify editor is loaded and take screenshot
    await expect(page).toHaveURL(/.*\/editor\/.*/);
    
    // Wait for editor to fully load
    await page.waitForLoadState('networkidle');
    
    const timestamp = new Date();
    const formattedTimestamp = `${timestamp.getFullYear()}.${String(timestamp.getMonth() + 1).padStart(2, '0')}.${String(timestamp.getDate()).padStart(2, '0')}-${String(timestamp.getHours()).padStart(2, '0')}.${String(timestamp.getMinutes()).padStart(2, '0')}.${String(timestamp.getSeconds()).padStart(2, '0')}`;
    await page.screenshot({ 
      path: getScreenshotPath(`TS.7.2-02-5-${formattedTimestamp}.png`) 
    });
  });

  // Expected Results:
  // 1. Button clicked ✓
  // 2. Direct creation ✓
  // 3. Immediate response ✓
  // 4. Template loaded ✓
  // 5. Editor ready ✓
});