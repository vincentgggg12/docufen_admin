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

test('TS.7.6.1-07 Finalization Trigger', async ({ page }) => {
  // Setup: Login as owner
  const diegoEmail = process.env.MS_EMAIL_MSPM36_DIEGO_SICILIANI!;
  const password = process.env.MS_PASSWORD!;
  await microsoftLogin(page, diegoEmail, password);
  await handleERSDDialog(page);

  // Create document
  await page.goto('/documents');
  await page.waitForLoadState('networkidle');
  
  await page.getByTestId('lsb.nav-main.documents-newDocument').click();
  await page.getByTestId('createDocumentDialog.documentNameInput').fill('Finalization Trigger Test');
  await page.getByTestId('createDocumentDialog.createButton').click();
  await page.waitForURL(/.*\/editor\/.*/, { timeout: 10000 });

  // Add content
  await page.locator('[contenteditable="true"]').first().click();
  await page.keyboard.type('Finalization Trigger Test Document - Ready for PDF Generation');
  
  // Fast-track to Closed stage (skip all intermediate stages if possible)
  // This might require multiple stage advances
  let currentStage = await page.locator('[data-stage], .stage-indicator, .stage-name').first().textContent();
  
  while (currentStage && !currentStage.includes('Closed')) {
    const advanceButton = page.getByRole('button', { name: /Next Stage|Forward|Advance|Skip|To Closed|Close Document/i });
    if (await advanceButton.isVisible({ timeout: 3000 }).catch(() => false)) {
      await advanceButton.click();
      await page.waitForTimeout(2000);
      
      // Handle any confirmation dialogs
      const confirmButton = page.getByRole('button', { name: /Confirm|Yes|Proceed/i });
      if (await confirmButton.isVisible({ timeout: 2000 }).catch(() => false)) {
        await confirmButton.click();
      }
      
      currentStage = await page.locator('[data-stage], .stage-indicator, .stage-name').first().textContent();
    } else {
      break;
    }
  }

  // Step 1: Document closed
  await test.step('Document closed.', async () => {
    // Verify document is in Closed stage
    await expect(page.getByText(/Closed|Finalized/i)).toBeVisible();
    
    // Document should be in read-only state
    const editableElements = page.locator('[contenteditable="true"]');
    const editableCount = await editableElements.count();
    if (editableCount > 0) {
      // Editable elements should be disabled or read-only
      const isEditable = await editableElements.first().isEditable();
      expect(isEditable).toBeFalsy();
    }
  });

  // Step 2: Click Final PDF
  await test.step('Click Final PDF.', async () => {
    // Look for Final PDF button
    const finalPdfButton = page.getByRole('button', { name: /Final PDF|Generate PDF|Create PDF|Finalize PDF/i });
    await expect(finalPdfButton).toBeVisible();
    
    // Click the button
    await finalPdfButton.click();
  });

  // Step 3: PDF generation starts
  await test.step('PDF generation starts.', async () => {
    // Should see some indication that PDF generation has started
    // This could be a modal, notification, or status message
    const generationIndicator = page.locator('text=/generating|creating|processing|preparing.*pdf/i');
    await expect(generationIndicator.first()).toBeVisible({ timeout: 5000 });
  });

  // Step 4: Loading shown
  await test.step('Loading shown.', async () => {
    // Look for loading indicator
    const loadingIndicator = page.locator('[role="progressbar"], .spinner, .loading, [data-loading], svg[class*="animate"]');
    await expect(loadingIndicator.first()).toBeVisible();
    
    // Or look for loading text
    const loadingText = page.locator('text=/loading|processing|please wait|generating/i');
    const hasLoadingIndicator = await loadingIndicator.first().isVisible().catch(() => false) || 
                                await loadingText.first().isVisible().catch(() => false);
    expect(hasLoadingIndicator).toBeTruthy();
  });

  // Step 5: Process initiated (SC)
  await test.step('Process initiated (SC)', async () => {
    // Take screenshot showing PDF generation in progress
    const timestamp = new Date();
    const formattedTimestamp = `${timestamp.getFullYear()}.${String(timestamp.getMonth() + 1).padStart(2, '0')}.${String(timestamp.getDate()).padStart(2, '0')}-${String(timestamp.getHours()).padStart(2, '0')}.${String(timestamp.getMinutes()).padStart(2, '0')}.${String(timestamp.getSeconds()).padStart(2, '0')}`;
    await page.screenshot({ 
      path: getScreenshotPath(`TS.7.6.1-07-5-${formattedTimestamp}.png`) 
    });
    
    // Verify the process is running
    // Could check network activity or wait for completion
    const pdfRequest = page.waitForRequest(req => 
      req.url().includes('pdf') || 
      req.url().includes('generate') || 
      req.url().includes('finalize'),
      { timeout: 10000 }
    ).catch(() => null);
    
    // Or wait for success message
    const successMessage = page.waitForSelector('text=/pdf.*generated|completed|ready|success/i', { timeout: 30000 })
      .catch(() => null);
    
    // At least one of these should happen
    const result = await Promise.race([pdfRequest, successMessage]);
    expect(result).toBeTruthy();
  });

  // Expected Results:
  // 1. Closed stage ✓
  // 2. Finalize clicked ✓
  // 3. Generation begins ✓
  // 4. Progress indicator ✓
  // 5. PDF creating ✓
});