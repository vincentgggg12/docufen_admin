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

test('TS.7.7.3-04 Note Bookmark', async ({ page }) => {
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
  await test.step('1. Create note', async () => {
    // Click on the note button
    await page.getByRole('button', { name: 'Add Note' }).click();
    
    // Enter note content
    const noteInput = page.getByPlaceholder('Enter your note here') || 
                     page.getByLabel('Note') || 
                     page.locator('textarea').first();
    await noteInput.fill('Check this reference against protocol requirements');
    
    // Save the note
    await page.getByRole('button', { name: 'Save' }).click();
    
    // Wait for note to be saved
    await page.waitForResponse(response => 
      response.url().includes('note') && response.status() === 200
    );
  });

  await test.step('2. Check document', async () => {
    // Verify we're viewing the document
    const documentViewer = page.locator('.document-viewer, [data-testid="document-viewer"]');
    await expect(documentViewer).toBeVisible();
    
    // Look for any existing bookmarks
    const bookmarks = page.locator('.bookmark-icon, [data-testid="bookmark"]');
    const bookmarkCount = await bookmarks.count();
    expect(bookmarkCount).toBeGreaterThan(0);
  });

  await test.step('3. Bookmark icon shown', async () => {
    // Find the bookmark icon in the document
    const bookmarkIcon = page.locator('.bookmark-icon, [data-testid="bookmark"]').first();
    await expect(bookmarkIcon).toBeVisible();
    
    // Verify the bookmark has visual indicators (icon, color, etc.)
    const bookmarkStyles = await bookmarkIcon.evaluate(el => {
      const styles = window.getComputedStyle(el);
      return {
        display: styles.display,
        visibility: styles.visibility,
        opacity: styles.opacity
      };
    });
    
    expect(bookmarkStyles.display).not.toBe('none');
    expect(bookmarkStyles.visibility).toBe('visible');
    expect(parseFloat(bookmarkStyles.opacity)).toBeGreaterThan(0);
  });

  await test.step('4. Click bookmark', async () => {
    // Click on the bookmark icon
    const bookmarkIcon = page.locator('.bookmark-icon, [data-testid="bookmark"]').first();
    await bookmarkIcon.click();
    
    // Wait for any navigation or focus change
    await page.waitForTimeout(500);
  });

  await test.step('5. Jumps to location (SC)', async () => {
    // Verify the view jumps to the note location
    // This could be shown by:
    // 1. The note being highlighted in the sidebar
    const chatSidebar = page.locator('.chat-sidebar, [data-testid="notes-panel"]');
    const noteItem = chatSidebar.locator('text=Check this reference against protocol requirements');
    await expect(noteItem).toBeVisible();
    
    // 2. The note being highlighted or focused
    const noteHighlight = noteItem.locator('..').first();
    const highlightClass = await noteHighlight.getAttribute('class');
    expect(highlightClass).toMatch(/highlight|active|selected|focused/);
    
    // 3. The document scrolling to the bookmark location
    // Verify by checking if the bookmark is in viewport
    const isInViewport = await bookmarkIcon.isIntersectingViewport();
    expect(isInViewport).toBe(true);
    
    // Take screenshot showing the bookmark navigation
    const timestamp = formatTimestamp(new Date());
    await page.screenshot({ 
      path: getScreenshotPath(`TS.7.7.3-04-5-${timestamp}.png`) 
    });
  });

  // Expected Results:
  // 1. Note created ✓
  // 2. Doc checked ✓
  // 3. Icon visible ✓
  // 4. Clicked ✓
  // 5. Navigation works ✓
});