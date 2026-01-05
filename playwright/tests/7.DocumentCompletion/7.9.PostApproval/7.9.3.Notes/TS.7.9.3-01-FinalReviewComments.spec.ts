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

test('TS.7.9.3-01 Final Review Comments', async ({ page }) => {
  // Setup: Login as Post-Approval participant
  const email = process.env.MS_EMAIL_17NJ5D_ALEX_WILBER!;
  const password = process.env.MS_PASSWORD!;
  await microsoftLogin(page, email, password);
  await handleERSDDialog(page);

  // Navigate to a document in Post-Approval stage
  await page.getByRole('button', { name: 'Menu' }).click();
  await page.getByRole('link', { name: 'Tracking' }).click();
  
  // Find document in Post-Approval stage
  await page.waitForSelector('[data-testid="document-list"]', { timeout: 10000 });
  const postApprovalDoc = page.locator('[data-testid="document-item"]').filter({ hasText: 'Post-Approval' }).first();
  await postApprovalDoc.click();
  
  // Wait for document to load
  await page.waitForSelector('[data-testid="document-content"]', { timeout: 10000 });

  // Test Step 1: Add review note
  await test.step('Add review note', async () => {
    // Open notes/chat sidebar
    await page.getByRole('button', { name: 'Notes' }).click();
    await page.waitForSelector('[data-testid="notes-sidebar"]', { timeout: 5000 });
    
    // Click add note button
    await page.getByRole('button', { name: 'Add Note' }).click();
    
    // Wait for note input to be ready
    await page.waitForSelector('[data-testid="note-input"]', { timeout: 3000 });
  });

  // Test Step 2: Quality feedback
  await test.step('Quality feedback', async () => {
    // Type quality review feedback
    const reviewNote = 'Final quality review completed. All requirements have been met and verified. Document is ready for closure.';
    
    await page.getByPlaceholder('Type your note...').fill(reviewNote);
    
    // Verify text is entered
    await expect(page.getByPlaceholder('Type your note...')).toHaveValue(reviewNote);
  });

  // Test Step 3: Note saved
  await test.step('Note saved', async () => {
    // Save the note
    await page.getByRole('button', { name: 'Send' }).click();
    
    // Wait for note to appear in the list
    await page.waitForSelector('[data-testid="note-item"]', { timeout: 5000 });
    
    // Verify note is saved
    await expect(page.getByText('Final quality review completed')).toBeVisible();
  });

  // Test Step 4: In chat sidebar
  await test.step('In chat sidebar', async () => {
    // Verify note appears in the chat/notes sidebar
    const noteItem = page.locator('[data-testid="note-item"]').filter({ hasText: 'Final quality review completed' });
    await expect(noteItem).toBeVisible();
    
    // Verify it shows author name
    await expect(noteItem).toContainText('Alex Wilber');
    
    // Verify it shows timestamp
    await expect(noteItem).toContainText(/\d{1,2}:\d{2}/); // Time pattern
  });

  // Test Step 5: Review documented (SC)
  await test.step('Review documented (SC)', async () => {
    // Verify complete review documentation
    const noteItem = page.locator('[data-testid="note-item"]').filter({ hasText: 'Final quality review completed' });
    
    // Verify all review details are captured
    await expect(noteItem).toContainText('Final quality review completed');
    await expect(noteItem).toContainText('All requirements have been met');
    await expect(noteItem).toContainText('Document is ready for closure');
    
    // Take screenshot showing review note
    const timestamp = formatTimestamp(new Date());
    await page.screenshot({ 
      path: getScreenshotPath(`TS.7.9.3-01-5-${timestamp}.png`) 
    });
  });

  // Expected Results:
  // 1. Note added ✓
  // 2. Feedback entered ✓
  // 3. Saved ✓
  // 4. Visible in chat ✓
  // 5. Review recorded ✓
});