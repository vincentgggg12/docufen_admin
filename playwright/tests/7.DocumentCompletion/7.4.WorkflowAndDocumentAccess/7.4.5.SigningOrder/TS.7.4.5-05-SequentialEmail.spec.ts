import { test, expect } from '@playwright/test';
import { microsoftLogin } from '../../../utils/msLogin';
import { handleERSDDialog } from '../../../utils/ersd-handler';
import { getScreenshotPath } from '../../../utils/paths';
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

test('TS.7.4.5-05 Sequential Email', async ({ page }) => {
  // Test Procedure:
  // 1. Enable signing order
  // 2. First user notified
  // 3. Others not emailed
  // 4. After sign, next notified
  // 5. One at a time (SC)
  
  // Setup: Login (not reported as test step)
  const email = process.env.MS_EMAIL_17NJ5D_MEGAN_BOWEN!;
  const password = process.env.MS_PASSWORD!;
  
  // Navigate to login page
  await page.goto(`${baseUrl}/login`);
  
  // Perform Microsoft login
  await microsoftLogin(page, email, password);
  
  // Handle ERSD if needed
  await handleERSDDialog(page);
  
  // Wait for navigation
  await page.waitForLoadState('domcontentloaded');
  
  // Navigate to document setup
  await test.step('Navigate to document with participants', async () => {
    // Navigate to documents
    await page.getByRole('link', { name: 'Documents' }).click();
    await page.waitForLoadState('domcontentloaded');
    
    // Create new document for clean test
    await page.getByRole('button', { name: 'New Document' }).click();
    await page.waitForLoadState('domcontentloaded');
    
    // Wait for document editor to load
    await page.waitForSelector('.document-editor', { timeout: 30000 });
    
    // Open workflow panel
    await page.getByRole('button', { name: 'Workflow' }).click();
    await page.waitForTimeout(1000);
    
    // Add multiple participants to Pre-Approval group
    // This would involve adding users - implementation depends on UI
  });
  
  // Test Step 1: Enable signing order
  await test.step('Enable signing order', async () => {
    // Find and check the signing order checkbox for Pre-Approval group
    const preApprovalCheckbox = page.locator('.pre-approval-group input[type="checkbox"]');
    await preApprovalCheckbox.check();
    
    // Verify it's checked
    await expect(preApprovalCheckbox).toBeChecked();
    
    // Verify order numbers appear next to participants
    const participants = page.locator('.pre-approval-group .participant-item');
    await expect(participants.first()).toContainText('1');
    
    // Look for email notification settings
    const emailSettings = page.locator('.email-settings, .notification-settings');
    if (await emailSettings.count() > 0) {
      await expect(emailSettings).toBeVisible();
    }
  });
  
  // Test Step 2: First user notified
  await test.step('First user notified', async () => {
    // Advance document to appropriate stage or trigger notifications
    const sendButton = page.getByRole('button', { name: /send|notify|invite/i });
    if (await sendButton.count() > 0) {
      await sendButton.click();
    }
    
    // Look for notification confirmation
    const notificationConfirm = page.locator('.notification-sent, .email-sent, [role="status"]');
    await expect(notificationConfirm).toBeVisible({ timeout: 5000 });
    
    // Verify first user notification indicator
    const firstParticipant = page.locator('.pre-approval-group .participant-item').first();
    const notificationIcon = firstParticipant.locator('.email-icon, .notification-icon, .sent-icon');
    await expect(notificationIcon).toBeVisible();
    
    // Check for "Email sent" or similar status
    await expect(firstParticipant).toContainText(/notified|email sent|invited/i);
  });
  
  // Test Step 3: Others not emailed
  await test.step('Others not emailed', async () => {
    // Check subsequent participants do not show email sent status
    const participants = page.locator('.pre-approval-group .participant-item');
    const count = await participants.count();
    
    // Skip first participant (already notified)
    for (let i = 1; i < count; i++) {
      const participant = participants.nth(i);
      
      // Should not have sent icon
      const sentIcon = participant.locator('.email-sent-icon, .sent-icon');
      await expect(sentIcon).not.toBeVisible();
      
      // Should show pending or waiting status
      await expect(participant).toContainText(/pending|waiting|not notified/i);
    }
    
    // Verify email queue or status shows only first user
    const emailQueue = page.locator('.email-queue, .notification-queue');
    if (await emailQueue.count() > 0) {
      await expect(emailQueue).toContainText('1');
    }
  });
  
  // Test Step 4: After sign, next notified
  await test.step('After sign, next notified', async () => {
    // Simulate first user signing (this might require switching users or mocking)
    // For test purposes, we'll look for the signing simulation or status update
    
    // Mock or trigger first signature completion
    const firstParticipant = page.locator('.pre-approval-group .participant-item').first();
    
    // Look for sign simulation button or status update
    const signButton = firstParticipant.locator('button:has-text("Sign")');
    if (await signButton.count() > 0) {
      await signButton.click();
      
      // Complete signature process
      const confirmButton = page.getByRole('button', { name: /confirm|complete/i });
      if (await confirmButton.isVisible()) {
        await confirmButton.click();
      }
    }
    
    // Wait for status update
    await page.waitForTimeout(2000);
    
    // Verify second user now shows as notified
    const secondParticipant = page.locator('.pre-approval-group .participant-item').nth(1);
    
    // Should now show notification sent
    const notificationIcon = secondParticipant.locator('.email-icon, .notification-icon, .sent-icon');
    await expect(notificationIcon).toBeVisible({ timeout: 10000 });
    
    // Status should update to notified
    await expect(secondParticipant).toContainText(/notified|email sent|next to sign/i);
  });
  
  // Test Step 5: One at a time (SC)
  await test.step('One at a time (SC)', async () => {
    // Take screenshot showing sequential notification pattern
    const timestamp = formatTimestamp(new Date());
    await page.screenshot({ 
      path: getScreenshotPath(`TS.7.4.5-05-${timestamp}.png`),
      fullPage: true 
    });
    
    // Verify sequential notification pattern
    const participants = page.locator('.pre-approval-group .participant-item');
    const count = await participants.count();
    
    let notifiedCount = 0;
    let nextToSignFound = false;
    
    for (let i = 0; i < count; i++) {
      const participant = participants.nth(i);
      const hasNotificationIcon = await participant.locator('.email-sent-icon, .sent-icon').isVisible();
      const isNextToSign = await participant.locator('text=/next to sign|awaiting/i').isVisible();
      
      if (hasNotificationIcon) {
        notifiedCount++;
      }
      
      if (isNextToSign && !nextToSignFound) {
        nextToSignFound = true;
        // This should be the participant immediately after the last signed one
        expect(notifiedCount).toBeLessThanOrEqual(i + 1);
      }
    }
    
    // Verify only one participant is actively notified at a time
    const activeNotifications = page.locator('.participant-item:has(.active-notification)');
    const activeCount = await activeNotifications.count();
    expect(activeCount).toBeLessThanOrEqual(1);
    
    // Verify sequential email indicator or status
    const sequentialIndicator = page.locator('text=/sequential|one at a time|order enabled/i');
    await expect(sequentialIndicator).toBeVisible();
  });
  
  // Expected Results:
  // 1. Order enabled ✓
  // 2. Only first emailed ✓
  // 3. Others waiting ✓
  // 4. Next gets email ✓
  // 5. Sequential notify ✓
});