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

test('TS.7.7.3-02 Participant Mentions', async ({ page }) => {
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

  // Open note dialog
  await page.getByRole('button', { name: 'Add Note' }).click();

  // Test Steps
  await test.step('1. Type @ in note', async () => {
    // Find the note input field
    const noteInput = page.getByPlaceholder('Enter your note here') || 
                     page.getByLabel('Note') || 
                     page.locator('textarea').first();
    
    // Type @ to trigger mention
    await noteInput.type('@');
    
    // Wait for mention dropdown to appear
    await page.waitForTimeout(500);
  });

  await test.step('2. User list appears', async () => {
    // Verify the mention dropdown is visible
    const mentionDropdown = page.locator('.mention-dropdown, [data-testid="mention-list"]');
    await expect(mentionDropdown).toBeVisible();
    
    // Verify it contains user names
    await expect(mentionDropdown).toContainText('Diego');
  });

  await test.step('3. Select @Diego', async () => {
    // Click on Diego from the dropdown
    await page.getByText('Diego', { exact: false }).click();
    
    // Verify Diego was added to the note
    const noteInput = page.getByPlaceholder('Enter your note here') || 
                     page.getByLabel('Note') || 
                     page.locator('textarea').first();
    const noteValue = await noteInput.inputValue();
    expect(noteValue).toContain('@Diego');
    
    // Complete the note
    await noteInput.type(' please review the dosage section');
  });

  await test.step('4. Email sent', async () => {
    // Set up listener for notification API call
    const notificationPromise = page.waitForResponse(response => 
      response.url().includes('notification') || 
      response.url().includes('email') ||
      response.url().includes('mention'),
      { timeout: 10000 }
    );
    
    // Save the note
    await page.getByRole('button', { name: 'Save' }).click();
    
    // Wait for notification to be sent
    const notificationResponse = await notificationPromise;
    expect(notificationResponse.status()).toBe(200);
  });

  await test.step('5. Mention works (SC)', async () => {
    // Verify the mention appears in the saved note
    const chatSidebar = page.locator('.chat-sidebar, [data-testid="notes-panel"]');
    await expect(chatSidebar).toBeVisible();
    
    // Verify the mention is highlighted/styled differently
    const mentionElement = chatSidebar.locator('text=@Diego');
    await expect(mentionElement).toBeVisible();
    
    // Check that mention has special styling (usually a different color or background)
    const mentionStyle = await mentionElement.evaluate(el => {
      const styles = window.getComputedStyle(el);
      return {
        color: styles.color,
        backgroundColor: styles.backgroundColor,
        fontWeight: styles.fontWeight
      };
    });
    
    // Verify mention has distinct styling
    expect(mentionStyle.color).not.toBe('rgb(0, 0, 0)'); // Not plain black
    
    // Take screenshot
    const timestamp = formatTimestamp(new Date());
    await page.screenshot({ 
      path: getScreenshotPath(`TS.7.7.3-02-5-${timestamp}.png`) 
    });
  });

  // Expected Results:
  // 1. @ typed ✓
  // 2. Dropdown shown ✓
  // 3. Diego selected ✓
  // 4. Notification sent ✓
  // 5. Feature functional ✓
});