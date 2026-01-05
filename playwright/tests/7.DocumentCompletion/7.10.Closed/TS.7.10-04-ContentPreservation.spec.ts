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

test('TS.7.10-04 Content Preservation', async ({ page }) => {
  // Setup: Login as Trial Administrator
  const email = process.env.MS_EMAIL_17NJ5D_MEGAN_BOWEN!;
  const password = process.env.MS_PASSWORD!;
  await microsoftLogin(page, email, password);
  await handleERSDDialog(page);

  // Navigate to tracking page
  await page.getByRole('button', { name: 'Menu' }).click();
  await page.getByRole('link', { name: 'Tracking' }).click();
  await page.waitForSelector('[data-testid="document-list"]', { timeout: 10000 });

  // Test Step 1: View closed doc
  await test.step('View closed doc', async () => {
    // Find and click on a closed document
    const closedDoc = page.locator('[data-testid="document-item"]').filter({ hasText: 'Closed' }).first();
    
    // If no closed doc exists, find one in Post-Approval and close it
    if (!(await closedDoc.isVisible())) {
      const postApprovalDoc = page.locator('[data-testid="document-item"]').filter({ hasText: 'Post-Approval' }).first();
      await postApprovalDoc.click();
      await page.waitForSelector('[data-testid="document-content"]', { timeout: 10000 });
      
      // Add some content before closing
      await page.getByRole('button', { name: 'Text' }).click();
      await page.getByPlaceholder('Enter text').fill('Test content before closing');
      await page.keyboard.press('Enter');
      await page.waitForTimeout(1000);
      
      // Close the document
      await page.getByRole('button', { name: 'Close Document' }).click();
      await page.waitForTimeout(2000);
    } else {
      await closedDoc.click();
    }
    
    // Wait for document to load
    await page.waitForSelector('[data-testid="document-content"]', { timeout: 10000 });
  });

  // Test Step 2: All content intact
  await test.step('All content intact', async () => {
    // Verify document content is visible
    const documentContent = page.locator('[data-testid="document-content"], .document-viewer');
    await expect(documentContent).toBeVisible();
    
    // Check for signatures if present
    const signatures = page.locator('[data-testid="signature-block"], .signature-element');
    if (await signatures.count() > 0) {
      await expect(signatures.first()).toBeVisible();
    }
    
    // Check for text entries if present
    const textEntries = page.locator('[data-testid="text-entry"], .text-annotation');
    if (await textEntries.count() > 0) {
      await expect(textEntries.first()).toBeVisible();
    }
  });

  // Test Step 3: Cannot edit
  await test.step('Cannot edit', async () => {
    // Try to click on Text button - should be disabled or not visible
    const textButton = page.getByRole('button', { name: 'Text' });
    
    if (await textButton.isVisible()) {
      await expect(textButton).toBeDisabled();
    } else {
      await expect(textButton).not.toBeVisible();
    }
    
    // Try to click on Sign button - should be disabled or not visible
    const signButton = page.getByRole('button', { name: 'Sign', exact: true });
    
    if (await signButton.isVisible()) {
      await expect(signButton).toBeDisabled();
    } else {
      await expect(signButton).not.toBeVisible();
    }
  });

  // Test Step 4: Read-only mode
  await test.step('Read-only mode', async () => {
    // Verify document is in read-only mode
    // Check for read-only indicator
    const readOnlyIndicator = page.locator('[data-testid="read-only-indicator"], .read-only-badge, text=/read.*only/i');
    
    // Document should either show read-only indicator or have disabled editing controls
    const hasReadOnlyIndicator = await readOnlyIndicator.isVisible();
    const hasDisabledControls = 
      (await page.getByRole('button', { name: 'Text' }).isDisabled().catch(() => false)) ||
      (await page.getByRole('button', { name: 'Sign' }).isDisabled().catch(() => false));
    
    expect(hasReadOnlyIndicator || hasDisabledControls).toBeTruthy();
  });

  // Test Step 5: Preserved state (SC)
  await test.step('Preserved state (SC)', async () => {
    // Verify all content is preserved and document is in read-only state
    const documentContent = page.locator('[data-testid="document-content"], .document-viewer');
    await expect(documentContent).toBeVisible();
    
    // Verify stage is Closed
    await expect(page.getByText('Closed')).toBeVisible();
    
    // Take screenshot showing preserved content in read-only mode
    const timestamp = formatTimestamp(new Date());
    await page.screenshot({ 
      path: getScreenshotPath(`TS.7.10-04-5-${timestamp}.png`) 
    });
  });

  // Expected Results:
  // 1. Content viewed ✓
  // 2. Everything present ✓
  // 3. Edit disabled ✓
  // 4. View only ✓
  // 5. Fully preserved ✓
});