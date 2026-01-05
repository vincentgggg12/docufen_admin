import { test, expect } from '@playwright/test';
import { getScreenshotPath } from '../../../utils/paths';
import dotenv from 'dotenv';
import { microsoftLogin } from '../../../utils/msLogin';
import { handleERSDDialog } from '../../../utils/ersd-handler';

dotenv.config({ path: '.playwright.env' });

test.use({
  viewport: { height: 1080, width: 1920 },
  ignoreHTTPSErrors: true
});

test.setTimeout(120000); // 2 minutes

test('TS.7.12.1-02 Re-Open Button Display', async ({ page }) => {
  // Setup: Create and finalize a document
  const diegoEmail = process.env.MS_EMAIL_MSPM36_DIEGO_SICILIANI!;
  const password = process.env.MS_PASSWORD!;
  await microsoftLogin(page, diegoEmail, password);
  await handleERSDDialog(page);

  // Create a document
  await page.goto('/documents');
  await page.waitForLoadState('networkidle');
  
  await page.getByTestId('lsb.nav-main.documents-newDocument').click();
  await page.getByTestId('createDocumentDialog.documentNameInput').fill('Re-Open Button Test');
  await page.getByTestId('createDocumentDialog.createButton').click();
  await page.waitForURL(/.*\/editor\/.*/, { timeout: 10000 });

  // Add some content and finalize the document
  await page.getByRole('button', { name: /Sign/i }).first().click();
  await page.getByRole('option', { name: /Author/i }).click();
  await page.getByRole('button', { name: /Apply/i }).click();
  await page.waitForTimeout(2000);

  // Move through stages to finalize
  await page.getByRole('button', { name: /To Execution/i }).click();
  await page.waitForTimeout(2000);
  await page.getByRole('button', { name: /To Post-Approval/i }).click();
  await page.waitForTimeout(2000);
  await page.getByRole('button', { name: /Finalise/i }).click();
  await page.waitForTimeout(3000);

  // Step 1: View finalized doc.
  await test.step('View finalized doc.', async () => {
    // Reload to ensure finalized state is loaded
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    // Verify document is in finalized state
    await expect(page.getByText(/Finalised|Finalized/i)).toBeVisible();
  });

  // Step 2: Re-open button shown.
  await test.step('Re-open button shown.', async () => {
    // Verify re-open button is visible
    const reopenButton = page.getByRole('button', { name: /Re-open/i });
    await expect(reopenButton).toBeVisible();
  });

  // Step 3: Amber warning icon.
  await test.step('Amber warning icon.', async () => {
    // Check for warning icon/color on the re-open button
    const reopenButton = page.getByRole('button', { name: /Re-open/i });
    
    // Check for amber/warning styling
    const buttonColor = await reopenButton.evaluate((el) => {
      const styles = window.getComputedStyle(el);
      return styles.backgroundColor || styles.color;
    });
    
    // Amber colors typically include orange/yellow hues
    expect(buttonColor).toMatch(/rgb\(2\d{2}, \d{2,3}, \d{1,2}\)|#[fF][fF][aA-dD]\d{3}|warning|amber|orange/i);
  });

  // Step 4: Clear visibility.
  await test.step('Clear visibility.', async () => {
    const reopenButton = page.getByRole('button', { name: /Re-open/i });
    
    // Check button is clearly visible and not obscured
    await expect(reopenButton).toBeVisible();
    const bbox = await reopenButton.boundingBox();
    expect(bbox).toBeTruthy();
    expect(bbox!.width).toBeGreaterThan(50);
    expect(bbox!.height).toBeGreaterThan(20);
  });

  // Step 5: Obvious action (SC)
  await test.step('Obvious action (SC)', async () => {
    // Take screenshot showing the re-open button with amber warning styling
    const timestamp = new Date();
    const formattedTimestamp = `${timestamp.getFullYear()}.${String(timestamp.getMonth() + 1).padStart(2, '0')}.${String(timestamp.getDate()).padStart(2, '0')}-${String(timestamp.getHours()).padStart(2, '0')}.${String(timestamp.getMinutes()).padStart(2, '0')}.${String(timestamp.getSeconds()).padStart(2, '0')}`;
    await page.screenshot({ 
      path: getScreenshotPath(`TS.7.12.1-02-5-${formattedTimestamp}.png`) 
    });
  });

  // Expected Results:
  // 1. Doc viewed ✓
  // 2. Button present ✓
  // 3. Warning color ✓
  // 4. Stands out ✓
  // 5. Clear option ✓
});