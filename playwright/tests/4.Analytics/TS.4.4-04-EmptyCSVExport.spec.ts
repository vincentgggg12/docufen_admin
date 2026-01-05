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

test('TS.4.4-04 Empty CSV Export', async ({ page }) => {
  // Test Procedure:
  // 1. Filter to show no results
  // 2. Click Export CSV
  // 3. Open downloaded file
  // 4. Verify headers present (SC)
  
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
  
  // Test Step 1: Filter to show no results
  await test.step('Filter to show no results', async () => {
    // Search for something that won't exist
    const searchInput = page.getByPlaceholder('Search transactions...');
    await searchInput.fill('XXXXXXXXXXXXXXXXXXXXXXXX');
    
    // Wait for search to process
    await page.waitForTimeout(1000);
    
    // Verify no results
    await expect(page.getByText('No transactions found')).toBeVisible();
  });
  
  // Test Step 2: Click Export CSV
  await test.step('Click Export CSV', async () => {
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
  
  // Test Step 3: Open downloaded file
  await test.step('Open downloaded file', async () => {
    const downloadPath = page.context().downloadPath;
    
    // Verify file exists
    expect(fs.existsSync(downloadPath)).toBeTruthy();
  });
  
  // Test Step 4: Verify headers present (SC)
  await test.step('Verify headers present (SC)', async () => {
    const downloadPath = page.context().downloadPath;
    
    // Read file content
    const fileContent = fs.readFileSync(downloadPath, 'utf8');
    
    // Verify CSV has headers
    expect(fileContent).toContain('Timestamp');
    expect(fileContent).toContain('Document');
    expect(fileContent).toContain('Category');
    expect(fileContent).toContain('User');
    expect(fileContent).toContain('Type');
    expect(fileContent).toContain('Pages');
    
    // Verify no data rows (only header line)
    const lines = fileContent.split('\n').filter(line => line.trim());
    expect(lines.length).toBe(1); // Only header line
    
    // Clean up downloaded file
    fs.unlinkSync(downloadPath);
    
    // Take screenshot
    const timestamp = formatTimestamp(new Date());
    await page.screenshot({ 
      path: getScreenshotPath(`TS.4.4-04-${timestamp}.png`),
      fullPage: true 
    });
  });
  
  // Expected Results:
  // 1. No transactions shown ✓
  // 2. CSV downloads ✓
  // 3. File contains headers only ✓
  // 4. Valid CSV structure ✓
});