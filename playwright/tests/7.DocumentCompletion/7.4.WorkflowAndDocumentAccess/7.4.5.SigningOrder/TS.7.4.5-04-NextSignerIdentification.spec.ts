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

test('TS.7.4.5-04 Next Signer Identification', async ({ page }) => {
  // Test Procedure:
  // 1. View participant list
  // 2. Next signer highlighted
  // 3. "Next to Sign" label
  // 4. Clear indication
  // 5. User knows turn (SC)
  
  // Setup: Login (not reported as test step)
  const email = process.env.MS_EMAIL_17NJ5D_MEGAN_BOWEN!;
  const password = process.env.MS_PASSWORD!;
  
  // Navigate to login page
  await page.goto(`${baseUrl}/login`);
  
  // Perform Microsoft login
  await microsoftLogin(page, email, password);
  
  // Handle ERSD if needed
  await handleERSDDialog(page);
  
  // Wait for navigation
  await page.waitForLoadState('domcontentloaded');
  
  // Navigate to document with signing order enabled
  await test.step('Navigate to document with signing order', async () => {
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
    
    // Enable signing order
    const preApprovalCheckbox = page.locator('.pre-approval-group input[type="checkbox"]');
    await preApprovalCheckbox.check();
  });
  
  // Test Step 1: View participant list
  await test.step('View participant list', async () => {
    // Ensure workflow panel is open
    const workflowPanel = page.locator('.workflow-panel, .participants-panel');
    await expect(workflowPanel).toBeVisible();
    
    // View the participant list
    const participantList = page.locator('.participant-list, .participants-container');
    await expect(participantList).toBeVisible();
    
    // Verify participants are listed
    const participants = page.locator('.participant-item');
    const count = await participants.count();
    expect(count).toBeGreaterThan(0);
  });
  
  // Test Step 2: Next signer highlighted
  await test.step('Next signer highlighted', async () => {
    // Look for highlighted participant (first unsigned in order)
    const highlightedParticipant = page.locator('.participant-item.next-signer, .participant-item.highlighted, .participant-item[data-next="true"]');
    await expect(highlightedParticipant).toBeVisible();
    
    // Verify highlighting style is applied
    const hasHighlight = await highlightedParticipant.evaluate(el => {
      const styles = window.getComputedStyle(el);
      return styles.backgroundColor !== 'rgba(0, 0, 0, 0)' || 
             styles.border !== 'none' || 
             styles.boxShadow !== 'none' ||
             el.classList.contains('highlighted') ||
             el.classList.contains('next-signer');
    });
    expect(hasHighlight).toBeTruthy();
  });
  
  // Test Step 3: "Next to Sign" label
  await test.step('"Next to Sign" label', async () => {
    // Look for "Next to Sign" label or badge
    const nextToSignLabel = page.locator('text=/next to sign|next signer|awaiting signature/i');
    await expect(nextToSignLabel).toBeVisible();
    
    // Verify the label is associated with a specific participant
    const labeledParticipant = page.locator('.participant-item').filter({ has: nextToSignLabel });
    await expect(labeledParticipant).toBeVisible();
  });
  
  // Test Step 4: Clear indication
  await test.step('Clear indication', async () => {
    // Verify visual distinction of next signer
    const nextSigner = page.locator('.participant-item').filter({ hasText: /next to sign|next signer/i });
    const otherParticipants = page.locator('.participant-item').filter({ hasNotText: /next to sign|next signer/i });
    
    // Next signer should be visually distinct
    await expect(nextSigner).toHaveClass(/highlighted|next-signer|active/);
    
    // Verify order number is shown
    await expect(nextSigner).toContainText(/1|2|3/);
    
    // Check for icon or badge indicating next signer
    const indicator = nextSigner.locator('.indicator, .badge, .icon');
    await expect(indicator.first()).toBeVisible();
  });
  
  // Test Step 5: User knows turn (SC)
  await test.step('User knows turn (SC)', async () => {
    // Take screenshot showing clear next signer identification
    const timestamp = formatTimestamp(new Date());
    await page.screenshot({ 
      path: getScreenshotPath(`TS.7.4.5-04-${timestamp}.png`),
      fullPage: true 
    });
    
    // Verify comprehensive identification elements
    const nextSigner = page.locator('.participant-item').filter({ hasText: /next to sign|next signer/i });
    
    // Should have multiple indicators:
    // 1. Visual highlighting
    await expect(nextSigner).toHaveClass(/highlighted|next-signer|active/);
    
    // 2. Text label
    await expect(nextSigner).toContainText(/next to sign|next signer/i);
    
    // 3. Order number
    await expect(nextSigner).toContainText(/\d+/);
    
    // 4. Status indicator
    const statusIndicator = nextSigner.locator('.status, .indicator');
    await expect(statusIndicator.first()).toBeVisible();
    
    // Verify other participants show their position in queue
    const allParticipants = page.locator('.participant-item');
    const participantCount = await allParticipants.count();
    
    for (let i = 0; i < participantCount; i++) {
      const participant = allParticipants.nth(i);
      // Each should show their order number
      await expect(participant).toContainText(/\d+/);
    }
  });
  
  // Expected Results:
  // 1. List viewed ✓
  // 2. Highlighting visible ✓
  // 3. Label shown ✓
  // 4. Obviously next ✓
  // 5. Clear guidance ✓
});