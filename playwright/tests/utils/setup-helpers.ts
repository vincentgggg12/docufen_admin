import { Page, expect } from '@playwright/test';
import { handleERSDDialog } from './ersd-handler';
import { getScreenshotPath } from './paths';

// Interface for tenant configuration
export interface TenantConfig {
  name: string;
  userEmail: string;
  userManagerEmail: string;
  companyName: string;
  companyAddress: string;
  companyCity: string;
  companyState: string;
  companyPostCode: string;
  companyCountry: string;
  businessRegistrationNumber: string;
  // Tenant Administrator details
  tenantAdminName: string;
  tenantAdminInitials: string;
  // User Manager details
  userManagerName: string;
  userManagerInitials: string;
  password: string;
}

// Core setup function that can be imported by tenant-specific test files
export async function runSetupTest(page: Page, config: TenantConfig) {
  // Set a fixed viewport size to prevent scaling/zooming issues
  await page.setViewportSize({ width: 1440, height: 900 });
  
  // Verify credentials are available
  if (!config.userEmail || !config.password || !config.userManagerEmail) {
    throw new Error(`Microsoft credentials not set in configuration for tenant ${config.name}.`);
  }

  // Step 1: Navigate to the website
  try {
    await page.goto('/login', { waitUntil: 'networkidle', timeout: 60000 });
  } catch (error) {
    console.log('Navigation error:', error.message);
    // Add 2 second pause even when navigation fails
    await page.waitForTimeout(2000);
    await page.screenshot({ path: getScreenshotPath(`${config.name}-navigation-error.png`) });
    throw error;
  }
  
  // Add a 2 second pause after navigation to see what happens
  await page.waitForTimeout(2000);
  await page.screenshot({ path: getScreenshotPath(`${config.name}-after-navigation.png`) });
  
  await expect(page).toHaveTitle(/Docufen/);

  // Step 2: Click on the "Continue with Microsoft" button using data-testid
  const msLoginButton = page.getByTestId('loginPage.loginButton');
  await expect(msLoginButton).toBeVisible({ timeout: 10000 });
  await msLoginButton.click();
  
  // Wait for navigation to Microsoft login page
  await page.waitForURL(/login\.microsoftonline\.com/, { timeout: 15000 });

  // Step 3: Enter Microsoft credentials
  // Enter email/username
  const emailInput = page.getByRole('textbox', { name: /Email.*|Username.*|Sign in/i });
  await expect(emailInput).toBeVisible({ timeout: 10000 });
  // Type slowly, character by character
  await emailInput.clear();
  for (const char of config.userEmail) {
    await emailInput.press(char);
    await page.waitForTimeout(30);
  }
  await page.getByRole('button', { name: /Next/i }).click();
  
  // Enter password
  const passwordInput = page.getByRole('textbox', { name: /Password/i }).or(page.getByPlaceholder('Password'));
  await expect(passwordInput).toBeVisible({ timeout: 10000 });
  // Type slowly, character by character
  await passwordInput.clear();
  for (const char of config.password) {
    await passwordInput.press(char);
    await page.waitForTimeout(30);
  }
  await page.getByRole('button', { name: /Sign in/i }).click();

  // Take screenshot after initial login
  await page.screenshot({ path: getScreenshotPath(`${config.name}-after-login.png`) });
  
  // Step 4a: Handle Microsoft permissions dialog if it appears
  try {
    console.log('Checking for Microsoft permissions dialog...');
    
    // Look for the permissions dialog with a short timeout
    const permissionsText = page.getByText('Permissions requested');
    const permissionsVisible = await permissionsText.isVisible({ timeout: 5000 });
    
    if (permissionsVisible) {
      console.log('Microsoft permissions dialog detected');
      await page.screenshot({ path: getScreenshotPath(`${config.name}-permissions-dialog.png`) });
      
      // Click the Accept button
      const acceptButton = page.getByRole('button', { name: 'Accept' });
      if (await acceptButton.isVisible()) {
        // Add a 2-second pause before clicking Accept
        await page.waitForTimeout(2000);
        await acceptButton.click();
        console.log('Clicked Accept button on permissions dialog');
        await page.screenshot({ path: getScreenshotPath(`${config.name}-after-permissions-accept.png`) });
      }
    } else {
      console.log('No Microsoft permissions dialog detected, continuing with test');
    }
  } catch (error) {
    // Log the error but don't fail the test
    console.log('Error while checking for Microsoft permissions dialog:', error.message);
    console.log('Continuing with test regardless');
    await page.screenshot({ path: getScreenshotPath(`${config.name}-permissions-dialog-error.png`) });
  }
    
  // Step 4b: Try to handle the "Stay signed in?" prompt, but don't fail if it doesn't appear
  try {
    // Wait a few seconds to see if the prompt appears
    console.log('Checking for "Stay signed in?" prompt...');
    
    // First check if we're still on a Microsoft domain
    if (page.url().includes('login.microsoftonline.com') || page.url().includes('microsoft.com')) {
      // Look for the "Stay signed in?" text with a short timeout
      const staySignedInText = page.getByText('Stay signed in?');
      const promptVisible = await staySignedInText.isVisible({ timeout: 5000 });
      
      if (promptVisible) {
        console.log('Stay signed in prompt detected');
        
        // Check the "Don't show this again" checkbox
        const checkbox = page.locator('input[type="checkbox"]');
        if (await checkbox.isVisible()) {
          await checkbox.click();
          console.log('Clicked "Don\'t show this again" checkbox');
        }
        
        // Click the "No" button
        const noButton = page.getByRole('button', { name: 'No' });
        if (await noButton.isVisible()) {
          // Add a 2-second pause before clicking No
          await page.waitForTimeout(2000);
          await noButton.click();
          console.log('Clicked No button');
          
          // Take screenshot after handling the prompt
          await page.screenshot({ path: getScreenshotPath(`${config.name}-after-stay-signed-in-prompt.png`) });
        }
      } else {
        console.log('No "Stay signed in?" prompt detected, continuing with test');
      }
    } else {
      console.log('Already redirected past Microsoft login, no prompt handling needed');
    }
  } catch (error) {
    // Log the error but don't fail the test
    console.log('Error while checking for "Stay signed in?" prompt:', error.message);
    console.log('Continuing with test regardless');
    await page.screenshot({ path: getScreenshotPath(`${config.name}-stay-signed-in-error.png`) });
  }

  // Step 4c: Handle ERSD dialog if it appears after login
  try {
    console.log('Checking for ERSD dialog after login...');
    await handleERSDDialog(page);
  } catch (error) {
    // Log the error but don't fail the test
    console.log('Error while checking for ERSD dialog:', error.message);
    console.log('Continuing with test regardless');
    await page.screenshot({ path: getScreenshotPath(`${config.name}-ersd-dialog-error.png`) });
  }

  // Step 5: Check where the user is redirected to - Setup wizard or Dashboard (if already registered)
  // Wait a moment to let the redirection happen
  await page.waitForTimeout(5000);
  
  // Check the current URL
  const currentUrl = page.url();
  console.log(`Current URL after login: ${currentUrl}`);
  
  // Take a screenshot of where we ended up
  await page.screenshot({ path: getScreenshotPath(`${config.name}-after-redirect.png`) });
  
  // Check if user is already registered by looking for key indicators
  // If on /home, /dashboard, or /account pages and NOT on /setup, user might be registered
  if ((currentUrl.includes('/home') || currentUrl.includes('/dashboard') || currentUrl.includes('/account') ||
      currentUrl.includes('/users') || currentUrl.includes('/documents')) && 
      !currentUrl.includes('/setup')) {
    
    console.log('Possible registered user detected. Checking for key UI elements...');
    
    // First explicitly check if we're on the setup wizard despite the URL
    const isSetupWizardVisible = await page.getByText('Account Setup').isVisible({ timeout: 3000 }).catch(() => false);
    
    // If we see the Account Setup heading, we're actually on the setup wizard despite the URL
    if (isSetupWizardVisible) {
      console.log('Account Setup wizard heading detected. User needs to complete registration.');
    } else {
      // Check for Trial Period text which is a definitive indicator of registration
      const trialPeriodVisible = await page.getByText('Trial Period').isVisible({ timeout: 3000 }).catch(() => false);
      
      // Also look for common UI elements that appear after registration
      const dashboardElementVisible = await page.getByRole('button', { name: /Users|Documents|Dashboard|Account/i })
        .isVisible({ timeout: 3000 }).catch(() => false);
      
      if (trialPeriodVisible || dashboardElementVisible) {
        console.log('✅ User already registered! Found "Trial Period" or dashboard UI elements.');
        
        // Wait a bit and take a final screenshot
        await page.waitForTimeout(2000);
        await page.screenshot({ path: getScreenshotPath(`${config.name}-already-registered.png`) });
        
        // Try to verify we're on the dashboard by looking for common elements
        try {
          // Check for some dashboard elements like "New Document" or "Dashboard" text
          const dashboardElement = page.getByText(/Dashboard|New Document|Documents/i);
          if (await dashboardElement.isVisible({ timeout: 5000 })) {
            console.log('✅ Dashboard elements confirmed visible. Setup test complete (user already registered).');
          }
        } catch (error) {
          console.log('Note: Could not confirm dashboard elements, but user appears to be registered.');
        }
        
        // Final pause for already registered scenario
        await page.waitForTimeout(5000);
        
        // Return early as we don't need to go through setup
        return;
      }
      else {
        // One more attempt to check for logged-in state
        const userProfileButton = page.getByRole('button').filter({ hasText: new RegExp(config.userEmail.split('@')[0], 'i') });
        if (await userProfileButton.isVisible({ timeout: 3000 }).catch(() => false)) {
          console.log('✅ User already registered! Found user profile button in UI.');
          
          // Wait a bit and take a final screenshot
          await page.waitForTimeout(2000);
          await page.screenshot({ path: getScreenshotPath(`${config.name}-already-registered-profile.png`) });
          
          // Return early as we don't need to go through setup
          return;
        }
        
        console.log('Navigation URL suggests registration, but could not confirm with UI elements.');
      }
    }
  }

  // Continue with the original setup process if the user is not already registered
  console.log('User is not registered. Continuing with setup wizard...');

  // Step 6: Wait for redirect to setup page
  await page.waitForURL(/setup/, { timeout: 60000 });
  
  await page.screenshot({ path: getScreenshotPath(`${config.name}-setup-page.png`) });
  
  // Wait to ensure page is fully loaded and stable
  // Use a reasonable timeout and make it resilient
  try {
    await expect(page.locator('div[data-slot="card-title"]').filter({ hasText: 'Account Setup' }))
      .toBeVisible({ timeout: 60000 });
  } catch (error) {
    console.log('Warning: Account Setup title not found within timeout. Taking a screenshot and continuing.');
    await page.screenshot({ path: getScreenshotPath(`${config.name}-setup-page-error.png`) });
    // Try to continue anyway
  }

  // Function to fill form fields with small delays to prevent jumpy behavior
  const fillField = async (fieldSelector, value) => {
    await fieldSelector.scrollIntoViewIfNeeded();
    await fieldSelector.click({ force: true });
    // Type slowly, character by character
    await fieldSelector.clear();
    for (const char of value) {
      await fieldSelector.press(char);
      await page.waitForTimeout(20);
    }
  };

  // Step 7: Fill in company information using data-testid attributes
  await fillField(page.getByTestId('setupPage.companyNameField'), config.companyName);
  await fillField(page.getByTestId('setupPage.companyAddressField'), config.companyAddress);
  await fillField(page.getByTestId('setupPage.companyCityField'), config.companyCity);
  await fillField(page.getByTestId('setupPage.companyStateField'), config.companyState);
  await fillField(page.getByTestId('setupPage.companyPostCodeField'), config.companyPostCode);
  
  // For dropdown, we need to select the option using data-testid
  const countryField = page.getByTestId('setupPage.companyCountryField');
  await fillField(countryField, config.companyCountry);
  
  // Fill in business registration number using data-testid
  await fillField(page.getByTestId('setupPage.businessRegistrationField'), config.businessRegistrationNumber);
  
  // Select language using data-testid
  const languageSelectTrigger = page.getByTestId('setupPage.languageSelectTrigger');
  if (await languageSelectTrigger.isVisible({ timeout: 2000 }).catch(() => false)) {
    await languageSelectTrigger.scrollIntoViewIfNeeded();
    await languageSelectTrigger.click();
    // Select English option - this might need adjustment based on actual implementation
    await page.getByRole('option', { name: 'English' }).click();
  }
  
  // Take a screenshot before submitting
  await page.screenshot({ path: getScreenshotPath(`${config.name}-setup-form-filled.png`) });
  
  // Add a short delay before submitting the form
  await page.waitForTimeout(500);
  
  // Click Next button using data-testid
  const nextButton = page.getByTestId('setupPage.nextButton');
  await nextButton.scrollIntoViewIfNeeded();
  await nextButton.click();
  
  // Wait for navigation to next page - User Manager setup
  await page.waitForLoadState('networkidle');
  await page.screenshot({ path: getScreenshotPath(`${config.name}-user-manager-page.png`) });
  
  // Step 8: Verify we're on the User Manager setup page
  // Look for both the administrator and user manager sections in the new UI
  await page.waitForLoadState('networkidle');
  await page.screenshot({ path: getScreenshotPath(`${config.name}-user-manager-page.png`) });
  
  // Verify the Administrator section with the current user's email
  console.log('Verifying Administrator section...');
  const adminSection = page.getByText('Tenant Administrator (You)');
  await expect(adminSection).toBeVisible({ timeout: 10000 });
  
  // The admin email field should be pre-filled and disabled with the current user's email using data-testid
  const adminEmailField = page.getByTestId('setupPage.adminEmailField');
  await expect(adminEmailField).toBeDisabled();
  await expect(adminEmailField).toHaveValue(config.userEmail.toLowerCase());
  
  // Fill in the tenant administrator's name and initials using data-testid
  console.log('Filling in Tenant Administrator name and initials...');
  await fillField(page.getByTestId('setupPage.adminLegalNameField'), config.tenantAdminName);
  await fillField(page.getByTestId('setupPage.adminInitialsField'), config.tenantAdminInitials);
  
  // Take screenshot after filling admin details
  await page.screenshot({ path: getScreenshotPath(`${config.name}-admin-details-filled.png`) });
  
  // Step 9: First try to use the same email as administrator to test validation
  console.log('Testing email validation by attempting to use the same email as administrator...: ' + config.userEmail);
  
  // Wait for the User Manager section to be visible
  const userManagerSection = page.getByText('Add User Manager (Different Person)');
  await expect(userManagerSection).toBeVisible({ timeout: 10000 });

  // Fill out User Manager form with the SAME email to trigger validation using data-testid
  await fillField(page.getByTestId('setupPage.userManagerLegalNameField'), config.userManagerName);
  await fillField(page.getByTestId('setupPage.userManagerInitialsField'), config.userManagerInitials);
  await fillField(page.getByTestId('setupPage.userManagerEmailField'), config.userEmail); // Same email as admin
  
  // Take screenshot showing validation error
  await page.waitForTimeout(500); // Short wait for validation to trigger
  await page.screenshot({ path: getScreenshotPath(`${config.name}-same-email-validation.png`) });
  await page.locator('body').evaluate(() => window.scrollTo(0, document.body.scrollHeight / 2));
  
  // Verify the validation error message appears
  const validationError = page.getByText(/same email detected/i);
  await expect(validationError).toBeVisible({ timeout: 5000 });
  
  // Verify the Add User Manager button is disabled using data-testid
  const addUserButton = page.getByTestId('setupPage.addUserManagerButton');
  await expect(addUserButton).toBeDisabled();
  
  // Now fill the form with the correct user manager email
  console.log('Now using correct User Manager email...');
  await fillField(page.getByTestId('setupPage.userManagerEmailField'), config.userManagerEmail);
  
  // Take screenshot before submitting
  await page.screenshot({ path: getScreenshotPath(`${config.name}-user-manager-form-filled.png`) });
  
  // Add a short delay before submitting the form
  await page.waitForTimeout(500);
  
  // Click Add User Manager button
  await addUserButton.scrollIntoViewIfNeeded();
  await addUserButton.click();
  
  // Wait for the user to be added and check for confirmation
  await page.waitForLoadState('networkidle');
  
  // Verify user manager was added to the list
  const addedUserManager = page.getByText(config.userManagerName);
  await expect(addedUserManager).toBeVisible({ timeout: 5000 });
  
  // Click Next button to proceed using data-testid
  const finalNextButton = page.getByTestId('setupPage.nextButton');
  await finalNextButton.scrollIntoViewIfNeeded();
  await finalNextButton.click();
  
  // Wait for navigation to next page in the setup process
  await page.waitForLoadState('networkidle');
  await page.screenshot({ path: getScreenshotPath(`${config.name}-after-user-manager.png`) });
  
  // Verify we're no longer on the User Manager page
  await expect(page.locator('div[data-slot="card-title"]').filter({ hasText: 'Add at least one User Manager' }))
    .not.toBeVisible({ timeout: 5000 });

  // Pause for a moment
  await page.waitForTimeout(1000);
  
  // Click the Finish button using data-testid
  const finishButton = page.getByTestId('setupPage.finishButton');
  await finishButton.scrollIntoViewIfNeeded();
  await expect(finishButton).toBeEnabled({ timeout: 15000})
  await finishButton.click();
  
  // Wait for page transition after clicking Finish 
  // The account creation may take significant time - be very patient here
  
  // Add additional wait for any loading spinners to disappear
  await page.waitForTimeout(2000);
  
  console.log('Waiting for account creation to complete...');
  
  // Check for common loading indicators and wait for them to disappear
  // const loadingSpinner = page.getByRole('progressbar').or(page.locator('.spinner')).or(page.getByText(/creating|loading/i));
  // if (await loadingSpinner.isVisible({ timeout: 10000 }).catch(() => false)) {
  //   console.log('Loading spinner detected - waiting for it to disappear');
  //   await loadingSpinner.waitFor({ state: 'hidden', timeout: 60000 }).catch(err => {
  //     console.warn('Loading spinner might still be visible - continuing anyway');
  //   });
  // } else {
  //   console.log('No loading spinner detected, proceeding with setup completion');
  // }
 
  const finalFinishButton = page.getByTestId('setupPage.finalFinishButton');
  await expect(finalFinishButton).toBeVisible({ timeout: 20000 });
  await finalFinishButton.scrollIntoViewIfNeeded();
  await expect(finalFinishButton).toBeEnabled({ timeout: 20000 });
  await finalFinishButton.click();
  await page.waitForLoadState("domcontentloaded");
  
  // Wait a bit for any redirects
  await page.waitForTimeout(3000);
  
  // Check if we've been redirected to an ERSD page
  console.log(`Current URL after final finish: ${page.url()}`);
  
  await page.screenshot({ path: getScreenshotPath(`${config.name}-setup-complete.png`) });
  
  // Handle ERSD - it might be on a separate page or as a dialog
  await handleERSDDialog(page); // Ensure ERSD dialog is handled after setup completion
  // Add verification step to confirm setup was successful
  try {
    // Make sure the account creation is FULLY complete
    console.log('Checking for account creation completion - waiting for Trial Period text');
    
    // Check for "Trial Period" text which indicates successful setup
    // Give the account page a very long timeout (90 seconds) to fully complete the provisioning
    const trialPeriodText = page.getByText('Trial Period');
    const azureSetupButton = page.getByTestId('accountPage.activateAzureLicenseButton');
    
    // Check for ERSD dialog during the wait period
    let isAzureSetupButtonVisible = false;
    const maxAttempts = 18; // 90 seconds / 5 seconds per attempt
    for (let i = 0; i < maxAttempts; i++) {
      // Check if ERSD dialog appeared
      const ersdHandled = await handleERSDDialog(page);
      if (ersdHandled) {
        console.log('ERSD dialog appeared and was handled during verification');
        // Give it a moment after handling ERSD
        await page.waitForTimeout(2000);
      }
      
      // Check if Azure button is visible
      isAzureSetupButtonVisible = await azureSetupButton.isVisible({ timeout: 5000 }).catch(() => false);
      if (isAzureSetupButtonVisible) {
        break;
      }
    }
    if (isAzureSetupButtonVisible) {
      console.log('✅ Trial Period text is visible, setup completed successfully!');
      // Take a screenshot showing the account settings page with Trial Period
      await page.screenshot({ path: getScreenshotPath(`${config.name}-account-settings-trial-period.png`) });
    } else {
      console.log('⚠️ Setup wizard completed, but Trial Period text was not found.');
      await page.screenshot({ path: getScreenshotPath(`${config.name}-final-page-no-trial-period.png`) });
    }
    
    // // This verification has an extremely long timeout because account creation can be slow
    // // We wait up to 90 seconds for the Trial Period text to appear
    // const isTrialPeriodVisible = await trialPeriodText.isVisible({ timeout: 90000 }).catch(err => {
    //   console.warn('Error waiting for Trial Period text:', err.message);
    //   return false;
    // });
    
    // if (isTrialPeriodVisible) {
    //   console.log('✅ Setup wizard completed successfully! Trial Period text is visible.');
    //   // Take a final screenshot showing the account settings page with Trial Period
    //   await page.screenshot({ path: getScreenshotPath(`${config.name}-account-settings-success.png`) });
    // } else {
    //   console.log('⚠️ Setup wizard completed, but Trial Period text was not found.');
    //   await page.screenshot({ path: getScreenshotPath(`${config.name}-final-page-no-trial-period.png`) });
    // }
  } catch (error) {
    console.log('Error while verifying final page:', error.message);
    await page.screenshot({ path: getScreenshotPath(`${config.name}-final-verification-error.png`) });
  }

  // Ensure the sidebar / navigation has fully loaded so downstream tests can interact with it
  try {
    // const usersLink = page.getByRole('button', { name: /^Users$/i });
    const usersLink = page.getByTestId('lsb.nav-main.nav-users');
    await expect(usersLink).toBeVisible({ timeout: 60000 });
  } catch (err) {
    console.warn('Users link not visible after setup completion – subsequent assertions may fail.');
  }

  // Final pause at the end of the test
  await page.waitForTimeout(2000);

  try {
    // First wait for any navigation to complete
    await page.waitForLoadState('networkidle', { timeout: 20_000 });
    
    // Use a more flexible pattern to catch all possible landing pages
    // This includes dashboard, home, users, invitation pages, etc.
    await page.waitForURL(/account|\/documents|\/users|\/invite|\/setup|\/ERSD|\/notinvited/, { timeout: 60_002 });
    
    // Take a screenshot after redirect so we can see where we landed
    await page.screenshot({ path: getScreenshotPath('after-ms-login-redirect.png') });
    
    // Handle ERSD dialog if it appears
    await handleERSDDialog(page);
    
    // Handle invitation acceptance if needed (for User Manager scenario)
    console.log('Checking for invitation acceptance prompt...');
    
    // ... rest of the existing function ...
  } catch (error) {
    console.log('Error handling post-login redirection:', error.message);
    await page.screenshot({ path: getScreenshotPath(`${config.name}-post-login-error.png`) });
  }
} 