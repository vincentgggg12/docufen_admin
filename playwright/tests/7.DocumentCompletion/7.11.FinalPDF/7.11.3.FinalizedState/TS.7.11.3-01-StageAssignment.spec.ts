import { test, expect } from '@playwright/test';
import * as dotenv from 'dotenv';
import { microsoftLogin, handleERSDDialog } from '../../../../../src/utils/microsoftLogin';
import { getScreenshotPath, formatTimestamp } from '../../../../../src/utils/screenshotUtils';

dotenv.config({ path: '.playwright.env' });

test.use({
  viewport: { height: 1080, width: 1920 },
  ignoreHTTPSErrors: true
});

test.setTimeout(180000); // 3 minutes for PDF generation

test('TS.7.11.3-01 Stage Assignment', async ({ page }) => {
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

  // Generate PDF
  const finalPDFButton = page.getByRole('button', { name: 'Final PDF' });
  await finalPDFButton.click();

  // Test Step 1: After PDF generation
  await test.step('After PDF generation', async () => {
    // Wait for PDF generation to complete
    await page.waitForSelector('[data-testid="view-pdf-button"], [data-testid="pdf-complete"]', { 
      timeout: 60000 
    });
    
    // Verify PDF generation completed
    const viewPDFButton = page.getByRole('button', { name: 'View PDF' });
    await expect(viewPDFButton).toBeVisible();
  });

  // Test Step 2: Stage = Finalised
  await test.step('Stage = Finalised', async () => {
    // Verify stage has changed to Finalised
    const stageIndicator = page.locator('[data-testid="stage-indicator"], [data-testid="document-stage"], [data-testid="workflow-stage"]');
    await expect(stageIndicator).toContainText('Finalised');
  });

  // Test Step 3: Status updated
  await test.step('Status updated', async () => {
    // Verify document status shows as Finalised
    const statusText = page.getByText('Finalised').first();
    await expect(statusText).toBeVisible();
  });

  // Test Step 4: In Final PDF tab
  await test.step('In Final PDF tab', async () => {
    // Verify we are in the Final PDF tab/section
    const finalPDFTab = page.locator('[data-testid="final-pdf-tab"], [role="tab"][aria-selected="true"]').filter({ hasText: /Final PDF/i });
    await expect(finalPDFTab).toBeVisible();
  });

  // Test Step 5: Properly staged (SC)
  await test.step('Properly staged (SC)', async () => {
    // Verify document is properly staged as Finalised
    await expect(page.getByText('Finalised')).toBeVisible();
    await expect(page.getByRole('button', { name: 'View PDF' })).toBeVisible();
    
    // Take screenshot showing Finalised stage
    const timestamp = formatTimestamp(new Date());
    await page.screenshot({ 
      path: getScreenshotPath(`TS.7.11.3-01-5-${timestamp}.png`) 
    });
  });

  // Expected Results:
  // 1. PDF complete ✓
  // 2. Finalised stage ✓
  // 3. Status changed ✓
  // 4. Correct tab ✓
  // 5. Stage correct ✓
});