import { test, expect } from '@playwright/test';
import { microsoftLogin } from '../utils/msLogin';
import { handleERSDDialog } from '../utils/ersd-handler';
import { getScreenshotPath } from '../utils/paths';
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

test('TS.5.4-04 Verification Recording', async ({ page }) => {
  // Test Procedure:
  // 1. View verified user details
  // 2. Check verifier identity shown
  // 3. Check timestamp displayed
  // 4. Check method recorded
  // 5. Verify in audit trail (SC)
  
  // Setup: Login as Grady (not reported as test step)
  const email = process.env.MS_EMAIL_17NJ5D_GRADY_ADAMS!;
  const password = process.env.MS_PASSWORD!;
  
  // Navigate to login page
  await page.goto(`${baseUrl}/login`);
  
  // Perform Microsoft login
  await microsoftLogin(page, email, password);
  
  // Handle ERSD if needed
  await handleERSDDialog(page);
  
  // Wait for navigation
  await page.waitForLoadState('domcontentloaded');
  
  // Navigate to Users page
  await page.getByRole('button', { name: 'Menu' }).click();
  await page.getByRole('link', { name: 'Users' }).click();
  await page.waitForSelector('text=Users', { timeout: 10000 });
  
  // Test Step 1: View verified user details
  await test.step('View verified user details', async () => {
    // Search for a verified user (e.g., Diego if verified in previous test)
    const searchBox = page.getByPlaceholder(/Search/i);
    await searchBox.fill('Diego Siciliani');
    await page.waitForTimeout(1000);
    
    // Find Diego's row
    const diegoRow = page.locator('tr').filter({ hasText: 'Diego Siciliani' });
    
    // Click on row to expand details
    await diegoRow.click();
    await page.waitForTimeout(1000);
    
    // Verify details are expanded
    const expandedDetails = page.locator('[data-testid="user-details"], [aria-expanded="true"]');
    await expect(expandedDetails).toBeVisible();
  });
  
  // Test Step 2: Check verifier identity shown
  await test.step('Check verifier identity shown', async () => {
    // Look for verifier information
    const expandedDetails = page.locator('[data-testid="user-details"], [aria-expanded="true"]');
    
    // Verify shows who verified the signature
    await expect(expandedDetails).toContainText(/Verified by.*Grady.*A|Verifier.*Grady/i);
  });
  
  // Test Step 3: Check timestamp displayed
  await test.step('Check timestamp displayed', async () => {
    const expandedDetails = page.locator('[data-testid="user-details"], [aria-expanded="true"]');
    
    // Verify timestamp is shown (various date formats)
    const datePattern = /\d{4}-\d{2}-\d{2}|\d{1,2}\/\d{1,2}\/\d{4}|\d{1,2}\s\w+\s\d{4}/;
    await expect(expandedDetails).toContainText(datePattern);
    
    // Also check for time if shown
    const timePattern = /\d{1,2}:\d{2}(:\d{2})?(\s?(AM|PM|am|pm))?/;
    const hasTime = await expandedDetails.locator(`text=${timePattern}`).count() > 0;
    if (hasTime) {
      await expect(expandedDetails).toContainText(timePattern);
    }
  });
  
  // Test Step 4: Check method recorded
  await test.step('Check method recorded', async () => {
    const expandedDetails = page.locator('[data-testid="user-details"], [aria-expanded="true"]');
    
    // Verify verification method is shown (e.g., Image Upload)
    await expect(expandedDetails).toContainText(/Method.*Image|Image.*Upload|Verification.*Method/i);
  });
  
  // Test Step 5: Verify in audit trail (SC)
  await test.step('Verify in audit trail (SC)', async () => {
    // Click Audit Trail button
    const auditTrailButton = page.getByRole('button', { name: /Audit Trail/i });
    await auditTrailButton.click();
    
    // Wait for audit modal to open
    await page.waitForTimeout(1000);
    
    // Take screenshot
    const timestamp = formatTimestamp(new Date());
    await page.screenshot({ 
      path: getScreenshotPath(`TS.5.4-04-${timestamp}.png`),
      fullPage: true 
    });
    
    // Verify audit modal is open
    const auditModal = page.locator('[role="dialog"], [data-testid="audit-trail-modal"]');
    await expect(auditModal).toBeVisible();
    
    // Look for signature verification entry
    const verificationEntry = page.locator('[data-testid="audit-entry"], tr').filter({ 
      hasText: /Signature.*verified|Verification.*added/i 
    });
    
    // Verify entry exists
    await expect(verificationEntry.first()).toBeVisible();
    
    // Verify entry shows verifier
    await expect(verificationEntry.first()).toContainText(/Grady/);
    
    // Verify entry shows timestamp
    await expect(verificationEntry.first()).toContainText(/\d{4}-\d{2}-\d{2}|\d{1,2}\/\d{1,2}\/\d{4}/);
  });
  
  // Expected Results:
  // 1. Details expand ✓
  // 2. Shows "Verified by Grady A" ✓
  // 3. Shows date/time ✓
  // 4. Shows verification method ✓
  // 5. Audit log entry created ✓
});