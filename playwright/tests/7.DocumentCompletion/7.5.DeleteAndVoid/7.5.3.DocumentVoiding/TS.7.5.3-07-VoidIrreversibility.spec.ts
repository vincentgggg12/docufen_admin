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

test('TS.7.5.3-07 Void Irreversibility', async ({ page }) => {
  // Setup: Login as owner
  const email = process.env.MS_EMAIL_MSPM36_DIEGO_SICILIANI!;
  const password = process.env.MS_PASSWORD!;
  await microsoftLogin(page, email, password);
  await handleERSDDialog(page);

  // Create and void a document
  await page.goto('/documents');
  await page.waitForLoadState('networkidle');
  
  await page.getByTestId('lsb.nav-main.documents-newDocument').click();
  await page.getByTestId('createDocumentDialog.documentNameInput').fill('Irreversibility Test Document');
  await page.getByTestId('createDocumentDialog.createButton').click();
  await page.waitForURL(/.*\/editor\/.*/, { timeout: 10000 });

  // Add content to enable void button
  const editor = page.getByTestId('editor-content');
  await editor.click();
  await page.keyboard.type('This document will be voided to test irreversibility');
  await page.waitForTimeout(1000);

  // Void the document
  await page.getByRole('button', { name: 'Void' }).click();
  const reasonField = page.getByTestId('voidReasonDialog.reasonTextarea');
  await reasonField.fill('Testing void irreversibility - this action cannot be undone');
  const confirmButton = page.getByTestId('voidReasonDialog.confirmButton');
  await confirmButton.click();
  await page.waitForTimeout(2000);

  // Step 1: View voided doc
  await test.step('View voided doc.', async () => {
    // Verify we're viewing the voided document
    const stageIndicator = page.getByTestId('document.stageIndicator');
    await expect(stageIndicator).toContainText('Voided');
    
    // Verify document content is still visible
    await expect(editor).toBeVisible();
    await expect(editor).toContainText('This document will be voided to test irreversibility');
  });

  // Step 2: No unvoid option
  await test.step('No unvoid option.', async () => {
    // Check for any unvoid/restore buttons - they should not exist
    const unvoidButton = page.getByRole('button', { name: /unvoid|restore|revert|undo void/i });
    await expect(unvoidButton).not.toBeVisible();
    
    // Check action menu if it exists
    const actionMenu = page.getByRole('button', { name: /actions|more|menu/i });
    if (await actionMenu.isVisible({ timeout: 1000 }).catch(() => false)) {
      await actionMenu.click();
      await page.waitForTimeout(500);
      
      // Verify no unvoid option in menu
      const unvoidMenuItem = page.getByRole('menuitem', { name: /unvoid|restore|revert/i });
      await expect(unvoidMenuItem).not.toBeVisible();
      
      // Close menu by clicking outside
      await page.click('body');
    }
    
    // Check toolbar for any void-related reversal options
    const toolbar = page.getByTestId('document.toolbar');
    if (await toolbar.isVisible({ timeout: 1000 }).catch(() => false)) {
      const toolbarButtons = await toolbar.getByRole('button').all();
      for (const button of toolbarButtons) {
        const buttonText = await button.textContent();
        expect(buttonText?.toLowerCase()).not.toMatch(/unvoid|restore|revert|undo void/);
      }
    }
  });

  // Step 3: No stage change
  await test.step('No stage change.', async () => {
    // Verify stage remains as Voided
    const stageIndicator = page.getByTestId('document.stageIndicator');
    await expect(stageIndicator).toContainText('Voided');
    
    // Check if there are any stage transition buttons
    const stageButtons = page.getByRole('button').filter({ hasText: /execution|review|approved|complete/i });
    const stageButtonCount = await stageButtons.count();
    expect(stageButtonCount).toBe(0);
    
    // Verify no dropdown or select for changing stages
    const stageSelect = page.getByRole('combobox', { name: /stage|status/i });
    await expect(stageSelect).not.toBeVisible();
  });

  // Step 4: Permanently voided
  await test.step('Permanently voided.', async () => {
    // Navigate away and come back to verify persistence
    await page.goto('/documents');
    await page.waitForLoadState('networkidle');
    
    // Find and click on the voided document
    const documentRow = page.getByRole('row').filter({ hasText: 'Irreversibility Test Document' });
    await documentRow.click();
    await page.waitForLoadState('networkidle');
    
    // Verify it's still voided
    const stageIndicator = page.getByTestId('document.stageIndicator');
    await expect(stageIndicator).toContainText('Voided');
    
    // Check for voided visual indicators
    const voidedBadge = page.getByRole('status').filter({ hasText: 'Voided' });
    await expect(voidedBadge).toBeVisible();
    
    // Verify the document maintains its voided state
    const hasVoidedClass = await page.evaluate(() => {
      const elements = document.querySelectorAll('[class*="void"], [class*="Void"]');
      return elements.length > 0;
    });
    expect(hasVoidedClass).toBeTruthy();
  });

  // Step 5: Cannot reverse (SC)
  await test.step('Cannot reverse (SC)', async () => {
    // Final verification that void is irreversible
    // Check all possible UI elements for reversal options
    const allButtons = await page.getByRole('button').all();
    for (const button of allButtons) {
      const buttonText = await button.textContent();
      expect(buttonText?.toLowerCase()).not.toMatch(/unvoid|restore|revert|undo void|reverse/);
    }
    
    // Check for any links that might reverse void
    const allLinks = await page.getByRole('link').all();
    for (const link of allLinks) {
      const linkText = await link.textContent();
      expect(linkText?.toLowerCase()).not.toMatch(/unvoid|restore|revert|undo void|reverse/);
    }
    
    // Take screenshot showing permanent void status
    const timestamp = new Date();
    const formattedTimestamp = `${timestamp.getFullYear()}.${String(timestamp.getMonth() + 1).padStart(2, '0')}.${String(timestamp.getDate()).padStart(2, '0')}-${String(timestamp.getHours()).padStart(2, '0')}.${String(timestamp.getMinutes()).padStart(2, '0')}.${String(timestamp.getSeconds()).padStart(2, '0')}`;
    await page.screenshot({ 
      path: getScreenshotPath(`TS.7.5.3-07-5-${formattedTimestamp}.png`) 
    });
    
    // Verify document remains in read-only state
    const editor = page.getByTestId('editor-content');
    const isReadOnly = await editor.evaluate(el => {
      return el.getAttribute('contenteditable') === 'false' || 
             el.hasAttribute('readonly') || 
             el.classList.contains('read-only');
    });
    expect(isReadOnly).toBeTruthy();
  });

  // Expected Results:
  // 1. Voided doc open ✓
  // 2. No undo button ✓
  // 3. Stage locked ✓
  // 4. Status permanent ✓
  // 5. Irreversible ✓
});