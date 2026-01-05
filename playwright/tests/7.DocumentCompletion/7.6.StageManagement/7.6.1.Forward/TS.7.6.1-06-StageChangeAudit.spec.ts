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

test('TS.7.6.1-06 Stage Change Audit', async ({ page }) => {
  // Setup: Login as owner
  const diegoEmail = process.env.MS_EMAIL_MSPM36_DIEGO_SICILIANI!;
  const password = process.env.MS_PASSWORD!;
  await microsoftLogin(page, diegoEmail, password);
  await handleERSDDialog(page);

  // Create document
  await page.goto('/documents');
  await page.waitForLoadState('networkidle');
  
  await page.getByTestId('lsb.nav-main.documents-newDocument').click();
  await page.getByTestId('createDocumentDialog.documentNameInput').fill('Stage Change Audit Test');
  await page.getByTestId('createDocumentDialog.createButton').click();
  await page.waitForURL(/.*\/editor\/.*/, { timeout: 10000 });

  // Add content
  await page.locator('[contenteditable="true"]').first().click();
  await page.keyboard.type('Stage Change Audit Test Document');
  
  // Note the current stage (should be Pre-Approval or Draft)
  const initialStage = await page.locator('[data-stage], .stage-indicator, .stage-name').first().textContent();

  // Step 1: Advance stage
  await test.step('Advance stage.', async () => {
    // Find and click the advance button
    const advanceButton = page.getByRole('button', { name: /Next Stage|Forward|Advance|To Execute|Skip/i });
    await expect(advanceButton).toBeVisible();
    await advanceButton.click();
    
    // Wait for stage change to complete
    await page.waitForTimeout(2000);
    
    // Verify stage has changed
    const newStage = await page.locator('[data-stage], .stage-indicator, .stage-name').first().textContent();
    expect(newStage).not.toBe(initialStage);
  });

  // Step 2: Check audit log
  await test.step('Check audit log.', async () => {
    // Navigate to audit log
    // Could be in a tab, menu, or dedicated audit section
    const auditTab = page.getByRole('tab', { name: /Audit|History|Activity|Log/i });
    
    if (await auditTab.isVisible({ timeout: 3000 }).catch(() => false)) {
      await auditTab.click();
    } else {
      // Try menu option
      const menuButton = page.getByRole('button', { name: /Menu|More|Options/i });
      if (await menuButton.isVisible({ timeout: 3000 }).catch(() => false)) {
        await menuButton.click();
        const auditOption = page.getByRole('menuitem', { name: /Audit|History|Activity/i });
        await auditOption.click();
      }
    }
    
    // Wait for audit entries to load
    await page.waitForTimeout(1000);
  });

  // Step 3: Stage change logged
  await test.step('Stage change logged.', async () => {
    // Look for stage change entry in audit log
    const stageChangeEntry = page.locator('text=/stage.*change|advanced.*stage|moved.*stage|transition/i');
    await expect(stageChangeEntry.first()).toBeVisible({ timeout: 5000 });
    
    // Entry should be recent (within last few entries)
    const recentEntries = page.locator('.audit-entry, [data-audit-entry], tr').locator(':visible');
    const entryCount = await recentEntries.count();
    
    // Check first few entries for stage change
    let found = false;
    for (let i = 0; i < Math.min(5, entryCount); i++) {
      const entryText = await recentEntries.nth(i).textContent();
      if (entryText && /stage|transition|advanced/i.test(entryText)) {
        found = true;
        break;
      }
    }
    expect(found).toBeTruthy();
  });

  // Step 4: Previous/new shown
  await test.step('Previous/new shown.', async () => {
    // Find the stage change entry
    const stageChangeEntry = page.locator('text=/stage.*change|advanced.*stage|moved.*stage|transition/i').first().locator('..');
    
    // Should show both previous and new stage names
    const entryText = await stageChangeEntry.textContent();
    
    // Look for stage names (Pre-Approval, Execute, Post-Approval, Closed)
    const stageNames = ['Pre-Approval', 'Execute', 'Post-Approval', 'Closed', 'Draft'];
    const mentionedStages = stageNames.filter(stage => 
      entryText && entryText.includes(stage)
    );
    
    // Should mention at least 2 stages (from and to)
    expect(mentionedStages.length).toBeGreaterThanOrEqual(2);
  });

  // Step 5: Actor recorded (SC)
  await test.step('Actor recorded (SC)', async () => {
    // Find the stage change entry
    const stageChangeEntry = page.locator('text=/stage.*change|advanced.*stage|moved.*stage|transition/i').first().locator('..');
    
    // Should show the user who made the change (Diego)
    await expect(stageChangeEntry.getByText(/Diego|Siciliani/i)).toBeVisible();
    
    // Should also show timestamp
    const timestampPattern = /\d{1,2}[:/]\d{2}|\d{4}-\d{2}-\d{2}|ago|AM|PM/;
    const entryText = await stageChangeEntry.textContent();
    expect(entryText).toMatch(timestampPattern);
    
    // Take screenshot of audit log entry
    const timestamp = new Date();
    const formattedTimestamp = `${timestamp.getFullYear()}.${String(timestamp.getMonth() + 1).padStart(2, '0')}.${String(timestamp.getDate()).padStart(2, '0')}-${String(timestamp.getHours()).padStart(2, '0')}.${String(timestamp.getMinutes()).padStart(2, '0')}.${String(timestamp.getSeconds()).padStart(2, '0')}`;
    await page.screenshot({ 
      path: getScreenshotPath(`TS.7.6.1-06-5-${formattedTimestamp}.png`) 
    });
  });

  // Expected Results:
  // 1. Stage advanced ✓
  // 2. Audit checked ✓
  // 3. Entry present ✓
  // 4. Both stages shown ✓
  // 5. User identified ✓
});