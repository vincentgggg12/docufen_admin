import { test, expect } from '@playwright/test';
import { microsoftLogin } from '../../../utils/msLogin';
import { handleERSDDialog } from '../../../utils/ersd-handler';
import { getScreenshotPath } from '../../../utils/paths';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.playwright.env' });

const baseUrl = process.env.BASE_URL;

// Set test timeout to 120 seconds
test.setTimeout(120000);

test.use({
  viewport: { height: 1080, width: 1920 },
  ignoreHTTPSErrors: true
});

function formatTimestamp(date: Date): string {
  return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}-${String(date.getHours()).padStart(2, '0')}.${String(date.getMinutes()).padStart(2, '0')}.${String(date.getSeconds()).padStart(2, '0')}`;
}

test('TS.7.4.5-03 Sequential Enforcement', async ({ page, browser }) => {
  // Test Procedure:
  // 1. User 2 tries to sign
  // 2. Blocked message
  // 3. "User 1 must sign first"
  // 4. Cannot proceed
  // 5. Order enforced (SC)
  
  // Setup: Login as document owner first to set up signing order
  const ownerEmail = process.env.MS_EMAIL_17NJ5D_MEGAN_BOWEN!;
  const password = process.env.MS_PASSWORD!;
  
  // Navigate to login page
  await page.goto(`${baseUrl}/login`);
  
  // Perform Microsoft login as owner
  await microsoftLogin(page, ownerEmail, password);
  
  // Handle ERSD if needed
  await handleERSDDialog(page);
  
  // Wait for navigation
  await page.waitForLoadState('domcontentloaded');
  
  // Set up document with signing order
  await test.step('Set up document with signing order', async () => {
    // Navigate to documents
    await page.getByRole('link', { name: 'Documents' }).click();
    await page.waitForLoadState('domcontentloaded');
    
    // Find or create a document
    const documentCard = page.locator('.document-card').first();
    if (await documentCard.count() > 0) {
      await documentCard.click();
    } else {
      // Create new document if needed
      await page.getByRole('button', { name: 'New Document' }).click();
      await page.waitForLoadState('domcontentloaded');
    }
    
    // Wait for document editor to load
    await page.waitForSelector('.document-editor', { timeout: 30000 });
    
    // Open workflow panel
    await page.getByRole('button', { name: 'Workflow' }).click();
    await page.waitForTimeout(1000);
    
    // Enable signing order for Pre-Approval
    const preApprovalCheckbox = page.locator('.pre-approval-group input[type="checkbox"]');
    await preApprovalCheckbox.check();
    
    // Store document URL for later
    const documentUrl = page.url();
    
    // Close owner session
    await page.close();
  });
  
  // Test Step 1: User 2 tries to sign
  await test.step('User 2 tries to sign', async () => {
    // Create new context for User 2
    const user2Context = await browser.newContext({
      ignoreHTTPSErrors: true,
      viewport: { width: 1920, height: 1080 }
    });
    const user2Page = await user2Context.newPage();
    
    // Login as User 2 (second in signing order)
    const user2Email = process.env.MS_EMAIL_17NJ5D_DIEGO_SICILIANI!;
    
    await user2Page.goto(`${baseUrl}/login`);
    await microsoftLogin(user2Page, user2Email, password);
    await handleERSDDialog(user2Page);
    
    // Navigate to the document
    await user2Page.goto(documentUrl);
    await user2Page.waitForLoadState('domcontentloaded');
    
    // Try to sign as User 2
    await user2Page.getByRole('button', { name: 'Sign' }).click();
  });
  
  // Test Step 2: Blocked message
  await test.step('Blocked message', async () => {
    // Look for blocking modal or message
    const blockingMessage = page.locator('.signing-order-block-modal, .error-message, [role="alert"]');
    await expect(blockingMessage).toBeVisible({ timeout: 5000 });
  });
  
  // Test Step 3: "User 1 must sign first"
  await test.step('"User 1 must sign first"', async () => {
    // Verify the specific message about signing order
    const messageText = page.locator('text=/must sign first|cannot sign yet|signing order/i');
    await expect(messageText).toBeVisible();
    
    // The message should indicate who needs to sign first
    const user1Reference = page.locator('text=/User 1|first signer|previous signer/i');
    await expect(user1Reference).toBeVisible();
  });
  
  // Test Step 4: Cannot proceed
  await test.step('Cannot proceed', async () => {
    // Verify sign button is disabled or clicking it doesn't work
    const signButton = page.getByRole('button', { name: 'Sign' });
    
    // Check if button is disabled
    const isDisabled = await signButton.isDisabled();
    
    if (!isDisabled) {
      // If not disabled, verify clicking again shows the same error
      await signButton.click();
      const blockingMessage = page.locator('.signing-order-block-modal, .error-message, [role="alert"]');
      await expect(blockingMessage).toBeVisible();
    }
    
    // Verify no signature dialog opens
    const signatureDialog = page.locator('.signature-dialog, .sign-modal');
    await expect(signatureDialog).not.toBeVisible();
  });
  
  // Test Step 5: Order enforced (SC)
  await test.step('Order enforced (SC)', async () => {
    // Take screenshot showing the blocked state
    const timestamp = formatTimestamp(new Date());
    await page.screenshot({ 
      path: getScreenshotPath(`TS.7.4.5-03-${timestamp}.png`),
      fullPage: true 
    });
    
    // Verify user cannot bypass the signing order
    // Check that signature fields/areas are not clickable
    const signatureFields = page.locator('.signature-field, .sign-area');
    const fieldCount = await signatureFields.count();
    
    for (let i = 0; i < fieldCount; i++) {
      const field = signatureFields.nth(i);
      // Verify fields are either disabled or clicking them shows the blocking message
      const isFieldDisabled = await field.isDisabled().catch(() => false);
      expect(isFieldDisabled || await blockingMessage.isVisible()).toBeTruthy();
    }
    
    // Verify the signing order is being enforced
    await expect(page.locator('text=/signing order|sequence required/i')).toBeVisible();
  });
  
  // Expected Results:
  // 1. Out of order attempt ✓
  // 2. Action blocked ✓
  // 3. Clear message ✓
  // 4. Sign disabled ✓
  // 5. Sequence required ✓
});