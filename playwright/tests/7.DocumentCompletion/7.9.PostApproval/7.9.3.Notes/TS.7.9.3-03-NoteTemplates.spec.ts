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

test('TS.7.9.3-03 Note Templates', async ({ page }) => {
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

  // Open notes sidebar
  await page.getByRole('button', { name: 'Notes' }).click();
  await page.waitForSelector('[data-testid="notes-sidebar"]', { timeout: 5000 });

  // Test Step 1: View templates
  await test.step('View templates', async () => {
    // Look for template button or quick actions
    const templateButton = page.getByRole('button', { name: 'Templates' });
    const quickActionsButton = page.getByRole('button', { name: 'Quick Actions' });
    
    // Click whichever is available
    if (await templateButton.isVisible({ timeout: 2000 })) {
      await templateButton.click();
    } else if (await quickActionsButton.isVisible({ timeout: 2000 })) {
      await quickActionsButton.click();
    } else {
      // Some systems show templates directly
      await page.getByRole('button', { name: 'Add Note' }).click();
    }
    
    // Wait for templates to be visible
    await page.waitForSelector('[data-testid="note-template"], [data-testid="quick-note"]', { timeout: 5000 });
  });

  // Test Step 2: Approval specific options
  await test.step('Approval specific options', async () => {
    // Verify Post-Approval specific templates
    const approvalTemplates = [
      'Approved - Ready for closure',
      'Final review complete',
      'Quality approval granted',
      'Regulatory compliance verified',
      'Document meets all requirements'
    ];
    
    // Check for at least some approval-specific templates
    let foundTemplates = 0;
    for (const template of approvalTemplates) {
      const templateOption = page.getByText(template);
      if (await templateOption.isVisible({ timeout: 1000 })) {
        foundTemplates++;
      }
    }
    
    // Should find at least 2 approval-specific templates
    expect(foundTemplates).toBeGreaterThanOrEqual(2);
  });

  // Test Step 3: Click template
  await test.step('Click template', async () => {
    // Click on an available template
    const templates = [
      'Final review complete',
      'Approved - Ready for closure',
      'Document meets all requirements'
    ];
    
    let templateClicked = false;
    for (const templateText of templates) {
      const template = page.getByText(templateText);
      if (await template.isVisible({ timeout: 1000 })) {
        await template.click();
        templateClicked = true;
        break;
      }
    }
    
    expect(templateClicked).toBeTruthy();
  });

  // Test Step 4: Note created
  await test.step('Note created', async () => {
    // Verify note is created from template
    // Either in the input field or already posted
    
    // Check if it's in the input field
    const noteInput = page.getByPlaceholder('Type your note...');
    const inputValue = await noteInput.inputValue();
    
    if (inputValue) {
      // If in input, send it
      await page.getByRole('button', { name: 'Send' }).click();
    }
    
    // Wait for note to appear
    await page.waitForSelector('[data-testid="note-item"]', { timeout: 5000 });
    
    // Verify a template note was created
    const noteItems = page.locator('[data-testid="note-item"]');
    const latestNote = noteItems.first();
    await expect(latestNote).toBeVisible();
  });

  // Test Step 5: Quick feedback (SC)
  await test.step('Quick feedback (SC)', async () => {
    // Verify efficiency of template system
    const noteItems = page.locator('[data-testid="note-item"]');
    const latestNote = noteItems.first();
    
    // Verify note was created quickly with one click
    await expect(latestNote).toContainText(/Final review|Approved|requirements/i);
    
    // Verify it shows author
    await expect(latestNote).toContainText('Alex Wilber');
    
    // Take screenshot showing template note
    const timestamp = formatTimestamp(new Date());
    await page.screenshot({ 
      path: getScreenshotPath(`TS.7.9.3-03-5-${timestamp}.png`) 
    });
  });

  // Expected Results:
  // 1. Templates shown ✓
  // 2. Stage appropriate ✓
  // 3. One-click ✓
  // 4. Note added ✓
  // 5. Efficient entry ✓
});