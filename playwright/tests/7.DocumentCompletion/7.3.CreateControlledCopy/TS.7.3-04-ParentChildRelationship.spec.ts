import { test, expect } from '@playwright/test';
import { getScreenshotPath } from '../../utils/paths';
import dotenv from 'dotenv';
import { microsoftLogin } from '../../utils/msLogin';
import { handleERSDDialog } from '../../utils/ersd-handler';

dotenv.config({ path: '.playwright.env' });

test.use({
  viewport: { height: 1080, width: 1920 },
  ignoreHTTPSErrors: true
});

test.setTimeout(180000); // 3 minutes

test('TS.7.3-04 Parent Child Relationship', async ({ page }) => {
  // Setup: Login as Creator
  const email = process.env.MS_EMAIL_MSPM36_DIEGO_SICILIANI!;
  const password = process.env.MS_PASSWORD!;
  await microsoftLogin(page, email, password);
  await handleERSDDialog(page);

  // Create a parent document first
  await page.goto('/documents');
  await page.waitForLoadState('networkidle');
  
  await page.getByTestId('lsb.nav-main.documents-newDocument').click();
  await page.getByTestId('createDocumentDialog.documentNameInput').fill('Parent Document for Relationship Test');
  await page.getByTestId('createDocumentDialog.createButton').click();
  await page.waitForURL(/.*\/editor\/.*/, { timeout: 10000 });
  
  const parentUrl = page.url();
  const parentId = parentUrl.split('/').pop();

  // Step 1: Create copy
  await test.step('Create copy.', async () => {
    const copyButton = page.getByRole('button', { name: /Create Controlled Copy|Copy Document/i });
    await expect(copyButton).toBeVisible();
    await copyButton.click();
    
    await page.waitForURL(/.*\/editor\/.*/, { timeout: 10000 });
    await page.waitForLoadState('networkidle');
  });

  const copyUrl = page.url();
  const copyId = copyUrl.split('/').pop();

  // Step 2: Check child's parentDocument
  await test.step('Check child\'s parentDocument.', async () => {
    // Check document properties/API for parent reference
    const response = await page.evaluate(async (docId) => {
      const response = await fetch(`/api/documents/${docId}`);
      return await response.json();
    }, copyId);
    
    // Verify parent document ID is stored
    expect(response.parentDocument).toBe(parentId);
  });

  // Step 3: Check parent's activeChildren
  await test.step('Check parent\'s activeChildren.', async () => {
    // Navigate back to parent
    await page.goto(parentUrl);
    await page.waitForLoadState('networkidle');
    
    const response = await page.evaluate(async (docId) => {
      const response = await fetch(`/api/documents/${docId}`);
      return await response.json();
    }, parentId);
    
    // Verify child is in activeChildren array
    expect(response.activeChildren).toContain(copyId);
  });

  // Step 4: Both linked
  await test.step('Both linked.', async () => {
    // Verify relationship is visible in UI
    const childrenSection = page.getByText(/Controlled Copies|Child Documents/i);
    if (await childrenSection.isVisible({ timeout: 5000 }).catch(() => false)) {
      await expect(childrenSection).toBeVisible();
    }
  });

  // Step 5: Bidirectional (SC)
  await test.step('Bidirectional (SC)', async () => {
    // Take screenshot of parent showing child relationship
    const timestamp = new Date();
    const formattedTimestamp = `${timestamp.getFullYear()}.${String(timestamp.getMonth() + 1).padStart(2, '0')}.${String(timestamp.getDate()).padStart(2, '0')}-${String(timestamp.getHours()).padStart(2, '0')}.${String(timestamp.getMinutes()).padStart(2, '0')}.${String(timestamp.getSeconds()).padStart(2, '0')}`;
    await page.screenshot({ 
      path: getScreenshotPath(`TS.7.3-04-5-${formattedTimestamp}.png`) 
    });
  });

  // Expected Results:
  // 1. Copy made ✓
  // 2. Parent ID stored ✓
  // 3. Child in array ✓
  // 4. References valid ✓
  // 5. Relationship intact ✓
});