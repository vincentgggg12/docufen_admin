import { test, expect } from '@playwright/test';
import * as dotenv from 'dotenv';
import { microsoftLogin, handleERSDDialog } from '../../../../../src/utils/microsoftLogin';
import { getScreenshotPath, formatTimestamp } from '../../../../../src/utils/screenshotUtils';

dotenv.config({ path: '.playwright.env' });

test.use({
  viewport: { height: 1080, width: 1920 },
  ignoreHTTPSErrors: true
});

test.setTimeout(120000); // 2 minutes

test('TS.7.11.3-03 Finalization Audit', async ({ page }) => {
  // Setup: Login as Trial Administrator (Owner)
  const email = process.env.MS_EMAIL_17NJ5D_MEGAN_BOWEN!;
  const password = process.env.MS_PASSWORD!;
  await microsoftLogin(page, email, password);
  await handleERSDDialog(page);

  // Navigate to a finalized document
  await page.getByRole('button', { name: 'Menu' }).click();
  await page.getByRole('link', { name: 'Tracking' }).click();
  
  // Find document in Finalised stage
  await page.waitForSelector('[data-testid="document-list"]', { timeout: 10000 });
  const finalizedDoc = page.locator('[data-testid="document-item"]').filter({ hasText: 'Finalised' }).first();
  await finalizedDoc.click();
  
  // Wait for document to load
  await page.waitForSelector('[data-testid="document-content"]', { timeout: 10000 });

  // Test Step 1: Check audit log
  await test.step('Check audit log', async () => {
    // Navigate to audit log section
    const auditTab = page.getByRole('tab', { name: /Audit|History|Activity/i });
    if (await auditTab.isVisible()) {
      await auditTab.click();
    } else {
      // Look for audit button or link
      const auditButton = page.getByRole('button', { name: /Audit|History|Activity/i });
      if (await auditButton.isVisible()) {
        await auditButton.click();
      }
    }
    
    // Wait for audit entries to load
    await page.waitForSelector('[data-testid="audit-log"], [data-testid="audit-entries"], .audit-log', { timeout: 10000 });
  });

  // Test Step 2: Finalization entry
  await test.step('Finalization entry', async () => {
    // Look for finalization entry in audit log
    const finalizationEntry = page.locator('[data-testid="audit-entry"], .audit-entry').filter({ 
      hasText: /Finalized|Finalised|PDF Generated/i 
    });
    await expect(finalizationEntry).toBeVisible();
  });

  // Test Step 3: ChangedStage recorded
  await test.step('ChangedStage recorded', async () => {
    // Verify stage change is recorded in audit
    const stageChangeEntry = page.locator('[data-testid="audit-entry"], .audit-entry').filter({ 
      hasText: /Stage.*Changed|Changed.*Stage|Closed.*Finalised/i 
    });
    await expect(stageChangeEntry).toBeVisible();
  });

  // Test Step 4: PDF generation noted
  await test.step('PDF generation noted', async () => {
    // Verify PDF generation is noted in audit
    const pdfEntry = page.locator('[data-testid="audit-entry"], .audit-entry').filter({ 
      hasText: /PDF.*Generated|Generated.*PDF|Final.*PDF/i 
    });
    await expect(pdfEntry).toBeVisible();
  });

  // Test Step 5: Complete audit (SC)
  await test.step('Complete audit (SC)', async () => {
    // Verify audit log is complete with all finalization details
    await expect(page.locator('[data-testid="audit-log"], [data-testid="audit-entries"], .audit-log')).toBeVisible();
    
    // Check for timestamp, user, and action details
    const auditEntries = page.locator('[data-testid="audit-entry"], .audit-entry');
    const finalizationEntries = auditEntries.filter({ hasText: /Finalized|PDF/i });
    await expect(finalizationEntries).toHaveCount(1, { timeout: 5000 });
    
    // Take screenshot of audit log showing finalization
    const timestamp = formatTimestamp(new Date());
    await page.screenshot({ 
      path: getScreenshotPath(`TS.7.11.3-03-5-${timestamp}.png`) 
    });
  });

  // Expected Results:
  // 1. Audit viewed ✓
  // 2. Entry found ✓
  // 3. Stage change logged ✓
  // 4. PDF noted ✓
  // 5. Audit complete ✓
});