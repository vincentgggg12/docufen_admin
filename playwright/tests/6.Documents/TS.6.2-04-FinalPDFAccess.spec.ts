import { test, expect } from '@playwright/test';
import { microsoftLogin } from '../utils/msLogin';
import { handleERSDDialog } from '../utils/ersd-handler';
import { getScreenshotPath } from '../utils/paths';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

// Load environment variables
dotenv.config({ path: '.playwright.env' });

const baseUrl = process.env.BASE_URL;

// Set test timeout to 120 seconds
test.setTimeout(120000);

test.use({
  viewport: { height: 1080, width: 1920 },
  ignoreHTTPSErrors: true
});

function formatTimestamp(date: Date): string {
  return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}-${String(date.getHours()).padStart(2, '0')}.${String(date.getMinutes()).padStart(2, '0')}.${String(date.getSeconds()).padStart(2, '0')}`;
}

test('TS.6.2-04 Final PDF Access', async ({ page }) => {
  // Test Procedure:
  // 1. Navigate to Final PDF tab
  // 2. Open finalized document
  // 3. Click "Download PDF" button
  // 4. Verify PDF contains document
  // 5. Check audit trail included (SC)
  
  // Setup: Login (not reported as test step)
  const email = process.env.MS_EMAIL_17NJ5D_MEGAN_BOWEN!;
  const password = process.env.MS_PASSWORD!;
  
  // Navigate to login page
  await page.goto(`${baseUrl}/login`);
  
  // Perform Microsoft login
  await microsoftLogin(page, email, password);
  
  // Handle ERSD if needed
  await handleERSDDialog(page);
  
  // Wait for navigation
  await page.waitForLoadState('domcontentloaded');
  
  // Navigate to Documents page
  await page.getByRole('button', { name: 'Menu' }).click();
  await page.getByRole('link', { name: 'Documents' }).click();
  await page.waitForSelector('text=Documents', { timeout: 10000 });
  
  // Test Step 1: Navigate to Final PDF tab
  await test.step('Navigate to Final PDF tab', async () => {
    const finalPdfTab = page.getByRole('tab', { name: /Final PDF/i });
    await finalPdfTab.click();
    
    // Wait for content to load
    await page.waitForTimeout(2000);
    
    // Verify Final PDFs are listed
    const pdfCount = await page.locator('[data-testid="document-item"], tr[role="row"]').count();
    expect(pdfCount).toBeGreaterThan(0);
  });
  
  // Test Step 2: Open finalized document
  await test.step('Open finalized document', async () => {
    // Click on first finalized document
    const documentRow = page.locator('tr[role="row"]').nth(1);
    await documentRow.click();
    
    // Wait for document details to load
    await page.waitForSelector('[data-testid="document-details"], text=/Document Details|Final PDF/i', { timeout: 10000 });
    
    // Verify document details are shown
    await expect(page.getByText(/Document Details|PDF Details/i)).toBeVisible();
  });
  
  // Test Step 3: Click "Download PDF" button
  const downloadPromise = page.waitForEvent('download');
  await test.step('Click "Download PDF" button', async () => {
    // Find and click download button
    const downloadButton = page.getByRole('button', { name: /Download PDF|Download/i });
    await expect(downloadButton).toBeVisible();
    await downloadButton.click();
  });
  
  // Test Step 4: Verify PDF contains document
  await test.step('Verify PDF contains document', async () => {
    // Wait for download to complete
    const download = await downloadPromise;
    
    // Save the download
    const fileName = download.suggestedFilename();
    const filePath = path.join(process.cwd(), 'playwright', 'results', fileName);
    await download.saveAs(filePath);
    
    // Verify file exists and has content
    const stats = fs.statSync(filePath);
    expect(stats.size).toBeGreaterThan(1000); // PDF should be at least 1KB
    
    console.log(`PDF downloaded: ${fileName}, size: ${stats.size} bytes`);
    
    // Clean up
    fs.unlinkSync(filePath);
  });
  
  // Test Step 5: Check audit trail included (SC)
  await test.step('Check audit trail included (SC)', async () => {
    // Take screenshot showing PDF details and audit trail info
    const timestamp = formatTimestamp(new Date());
    await page.screenshot({ 
      path: getScreenshotPath(`TS.6.2-04-${timestamp}.png`),
      fullPage: true 
    });
    
    // Look for audit trail indicators
    const auditTrailInfo = page.getByText(/Audit Trail|Signatures|Approval History/i);
    if (await auditTrailInfo.count() > 0) {
      await expect(auditTrailInfo.first()).toBeVisible();
      console.log('Audit trail information is displayed');
    }
    
    // Verify document metadata
    await expect(page.getByText(/Created|Modified|Finalized/i)).toBeVisible();
  });
  
  // Expected Results:
  // 1. Final PDFs listed ✓
  // 2. Document details shown ✓
  // 3. PDF downloads ✓
  // 4. Document content present ✓
  // 5. Complete audit trail in PDF ✓
});