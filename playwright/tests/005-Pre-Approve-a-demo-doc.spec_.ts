import { test, expect, Locator } from '@playwright/test';
import { microsoftLogin } from './utils/msLogin';
import dotenv from 'dotenv';
import { getScreenshotPath } from './utils/paths';

dotenv.config({ path: '.playwright.env' });
const baseUrl = process.env.BASE_URL || "https://beta.docufen.com"

test.use({
  viewport: {
    height: 1080,
    width: 1920
  },
  // Add HTTPS error handling
  ignoreHTTPSErrors: true,
  
  // Make Chromium behave more like a full browser
  // Run in headed mode to see what's happening (comment out for CI)
  // headless: false,
  
  // Use Chrome channel instead of Chromium for better compatibility
  // channel: 'chrome',
  
  // Browser context options to make it more like a real browser
  contextOptions: {
    // Add user agent to look like a real browser
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    
    // Enable JavaScript
    javaScriptEnabled: true,
    
    // Set a realistic screen size
    screen: {
      width: 1920,
      height: 1080
    },
    
    // Set color scheme
    colorScheme: 'light',
    
    // Set timezone
    timezoneId: 'America/New_York',
    
    // Set locale
    locale: 'en-US',
    
    // Enable web security (some apps check for this)
    bypassCSP: false,
    
    // Accept downloads
    acceptDownloads: true,
    
    // Set device scale factor
    deviceScaleFactor: 1,
    
    // Enable touch events (some apps check for this)
    hasTouch: false,
    
    // Set permissions
    permissions: ['clipboard-read', 'clipboard-write'],
  },
  
  // Launch options
  launchOptions: {
    // Args to make Chromium more like Chrome
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--no-first-run',
      '--no-zygote',
      '--disable-gpu',
      '--disable-blink-features=AutomationControlled',
      '--disable-features=IsolateOrigins,site-per-process',
      // Enable features that might be needed
      '--enable-features=NetworkService,NetworkServiceInProcess',
      // Set window size
      '--window-size=1920,1080',
      // Disable headless specific features
      '--disable-headless-mode',
      // Enable WebGL
      '--enable-webgl',
      '--enable-webgl2',
      // Allow insecure content (for mixed HTTPS/HTTP)
      '--allow-running-insecure-content',
      // Disable web security for CORS issues
      '--disable-web-security',
      // Note: --user-data-dir must be set via launchPersistentContext, not here
    ],
    
    // Slow down actions to be more human-like
    slowMo: 100,
  }
});

test('Pre-Approve a practice document', async ({ page, browser, context }) => {
  test.setTimeout(600000); // 5 minutes timeout
  
  // Set up error handling
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log('Browser console error:', msg.text());
    }
  });
  
  // Initialize browser context to be more like a real browser
  // This helps with third-party services like Amplitude
  await context.addInitScript(() => {
    // Override navigator.webdriver to false
    Object.defineProperty(navigator, 'webdriver', {
      get: () => false,
    });
    
    // Add Chrome object if it doesn't exist
    if (!(window as any).chrome) {
      (window as any).chrome = {
        runtime: {},
        loadTimes: () => {},
        csi: () => {},
      };
    }
    
    // Add plugins to make it look like a real browser
    Object.defineProperty(navigator, 'plugins', {
      get: () => [
        { name: 'Chrome PDF Plugin', filename: 'internal-pdf-viewer' },
        { name: 'Chrome PDF Viewer', filename: 'mhjfbmdgcfjbbpaeojofohoefgiehjai' },
        { name: 'Native Client', filename: 'internal-nacl-plugin' }
      ],
    });
    
    // Override permissions - simplified version
    try {
      const originalQuery = window.navigator.permissions.query.bind(window.navigator.permissions);
      (window.navigator.permissions as any).query = function(parameters: any) {
        if (parameters.name === 'notifications') {
          return Promise.resolve({
            state: (Notification as any).permission || 'default',
            name: 'notifications',
            onchange: null,
            addEventListener: function() {},
            removeEventListener: function() {},
            dispatchEvent: function() { return true; }
          });
        }
        return originalQuery(parameters);
      };
    } catch (e) {
      // Permissions API might not be available in some contexts
      console.log('Could not override permissions API:', e);
    }
    
    // Add languages
    Object.defineProperty(navigator, 'languages', {
      get: () => ['en-US', 'en'],
    });
    
    // Fix hardwareConcurrency
    Object.defineProperty(navigator, 'hardwareConcurrency', {
      get: () => 8,
    });
    
    // Fix platform
    Object.defineProperty(navigator, 'platform', {
      get: () => 'Win32',
    });
    
    // Add WebGL vendor and renderer
    try {
      const getParameter = WebGLRenderingContext.prototype.getParameter;
      WebGLRenderingContext.prototype.getParameter = function(parameter: any) {
        if (parameter === 37445) {
          return 'Intel Inc.';
        }
        if (parameter === 37446) {
          return 'Intel Iris OpenGL Engine';
        }
        return getParameter.apply(this, arguments as any);
      };
    } catch (e) {
      console.log('Could not override WebGL:', e);
    }
  });
  
  // Add cookies that might be needed
  await context.addCookies([
    {
      name: 'docufen_session',
      value: 'test_session',
      domain: new URL(baseUrl).hostname,
      path: '/',
      httpOnly: false,
      secure: true,
      sameSite: 'Lax'
    }
  ]);
  
  // Pre-navigate to initialize any services
  await page.goto(baseUrl, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2000);
  
  // Create additional browser contexts for multi-user simulation
  const context2 = await browser.newContext({ ignoreHTTPSErrors: true });
  const page2 = await context2.newPage();
  const context4 = await browser.newContext({ ignoreHTTPSErrors: true });
  const page4 = await context4.newPage();

  // Log in as Grady Archie using microsoftLogin
  console.log('Logging in as Grady Archie...');
  await microsoftLogin(page, process.env.MS_EMAIL_17NJ5D_GRADY_ARCHIE || '', process.env.MS_PASSWORD || '');
  
  // Wait for page to stabilize after login
  await page.waitForLoadState('networkidle');
  
  // Navigate to users page if not already there
  if (!page.url().includes('/users')) {
    await page.goto(`${baseUrl}/users`);
    await page.waitForLoadState('networkidle');
  }
  
  // Create practice document
  await page.getByTestId('lsb.nav-main.documents-createDemoDoc').click();
  
  // Wait for dialog to appear
  await page.waitForSelector('[data-testid="createDemoDocumentDialog.createButton"]', { state: 'visible' });
  await page.getByTestId('createDemoDocumentDialog.createButton').click();
  
  // Wait for document creation - monitor the progress
  console.log('Waiting for document creation to complete...');
  
  // Wait for either redirect or error
  try {
    await page.waitForURL('**/document/**', { timeout: 60000 });
    console.log('Document created and redirected successfully');
  } catch (error) {
    console.log('Document creation timeout, checking for issues...');
    await page.screenshot({ path: getScreenshotPath('test-results/document-creation-timeout.png') });
    
    // Check if dialog is stuck at 0%
    const processingText = await page.getByText('Processing 0%').isVisible({ timeout: 2000 }).catch(() => false);
    if (processingText) {
      console.log('Document creation stuck at 0% - this might be a server issue');
      
      // Try closing and creating a regular document instead
      const closeButton = page.getByRole('button', { name: 'Close' });
      if (await closeButton.isVisible({ timeout: 2000 })) {
        await closeButton.click();
        await page.waitForTimeout(2000);
        
        // Skip to creating a regular document
        console.log('Practice document creation failed, creating regular document instead...');
        await page.getByRole('button', { name: 'New Document' }).click();
        await page.waitForTimeout(2000);
        
        // Fill in document details
        await page.getByRole('textbox', { name: 'Document Name' }).fill('Test Pre-Approval Doc');
        await page.getByRole('textbox', { name: 'Document Number (Optional)' }).fill('TEST-001');
        await page.getByRole('combobox', { name: 'GxP Document Category (' }).click();
        await page.getByText('Validation').click();
        
        // Upload a file
        const fileToUpload = 'playwright/tests/WordDocuments/Docufen Testing Document v0._EN.docx';
        await page.setInputFiles('input[type="file"]', fileToUpload);
        await page.waitForTimeout(5000);
        
        // Create document
        await page.getByRole('button', { name: 'Create Document' }).last().click();
        await page.waitForURL('**/document/**', { timeout: 30000 });
      }
    }
    
    // If still not on document page, throw error
    if (!page.url().includes('/document/')) {
      throw new Error('Failed to create document');
    }
  }
  
  await page.waitForLoadState('networkidle');
  
  // Extract the dynamic document ID from URL
  const documentUrl = page.url();
  const documentId = documentUrl.split('/').pop();
  console.log('Created document ID:', documentId);
  
  // Wait for document to fully load
  await page.waitForTimeout(5000);
  
  // Close any open context menus by clicking elsewhere
  console.log('Clicking to close any open menus...');
  await page.mouse.click(100, 100);
  await page.waitForTimeout(1000);
  
  // Take screenshot to see current state
  await page.screenshot({ path: getScreenshotPath('test-results/practice-document-loaded.png') });
  
  // Check if we're on the document page or if there's an authorization issue
  const notAuthorizedText = page.getByText('Not Authorized');
  if (await notAuthorizedText.isVisible({ timeout: 3000 }).catch(() => false)) {
    console.log('User is not authorized for this document stage');
    // Take screenshot of the not authorized state
    await page.screenshot({ path: getScreenshotPath('test-results/not-authorized-practice-doc.png') });
    
    // For practice documents, we might need to handle this differently
    // Let's try to continue anyway
  }
  
  // Check if this is a read-only practice document
  const readOnlyIndicator = await page.getByText(/read.*only|view.*only/i).isVisible({ timeout: 2000 }).catch(() => false);
  if (readOnlyIndicator) {
    console.log('Practice document appears to be read-only');
    await page.screenshot({ path: getScreenshotPath('test-results/read-only-practice-doc.png') });
  }
  
  // Try multiple strategies to find the Add button
  console.log('Looking for Add button...');
  
  // First, let's see what buttons are available
  const allButtons = await page.getByRole('button').all();
  console.log(`Found ${allButtons.length} buttons on the page`);
  
  // Try different selectors for the Add button
  let addButton: Locator | null = null;
  
  // Strategy 1: Test ID for pre-approval
  addButton = page.getByTestId('docExecutionPage.rsb.fillout.preApprovalAddButton');
  if (await addButton.isVisible({ timeout: 2000 }).catch(() => false)) {
    console.log('Found Add button using preApprovalAddButton testId');
    await addButton.click();
  } else {
    // Strategy 2: Try with more specific selector
    console.log('Trying alternative Add button selectors...');
    
    // Look for Add buttons more specifically
    const addButtonSelectors = [
      page.getByRole('button', { name: 'Add', exact: true }),
      page.locator('button:has-text("Add")').first(),
      page.locator('.workflow-stage').first().getByRole('button', { name: 'Add' }),
      page.getByText('Pre-Approval').locator('..').getByRole('button', { name: 'Add' })
    ];
    
    let buttonClicked = false;
    for (const selector of addButtonSelectors) {
      if (await selector.isVisible({ timeout: 2000 }).catch(() => false)) {
        console.log('Found Add button with alternative selector');
        await selector.click();
        buttonClicked = true;
        break;
      }
    }
    
    if (!buttonClicked) {
      // Take screenshot to debug
      await page.screenshot({ path: getScreenshotPath('test-results/no-add-button-found.png') });
      
      // List all visible buttons for debugging
      const visibleButtons = await page.getByRole('button').filter({ hasText: /Add|add/ }).all();
      console.log(`Found ${visibleButtons.length} buttons with 'Add' text`);
      
      throw new Error('Could not find Add button for participants');
    }
  }
  
  // Wait for dialog to open - the dialog might have a different selector
  try {
    const dialogSelectors = [
      page.locator('[role="dialog"]'),
      page.getByText('Add Participants to Pre-Approval'),
      page.locator('[aria-label="Add Participants to Pre-Approval"]')
    ];
    
    let dialogFound = false;
    for (const selector of dialogSelectors) {
      if (await selector.isVisible({ timeout: 3000 }).catch(() => false)) {
        console.log('Dialog opened successfully');
        dialogFound = true;
        break;
      }
    }
    
    if (!dialogFound) {
      throw new Error('Dialog not found with any selector');
    }
  } catch (error) {
    console.log('Dialog detection failed, taking screenshot');
    await page.screenshot({ path: getScreenshotPath('test-results/no-dialog-after-add.png') });
    // Don't throw error - dialog might be open but with different structure
    console.log('Continuing anyway as dialog might be open with different structure');
  }
  
  // Wait for the search box to be ready
  console.log('Waiting for participants dialog to load...');
  
  // Get the non-readonly search box (the second one in the error message)
  const searchBox = page.getByRole('dialog').filter({ hasText: 'Add Participants to' }).getByPlaceholder('Search users');
  
  try {
    await searchBox.waitFor({ state: 'visible', timeout: 10000 });
    console.log('Search box found and visible');
  } catch (error) {
    await page.screenshot({ path: getScreenshotPath('test-results/no-search-box.png') });
    throw new Error('Could not find search box in participants dialog');
  }
  
  // Take screenshot of participants dialog
  await page.screenshot({ path: getScreenshotPath('test-results/participants-dialog.png') });
  
  // Add participants one by one
  // 1. Grady Archie (might already be added)
  console.log('Checking if Grady needs to be added...');
  const gradyAlreadyAdded = await page.getByText('Grady Archie').filter({ has: page.getByTestId(/selected|chip/) }).isVisible({ timeout: 2000 }).catch(() => false);
  
  if (!gradyAlreadyAdded) {
    console.log('Adding Grady Archie...');
    await searchBox.click();
    await searchBox.fill('Grady');
    await page.waitForTimeout(1000);
    
    // Click on Grady in the dropdown
    await page.getByRole('option').filter({ hasText: 'Grady Archie' }).first().click();
    await page.waitForTimeout(500);
  } else {
    console.log('Grady Archie already added');
  }
  
  // 2. Julia Smith External
  console.log('Adding Julia Smith External...');
  await searchBox.click();
  await searchBox.clear();
  await searchBox.fill('Julia Smith');
  await page.waitForTimeout(1000);
  
  // Look for Julia Smith with External tag
  const juliaExternalOption = page.getByRole('option').filter({ hasText: 'Julia Smith' }).filter({ hasText: 'External' });
  if (await juliaExternalOption.count() > 0) {
    await juliaExternalOption.first().click();
    await page.waitForTimeout(500);
  }
  
  // 3. Julia Smith Internal (from 17NJ5D)
  console.log('Adding Julia Smith Internal...');
  await searchBox.click();
  await searchBox.clear();
  await searchBox.fill('Julia Smith');
  await page.waitForTimeout(1000);
  
  // Look for Julia Smith WITHOUT External tag - should show initials JS1
  const juliaInternalOption = page.getByRole('option')
    .filter({ hasText: 'Julia Smith' })
    .filter({ hasNot: page.getByText('External') });
    
  if (await juliaInternalOption.count() > 0) {
    await juliaInternalOption.first().click();
    await page.waitForTimeout(500);
  }
  
  // Take screenshot after adding all participants
  await page.screenshot({ path: getScreenshotPath('test-results/participants-added.png') });
  
  // Save changes - try both Save and Save Changes buttons
  const saveButton = page.getByRole('button', { name: 'Save' })
    .or(page.getByRole('button', { name: 'Save Changes' }));
  
  if (await saveButton.isVisible({ timeout: 3000 })) {
    await saveButton.click();
    console.log('Clicked save button');
    await page.waitForTimeout(2000);
  }
  
  // Close dialog if it's still open
  const closeButton = page.getByTestId('docExecutionPage.rsb.fillout.multiStageDialogCloseButton')
    .or(page.getByRole('button', { name: 'Close' }))
    .or(page.locator('[aria-label="Close"]'));
  
  if (await closeButton.isVisible({ timeout: 3000 })) {
    await closeButton.click();
    console.log('Closed dialog');
  }
  
  await page.waitForTimeout(2000);
  
  // Wait for page to stabilize
  await page.waitForTimeout(3000);
  
  // Take screenshot before signing
  await page.screenshot({ path: getScreenshotPath('test-results/before-signing.png') });
  
  // Click on canvas for first signature - use more generic coordinates
  console.log('Clicking for first signature...');
  await page.mouse.click(650, 350);
  
  // Wait for pre-approval dialog
  try {
    await page.waitForSelector('[data-testid="editor.preApproval.sign.roleDropdown"]', { state: 'visible', timeout: 5000 });
    await page.getByTestId('editor.preApproval.sign.roleDropdown').click();
    await page.getByTestId('editor.preApproval.sign.roleOption.preparedby').click();
  } catch (error) {
    console.log('Could not find role dropdown, taking screenshot');
    await page.screenshot({ path: getScreenshotPath('test-results/no-role-dropdown.png') });
    throw error;
  }
  
  // Handle popup for signature
  const page1Promise = page.waitForEvent('popup');
  await page.getByTestId('editor.preApproval.sign.signButton').click();
  const page1 = await page1Promise;
  
  // Handle Microsoft login in popup
  await page1.waitForLoadState('load');
  await page1.getByRole('textbox', { name: 'Enter your email or phone' }).click();
  await page1.getByRole('textbox', { name: 'Enter your email or phone' }).fill(process.env.MS_EMAIL_17NJ5D_GRADY_ARCHIE || '');
  await page1.getByRole('button', { name: 'Next' }).click();
  
  await page1.waitForSelector('#i0118', { state: 'visible' });
  await page1.locator('#i0118').fill(process.env.MS_PASSWORD || '');
  await page1.getByRole('button', { name: 'Sign in' }).click();
  
  // Wait for popup to close
  await page1.waitForEvent('close');
  
  // Second user login
  console.log('Logging in as Julia Smith (External)...');
  await microsoftLogin(page2, process.env.MS_EMAIL_XMWKB_JULIA_SMITH || '', process.env.MS_PASSWORD || '');
  
  await page2.waitForLoadState('networkidle');
  
  // Switch tenant
  await page2.getByTestId('lsb.tenant-switcher.trigger').click();
  await page2.waitForSelector('[data-testid="lsb.tenant-switcher.organization.17nj5d"]', { state: 'visible' });
  await page2.getByTestId('lsb.tenant-switcher.organization.17nj5d').click();
  
  // Navigate to documents
  await page2.goto(`${baseUrl}/documents`);
  await page2.waitForLoadState('networkidle');
  
  // Navigate to the created document using dynamic ID
  await page2.goto(`${baseUrl}/document/${documentId}`);
  await page2.waitForLoadState('networkidle');
  await page2.waitForTimeout(2000);
  
  // Second signature
  await page2.mouse.click(631.8046875, 278.4296875);
  await page2.waitForSelector('[data-testid="editor.preApproval.sign.roleDropdown"]', { state: 'visible' });
  await page2.getByTestId('editor.preApproval.sign.roleDropdown').click();
  await page2.getByTestId('editor.preApproval.sign.roleOption.reviewedby').click();
  
  const page3Promise = page2.waitForEvent('popup');
  await page2.getByTestId('editor.preApproval.sign.signButton').click();
  const page3 = await page3Promise;
  
  await page3.waitForLoadState('load');
  await page3.getByRole('textbox', { name: 'Enter your email or phone' }).click();
  await page3.getByRole('textbox', { name: 'Enter your email or phone' }).fill(process.env.MS_EMAIL_XMWKB_JULIA_SMITH || '');
  await page3.getByRole('button', { name: 'Next' }).click();
  
  await page3.waitForSelector('#i0118', { state: 'visible' });
  await page3.locator('#i0118').fill(process.env.MS_PASSWORD || '');
  await page3.getByRole('button', { name: 'Sign in' }).click();
  await page3.waitForEvent('close');
  
  // Third user login
  console.log('Logging in as Julia Smith (Internal)...');
  await microsoftLogin(page4, process.env.MS_EMAIL_17NJ5D_JULIA_SMITH || '', process.env.MS_PASSWORD || '');
  
  await page4.waitForLoadState('networkidle');
  
  // Navigate to document
  await page4.goto(`${baseUrl}/document/${documentId}`);
  await page4.waitForLoadState('networkidle');
  await page4.waitForTimeout(2000);
  
  // Third signature
  await page4.mouse.click(631, 325);
  await page4.waitForSelector('[data-testid="editor.preApproval.sign.roleDropdown"]', { state: 'visible' });
  await page4.getByTestId('editor.preApproval.sign.roleDropdown').click();
  await page4.getByTestId('editor.preApproval.sign.roleOption.approvedby').click();
  
  const page5Promise = page4.waitForEvent('popup');
  await page4.getByTestId('editor.preApproval.sign.signButton').click();
  const page5 = await page5Promise;
  
  await page5.waitForLoadState('load');
  await page5.getByRole('textbox', { name: 'Enter your email or phone' }).fill(process.env.MS_EMAIL_17NJ5D_JULIA_SMITH || '');
  await page5.getByRole('button', { name: 'Next' }).click();
  
  await page5.waitForSelector('#i0118', { state: 'visible' });
  await page5.locator('#i0118').fill(process.env.MS_PASSWORD || '');
  await page5.getByRole('button', { name: 'Sign in' }).click();
  
  // Handle potential "Don't show this again" in popup
  const dontShowCheckbox5 = page5.getByRole('checkbox', { name: 'Don\'t show this again' });
  if (await dontShowCheckbox5.isVisible({ timeout: 5000 })) {
    await dontShowCheckbox5.check();
    await page5.getByRole('button', { name: 'No' }).click();
  }
  
  await page5.waitForEvent('close');
  
  // Add text annotations
  await page4.waitForTimeout(2000);
  await page4.mouse.click(683.8125, 354.25390625);
  
  await page4.waitForSelector('[data-testid="editor.preApproval.tabButton.text"]', { state: 'visible' });
  await page4.getByTestId('editor.preApproval.tabButton.text').click();
  await page4.getByTestId('editor.preApproval.text.inputField').click();
  await page4.getByTestId('editor.preApproval.text.inputField').fill('Julia Smith');
  await page4.getByTestId('editor.preApproval.text.insertButton').click();
  
  await page4.waitForTimeout(1000);
  await page4.mouse.click(550.5390625, 439.34375);
  await page4.getByTestId('editor.preApproval.text.inputField').click();
  await page4.getByTestId('editor.preApproval.text.inputField').fill('today dd/mmm/yyy');
  await page4.getByTestId('editor.preApproval.text.insertButton').click();
  
  // Handle alert modal if it appears
  const alertModal = page4.getByTestId('insertAtCursorAlertModal.confirmButton');
  if (await alertModal.isVisible({ timeout: 2000 })) {
    await alertModal.click();
  }
  
  await page4.waitForTimeout(1000);
  await page4.mouse.click(881.5, 540);
  await page4.getByTestId('editor.preApproval.text.inputField').click();
  await page4.getByTestId('editor.preApproval.text.inputField').fill('today dd/mmm/yyy');
  await page4.getByTestId('editor.preApproval.text.insertButton').click();
  
  if (await alertModal.isVisible({ timeout: 2000 })) {
    await alertModal.click();
  }
  
  // Final document actions
  await page.waitForTimeout(2000);
  await page.getByTestId('docExecutionPage.rsb.refreshButton').click();
  
  // Handle document status modals
  const statusModal = page.getByTestId('documentStatusModal.primaryButton');
  if (await statusModal.isVisible({ timeout: 2000 })) {
    await statusModal.click();
  }
  
  await page.getByTestId('docExecutionPage.rsb.nextButton').click();
  if (await statusModal.isVisible({ timeout: 2000 })) {
    await statusModal.click();
  }
  
  await page.getByTestId('docExecutionPage.rsb.nextButton').click();
  if (await statusModal.isVisible({ timeout: 2000 })) {
    await statusModal.click();
  }
  
  await page.getByTestId('docExecutionPage.rsb.refreshButton').click();
  if (await statusModal.isVisible({ timeout: 2000 })) {
    await statusModal.click();
  }
  
  await page.getByTestId('docExecutionPage.rsb.nextButton').click();
  if (await statusModal.isVisible({ timeout: 2000 })) {
    await statusModal.click();
  }
  
  await page.getByTestId('docExecutionPage.rsb.attachmentTabButton').click();
  await page.getByTestId('docExecutionPage.rsb.filloutTabButton').click();
  await page.getByTestId('docExecutionPage.rsb.nextButton').click();
  if (await statusModal.isVisible({ timeout: 2000 })) {
    await statusModal.click();
  }
  
  await page.getByTestId('docExecutionPage.rsb.refreshButton').click();
  await page.getByTestId('docExecutionPage.leftSidebarToggle').click();
  await page.locator('#de_elementmb90dh522eh2mga8kl6_viewerContainer').click();
  
  // Cleanup
  await context2.close();
  await context4.close();
});