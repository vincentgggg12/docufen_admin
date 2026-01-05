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

test('TS.7.9.1-05 Blue Signature Format', async ({ page }) => {
  // Setup: Login as Post-Approval participant who has already signed
  const email = process.env.MS_EMAIL_17NJ5D_ALEX_WILBER!;
  const password = process.env.MS_PASSWORD!;
  await microsoftLogin(page, email, password);
  await handleERSDDialog(page);

  // Navigate to a document in Post-Approval stage with signatures
  await page.getByRole('button', { name: 'Menu' }).click();
  await page.getByRole('link', { name: 'Tracking' }).click();
  
  // Find document in Post-Approval stage
  await page.waitForSelector('[data-testid="document-list"]', { timeout: 10000 });
  const postApprovalDoc = page.locator('[data-testid="document-item"]').filter({ hasText: 'Post-Approval' }).first();
  await postApprovalDoc.click();
  
  // Wait for document to load
  await page.waitForSelector('[data-testid="document-content"]', { timeout: 10000 });

  // Test Step 1: View signature
  await test.step('View signature', async () => {
    // Look for existing signatures in the document
    const signatureBlock = page.locator('[data-testid="signature-block"]').first();
    await expect(signatureBlock).toBeVisible();
    
    // Scroll to signature if needed
    await signatureBlock.scrollIntoViewIfNeeded();
  });

  // Test Step 2: Blue font color
  await test.step('Blue font color', async () => {
    // Verify signature text is blue
    const signatureText = page.locator('[data-testid="signature-block"]').first();
    
    // Check CSS color property
    const color = await signatureText.evaluate(el => {
      return window.getComputedStyle(el).color;
    });
    
    // Verify it's blue (rgb values for blue)
    expect(color).toMatch(/rgb\(0,\s*0,\s*255\)|blue|#0000ff/i);
  });

  // Test Step 3: Shows all details
  await test.step('Shows all details', async () => {
    const signatureBlock = page.locator('[data-testid="signature-block"]').first();
    
    // Verify signature contains name
    await expect(signatureBlock).toContainText(/\w+\s+\w+/); // First and last name pattern
    
    // Verify signature contains role
    await expect(signatureBlock).toContainText(/Approved By|Quality Approved By|Regulatory Approved By/);
    
    // Verify signature contains timestamp
    await expect(signatureBlock).toContainText(/\d{1,2}\/\d{1,2}\/\d{4}|\d{4}-\d{2}-\d{2}/); // Date pattern
    await expect(signatureBlock).toContainText(/\d{1,2}:\d{2}/); // Time pattern
  });

  // Test Step 4: In designated area
  await test.step('In designated area', async () => {
    // Verify signature is in the signature area of the document
    const signatureArea = page.locator('[data-testid="signature-area"], [data-testid="approval-signatures"]');
    const signatureInArea = signatureArea.locator('[data-testid="signature-block"]').first();
    
    await expect(signatureInArea).toBeVisible();
  });

  // Test Step 5: Properly formatted (SC)
  await test.step('Properly formatted (SC)', async () => {
    // Verify complete formatting
    const signatureBlock = page.locator('[data-testid="signature-block"]').first();
    
    // Verify structure includes all elements
    await expect(signatureBlock).toContainText(/Digitally signed by:/i);
    
    // Take screenshot showing blue signature format
    await signatureBlock.scrollIntoViewIfNeeded();
    const timestamp = formatTimestamp(new Date());
    await page.screenshot({ 
      path: getScreenshotPath(`TS.7.9.1-05-5-${timestamp}.png`) 
    });
  });

  // Expected Results:
  // 1. Signature viewed ✓
  // 2. Blue text ✓
  // 3. Name/role/time ✓
  // 4. Correct location ✓
  // 5. Format correct ✓
});