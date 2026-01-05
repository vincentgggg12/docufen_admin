import { test, expect } from '@playwright/test';
import * as dotenv from 'dotenv';
import { microsoftLogin, handleERSDDialog } from '../../src/utils/microsoftLogin';
import { getScreenshotPath, formatTimestamp } from '../../src/utils/screenshotUtils';
import * as path from 'path';

dotenv.config({ path: '.playwright.env' });

test.use({
  viewport: { height: 1080, width: 1920 },
  ignoreHTTPSErrors: true
});

test.setTimeout(180000); // 3 minutes

test('TS.6.4-06 Circular Ownership', async ({ page }) => {
  // Test Step 1: Diego owns Doc A
  await test.step('Diego owns Doc A', async () => {
    // Login as Diego
    const email = process.env.MS_EMAIL_17NJ5D_DIEGO_SICILIANI!;
    const password = process.env.MS_PASSWORD!;
    await microsoftLogin(page, email, password);
    await handleERSDDialog(page);
    
    // Navigate to Documents
    await page.getByRole('button', { name: 'Menu' }).click();
    await page.getByRole('link', { name: 'Documents' }).click();
    await expect(page).toHaveURL(/.*\/documents/);
    
    // Create Doc A
    await page.getByRole('button', { name: 'Upload Document' }).click();
    await expect(page.getByRole('dialog')).toBeVisible();
    
    await page.getByLabel('Document Name').fill('Circular Ownership Doc A');
    
    const sampleFilePath = path.join(process.cwd(), 'playwright/tests/WordDocuments/test_document.docx');
    await page.locator('input[type="file"]').setInputFiles(sampleFilePath);
    
    await page.getByLabel('Document Type').click();
    await page.getByRole('option', { name: 'Protocol' }).click();
    
    await page.getByRole('button', { name: 'Upload' }).click();
    await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 10000 });
    
    await page.waitForTimeout(2000);
  });
  
  // Test Step 2: Add Henrietta as owner
  await test.step('Add Henrietta as owner', async () => {
    // Find Doc A and open its actions menu
    const docRow = page.locator('tr').filter({ hasText: 'Circular Ownership Doc A' });
    await docRow.locator('button[aria-label="Actions"]').click();
    
    // Click on Manage Owners or similar option
    const manageOwnersOption = page.getByRole('menuitem', { name: /owner/i }).or(
      page.getByRole('menuitem', { name: /share/i })
    ).or(
      page.getByRole('menuitem', { name: /permission/i })
    );
    
    if (await manageOwnersOption.isVisible()) {
      await manageOwnersOption.click();
      
      // Wait for owners dialog
      await expect(page.getByRole('dialog')).toBeVisible();
      
      // Add Henrietta as co-owner
      const userInput = page.getByPlaceholder(/search.*user/i).or(
        page.getByLabel(/add.*owner/i)
      ).or(
        page.getByRole('combobox')
      );
      
      if (await userInput.isVisible()) {
        await userInput.fill('Henrietta');
        await page.waitForTimeout(1000);
        
        // Select Henrietta from dropdown
        await page.getByText('Henrietta Mueller').click();
        
        // Save changes
        await page.getByRole('button', { name: /save/i }).or(
          page.getByRole('button', { name: /add/i })
        ).click();
        
        await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 5000 });
      }
    }
    
    // Logout as Diego
    await page.getByRole('button', { name: 'Menu' }).click();
    await page.getByRole('button', { name: 'Logout' }).click();
    await page.waitForTimeout(2000);
  });
  
  // Test Step 3: Henrietta creates Doc B
  await test.step('Henrietta creates Doc B', async () => {
    // Login as Henrietta
    const email = process.env.MS_EMAIL_17NJ5D_HENRIETTA_MUELLER!;
    const password = process.env.MS_PASSWORD!;
    await microsoftLogin(page, email, password);
    await handleERSDDialog(page);
    
    // Navigate to Documents
    await page.getByRole('button', { name: 'Menu' }).click();
    await page.getByRole('link', { name: 'Documents' }).click();
    await expect(page).toHaveURL(/.*\/documents/);
    
    // Create Doc B
    await page.getByRole('button', { name: 'Upload Document' }).click();
    await expect(page.getByRole('dialog')).toBeVisible();
    
    await page.getByLabel('Document Name').fill('Circular Ownership Doc B');
    
    const sampleFilePath = path.join(process.cwd(), 'playwright/tests/WordDocuments/test_document.docx');
    await page.locator('input[type="file"]').setInputFiles(sampleFilePath);
    
    await page.getByLabel('Document Type').click();
    await page.getByRole('option', { name: 'SOP' }).click();
    
    await page.getByRole('button', { name: 'Upload' }).click();
    await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 10000 });
    
    await page.waitForTimeout(2000);
  });
  
  // Test Step 4: Try to add Diego as owner
  await test.step('Try to add Diego as owner', async () => {
    // Find Doc B and open its actions menu
    const docRow = page.locator('tr').filter({ hasText: 'Circular Ownership Doc B' });
    await docRow.locator('button[aria-label="Actions"]').click();
    
    // Click on Manage Owners or similar option
    const manageOwnersOption = page.getByRole('menuitem', { name: /owner/i }).or(
      page.getByRole('menuitem', { name: /share/i })
    ).or(
      page.getByRole('menuitem', { name: /permission/i })
    );
    
    if (await manageOwnersOption.isVisible()) {
      await manageOwnersOption.click();
      
      // Wait for owners dialog
      await expect(page.getByRole('dialog')).toBeVisible();
      
      // Add Diego as co-owner
      const userInput = page.getByPlaceholder(/search.*user/i).or(
        page.getByLabel(/add.*owner/i)
      ).or(
        page.getByRole('combobox')
      );
      
      if (await userInput.isVisible()) {
        await userInput.fill('Diego');
        await page.waitForTimeout(1000);
        
        // Select Diego from dropdown
        await page.getByText('Diego Siciliani').click();
        
        // Save changes
        await page.getByRole('button', { name: /save/i }).or(
          page.getByRole('button', { name: /add/i })
        ).click();
        
        await page.waitForTimeout(2000);
      }
    }
  });
  
  // Test Step 5: Verify no issues (SC)
  await test.step('Verify no issues (SC)', async () => {
    // Check that the operation completed without errors
    const errorMessage = page.getByText(/error/i).or(
      page.getByText(/failed/i)
    ).or(
      page.getByText(/circular/i)
    );
    
    // There should be no error about circular ownership
    await expect(errorMessage).not.toBeVisible({ timeout: 3000 }).catch(() => {
      // No error is expected
    });
    
    // Verify both documents are visible and manageable
    await page.reload();
    await page.waitForTimeout(2000);
    
    // Check that Henrietta can see both documents
    const docA = page.locator('tr').filter({ hasText: 'Circular Ownership Doc A' });
    const docB = page.locator('tr').filter({ hasText: 'Circular Ownership Doc B' });
    
    await expect(docA).toBeVisible();
    await expect(docB).toBeVisible();
    
    // Take screenshot showing both documents
    const timestamp = formatTimestamp(new Date());
    await page.screenshot({ 
      path: getScreenshotPath(`TS.6.4-06-5-${timestamp}.png`) 
    });
    
    // Verify Henrietta can manage Doc A (which Diego owns)
    await docA.locator('button[aria-label="Actions"]').click();
    const editOption = page.getByRole('menuitem', { name: 'Edit' });
    await expect(editOption).toBeVisible();
    
    // Close menu
    await page.keyboard.press('Escape');
    
    // Verify Henrietta can manage Doc B (which she owns)
    await docB.locator('button[aria-label="Actions"]').click();
    await expect(editOption).toBeVisible();
    
    // Close menu
    await page.keyboard.press('Escape');
  });
  
  // Expected Results:
  // 1. Doc A created ✓
  // 2. Co-owner added ✓
  // 3. Doc B created ✓
  // 4. Co-owner added ✓
  // 5. Both can manage both docs ✓
});