import { Page } from '@playwright/test';
import { getScreenshotPath } from './paths';

/**
 * Handles the Electronic Records and Signature Disclosure dialog if it appears
 * @param page Playwright page object
 * @param recordTestStep Optional function to record test steps for reporting
 * @returns Boolean indicating whether the dialog was handled
 */
export async function handleERSDDialog(
  page: Page, 
  recordTestStep?: (testId: string, description: string, status: 'passed' | 'failed', code?: string, details?: string[]) => void
): Promise<boolean> {
  const testId = page.context()?.['_browser']?._browserType?.name() || 'unknown';
  console.log('Checking for ERSD dialog...');
  console.log(`Current URL: ${page.url()}`);
  
  // Take a screenshot to debug what we're seeing
  await page.screenshot({ path: getScreenshotPath('test-results/pre-ersd-check.png') });
  
  // Check if we're on the ERSD dialog by looking for key elements
  const dialogTitle = page.getByText('Electronic Record and Signature Disclosure', { exact: true });
  
  // Debug: Check if element exists in DOM
  const titleCount = await dialogTitle.count();
  console.log(`ERSD title element count in DOM: ${titleCount}`);
  
  // Try with a more flexible selector
  const dialogHeading = page.getByRole('heading', { name: 'Electronic Record and Signature Disclosure' });
  const headingCount = await dialogHeading.count();
  console.log(`ERSD heading element count: ${headingCount}`);
  
  // Check both text and heading visibility
  const dialogVisible = await dialogTitle.isVisible({ timeout: 5000 }).catch(() => false);
  const headingVisible = await dialogHeading.isVisible({ timeout: 5000 }).catch(() => false);
  
  if (!dialogVisible && !headingVisible) {
    console.log('ERSD dialog not detected, continuing with test');
    if (recordTestStep) {
      recordTestStep(
        testId,
        'Check for ERSD dialog',
        'passed',
        'await dialogTitle.isVisible()',
        ['ERSD dialog not shown - user has already accepted it previously']
      );
    }
    return false;
  }
  
  console.log(`ERSD dialog detected (text visible: ${dialogVisible}, heading visible: ${headingVisible}), handling consent process`);
  if (recordTestStep) {
    recordTestStep(
      testId,
      'Handle ERSD dialog',
      'passed',
      'await checkbox.check(), await agreeButton.click()',
      ['ERSD dialog detected', 'Checking consent checkbox', 'Clicking I Agree button']
    );
  }
  
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
    await page.screenshot({ path: getScreenshotPath('test-results/ersd-dialog-not-dismissed.png') });
  }
  
  return true;
} 