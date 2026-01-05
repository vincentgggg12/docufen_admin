import { Page } from '@playwright/test';

/**
 * Simplified version of handleERSDDialog without screenshots
 * Used for tests that need to control their own screenshot timing
 */
export async function handleERSDDialogNoScreenshots(
  page: Page
): Promise<boolean> {
  console.log('Checking for ERSD dialog...');
  await page.waitForTimeout(2000);
  
  // Check if we're on the ERSD dialog by looking for key elements
  const dialogTitle = page.getByText('Electronic Record and Signature Disclosure', { exact: true });
  const dialogVisible = await dialogTitle.isVisible({ timeout: 5000 }).catch(() => false);
  
  if (!dialogVisible) {
    console.log('ERSD dialog not detected, continuing with test');
    return false;
  }
  
  console.log('ERSD dialog detected, handling consent process');
  
  // Check the agreement checkbox
  const checkbox = page.getByTestId('ersd-agreement-checkbox')
  
  await checkbox.check();
  console.log('Checked ERSD consent checkbox');
  
  // Click the I Agree button
  const agreeButton = page.getByTestId('ersd-agree-button');
  await agreeButton.click();
  console.log('Clicked I Agree button');
  
  // Wait for dialog to disappear
  await page.waitForTimeout(2000);
  
  // Verify dialog is gone
  const dialogGone = !(await dialogTitle.isVisible().catch(() => false));
  if (!dialogGone) {
    console.warn('ERSD dialog still visible after clicking I Agree');
  }
  
  return true;
}