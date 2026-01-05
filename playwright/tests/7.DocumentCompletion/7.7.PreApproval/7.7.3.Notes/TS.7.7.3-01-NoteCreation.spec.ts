import { test, expect } from '@playwright/test';
import * as dotenv from 'dotenv';
import { microsoftLogin, handleERSDDialog } from '../../../src/utils/microsoftLogin';
import { getScreenshotPath, formatTimestamp } from '../../../src/utils/screenshotUtils';

dotenv.config({ path: '.playwright.env' });

test.use({
  viewport: { height: 1080, width: 1920 },
  ignoreHTTPSErrors: true
});

test.setTimeout(120000); // 2 minutes

test('TS.7.7.3-01 Note Creation', async ({ page }) => {
  // Login as a Pre-Approval participant
  const email = process.env.MS_EMAIL_ORG_USERNAME!;
  const password = process.env.MS_PASSWORD!;
  await microsoftLogin(page, email, password);
  await handleERSDDialog(page);

  // Navigate to a document in Pre-Approval stage
  await page.getByRole('button', { name: 'Menu' }).click();
  await page.getByRole('link', { name: 'Documents' }).click();
  await page.waitForLoadState('networkidle');
  
  // Find and open a document in Pre-Approval stage
  await page.getByText('Pre-Approval').first().click();
  await page.waitForLoadState('networkidle');

  // Test Steps
  await test.step('1. Click note option', async () => {
    // Click on the note/comment button in the toolbar
    await page.getByRole('button', { name: 'Add Note' }).click();
    
    // Verify note dialog/panel opens
    await expect(page.getByRole('dialog', { name: 'Add Note' })).toBeVisible();
  });

  await test.step('2. Enter comment', async () => {
    // Type comment in the note field
    const noteInput = page.getByPlaceholder('Enter your note here') || 
                     page.getByLabel('Note') || 
                     page.locator('textarea').first();
    await noteInput.fill('This section needs clarification on dosage requirements');
    
    // Verify text was entered
    await expect(noteInput).toHaveValue('This section needs clarification on dosage requirements');
  });

  await test.step('3. Save note', async () => {
    // Click save button
    await page.getByRole('button', { name: 'Save' }).click();
    
    // Wait for note to be saved
    await page.waitForResponse(response => 
      response.url().includes('note') && response.status() === 200
    );
  });

  await test.step('4. Bookmark created', async () => {
    // Check that a bookmark icon appears in the document at the note location
    const bookmarkIcon = page.locator('.bookmark-icon, [data-testid="bookmark"]').first();
    await expect(bookmarkIcon).toBeVisible();
    
    // Verify bookmark is clickable
    await expect(bookmarkIcon).toHaveAttribute('role', 'button');
  });

  await test.step('5. Note visible (SC)', async () => {
    // Verify note appears in the chat sidebar
    const chatSidebar = page.locator('.chat-sidebar, [data-testid="notes-panel"]');
    await expect(chatSidebar).toBeVisible();
    
    // Verify the note content is displayed
    await expect(chatSidebar).toContainText('This section needs clarification on dosage requirements');
    
    // Take screenshot
    const timestamp = formatTimestamp(new Date());
    await page.screenshot({ 
      path: getScreenshotPath(`TS.7.7.3-01-5-${timestamp}.png`) 
    });
  });

  // Expected Results:
  // 1. Note clicked ✓
  // 2. Comment typed ✓
  // 3. Saved ✓
  // 4. Bookmark added ✓
  // 5. In chat sidebar ✓
});