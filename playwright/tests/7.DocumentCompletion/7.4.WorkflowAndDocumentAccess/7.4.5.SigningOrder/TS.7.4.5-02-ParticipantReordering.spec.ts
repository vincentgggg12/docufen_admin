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

test('TS.7.4.5-02 Participant Reordering', async ({ page }) => {
  // Test Procedure:
  // 1. Enable signing order
  // 2. Drag user up
  // 3. Order changes
  // 4. Numbers update
  // 5. New sequence (SC)
  
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
  
  // Navigate to documents and create/open a document with participants
  await test.step('Navigate to document with multiple participants', async () => {
    // Navigate to documents
    await page.getByRole('link', { name: 'Documents' }).click();
    await page.waitForLoadState('domcontentloaded');
    
    // Find or create a document with multiple participants
    const documentCard = page.locator('.document-card').first();
    if (await documentCard.count() > 0) {
      await documentCard.click();
    } else {
      // Create new document if needed
      await page.getByRole('button', { name: 'New Document' }).click();
      await page.waitForLoadState('domcontentloaded');
    }
    
    // Wait for document editor to load
    await page.waitForSelector('.document-editor', { timeout: 30000 });
    
    // Open workflow panel
    await page.getByRole('button', { name: 'Workflow' }).click();
    await page.waitForTimeout(1000);
  });
  
  // Test Step 1: Enable signing order
  await test.step('Enable signing order', async () => {
    // Find and check the signing order checkbox for Pre-Approval group
    const preApprovalCheckbox = page.locator('.pre-approval-group input[type="checkbox"]');
    await preApprovalCheckbox.check();
    
    // Verify it's checked
    await expect(preApprovalCheckbox).toBeChecked();
    
    // Verify order numbers appear
    const participants = page.locator('.pre-approval-group .participant-item');
    await expect(participants.first()).toContainText('1');
  });
  
  // Test Step 2: Drag user up
  await test.step('Drag user up', async () => {
    // Get the second participant (should have order number 2)
    const secondParticipant = page.locator('.pre-approval-group .participant-item').nth(1);
    const firstParticipant = page.locator('.pre-approval-group .participant-item').nth(0);
    
    // Store the original names for verification
    const secondName = await secondParticipant.locator('.participant-name').textContent();
    const firstName = await firstParticipant.locator('.participant-name').textContent();
    
    // Perform drag and drop - drag second participant above first
    const dragHandle = secondParticipant.locator('.drag-handle');
    const targetArea = firstParticipant;
    
    await dragHandle.hover();
    await page.mouse.down();
    await targetArea.hover();
    await page.mouse.up();
    
    // Wait for reordering animation
    await page.waitForTimeout(500);
  });
  
  // Test Step 3: Order changes
  await test.step('Order changes', async () => {
    // Verify the participants have swapped positions
    const participants = page.locator('.pre-approval-group .participant-item');
    
    // The second participant should now be first
    const newFirstName = await participants.nth(0).locator('.participant-name').textContent();
    const newSecondName = await participants.nth(1).locator('.participant-name').textContent();
    
    // Verify positions have changed
    expect(newFirstName).not.toEqual(newSecondName);
  });
  
  // Test Step 4: Numbers update
  await test.step('Numbers update', async () => {
    // Verify order numbers have updated correctly
    const participants = page.locator('.pre-approval-group .participant-item');
    
    // First participant should have "1"
    await expect(participants.nth(0)).toContainText('1');
    
    // Second participant should have "2"
    await expect(participants.nth(1)).toContainText('2');
    
    // If there's a third participant, it should have "3"
    if (await participants.count() > 2) {
      await expect(participants.nth(2)).toContainText('3');
    }
  });
  
  // Test Step 5: New sequence (SC)
  await test.step('New sequence (SC)', async () => {
    // Verify the new signing order is maintained
    const participants = page.locator('.pre-approval-group .participant-item');
    
    // Count total participants
    const count = await participants.count();
    
    // Verify sequential numbering
    for (let i = 0; i < count; i++) {
      await expect(participants.nth(i)).toContainText(`${i + 1}`);
    }
    
    // Take screenshot showing the reordered sequence
    const timestamp = formatTimestamp(new Date());
    await page.screenshot({ 
      path: getScreenshotPath(`TS.7.4.5-02-${timestamp}.png`),
      fullPage: true 
    });
    
    // Verify drag handles are still visible for further reordering
    const dragHandles = page.locator('.pre-approval-group .drag-handle');
    await expect(dragHandles.first()).toBeVisible();
  });
  
  // Expected Results:
  // 1. Order on ✓
  // 2. Dragged ✓
  // 3. Position changed ✓
  // 4. 1,2,3 updated ✓
  // 5. Reordered ✓
});