import { test, expect } from '@playwright/test';
import { microsoftLogin } from '../utils/msLogin';
import { handleERSDDialog } from '../utils/ersd-handler';
import { getScreenshotPath } from '../utils/paths';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';

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

test('TS.4.2-08 CSV Export Filtered', async ({ page }) => {
  // Test Procedure:
  // 1. Apply search and date filters
  // 2. Export to CSV
  // 3. Open file and verify filtered data (SC)
  
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
  
  // Navigate to Billing
  await page.getByRole('button', { name: 'Menu' }).click();
  await page.getByRole('link', { name: 'Analytics' }).click();
  await page.waitForSelector('text=Billing', { timeout: 10000 });
  await page.getByRole('link', { name: 'Billing' }).click();
  
  // Test Step 1: Apply search and date filters
  await test.step('Apply search and date filters', async () => {
    // Apply search filter
    const searchInput = page.getByPlaceholder('Search transactions...');
    await searchInput.fill('Protocol');
    
    // Apply date filter
    const today = new Date();
    const lastMonth = new Date();
    lastMonth.setMonth(today.getMonth() - 1);
    
    const formatDateForInput = (date: Date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };
    
    const startDateInput = page.getByLabel('Start Date');
    const endDateInput = page.getByLabel('End Date');
    
    await startDateInput.fill(formatDateForInput(lastMonth));
    await endDateInput.fill(formatDateForInput(today));
    
    await page.waitForTimeout(1000);
  });
  
  // Test Step 2: Export to CSV
  await test.step('Export to CSV', async () => {
    // Start waiting for download before clicking
    const downloadPromise = page.waitForEvent('download');
    
    // Click export button
    const exportButton = page.getByRole('button', { name: 'Export to CSV' });
    await expect(exportButton).toBeVisible();
    await exportButton.click();
    
    // Wait for download
    const download = await downloadPromise;
    
    // Save the file
    const downloadPath = path.join(process.cwd(), 'playwright', 'downloads', download.suggestedFilename());
    await download.saveAs(downloadPath);
    
    // Store download path for verification
    page.context().downloadPath = downloadPath;
  });
  
  // Test Step 3: Open file and verify filtered data (SC)
  await test.step('Open file and verify filtered data (SC)', async () => {
    // Get the download path from context
    const downloadPath = page.context().downloadPath;
    
    // Verify file exists
    expect(fs.existsSync(downloadPath)).toBeTruthy();
    
    // Read file content
    const fileContent = fs.readFileSync(downloadPath, 'utf8');
    
    // Verify CSV has headers
    expect(fileContent).toContain('Timestamp');
    expect(fileContent).toContain('Document');
    
    // If there are data rows, verify they contain the search term
    const lines = fileContent.split('\n');
    if (lines.length > 1) {
      // Check that data rows contain "Protocol" (case-insensitive)
      const dataLines = lines.slice(1).filter(line => line.trim());
      dataLines.forEach(line => {
        if (line) {
          expect(line.toLowerCase()).toContain('protocol');
        }
      });
    }
    
    // Clean up downloaded file
    fs.unlinkSync(downloadPath);
    
    // Take screenshot
    const timestamp = formatTimestamp(new Date());
    await page.screenshot({ 
      path: getScreenshotPath(`TS.4.2-08-${timestamp}.png`),
      fullPage: true 
    });
  });
  
  // Expected Results:
  // 1. Filters applied ✓
  // 2. Export successful ✓
  // 3. CSV contains only filtered records ✓
});