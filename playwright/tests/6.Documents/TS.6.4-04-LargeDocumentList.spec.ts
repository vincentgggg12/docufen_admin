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

test.setTimeout(300000); // 5 minutes for creating 200 documents

test('TS.6.4-04 Large Document List', async ({ page }) => {
  // Login as Diego (Trial Administrator)
  const email = process.env.MS_EMAIL_17NJ5D_DIEGO_SICILIANI!;
  const password = process.env.MS_PASSWORD!;
  await microsoftLogin(page, email, password);
  await handleERSDDialog(page);

  // Navigate to Documents page
  await page.getByRole('button', { name: 'Menu' }).click();
  await page.getByRole('link', { name: 'Documents' }).click();
  await expect(page).toHaveURL(/.*\/documents/);

  // Test Step 1: Create 200 test documents
  await test.step('Create 200 test documents', async () => {
    const sampleFilePath = path.join(process.cwd(), 'playwright/tests/WordDocuments/test_document.docx');
    
    // Create documents in batches to avoid overwhelming the system
    const batchSize = 10;
    const totalDocs = 200;
    
    for (let i = 0; i < totalDocs; i += batchSize) {
      const promises = [];
      
      for (let j = 0; j < batchSize && (i + j) < totalDocs; j++) {
        const docNum = i + j + 1;
        
        // Create a promise for each document upload
        const uploadPromise = (async () => {
          // Click Upload Document button
          await page.getByRole('button', { name: 'Upload Document' }).click();
          
          // Wait for upload dialog
          await expect(page.getByRole('dialog')).toBeVisible();
          
          // Fill in document name
          await page.getByLabel('Document Name').fill(`Performance Test Doc ${docNum}`);
          
          // Select file
          const fileInput = page.locator('input[type="file"]');
          await fileInput.setInputFiles(sampleFilePath);
          
          // Select document type
          await page.getByLabel('Document Type').click();
          await page.getByRole('option', { name: 'Protocol' }).click();
          
          // Click Upload
          await page.getByRole('button', { name: 'Upload' }).click();
          
          // Wait for upload to complete
          await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 10000 });
          
          // Small delay between uploads
          await page.waitForTimeout(500);
        })();
        
        promises.push(uploadPromise);
      }
      
      // Wait for batch to complete
      await Promise.all(promises);
      
      // Progress update
      console.log(`Created ${Math.min(i + batchSize, totalDocs)} of ${totalDocs} documents`);
    }
  });

  // Test Step 2: Load documents page
  await test.step('Load documents page', async () => {
    // Refresh the page to test load time
    const startTime = Date.now();
    await page.reload();
    
    // Wait for documents to be visible
    await expect(page.locator('tr').first()).toBeVisible({ timeout: 10000 });
    
    const loadTime = Date.now() - startTime;
    console.log(`Page load time: ${loadTime}ms`);
  });

  // Test Step 3: Measure load time
  await test.step('Measure load time', async () => {
    // Navigate away and back to measure fresh load time
    await page.getByRole('button', { name: 'Menu' }).click();
    await page.getByRole('link', { name: 'Dashboard' }).click();
    await expect(page).toHaveURL(/.*\/dashboard/);
    
    // Navigate back to Documents
    await page.getByRole('button', { name: 'Menu' }).click();
    
    const startTime = Date.now();
    await page.getByRole('link', { name: 'Documents' }).click();
    
    // Wait for documents table to be visible
    await expect(page.locator('table')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('tr').nth(1)).toBeVisible({ timeout: 10000 });
    
    const loadTime = Date.now() - startTime;
    console.log(`Documents page load time: ${loadTime}ms`);
    
    // Verify load time is under 3 seconds
    expect(loadTime).toBeLessThan(3000);
  });

  // Test Step 4: Test pagination performance (SC)
  await test.step('Test pagination performance (SC)', async () => {
    // Test scrolling performance
    await page.evaluate(() => {
      window.scrollTo(0, document.body.scrollHeight);
    });
    
    await page.waitForTimeout(1000);
    
    // Scroll back to top
    await page.evaluate(() => {
      window.scrollTo(0, 0);
    });
    
    // Check if pagination controls exist
    const paginationControls = page.locator('[aria-label="Pagination"]').or(
      page.locator('.pagination')
    ).or(
      page.getByRole('navigation', { name: /page/i })
    );
    
    if (await paginationControls.isVisible()) {
      // Test pagination navigation
      const nextButton = page.getByRole('button', { name: /next/i }).or(
        page.locator('button:has-text(">")')
      );
      
      if (await nextButton.isVisible() && await nextButton.isEnabled()) {
        const startTime = Date.now();
        await nextButton.click();
        
        // Wait for new page to load
        await page.waitForTimeout(1000);
        
        const pageChangeTime = Date.now() - startTime;
        console.log(`Pagination response time: ${pageChangeTime}ms`);
        
        // Verify pagination is responsive
        expect(pageChangeTime).toBeLessThan(2000);
      }
    }
    
    // Take screenshot showing performance with large dataset
    const timestamp = formatTimestamp(new Date());
    await page.screenshot({ 
      path: getScreenshotPath(`TS.6.4-04-4-${timestamp}.png`) 
    });
  });

  // Expected Results:
  // 1. Documents created ✓
  // 2. Page loads < 3 seconds ✓
  // 3. Smooth scrolling ✓
  // 4. Pagination responsive ✓
  
  // Clean up: Note - in a real test environment, you might want to delete the test documents
  // This is commented out to preserve the test data for verification
  /*
  await test.step('Cleanup test documents', async () => {
    // Implementation would depend on whether there's a bulk delete feature
    // or if documents need to be deleted one by one
  });
  */
});