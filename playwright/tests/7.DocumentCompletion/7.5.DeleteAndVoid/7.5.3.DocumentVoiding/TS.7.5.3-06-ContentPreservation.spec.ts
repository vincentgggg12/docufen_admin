import { test, expect } from '@playwright/test';
import { getScreenshotPath } from '../../../utils/paths';
import dotenv from 'dotenv';
import { microsoftLogin } from '../../../utils/msLogin';
import { handleERSDDialog } from '../../../utils/ersd-handler';

dotenv.config({ path: '.playwright.env' });

test.use({
  viewport: { height: 1080, width: 1920 },
  ignoreHTTPSErrors: true
});

test.setTimeout(120000); // 2 minutes

test('TS.7.5.3-06 Content Preservation', async ({ page }) => {
  // Setup: Login as owner
  const email = process.env.MS_EMAIL_MSPM36_DIEGO_SICILIANI!;
  const password = process.env.MS_PASSWORD!;
  await microsoftLogin(page, email, password);
  await handleERSDDialog(page);

  // Create a document with content
  await page.goto('/documents');
  await page.waitForLoadState('networkidle');
  
  await page.getByTestId('lsb.nav-main.documents-newDocument').click();
  await page.getByTestId('createDocumentDialog.documentNameInput').fill('Content Preservation Test');
  await page.getByTestId('createDocumentDialog.createButton').click();
  await page.waitForURL(/.*\/editor\/.*/, { timeout: 10000 });

  // Add comprehensive content to the document
  const editor = page.getByTestId('editor-content');
  await editor.click();
  
  // Add various types of content
  const testContent = `Test Document Content

This document contains various elements:
1. Numbered lists
2. Text formatting
3. Multiple paragraphs

Important Information:
- Bullet point 1
- Bullet point 2
- Bullet point 3

Final section with additional text to ensure all content is preserved after voiding.`;

  await page.keyboard.type(testContent);
  await page.waitForTimeout(1000);

  // Store content for comparison
  const originalContent = await editor.innerText();

  // Step 1: Void document
  await test.step('Void document.', async () => {
    // Click Void button
    await page.getByRole('button', { name: 'Void' }).click();
    
    // Enter void reason
    const reasonField = page.getByTestId('voidReasonDialog.reasonTextarea');
    await reasonField.fill('Testing content preservation after document voiding');
    
    // Confirm void
    const confirmButton = page.getByTestId('voidReasonDialog.confirmButton');
    await confirmButton.click();
    
    // Wait for void process to complete
    await page.waitForTimeout(2000);
    
    // Verify document is voided
    const stageIndicator = page.getByTestId('document.stageIndicator');
    await expect(stageIndicator).toContainText('Voided');
  });

  // Step 2: View content
  await test.step('View content.', async () => {
    // Ensure editor is still visible
    await expect(editor).toBeVisible();
    
    // Get current content
    const currentContent = await editor.innerText();
    
    // Verify content is still accessible
    expect(currentContent).toBeTruthy();
    expect(currentContent.length).toBeGreaterThan(0);
  });

  // Step 3: All preserved
  await test.step('All preserved.', async () => {
    // Get content after voiding
    const preservedContent = await editor.innerText();
    
    // Compare with original content
    expect(preservedContent).toBe(originalContent);
    
    // Verify specific content elements
    await expect(editor).toContainText('Test Document Content');
    await expect(editor).toContainText('This document contains various elements:');
    await expect(editor).toContainText('Important Information:');
    await expect(editor).toContainText('Bullet point 1');
    await expect(editor).toContainText('Final section with additional text');
  });

  // Step 4: Read-only mode
  await test.step('Read-only mode.', async () => {
    // Try to click and type in the editor
    await editor.click();
    const initialContent = await editor.innerText();
    
    // Attempt to type new content
    await page.keyboard.type('This should not be added');
    await page.waitForTimeout(500);
    
    // Verify content hasn't changed
    const afterTypeContent = await editor.innerText();
    expect(afterTypeContent).toBe(initialContent);
    
    // Check for read-only attributes
    const isReadOnly = await editor.evaluate(el => {
      const contentEditable = el.getAttribute('contenteditable');
      const hasReadOnlyAttr = el.hasAttribute('readonly');
      const hasReadOnlyClass = el.classList.contains('read-only') || 
                              el.classList.contains('readonly') ||
                              el.classList.contains('disabled');
      const isDisabled = el.hasAttribute('disabled');
      
      return contentEditable === 'false' || hasReadOnlyAttr || hasReadOnlyClass || isDisabled;
    });
    
    expect(isReadOnly).toBeTruthy();
  });

  // Step 5: Nothing lost (SC)
  await test.step('Nothing lost (SC)', async () => {
    // Final verification that all content is preserved
    const finalContent = await editor.innerText();
    expect(finalContent).toBe(originalContent);
    
    // Take screenshot showing preserved content
    const timestamp = new Date();
    const formattedTimestamp = `${timestamp.getFullYear()}.${String(timestamp.getMonth() + 1).padStart(2, '0')}.${String(timestamp.getDate()).padStart(2, '0')}-${String(timestamp.getHours()).padStart(2, '0')}.${String(timestamp.getMinutes()).padStart(2, '0')}.${String(timestamp.getSeconds()).padStart(2, '0')}`;
    await page.screenshot({ 
      path: getScreenshotPath(`TS.7.5.3-06-5-${formattedTimestamp}.png`) 
    });
    
    // Additional checks for UI elements
    const voidedBadge = page.getByRole('status').filter({ hasText: 'Voided' });
    await expect(voidedBadge).toBeVisible();
    
    // Verify no edit buttons are available
    const editButton = page.getByRole('button', { name: 'Edit' });
    await expect(editButton).not.toBeVisible();
  });

  // Expected Results:
  // 1. Voided ✓
  // 2. Content checked ✓
  // 3. Everything intact ✓
  // 4. Cannot edit ✓
  // 5. Fully preserved ✓
});