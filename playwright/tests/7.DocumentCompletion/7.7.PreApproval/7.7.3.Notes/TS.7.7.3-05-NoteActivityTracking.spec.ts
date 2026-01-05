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

test('TS.7.7.3-05 Note Activity Tracking', async ({ page }) => {
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

  // Store note details for verification
  let noteText = '';
  let noteTimestamp = '';

  // Test Steps
  await test.step('1. Add note', async () => {
    // Click on the note button
    await page.getByRole('button', { name: 'Add Note' }).click();
    
    // Enter note content with unique identifier
    noteText = `Audit test note - ${new Date().getTime()}`;
    const noteInput = page.getByPlaceholder('Enter your note here') || 
                     page.getByLabel('Note') || 
                     page.locator('textarea').first();
    await noteInput.fill(noteText);
    
    // Save the note
    await page.getByRole('button', { name: 'Save' }).click();
    
    // Wait for note to be saved
    await page.waitForResponse(response => 
      response.url().includes('note') && response.status() === 200
    );
    
    // Capture timestamp
    noteTimestamp = new Date().toISOString();
  });

  await test.step('2. Check audit', async () => {
    // Navigate to audit log or activity view
    // This could be in document details, a separate audit tab, or an activity panel
    
    // Try to find audit/activity button or tab
    const auditButton = page.getByRole('button', { name: 'Audit' }) ||
                       page.getByRole('button', { name: 'Activity' }) ||
                       page.getByRole('tab', { name: 'Audit Log' });
    
    if (await auditButton.isVisible()) {
      await auditButton.click();
    } else {
      // Alternative: Look for audit in document info or menu
      await page.getByRole('button', { name: 'Document Info' }).click();
      await page.getByRole('tab', { name: 'Activity' }).click();
    }
    
    // Wait for audit data to load
    await page.waitForLoadState('networkidle');
  });

  await test.step('3. Note creation logged', async () => {
    // Look for the note creation entry in the audit log
    const auditEntries = page.locator('.audit-entry, [data-testid="audit-item"]');
    
    // Find entry that mentions note creation
    const noteCreationEntry = auditEntries.filter({ 
      hasText: /note.*created|added.*note|comment.*added/i 
    });
    
    await expect(noteCreationEntry.first()).toBeVisible();
    
    // Verify the entry shows it's a note creation action
    const entryText = await noteCreationEntry.first().textContent();
    expect(entryText?.toLowerCase()).toMatch(/note|comment/);
  });

  await test.step('4. Content recorded', async () => {
    // Verify the audit entry contains the note content
    const auditEntry = page.locator('.audit-entry, [data-testid="audit-item"]')
      .filter({ hasText: noteText.substring(0, 20) }); // Use partial text for matching
    
    await expect(auditEntry.first()).toBeVisible();
    
    // Verify the full note text is captured
    const entryDetails = await auditEntry.first().textContent();
    expect(entryDetails).toContain(noteText);
  });

  await test.step('5. Location tracked (SC)', async () => {
    // Verify the audit entry shows location/position information
    const auditEntry = page.locator('.audit-entry, [data-testid="audit-item"]')
      .filter({ hasText: noteText.substring(0, 20) });
    
    // Look for location indicators like page number, coordinates, or section
    const locationInfo = auditEntry.locator('.location-info, [data-testid="location"]');
    
    if (await locationInfo.isVisible()) {
      const location = await locationInfo.textContent();
      expect(location).toMatch(/page|position|section|location/i);
    } else {
      // Alternative: Check if the entry contains location data
      const fullEntry = await auditEntry.first().textContent();
      expect(fullEntry).toMatch(/page \d+|position|coordinates|section/i);
    }
    
    // Verify user information is tracked
    const userInfo = auditEntry.locator('.user-info, [data-testid="user"]');
    await expect(userInfo.first()).toBeVisible();
    
    // Take screenshot of the audit log showing note tracking
    const timestamp = formatTimestamp(new Date());
    await page.screenshot({ 
      path: getScreenshotPath(`TS.7.7.3-05-5-${timestamp}.png`) 
    });
  });

  // Expected Results:
  // 1. Note added ✓
  // 2. Audit viewed ✓
  // 3. Entry found ✓
  // 4. Text captured ✓
  // 5. Position saved ✓
});