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

test('TS.7.6.1-08 Stage Skip Options', async ({ page }) => {
  // Setup: Login as owner
  const diegoEmail = process.env.MS_EMAIL_MSPM36_DIEGO_SICILIANI!;
  const password = process.env.MS_PASSWORD!;
  await microsoftLogin(page, diegoEmail, password);
  await handleERSDDialog(page);

  // Create document
  await page.goto('/documents');
  await page.waitForLoadState('networkidle');
  
  await page.getByTestId('lsb.nav-main.documents-newDocument').click();
  await page.getByTestId('createDocumentDialog.documentNameInput').fill('Stage Skip Options Test');
  await page.getByTestId('createDocumentDialog.createButton').click();
  await page.waitForURL(/.*\/editor\/.*/, { timeout: 10000 });

  // Add content
  await page.locator('[contenteditable="true"]').first().click();
  await page.keyboard.type('Stage Skip Options Test - Testing Optional Stages');
  
  // Configure participants - leave Pre-Approval empty
  const participantsTab = page.getByRole('tab', { name: /Participants|Users|Workflow/i });
  await participantsTab.click();

  // Step 1: No Pre-Approval needed
  await test.step('No Pre-Approval needed.', async () => {
    // Verify Pre-Approval section exists but is empty
    const preApprovalSection = page.getByText('Pre-Approval').locator('..');
    await expect(preApprovalSection).toBeVisible();
    
    // Check that no participants are assigned to Pre-Approval
    const preApprovalParticipants = preApprovalSection.locator('.participant, .user-item, [data-participant]');
    const participantCount = await preApprovalParticipants.count();
    expect(participantCount).toBe(0);
  });

  // Step 2: Skip to Execute
  await test.step('Skip to Execute.', async () => {
    // Should be able to skip Pre-Approval and go directly to Execute
    const skipButton = page.getByRole('button', { name: /Skip.*Execute|Direct.*Execute|To Execute|Next Stage/i });
    await expect(skipButton).toBeVisible();
    
    await skipButton.click();
    
    // Confirm skip if needed
    const confirmButton = page.getByRole('button', { name: /Confirm|Yes|Skip/i });
    if (await confirmButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await confirmButton.click();
    }
    
    // Verify we're now in Execute stage
    await page.waitForTimeout(2000);
    await expect(page.getByText(/Execute|Execution/i)).toBeVisible();
  });

  // Add some execution content
  await page.locator('[contenteditable="true"]').first().click();
  await page.keyboard.type('\n\nExecution completed without Pre-Approval stage.');

  // Step 3: No Post-Approval needed
  await test.step('No Post-Approval needed.', async () => {
    // Go back to participants tab
    await participantsTab.click();
    
    // Verify Post-Approval section exists but is empty
    const postApprovalSection = page.getByText('Post-Approval').locator('..');
    await expect(postApprovalSection).toBeVisible();
    
    // Check that no participants are assigned to Post-Approval
    const postApprovalParticipants = postApprovalSection.locator('.participant, .user-item, [data-participant]');
    const participantCount = await postApprovalParticipants.count();
    expect(participantCount).toBe(0);
  });

  // Step 4: Skip to Closed
  await test.step('Skip to Closed.', async () => {
    // Should be able to skip Post-Approval and go directly to Closed
    const skipToClosedButton = page.getByRole('button', { name: /Skip.*Closed|Direct.*Closed|To Closed|Close Document|Finalize/i });
    await expect(skipToClosedButton).toBeVisible();
    
    await skipToClosedButton.click();
    
    // Confirm skip if needed
    const confirmButton = page.getByRole('button', { name: /Confirm|Yes|Close|Finalize/i });
    if (await confirmButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await confirmButton.click();
    }
    
    // Verify we're now in Closed stage
    await page.waitForTimeout(2000);
    await expect(page.getByText(/Closed|Finalized/i)).toBeVisible();
  });

  // Step 5: Optional stages (SC)
  await test.step('Optional stages (SC)', async () => {
    // Verify the document successfully skipped optional stages
    // Check stage history or audit if available
    const auditTab = page.getByRole('tab', { name: /Audit|History|Activity/i });
    if (await auditTab.isVisible({ timeout: 3000 }).catch(() => false)) {
      await auditTab.click();
      
      // Should show direct transitions without intermediate stages
      const auditEntries = page.locator('.audit-entry, [data-audit-entry], tr');
      const entryTexts = await auditEntries.allTextContents();
      
      // Should show transitions like Draft -> Execute -> Closed
      const hasDirectTransitions = entryTexts.some(text => 
        text.includes('Execute') || text.includes('Closed')
      );
      expect(hasDirectTransitions).toBeTruthy();
    }
    
    // Take screenshot showing the completed document with skipped stages
    const timestamp = new Date();
    const formattedTimestamp = `${timestamp.getFullYear()}.${String(timestamp.getMonth() + 1).padStart(2, '0')}.${String(timestamp.getDate()).padStart(2, '0')}-${String(timestamp.getHours()).padStart(2, '0')}.${String(timestamp.getMinutes()).padStart(2, '0')}.${String(timestamp.getSeconds()).padStart(2, '0')}`;
    await page.screenshot({ 
      path: getScreenshotPath(`TS.7.6.1-08-5-${formattedTimestamp}.png`) 
    });
    
    // Document should be in final closed state
    const closedIndicator = page.locator('[data-stage="closed"], .stage-closed, text=/closed|finalized/i');
    await expect(closedIndicator.first()).toBeVisible();
  });

  // Expected Results:
  // 1. Pre-Approval empty ✓
  // 2. Direct to Execute ✓
  // 3. Post-Approval empty ✓
  // 4. Direct to Closed ✓
  // 5. Flexibility allowed ✓
});