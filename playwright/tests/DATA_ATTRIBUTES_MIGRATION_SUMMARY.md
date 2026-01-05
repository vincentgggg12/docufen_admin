# Data Attributes Migration Summary

This document summarizes the changes made to migrate Playwright test selectors from using `getByLabel`, `getByRole`, and other selectors to using `data-testid` attributes.

## Files Updated

### 1. `playwright-tests/utils/setup-helpers.ts`
**Purpose**: Core setup wizard helper functions

**Changes Made**:
- **Login Button**: `page.getByRole('button', { name: /Continue with Microsoft/i })` → `page.getByTestId('loginPage.loginButton')`
- **Company Name Field**: `page.getByLabel('Company Name')` → `page.getByTestId('setupPage.companyNameField')`
- **Company Address Field**: `page.getByLabel('Company Address')` → `page.getByTestId('setupPage.companyAddressField')`
- **Company City Field**: `page.getByLabel('Company City')` → `page.getByTestId('setupPage.companyCityField')`
- **Company State Field**: `page.getByLabel('Company State')` → `page.getByTestId('setupPage.companyStateField')`
- **Company Post Code Field**: `page.getByLabel('Company Post/Zip Code')` → `page.getByTestId('setupPage.companyPostCodeField')`
- **Company Country Field**: `page.getByLabel('Company Country')` → `page.getByTestId('setupPage.companyCountryField')`
- **Business Registration Field**: `page.getByLabel('Business Registration Number')` → `page.getByTestId('setupPage.businessRegistrationField')`
- **Language Select**: `page.locator('select[name*="language" i]')` → `page.getByTestId('setupPage.languageSelectTrigger')`
- **Next Button**: `page.getByRole('button', { name: 'Next' })` → `page.getByTestId('setupPage.nextButton')`
- **Admin Email Field**: `page.getByLabel('Email', { exact: false }).first()` → `page.getByTestId('setupPage.adminEmailField')`
- **Admin Legal Name Field**: `page.getByLabel('Full Legal Name').first()` → `page.getByTestId('setupPage.adminLegalNameField')`
- **Admin Initials Field**: `page.getByLabel('Initials').first()` → `page.getByTestId('setupPage.adminInitialsField')`
- **User Manager Legal Name Field**: `page.getByLabel('Full Legal Name').nth(1)` → `page.getByTestId('setupPage.userManagerLegalNameField')`
- **User Manager Initials Field**: `page.getByLabel('Initials').nth(1)` → `page.getByTestId('setupPage.userManagerInitialsField')`
- **User Manager Email Field**: `page.getByLabel('Email').nth(1)` → `page.getByTestId('setupPage.userManagerEmailField')`
- **Add User Manager Button**: `page.getByRole('button', { name: 'Add User Manager' })` → `page.getByTestId('setupPage.addUserManagerButton')`
- **Finish Button**: `page.getByRole('button', { name: 'Finish' })` → `page.getByTestId('setupPage.finishButton')`

### 2. `playwright-tests/001-setup-17nj5d.spec.ts`
**Purpose**: Main setup test for 17NJ5D tenant

**Changes Made**:
- **Company Name Field**: `page.getByLabel('Company Name').or(page.locator('[name="companyName"]'))` → `page.getByTestId('setupPage.companyNameField')`

### 3. `playwright-tests/utils/msLogin.ts`
**Purpose**: Microsoft login utility function

**Changes Made**:
- **Login Button**: `page.getByRole('button', { name: /Continue with Microsoft/i })` → `page.getByTestId('loginPage.loginButton')`

### 4. `playwright-tests/01-setup/guide.spec.ts`
**Purpose**: Setup guide test

**Changes Made**:
- **Login Button**: `page.getByRole('button', { name: /Continue with Microsoft/i })` → `page.getByTestId('loginPage.loginButton')`
- **Company Name Field**: `page.getByLabel('Company Name')` → `page.getByTestId('setupPage.companyNameField')`
- **Company Address Field**: `page.getByLabel('Company Address')` → `page.getByTestId('setupPage.companyAddressField')`
- **Company City Field**: `page.getByLabel('Company City')` → `page.getByTestId('setupPage.companyCityField')`
- **Company State Field**: `page.getByLabel('Company State')` → `page.getByTestId('setupPage.companyStateField')`
- **Company Post Code Field**: `page.getByLabel('Company Post/Zip Code')` → `page.getByTestId('setupPage.companyPostCodeField')`
- **Company Country Field**: `page.getByLabel('Company Country')` → `page.getByTestId('setupPage.companyCountryField')`
- **Business Registration Field**: `page.getByLabel('Business Registration Number')` → `page.getByTestId('setupPage.businessRegistrationField')`
- **Language Select**: `page.locator('select[name*="language" i]')` → `page.getByTestId('setupPage.languageSelectTrigger')`
- **Next Button**: `page.getByRole('button', { name: 'Next' })` → `page.getByTestId('setupPage.nextButton')`
- **User Manager Legal Name Field**: `page.getByLabel('Full Legal Name')` → `page.getByTestId('setupPage.userManagerLegalNameField')`
- **User Manager Initials Field**: `page.getByLabel('Initials')` → `page.getByTestId('setupPage.userManagerInitialsField')`
- **User Manager Email Field**: `page.getByLabel('Email')` → `page.getByTestId('setupPage.userManagerEmailField')`
- **Add User Manager Button**: `page.getByRole('button', { name: 'Add User Manager' })` → `page.getByTestId('setupPage.addUserManagerButton')`
- **Finish Button**: `page.getByRole('button', { name: 'Finish' })` → `page.getByTestId('setupPage.finishButton')`

### 5. `playwright-tests/002-setup-external-xmwkb.spec.ts`
**Purpose**: External organization setup test for XMWKB tenant

**Changes Made**:
- **Users Navigation**: `page.getByRole('button', { name: /^Users$/i })` → `page.getByTestId('usersPage.sidebarTrigger').or(page.getByRole('button', { name: /^Users$/i }))`
- **New User Button**: `page.getByRole('button', { name: 'New User' })` → `page.getByTestId('usersPage.addNewUserButton')`
- **User Name Field**: `page.locator('input[name="name"], input#name, [placeholder*="Full name"]')` → `page.getByTestId('usersPage.addUserLegalNameInput')`
- **User Initials Field**: `page.locator('input[name="initials"], input#initials, [placeholder*="initials"]')` → `page.getByTestId('usersPage.addUserInitialsInput')`
- **User Email Field**: `page.locator('input[name="email"], input[type="email"], input#email, [placeholder*="Email"]')` → `page.getByTestId('usersPage.addUserEmailInput')`
- **User Company Field**: `page.locator('input[name="company"], input#company, [placeholder*="Company"]')` → `page.getByTestId('usersPage.addUserCompanyNameInput')`
- **Role Dropdown**: `page.getByText('Collaborator').or(page.locator('button', { hasText: 'Collaborator' }))` → `page.getByTestId('usersPage.addUserRoleSelectTrigger')`
- **Role Selection Verification**: `page.locator('[aria-label="Role"], [name="role"]')` → `page.getByTestId('usersPage.addUserRoleSelect')`
- **Invite Button**: `page.getByRole('button', { name: /Invite/i }).or(...)` → `page.getByTestId('usersPage.addUserInviteButton')`
- **Row Expansion**: `juliaRow.locator('svg').first()` → `juliaRow.getByTestId('usersTable.collapsedRowIcon').or(juliaRow.getByTestId('usersTable.expandedRowIcon'))`

### 6. `playwright-tests/003-digital-signature-verification.spec.ts`
**Purpose**: Digital signature verification test using three different methods

**Changes Made**:
- **Users Navigation**: `page.getByRole('button', { name: /^Users$/i })` → `page.getByTestId('usersPage.sidebarTrigger').or(page.getByRole('button', { name: /^Users$/i }))`
- **Row Expansion**: `userRow.locator('svg').first()` → `userRow.getByTestId('usersTable.collapsedRowIcon').or(userRow.getByTestId('usersTable.expandedRowIcon'))`
- **Verify Digital Signature Button**: `page.getByRole('button', { name: /verify digital signature/i })` → `page.getByTestId('usersTable.verifyDigitalSignatureButton')`
- **View Verified Signature Button**: `userRow.getByRole('button', { name: /view.+signature/i })` → `userRow.getByTestId('usersTable.verifyDigitalSignatureButton')`
- **Image Upload Radio**: `page.getByRole('radio', { name: /image upload/i })` → `page.getByTestId('digitalSignatureVerification.imageRadioButton')`
- **File Input**: `page.locator('input[type="file"]')` → `page.getByTestId('digitalSignatureVerification.fileInput')`
- **Remove File Button**: `page.getByRole('button', { name: /remove|file uploaded/i })` → `page.getByTestId('digitalSignatureVerification.removeFileButton')`
- **Register Notation Radio**: `page.getByRole('radio', { name: /register notation/i })` → `page.getByTestId('digitalSignatureVerification.notationRadioButton')`
- **Notation Textarea**: `page.locator('textarea, input[type="text"]')` → `page.getByTestId('digitalSignatureVerification.notationTextarea')`
- **Microsoft ID Radio**: `page.getByRole('radio', { name: /microsoft id verification/i })` → `page.getByTestId('digitalSignatureVerification.microsoftRadioButton')`
- **Approve/Verify Button**: `page.getByRole('button', { name: /approve digital signature/i })` → `page.getByTestId('digitalSignatureVerification.verifyButton')`
- **Close Drawer Button**: `page.getByRole('button', { name: /close/i })` → `page.getByTestId('digitalSignatureVerification.closeButton')` (with improved fallback logic)
- **Revoke Button**: `page.getByRole('button', { name: /revoke verification/i })` → `page.getByTestId('digitalSignatureVerification.revokeButton')`
- **Audit Trail Button**: `page.getByRole('button', { name: /user audit trail/i })` → `page.getByTestId('usersPage.auditTrailButton')`
- **Audit Trail Close Button**: `page.getByRole('button', { name: /close/i })` → `page.getByTestId('usersPage.auditTrailCloseButton')` (with improved fallback logic)

**Important Fix**: Resolved strict mode violations by improving close button selectors to be more specific and scoped to their respective modals/drawers instead of using broad page-wide selectors.

## Data Attributes Used

Based on the `DataAttributes_README.md`, the following data-testid attributes are now being used:

### Login Page
- `loginPage.loginButton` - Microsoft sign-in button

### Setup Wizard
- `setupPage.companyNameField` - Company name input field
- `setupPage.companyAddressField` - Company address input field
- `setupPage.companyCityField` - Company city input field
- `setupPage.companyStateField` - Company state input field
- `setupPage.companyPostCodeField` - Company postal code input field
- `setupPage.companyCountryField` - Company country input field
- `setupPage.businessRegistrationField` - Business registration number input field
- `setupPage.languageSelectTrigger` - Language dropdown trigger button
- `setupPage.nextButton` - Navigation next button
- `setupPage.adminLegalNameField` - Administrator legal name input field
- `setupPage.adminInitialsField` - Administrator initials input field
- `setupPage.adminEmailField` - Administrator email input field (disabled)
- `setupPage.userManagerLegalNameField` - User manager legal name input field
- `setupPage.userManagerInitialsField` - User manager initials input field
- `setupPage.userManagerEmailField` - User manager email input field
- `setupPage.addUserManagerButton` - Button to add user manager
- `setupPage.finishButton` - Trial activation finish button

### Users Page
- `usersPage.sidebarTrigger` - Sidebar toggle button for Users navigation
- `usersPage.addNewUserButton` - Button to open add new user modal
- `usersPage.addUserLegalNameInput` - Legal name input field in add user modal
- `usersPage.addUserInitialsInput` - Initials input field in add user modal
- `usersPage.addUserEmailInput` - Email input field in add user modal
- `usersPage.addUserCompanyNameInput` - Company name input field in add user modal
- `usersPage.addUserRoleSelectTrigger` - Role dropdown trigger in add user modal
- `usersPage.addUserRoleSelect` - Role selection dropdown in add user modal
- `usersPage.addUserInviteButton` - Invite button to create new user
- `usersPage.auditTrailButton` - Button to open user audit trail modal
- `usersPage.auditTrailCloseButton` - Close button for audit trail modal

### Users Table
- `usersTable.collapsedRowIcon` - Chevron down icon for collapsed row
- `usersTable.expandedRowIcon` - Chevron up icon for expanded row
- `usersTable.verifyDigitalSignatureButton` - Button to verify/view digital signature
- `usersTable.revokeVerificationButton` - Button to revoke signature verification
- `usersTable.signatureDrawerCloseButton` - Close button in signature verification drawer

### Digital Signature Verification
- `digitalSignatureVerification.imageRadioButton` - Image verification radio option
- `digitalSignatureVerification.fileInput` - Hidden file input for image upload
- `digitalSignatureVerification.removeFileButton` - Button to remove selected file
- `digitalSignatureVerification.notationRadioButton` - Register notation radio option
- `digitalSignatureVerification.notationTextarea` - Textarea for register notation input
- `digitalSignatureVerification.microsoftRadioButton` - Microsoft verification radio option
- `digitalSignatureVerification.verifyButton` - Button to approve/verify signature
- `digitalSignatureVerification.revokeButton` - Button to revoke verification
- `digitalSignatureVerification.closeButton` - Close verification details button

## Benefits of This Migration

1. **Stability**: Data attributes are more stable than text-based selectors that might change with UI updates
2. **Performance**: `getByTestId` is faster than complex role/label queries
3. **Maintainability**: Centralized data attribute documentation makes it easier to track and update selectors
4. **Reliability**: Less prone to breaking when UI text changes or when multiple elements have similar labels
5. **Consistency**: Standardized naming convention across all test files

## Notes

- Other test files (like `004-create-document.spec.ts`, `004-a_create-document.spec.ts`, etc.) contain "Next" button selectors, but these are for document creation workflows, not the setup wizard, so they were not updated
- Microsoft login flow selectors (email, password inputs) remain unchanged as they are on Microsoft-hosted pages where we cannot add data attributes
- The migration focused on Docufen application elements where data attributes can be controlled

## Next Steps

1. Ensure all corresponding UI components have the appropriate `data-testid` attributes added
2. Test the updated selectors to ensure they work correctly
3. Consider migrating other test files to use data attributes for consistency
4. Update the `DataAttributes_README.md` if any new data attributes are needed 