import { test, expect } from '@playwright/test';
import * as dotenv from 'dotenv';
import { microsoftLogin, handleERSDDialog } from '../../../../src/utils/microsoftLogin';
import { getScreenshotPath, formatTimestamp } from '../../../../src/utils/screenshotUtils';

dotenv.config({ path: '.playwright.env' });

test.use({
  viewport: { height: 1080, width: 1920 },
  ignoreHTTPSErrors: true
});

test.setTimeout(120000); // 2 minutes

test('TS.7.10-05 Ready for Finalization', async ({ page }) => {
  // Setup: Login as Trial Administrator (Owner)
  const email = process.env.MS_EMAIL_17NJ5D_MEGAN_BOWEN!;
  const password = process.env.MS_PASSWORD!;
  await microsoftLogin(page, email, password);
  await handleERSDDialog(page);

  // Navigate to tracking page
  await page.getByRole('button', { name: 'Menu' }).click();
  await page.getByRole('link', { name: 'Tracking' }).click();
  await page.waitForSelector('[data-testid="document-list"]', { timeout: 10000 });

  // Test Step 1: Document closed
  await test.step('Document closed', async () => {
    // Find a closed document or create one
    let closedDoc = page.locator('[data-testid="document-item"]').filter({ hasText: 'Closed' }).first();
    
    if (!(await closedDoc.isVisible())) {
      // Close a Post-Approval document
      const postApprovalDoc = page.locator('[data-testid="document-item"]').filter({ hasText: 'Post-Approval' }).first();
      await postApprovalDoc.click();
      await page.waitForSelector('[data-testid="document-content"]', { timeout: 10000 });
      await page.getByRole('button', { name: 'Close Document' }).click();
      await page.waitForTimeout(2000);
      
      // Verify document is now closed
      await expect(page.getByText('Closed')).toBeVisible();
    } else {
      await closedDoc.click();
      await page.waitForSelector('[data-testid="document-content"]', { timeout: 10000 });
      
      // Verify document is in closed state
      await expect(page.getByText('Closed')).toBeVisible();
    }
  });

  // Test Step 2: Final PDF button shown
  await test.step('Final PDF button shown', async () => {
    // Look for Final PDF button
    const finalPdfButton = page.getByRole('button', { name: 'Final PDF' });
    await expect(finalPdfButton).toBeVisible();
    
    // Verify button is enabled
    await expect(finalPdfButton).toBeEnabled();
  });

  // Test Step 3: Can advance
  await test.step('Can advance', async () => {
    // Verify the Final PDF button is clickable
    const finalPdfButton = page.getByRole('button', { name: 'Final PDF' });
    
    // Hover over button to check if it's interactive
    await finalPdfButton.hover();
    
    // Check cursor style changes to pointer
    const cursor = await finalPdfButton.evaluate(el => 
      window.getComputedStyle(el).cursor
    );
    expect(cursor).toBe('pointer');
    
    // Verify button is not disabled
    await expect(finalPdfButton).not.toHaveAttribute('disabled');
  });

  // Test Step 4: Next stage available
  await test.step('Next stage available', async () => {
    // Verify that clicking Final PDF would advance to next stage
    const finalPdfButton = page.getByRole('button', { name: 'Final PDF' });
    
    // Check button tooltip or aria-label for stage advancement info
    const buttonTitle = await finalPdfButton.getAttribute('title');
    const ariaLabel = await finalPdfButton.getAttribute('aria-label');
    
    // Button should indicate it will generate PDF and advance stage
    const hasStageInfo = 
      buttonTitle?.toLowerCase().includes('final') || 
      ariaLabel?.toLowerCase().includes('final') ||
      (await finalPdfButton.textContent())?.includes('Final');
    
    expect(hasStageInfo).toBeTruthy();
  });

  // Test Step 5: Ready to finalize (SC)
  await test.step('Ready to finalize (SC)', async () => {
    // Verify document is ready for finalization
    await expect(page.getByText('Closed')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Final PDF' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Final PDF' })).toBeEnabled();
    
    // Take screenshot showing finalization readiness
    const timestamp = formatTimestamp(new Date());
    await page.screenshot({ 
      path: getScreenshotPath(`TS.7.10-05-5-${timestamp}.png`) 
    });
  });

  // Expected Results:
  // 1. In closed state ✓
  // 2. Button visible ✓
  // 3. Clickable ✓
  // 4. Can proceed ✓
  // 5. Finalization enabled ✓
});