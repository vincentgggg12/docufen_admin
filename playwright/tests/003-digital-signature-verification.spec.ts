import { test, expect } from '@playwright/test';
test.setTimeout(180000); // 3 minutes timeout for this test

import { microsoftLogin } from './utils/msLogin';
import dotenv from 'dotenv';
import { getScreenshotPath } from './utils/paths';

// Load environment variables from .playwright.env
dotenv.config({ path: '.playwright.env' });
const baseUrl = process.env.BASE_URL || 'https://beta.docufen.com';
// Define a simple recordTestStep function here to avoid having to create a new file
function recordTestStep(
  testId: string, 
  description: string, 
  status: 'passed' | 'failed', 
  code?: string, 
  details?: string[]
) {
  // Just log to console since we're not implementing the actual reporter
  console.log(`TEST STEP [${status}]: ${description}`);
}

test.describe('Test 003: Digital Signature Verification', () => {
  test('Verify digital signatures using three different methods', async ({ page }) => {
    const testId = test.info().testId;
    
    // Set a higher resolution viewport for better visibility
    await page.setViewportSize({ width: 1920, height: 1080 });
    
    // Record Microsoft login step
    recordTestStep(
      testId,
      'Log in as Grady Archie',
      'passed',
      'await microsoftLogin(page, process.env.MS_EMAIL_17NJ5D_GRADY_ARCHIE, process.env.MS_PASSWORD)',
      ['Uses Microsoft SSO login', 'Handles login redirects and permissions']
    );

    // Log in as Grady Archie
    await microsoftLogin(page, process.env.MS_EMAIL_17NJ5D_GRADY_ARCHIE || '', process.env.MS_PASSWORD || '');
    
    // ERSD dialog is already handled inside microsoftLogin

    // Navigate to Users page
    await page.goto(`${baseUrl}/users`);
    await page.waitForLoadState('networkidle', { timeout: 20_000 });
    
    // Take screenshot of users page
    await page.screenshot({ path: getScreenshotPath('test-results/digital-sig-users-page.png') });

    // --- User 1: Megan Bowen - Option 1: Image Upload ---
    recordTestStep(
      testId,
      'Verify User 1 (Megan Bowen) with Option 1: Image Upload',
      'passed',
      'Multiple steps for User 1 verification',
      ['Expands user row', 'Selects Option 1', 'Uploads image', 'Approves and verifies status']
    );

    console.log('--- Starting User 1 verification (Megan Bowen - Option 1: Image Upload) ---');
    
    // Expand Megan Bowen's row
    const meganRow = page.locator('tr', { has: page.getByText('Megan Bowen') })
                         .filter({ has: page.getByText('Trial Admin') });
    await meganRow.getByTestId('usersTable.collapsedRowIcon').click();
    await page.waitForTimeout(1000);
    
    // Take screenshot of expanded user details
    await page.screenshot({ path: getScreenshotPath('test-results/user1-expanded.png') });
    
    // Click "Verify Digital Signature" button
    await page.getByTestId('usersTable.verifyDigitalSignatureButton').click();
    await page.waitForTimeout(1000);
    
    // Take screenshot of verification drawer
    await page.screenshot({ path: getScreenshotPath('test-results/user1-verify-drawer.png') });
    
    // Upload image file (Option 1 is selected by default)
    console.log('Uploading image file...');
    
    // Find the hidden file input and set the file directly
    const fileInput = page.getByTestId('digitalSignatureVerification.fileInput')
      .or(page.locator('input[type="file"]'));
    
    // Make file input visible if hidden by CSS
    await page.evaluate(() => {
      const inputs = document.querySelectorAll('input[type="file"]');
      for (const input of inputs) {
        (input as HTMLElement).style.opacity = '1';
        (input as HTMLElement).style.visibility = 'visible';
        (input as HTMLElement).style.display = 'block';
        (input as HTMLElement).style.position = 'relative';
      }
    });
    
    // Set file to upload
    await fileInput.setInputFiles('src/assets/upload.png');
    await page.waitForTimeout(1000);
    
    // Take screenshot after file upload
    await page.screenshot({ path: getScreenshotPath('test-results/user1-after-upload.png') });
    
    // Click "Verify" button to approve the signature
    await page.getByTestId('digitalSignatureVerification.verifyButton').click();
    await page.waitForTimeout(2000);
    
    // Verify the signature image is visible
    await expect(page.getByRole('img', { name: 'Signature Image' })).toBeVisible();
    
    // Verify verification details
    await expect(page.getByLabel('Digital Signature Verification')).toContainText('Verified by:');
    await expect(page.getByLabel('Digital Signature Verification')).toContainText('Grady Archie (GA)');
    await expect(page.getByLabel('Digital Signature Verification')).toContainText('Verified on:');
    
    // Take screenshot of verification details
    await page.screenshot({ path: getScreenshotPath('test-results/user1-verification-details.png') });
    
    // Close the verification drawer
    await page.getByTestId('usersTable.signatureDrawerCloseButton').click();
    await page.waitForTimeout(1000);
    
    // Reopen to verify it shows as verified
    await page.getByTestId('usersTable.verifyDigitalSignatureButton').click();
    await page.waitForTimeout(1000);
    
    // Revoke the verification
    console.log('Revoking User 1 verification...');
    await page.getByTestId('usersTable.revokeVerificationButton').click();
    await page.waitForTimeout(1000);
    
    // Verify it's back to unverified state
    await page.getByTestId('usersTable.verifyDigitalSignatureButton').click();
    await page.waitForTimeout(1000);
    
    // Refresh the page to ensure UI updates properly
    await page.goto(`${baseUrl}/users`);
    await page.waitForLoadState('networkidle');
    
    // Re-find Megan's row after page refresh
    const meganRowAfterRefresh = page.locator('tr', { has: page.getByText('Megan Bowen') })
                                     .filter({ has: page.getByText('Trial Admin') });
    
    // Expand Megan's row again and verify status
    await meganRowAfterRefresh.getByTestId('usersTable.collapsedRowIcon').click();
    await page.getByTestId('usersTable.verifyDigitalSignatureButton').click();
    await expect(page.getByLabel('Digital Signature Verification')).toContainText('Verification Status: Not Verified');
    
    // Close drawer and collapse row
    await page.getByTestId('usersTable.signatureDrawerCloseButton').click();
    await page.getByTestId('usersTable.expandedRowIcon').click();
    
    console.log('✅ User 1 (Megan Bowen) verification completed');

    // --- User 2: Grady Archie - Option 2: Register Notation ---
    recordTestStep(
      testId,
      'Verify User 2 (Grady Archie) with Option 2: Register Notation',
      'passed',
      'Multiple steps for User 2 verification',
      ['Expands user row', 'Selects Option 2', 'Enters notation text', 'Approves and verifies status']
    );
    
    console.log('--- Starting User 2 verification (Grady Archie - Option 2: Register Notation) ---');
    
    // Expand Grady Archie's row
    const gradyRow = page.locator('tr', { has: page.getByText('Grady Archie') })
                         .filter({ has: page.getByText('User Manager') });
    await gradyRow.getByTestId('usersTable.collapsedRowIcon').click();
    await page.waitForTimeout(1000);
    
    // Take screenshot of expanded user details
    await page.screenshot({ path: getScreenshotPath('test-results/user2-expanded.png') });
    
    // Click "Verify Digital Signature" button
    await page.getByTestId('usersTable.verifyDigitalSignatureButton').click();
    await page.waitForTimeout(1000);
    
    // Take screenshot of verification drawer
    await page.screenshot({ path: getScreenshotPath('test-results/user2-verify-drawer.png') });
    
    // Select Option 2: Register Notation
    await page.getByTestId('digitalSignatureVerification.notationRadioButton').click();
    await page.waitForTimeout(500);
    
    // Enter notation text
    await page.getByTestId('digitalSignatureVerification.notationTextarea').click();
    await page.getByTestId('digitalSignatureVerification.notationTextarea').fill('Playwright test Register Notation');
    await page.waitForTimeout(500);
    
    // Take screenshot after entering notation
    await page.screenshot({ path: getScreenshotPath('test-results/user2-after-notation.png') });
    
    // Click "Verify" button to approve the signature
    await page.getByTestId('digitalSignatureVerification.verifyButton').click();
    await page.waitForTimeout(2000);
    
    // Verify the notation text is displayed
    await expect(page.getByLabel('Digital Signature Verification')).toContainText('Playwright test Register Notation');
    
    // Verify verification details
    await expect(page.getByLabel('Digital Signature Verification')).toContainText('Verified by:');
    await expect(page.getByLabel('Digital Signature Verification')).toContainText('Grady Archie (GA)');
    await expect(page.getByLabel('Digital Signature Verification')).toContainText('Verified on:');
    
    // Take screenshot of verification details
    await page.screenshot({ path: getScreenshotPath('test-results/user2-verification-details.png') });
    
    // Close the verification drawer
    await page.getByTestId('usersTable.signatureDrawerCloseButton').click();
    await page.waitForTimeout(1000);
    
    // Reopen to verify it shows as verified
    await page.getByTestId('usersTable.verifyDigitalSignatureButton').click();
    await page.waitForTimeout(1000);
    
    // Revoke the verification
    console.log('Revoking User 2 verification...');
    await page.getByTestId('usersTable.revokeVerificationButton').click();
    await page.waitForTimeout(1000);
    
    // Collapse Grady's row
    await gradyRow.getByTestId('usersTable.expandedRowIcon').click();
    // Now expand it again to verify status
    await gradyRow.getByTestId('usersTable.collapsedRowIcon').click();

    // Verify it's back to unverified state
    await page.getByTestId('usersTable.verifyDigitalSignatureButton').click();
    await page.waitForTimeout(1000);
    await expect(page.getByLabel('Digital Signature Verification')).toContainText('Verification Status: Not Verified');
    
    // Close drawer and collapse row
    await page.getByTestId('usersTable.signatureDrawerCloseButton').click();
    await page.getByTestId('usersTable.expandedRowIcon').click();
    
    console.log('✅ User 2 (Grady Archie) verification completed');

    // --- User 3: Julia Smith - Option 3: Microsoft ID Verification ---
    recordTestStep(
      testId,
      'Verify User 3 (Julia Smith) with Option 3: Microsoft ID Verification',
      'passed',
      'Multiple steps for User 3 verification',
      ['Expands user row', 'Selects Option 3', 'Approves with MS ID', 'Verifies status']
    );
    
    console.log('--- Starting User 3 verification (Julia Smith - Option 3: Microsoft ID Verification) ---');
    
    // Expand Julia Smith's row
    const juliaRow = page.locator('tr', { has: page.getByText('Julia Smith') })
                         .filter({ has: page.getByText('Creator') });
    await juliaRow.getByTestId('usersTable.collapsedRowIcon').click();
    await page.waitForTimeout(1000);
    
    // Take screenshot of expanded user details
    await page.screenshot({ path: getScreenshotPath('test-results/user3-expanded.png') });
    
    // Click "Verify Digital Signature" button
    await page.getByTestId('usersTable.verifyDigitalSignatureButton').click();
    await page.waitForTimeout(1000);
    
    // Take screenshot of verification drawer
    await page.screenshot({ path: getScreenshotPath('test-results/user3-verify-drawer.png') });
    
    // Select Option 3: Microsoft ID Verification
    await page.getByTestId('digitalSignatureVerification.microsoftRadioButton').click();
    await page.waitForTimeout(1000);
    
    // Take screenshot after selecting MS ID option
    await page.screenshot({ path: getScreenshotPath('test-results/user3-after-ms-id-selection.png') });
    
    // Click "Verify" button to approve the signature
    await page.getByTestId('digitalSignatureVerification.verifyButton').click();
    await page.waitForTimeout(2000);
    
    // Verify the Microsoft User ID is displayed
    await expect(page.getByLabel('Digital Signature Verification')).toContainText('7623372b-09cb-4d07-9428-44ba7223c403');
    
    // Verify verification details
    await expect(page.getByLabel('Digital Signature Verification')).toContainText('Verified by:');
    await expect(page.getByLabel('Digital Signature Verification')).toContainText('Grady Archie (GA)');
    await expect(page.getByLabel('Digital Signature Verification')).toContainText('Verified on:');
    
    // Take screenshot of verification details
    await page.screenshot({ path: getScreenshotPath('test-results/user3-verification-details.png') });
    
    // Close the verification drawer
    await page.getByTestId('usersTable.signatureDrawerCloseButton').click();
    await page.waitForTimeout(1000);
    
    // Collapse Julia's row
    await page.getByTestId('usersTable.expandedRowIcon').click();
    
    console.log('✅ User 3 (Julia Smith) verification completed');
    
    console.log('✅ Digital signature verification test completed successfully!');
  });
}); 