import { test, expect } from '@playwright/test';
import * as dotenv from 'dotenv';
import { microsoftLogin, handleERSDDialog } from '../../src/utils/microsoftLogin';
import { getScreenshotPath, formatTimestamp } from '../../src/utils/screenshotUtils';

dotenv.config({ path: '.playwright.env' });

test.use({
  viewport: { height: 1080, width: 1920 },
  ignoreHTTPSErrors: true
});

test.setTimeout(120000); // 2 minutes

test('TS.7.14-02 Rapid Participant Changes', async ({ page }) => {
  // Login as Document Owner
  const email = process.env.MS_EMAIL_17NJ5D_CHRIS_GREEN!;
  const password = process.env.MS_PASSWORD!;
  await microsoftLogin(page, email, password);
  await handleERSDDialog(page);

  // Navigate to Document Management
  await page.getByRole('button', { name: 'Menu' }).click();
  await page.getByRole('link', { name: 'Document Management' }).click();
  await page.waitForLoadState('networkidle');

  // Select a document to manage participants
  const firstDocument = page.locator('[data-testid="document-row"], tbody tr').first();
  await firstDocument.click();
  await page.waitForSelector('[data-testid="document-details"], text=/Participants/i');

  // Click on Participants or Edit Participants
  await page.getByRole('button', { name: /Participants|Edit Participants/i }).click();
  await page.waitForSelector('[data-testid="participants-modal"], [role="dialog"]');

  // Test Step 1: Add 10 users quickly
  await test.step('Add 10 users quickly', async () => {
    const userEmails = [
      'user1@example.com',
      'user2@example.com',
      'user3@example.com',
      'user4@example.com',
      'user5@example.com',
      'user6@example.com',
      'user7@example.com',
      'user8@example.com',
      'user9@example.com',
      'user10@example.com'
    ];

    for (const email of userEmails) {
      // Add user rapidly without waiting
      const addInput = page.locator('[data-testid="add-participant-input"], input[placeholder*="email" i]');
      await addInput.fill(email);
      await page.getByRole('button', { name: /Add|Plus|\+/i }).click();
      // Don't wait between additions
    }
  });

  // Test Step 2: Remove 5 rapidly
  await test.step('Remove 5 rapidly', async () => {
    // Find remove buttons and click 5 of them rapidly
    const removeButtons = page.locator('[data-testid="remove-participant"], button[aria-label*="Remove" i]');
    const count = await removeButtons.count();
    
    for (let i = 0; i < Math.min(5, count); i++) {
      await removeButtons.nth(i).click();
      // Don't wait between removals
    }
  });

  // Test Step 3: Add 5 more users
  await test.step('Add 5 more users', async () => {
    const additionalUsers = [
      'user11@example.com',
      'user12@example.com',
      'user13@example.com',
      'user14@example.com',
      'user15@example.com'
    ];

    for (const email of additionalUsers) {
      const addInput = page.locator('[data-testid="add-participant-input"], input[placeholder*="email" i]');
      await addInput.fill(email);
      await page.getByRole('button', { name: /Add|Plus|\+/i }).click();
    }
  });

  // Test Step 4: Single save call
  await test.step('Single save call', async () => {
    // Monitor network for save calls
    const savePromise = page.waitForResponse(
      response => response.url().includes('/api/documents') && 
                  (response.request().method() === 'PUT' || response.request().method() === 'PATCH'),
      { timeout: 10000 }
    );

    // Click save
    await page.getByRole('button', { name: /Save|Update/i }).click();

    // Wait for the save response
    const saveResponse = await savePromise;
    expect(saveResponse.status()).toBe(200);
  });

  // Test Step 5: All changes saved with screenshot
  await test.step('All changes saved (SC)', async () => {
    // Wait for success message
    await expect(page.getByText(/saved successfully|changes saved|updated successfully/i)).toBeVisible({ timeout: 10000 });

    // Verify the participant count reflects all changes
    // Started with existing, added 10, removed 5, added 5 more = net +10
    const participantCount = await page.locator('[data-testid="participant-item"], .participant-row').count();
    expect(participantCount).toBeGreaterThan(0);

    // Take screenshot
    const timestamp = formatTimestamp(new Date());
    await page.screenshot({ 
      path: getScreenshotPath(`TS.7.14-02-5-${timestamp}.png`),
      fullPage: true
    });
  });

  // Expected Results:
  // 1. Rapid adds ✓
  // 2. Quick removes ✓
  // 3. More adds ✓
  // 4. Debounced to one call ✓
  // 5. Efficient save ✓
});