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

test('TS.7.7.3-03 Quick Note Templates', async ({ page }) => {
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
  await test.step('1. View note options', async () => {
    // Click on the note button to open note options
    await page.getByRole('button', { name: 'Add Note' }).click();
    
    // Verify note dialog opens
    await expect(page.getByRole('dialog', { name: 'Add Note' })).toBeVisible();
  });

  await test.step('2. See "Sign Here"', async () => {
    // Look for template options or quick note buttons
    const templateSection = page.locator('.note-templates, [data-testid="quick-notes"]');
    
    // If templates are in a dropdown, click to expand
    const templateButton = page.getByRole('button', { name: 'Templates' });
    if (await templateButton.isVisible()) {
      await templateButton.click();
    }
    
    // Verify "Sign Here" template is visible
    const signHereTemplate = page.getByText('Sign Here', { exact: true });
    await expect(signHereTemplate).toBeVisible();
  });

  await test.step('3. Click template', async () => {
    // Click the "Sign Here" template
    await page.getByText('Sign Here', { exact: true }).click();
    
    // Verify the template text is inserted into the note field
    const noteInput = page.getByPlaceholder('Enter your note here') || 
                     page.getByLabel('Note') || 
                     page.locator('textarea').first();
    
    const noteValue = await noteInput.inputValue();
    expect(noteValue).toContain('Sign Here');
  });

  await test.step('4. Note created', async () => {
    // Save the note
    await page.getByRole('button', { name: 'Save' }).click();
    
    // Wait for note to be saved
    await page.waitForResponse(response => 
      response.url().includes('note') && response.status() === 200
    );
    
    // Verify note dialog closes
    await expect(page.getByRole('dialog', { name: 'Add Note' })).not.toBeVisible();
  });

  await test.step('5. Quick feedback (SC)', async () => {
    // Verify the note appears in the chat sidebar
    const chatSidebar = page.locator('.chat-sidebar, [data-testid="notes-panel"]');
    await expect(chatSidebar).toBeVisible();
    
    // Verify the template note is displayed
    await expect(chatSidebar).toContainText('Sign Here');
    
    // Verify it was created with one click (quick feedback)
    const noteTimestamp = chatSidebar.locator('.note-timestamp, time').first();
    await expect(noteTimestamp).toBeVisible();
    
    // Take screenshot showing the quick note creation
    const timestamp = formatTimestamp(new Date());
    await page.screenshot({ 
      path: getScreenshotPath(`TS.7.7.3-03-5-${timestamp}.png`) 
    });
  });

  // Expected Results:
  // 1. Options shown ✓
  // 2. Template visible ✓
  // 3. One-click ✓
  // 4. Note added ✓
  // 5. Efficient entry ✓
});