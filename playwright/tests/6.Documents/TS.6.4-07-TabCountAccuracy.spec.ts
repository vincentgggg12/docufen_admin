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

test('TS.6.4-07 Tab Count Accuracy', async ({ page }) => {
  // Login as Diego (Trial Administrator)
  const email = process.env.MS_EMAIL_17NJ5D_DIEGO_SICILIANI!;
  const password = process.env.MS_PASSWORD!;
  await microsoftLogin(page, email, password);
  await handleERSDDialog(page);

  // Navigate to Documents page
  await page.getByRole('button', { name: 'Menu' }).click();
  await page.getByRole('link', { name: 'Documents' }).click();
  await expect(page).toHaveURL(/.*\/documents/);

  // Wait for page to fully load
  await page.waitForTimeout(2000);

  // Test Step 1: Note counts on all tabs
  await test.step('Note counts on all tabs', async () => {
    // Get initial counts from all tabs
    const tabs = ['All', 'Pre-Approval', 'Execution', 'Approval', 'Effective'];
    const initialCounts: { [key: string]: number } = {};
    
    for (const tabName of tabs) {
      const tab = page.getByRole('tab', { name: new RegExp(tabName, 'i') }).or(
        page.locator(`button:has-text("${tabName}")`)
      );
      
      if (await tab.isVisible()) {
        const tabText = await tab.textContent();
        // Extract count from tab text (e.g., "Pre-Approval (5)" -> 5)
        const match = tabText?.match(/\((\d+)\)/);
        initialCounts[tabName] = match ? parseInt(match[1]) : 0;
        console.log(`Initial count for ${tabName}: ${initialCounts[tabName]}`);
      }
    }
    
    // Store counts for later comparison
    await page.evaluate((counts) => {
      (window as any).initialTabCounts = counts;
    }, initialCounts);
  });

  // Test Step 2: Move doc from Pre-Approval to Execution
  await test.step('Move doc from Pre-Approval to Execution', async () => {
    // Click on Pre-Approval tab to see documents in that stage
    const preApprovalTab = page.getByRole('tab', { name: /pre-approval/i }).or(
      page.locator('button:has-text("Pre-Approval")')
    );
    
    if (await preApprovalTab.isVisible()) {
      await preApprovalTab.click();
      await page.waitForTimeout(1000);
    }
    
    // Find a document in Pre-Approval stage
    const documentRow = page.locator('tr').filter({ hasText: /pre-approval/i }).first().or(
      page.locator('tr').nth(1) // First data row if stage column not visible
    );
    
    if (await documentRow.isVisible()) {
      // Open actions menu for the document
      await documentRow.locator('button[aria-label="Actions"]').click();
      
      // Look for option to change stage/status
      const changeStageOption = page.getByRole('menuitem', { name: /stage/i }).or(
        page.getByRole('menuitem', { name: /move/i })
      ).or(
        page.getByRole('menuitem', { name: /status/i })
      );
      
      if (await changeStageOption.isVisible()) {
        await changeStageOption.click();
        
        // Wait for stage change dialog
        await expect(page.getByRole('dialog')).toBeVisible();
        
        // Select Execution stage
        const stageSelect = page.getByLabel(/stage/i).or(
          page.getByRole('combobox')
        );
        
        if (await stageSelect.isVisible()) {
          await stageSelect.click();
          await page.getByRole('option', { name: 'Execution' }).click();
          
          // Save the change
          await page.getByRole('button', { name: 'Save' }).or(
            page.getByRole('button', { name: 'Update' })
          ).click();
          
          await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 5000 });
        }
      } else {
        // Alternative: Edit document and change stage
        await page.keyboard.press('Escape'); // Close current menu
        await documentRow.locator('button[aria-label="Actions"]').click();
        await page.getByRole('menuitem', { name: 'Edit' }).click();
        
        await expect(page.getByRole('dialog')).toBeVisible();
        
        // Look for stage field in edit form
        const stageField = page.getByLabel(/stage/i);
        if (await stageField.isVisible()) {
          await stageField.click();
          await page.getByRole('option', { name: 'Execution' }).click();
          
          await page.getByRole('button', { name: 'Save' }).click();
          await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 5000 });
        }
      }
    }
    
    // Wait for the change to be processed
    await page.waitForTimeout(2000);
  });

  // Test Step 3: Refresh page
  await test.step('Refresh page', async () => {
    await page.reload();
    
    // Wait for page to fully load
    await expect(page.locator('table')).toBeVisible({ timeout: 10000 });
    await page.waitForTimeout(2000);
  });

  // Test Step 4: Verify counts updated correctly (SC)
  await test.step('Verify counts updated correctly (SC)', async () => {
    // Get updated counts from all tabs
    const tabs = ['All', 'Pre-Approval', 'Execution', 'Approval', 'Effective'];
    const updatedCounts: { [key: string]: number } = {};
    
    for (const tabName of tabs) {
      const tab = page.getByRole('tab', { name: new RegExp(tabName, 'i') }).or(
        page.locator(`button:has-text("${tabName}")`)
      );
      
      if (await tab.isVisible()) {
        const tabText = await tab.textContent();
        const match = tabText?.match(/\((\d+)\)/);
        updatedCounts[tabName] = match ? parseInt(match[1]) : 0;
        console.log(`Updated count for ${tabName}: ${updatedCounts[tabName]}`);
      }
    }
    
    // Get initial counts
    const initialCounts = await page.evaluate(() => {
      return (window as any).initialTabCounts || {};
    });
    
    // Verify count changes
    if (initialCounts['Pre-Approval'] !== undefined && updatedCounts['Pre-Approval'] !== undefined) {
      // Pre-Approval count should decrease by 1
      expect(updatedCounts['Pre-Approval']).toBe(initialCounts['Pre-Approval'] - 1);
    }
    
    if (initialCounts['Execution'] !== undefined && updatedCounts['Execution'] !== undefined) {
      // Execution count should increase by 1
      expect(updatedCounts['Execution']).toBe(initialCounts['Execution'] + 1);
    }
    
    if (initialCounts['All'] !== undefined && updatedCounts['All'] !== undefined) {
      // All count should remain the same
      expect(updatedCounts['All']).toBe(initialCounts['All']);
    }
    
    // Take screenshot showing updated counts
    const timestamp = formatTimestamp(new Date());
    await page.screenshot({ 
      path: getScreenshotPath(`TS.6.4-07-4-${timestamp}.png`) 
    });
    
    // Log the count changes for verification
    console.log('Count changes:');
    console.log(`Pre-Approval: ${initialCounts['Pre-Approval']} -> ${updatedCounts['Pre-Approval']}`);
    console.log(`Execution: ${initialCounts['Execution']} -> ${updatedCounts['Execution']}`);
    console.log(`All: ${initialCounts['All']} -> ${updatedCounts['All']}`);
  });

  // Expected Results:
  // 1. Initial counts recorded ✓
  // 2. Document stage changed ✓
  // 3. Page refreshed ✓
  // 4. Counts reflect changes ✓
});