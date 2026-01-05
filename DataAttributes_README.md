# Data Attributes Documentation

This document tracks all `data-testid` attributes used throughout the application for testing and automation purposes.

## Naming Convention

We use the following naming convention for data-testid attributes:
- Format: `{pageName}.{elementName}` or `{componentName}.{elementName}`
- Use camelCase for both page/component names and element names
- Use descriptive names that clearly identify the element's purpose
- For pages: use the page name (e.g., `loginPage`, `setupPage`, `dashboardPage`)
- For reusable components: use the component name (e.g., `modal`, `dropdown`, `form`)

## Pages and Components

### Login Page
**File:** `src/pages/Login/LoginPage.tsx`

- **Login Button:** `loginPage.loginButton` - Microsoft sign-in button for user authentication

---

### Setup Wizard
**File:** `src/pages/setup_wizard/`

#### Account Setup Step
- **Company Name Input:** `setupPage.companyNameField` - Company name input field
- **Company Address Input:** `setupPage.companyAddressField` - Company address input field
- **Company City Input:** `setupPage.companyCityField` - Company city input field
- **Company State Input:** `setupPage.companyStateField` - Company state input field
- **Company Post Code Input:** `setupPage.companyPostCodeField` - Company postal code input field
- **Company Country Input:** `setupPage.companyCountryField` - Company country input field
- **Business Registration Input:** `setupPage.businessRegistrationField` - Business registration number input field
- **Language Select:** `setupPage.languageSelect` - Language selection dropdown
- **Language Select Trigger:** `setupPage.languageSelectTrigger` - Language dropdown trigger button
- **Back Button:** `setupPage.backButton` - Navigation back button
- **Next Button:** `setupPage.nextButton` - Navigation next button

#### User Manager Step
- **Admin Legal Name Input:** `setupPage.adminLegalNameField` - Administrator legal name input field
- **Admin Initials Input:** `setupPage.adminInitialsField` - Administrator initials input field
- **Admin Email Input:** `setupPage.adminEmailField` - Administrator email input field (disabled)
- **User Manager Legal Name Input:** `setupPage.userManagerLegalNameField` - User manager legal name input field
- **User Manager Initials Input:** `setupPage.userManagerInitialsField` - User manager initials input field
- **User Manager Email Input:** `setupPage.userManagerEmailField` - User manager email input field
- **Add User Manager Button:** `setupPage.addUserManagerButton` - Button to add user manager
- **Help Tooltip Trigger:** `setupPage.helpTooltipTrigger` - Help tooltip trigger icon

#### Trial Activation Step
- **Finish Button:** `setupPage.finishButton` - Trial activation finish button

#### Account Creation Step
- **Final Finish Button:** `setupPage.finalFinishButton` - Final setup completion button

---

### Trial Expired Page
**File:** `src/pages/TrialExpired/TrialExpired.tsx`

- **Activate License Button:** `trialExpiredPage.activateLicenseButton` - Primary CTA button to activate Azure license
- **Contact Support Button:** `trialExpiredPage.contactSupportButton` - Button to contact support via email

---

### Dashboard Page
**File:** `src/pages/dashboard/`

*To be documented*

---

### Billing Page
**File:** `src/pages/Billing/`

#### Main Billing Page
**File:** `src/pages/Billing/BillingPage.tsx`

- **Sidebar Trigger:** `billingPage.sidebarTrigger` - Sidebar toggle button
- **Breadcrumb:** `billingPage.breadcrumb` - Analytics breadcrumb navigation
- **Tabs List:** `billingPage.tabsList` - Main tabs container
- **Metrics Tab:** `billingPage.metricsTab` - Page metrics tab trigger
- **Transactions Tab:** `billingPage.transactionsTab` - Transactions tab trigger
- **ROI Tab:** `billingPage.roiTab` - ROI Analytics tab trigger
- **Month Select (Transactions):** `billingPage.monthSelectTransactions` - Month selection dropdown for transactions
- **Month Select Trigger (Transactions):** `billingPage.monthSelectTransactionsTrigger` - Month dropdown trigger for transactions
- **Month Select (Metrics):** `billingPage.monthSelectMetrics` - Month selection dropdown for metrics
- **Month Select Trigger (Metrics):** `billingPage.monthSelectMetricsTrigger` - Month dropdown trigger for metrics
- **Search Input:** `billingPage.searchInput` - Transaction search input field
- **Start Date Picker:** `billingPage.startDatePicker` - Start date selection
- **End Date Picker:** `billingPage.endDatePicker` - End date selection
- **Export Button:** `billingPage.exportButton` - Export to CSV button
- **Total Pages Card:** `billingPage.totalPagesCard` - Total pages summary card
- **Document Pages Card:** `billingPage.documentPagesCard` - Document pages summary card
- **Attachment Pages Card:** `billingPage.attachmentPagesCard` - Attachment pages summary card
- **Audit Trail Pages Card:** `billingPage.auditTrailPagesCard` - Audit trail pages summary card
- **Chart Container:** `billingPage.chartContainer` - Billing chart container

#### Billing Table
**File:** `src/pages/Billing/BillingTable.tsx`

- **Table:** `billingTable.table` - Main billing transactions table
- **Loading Row:** `billingTable.loadingRow` - Loading state table row
- **Empty Row:** `billingTable.emptyRow` - No transactions table row
- **Transaction Row:** `billingTable.transactionRow-{id}` - Individual transaction row (dynamic ID)
- **Pagination Controls:** `billingTable.paginationControls` - Pagination controls container
- **Rows Per Page Select:** `billingTable.rowsPerPageSelect` - Rows per page dropdown
- **Rows Per Page Select Trigger:** `billingTable.rowsPerPageSelectTrigger` - Rows per page dropdown trigger
- **Page Info:** `billingTable.pageInfo` - Current page information text
- **Previous Page Button:** `billingTable.previousPageButton` - Previous page navigation button
- **Next Page Button:** `billingTable.nextPageButton` - Next page navigation button

#### ROI Page
**File:** `src/pages/Billing/ROIPage.tsx`

- **Month Select:** `roiPage.monthSelect` - Month selection dropdown for ROI analysis
- **Month Select Trigger:** `roiPage.monthSelectTrigger` - Month dropdown trigger
- **Old Paper Cost Card:** `roiPage.oldPaperCostCard` - Old paper page cost card
- **Investment Cost Card:** `roiPage.investmentCostCard` - Investment cost card
- **Time to Break Even Card:** `roiPage.timeToBreakEvenCard` - Time to break even card
- **New Digital Cost Card:** `roiPage.newDigitalCostCard` - New digital page cost card
- **Savings Percentage Card:** `roiPage.savingsPercentageCard` - Savings percentage card
- **Three Year ROI Card:** `roiPage.threeYearROICard` - 3-year ROI card
- **Break Even Analysis Card:** `roiPage.breakEvenAnalysisCard` - Break-even analysis chart card
- **Edit Paper Cost Button:** `roiPage.editPaperCostButton` - Button to edit paper cost
- **Edit Investment Cost Button:** `roiPage.editInvestmentCostButton` - Button to edit investment cost
- **Edit Estimated Pages Button:** `roiPage.editEstimatedPagesButton` - Button to edit estimated pages

##### Paper Cost Modal
- **Modal:** `roiPage.paperCostModal` - Paper cost calculation modal
- **Paper Cost Input:** `roiPage.paperCostInput` - Paper cost per page input
- **Calculate Your Cost Button:** `roiPage.calculateYourCostButton` - Link to cost calculator
- **Cancel Button:** `roiPage.paperCostCancelButton` - Cancel button
- **Apply Button:** `roiPage.paperCostApplyButton` - Apply paper cost button

##### Investment Cost Modal
- **Modal:** `roiPage.investmentCostModal` - Investment cost modal
- **Investment Cost Input:** `roiPage.investmentCostInput` - Investment cost input
- **Cancel Button:** `roiPage.investmentCostCancelButton` - Cancel button
- **Apply Button:** `roiPage.investmentCostApplyButton` - Apply investment cost button

##### Estimated Pages Modal
- **Modal:** `roiPage.estimatedPagesModal` - Estimated monthly pages modal
- **Estimated Pages Input:** `roiPage.estimatedPagesInput` - Estimated pages input
- **Cancel Button:** `roiPage.estimatedPagesCancelButton` - Cancel button
- **Apply Button:** `roiPage.estimatedPagesApplyButton` - Apply estimated pages button

#### Billing Chart
**File:** `src/pages/Billing/BillingChart.tsx`

- **Loading Card:** `billingChart.loadingCard` - Loading state chart card
- **No Data Card:** `billingChart.noDataCard` - No data available chart card
- **Chart Card:** `billingChart.chartCard` - Main chart card
- **Time Range Toggle Group:** `billingChart.timeRangeToggleGroup` - Desktop time range toggle
- **Time Range 7d:** `billingChart.timeRange7d` - Last 7 days toggle option
- **Time Range 30d:** `billingChart.timeRange30d` - Last 30 days toggle option
- **Time Range 90d:** `billingChart.timeRange90d` - Last 90 days toggle option
- **Time Range Select:** `billingChart.timeRangeSelect` - Mobile time range dropdown
- **Time Range Select Trigger:** `billingChart.timeRangeSelectTrigger` - Mobile time range dropdown trigger
- **Chart Container:** `billingChart.chartContainer` - Chart container element

---

### Documents Page
**File:** `src/pages/Documents/`

#### Main Documents Page
**File:** `src/pages/Documents/DocumentsPage.tsx`

- **Sidebar Trigger:** `documentsPage.sidebarTrigger` - Sidebar toggle button
- **Documents Filter Switch:** `documentsPage.documentsFilterSwitch` - Toggle between "My Documents" and "Everyone's Documents"
- **All Tab:** `documentsPage.allTab` - All documents tab trigger
- **Pre-Approval Tab:** `documentsPage.preApprovalTab` - Pre-approval documents tab trigger
- **Execution Tab:** `documentsPage.executionTab` - Execution documents tab trigger
- **Post-Approval Tab:** `documentsPage.postApprovalTab` - Post-approval documents tab trigger
- **Completed Tab:** `documentsPage.completedTab` - Completed documents tab trigger
- **Final PDF Tab:** `documentsPage.finalPdfTab` - Final PDF documents tab trigger
- **Search Input:** `documentsPage.searchInput` - Document search input field

#### Document Information Edit Dialog
- **Document Name Input:** `documentsPage.editDocumentNameInput` - Document name input field in edit dialog
- **External Reference Input:** `documentsPage.editExternalReferenceInput` - External reference input field in edit dialog
- **Document Category Select:** `documentsPage.editDocumentCategorySelect` - Document category dropdown in edit dialog
- **Document Category Select Trigger:** `documentsPage.editDocumentCategorySelectTrigger` - Document category dropdown trigger in edit dialog
- **Document ID Input:** `documentsPage.editDocumentIdInput` - Read-only document ID input field
- **Cancel Edit Button:** `documentsPage.cancelEditButton` - Cancel button in document edit dialog
- **Save Changes Button:** `documentsPage.saveChangesButton` - Save changes button in document edit dialog

#### Documents Table
**File:** `src/pages/Documents/DocumentsTable.tsx`

- **Document Row:** `documentsTable.documentRow` - Individual document table row
- **Expand Row Button:** `documentsTable.expandRowButton` - Button to expand/collapse document row
- **Document Link:** `documentsTable.documentLink` - Link to open document
- **Final PDF Button:** `documentsTable.finalPdfButton` - Button to view final PDF in status column
- **Edit Document Button:** `documentsTable.editDocumentButton` - Edit document information button in expanded row
- **View Final PDF Button:** `documentsTable.viewFinalPdfButton` - View final PDF button in expanded row
- **Delete Document Button:** `documentsTable.deleteDocumentButton` - Delete document button in expanded row
- **Rows Per Page Select:** `documentsTable.rowsPerPageSelect` - Pagination rows per page dropdown
- **Rows Per Page Select Trigger:** `documentsTable.rowsPerPageSelectTrigger` - Pagination dropdown trigger
- **Previous Page Button:** `documentsTable.previousPageButton` - Previous page navigation button
- **Next Page Button:** `documentsTable.nextPageButton` - Next page navigation button

#### Delete Document Dialog
- **Delete Confirm Button:** `documentsTable.deleteConfirmButton` - Confirm delete button in delete dialog
- **Delete Cancel Button:** `documentsTable.deleteCancelButton` - Cancel button in delete dialog

#### Create New Document Dialog
**File:** `src/pages/Documents/CreateNewDocumentDialog.tsx`

- **Document Name Input:** `createDocumentDialog.documentNameInput` - Document name input field
- **External Reference Input:** `createDocumentDialog.externalReferenceInput` - External reference input field
- **Document Category Select:** `createDocumentDialog.documentCategorySelect` - Document category dropdown
- **Document Category Select Trigger:** `createDocumentDialog.documentCategorySelectTrigger` - Document category dropdown trigger
- **Custom Category Input:** `createDocumentDialog.customCategoryInput` - Custom document category input field
- **File Upload Input:** `createDocumentDialog.fileUploadInput` - Hidden file input for document upload
- **Upload Document Button:** `createDocumentDialog.uploadDocumentButton` - Button to trigger file upload
- **Remove File Button:** `createDocumentDialog.removeFileButton` - Button to remove uploaded file
- **Drag Drop Area:** `createDocumentDialog.dragDropArea` - Drag and drop area for file upload
- **Timezone Tooltip Trigger:** `createDocumentDialog.timezoneTooltipTrigger` - Timezone information tooltip trigger
- **Create Document Button:** `createDocumentDialog.createDocumentButton` - Final create document button

#### Document Category Selector
**File:** `src/pages/Documents/DocumentCategorySelector.tsx`

- **Category Select:** `documentCategorySelector.categorySelect` - Document category selection dropdown
- **Category Select Trigger:** `documentCategorySelector.categorySelectTrigger` - Document category dropdown trigger
- **Custom Category Input:** `documentCategorySelector.customCategoryInput` - Custom category input field when "custom" is selected

---

### Account Page
**File:** `src/pages/AccountPage/`

#### Main Account Page
- **Activate Azure License Button:** `accountPage.activateAzureLicenseButton` - Button to activate Azure license from trial period card
- **Activate Stripe License Button:** `accountPage.activateStripeLicenseButton` - Button to activate Stripe license from trial period card
- **Edit ERSD Button:** `accountPage.editErsdButton` - Button to edit Electronic Record and Signature Disclosure
- **Digital Signatures Switch:** `accountPage.digitalSignaturesSwitch` - Toggle switch to enforce digital signatures
- **Edit Company Info Button:** `accountPage.editCompanyInfoButton` - Button to open company information modal

#### Company Information Modal
- **Company Name Input:** `accountPage.companyNameInput` - Company name input field
- **Company Address Textarea:** `accountPage.companyAddressTextarea` - Company address textarea field
- **Company City Input:** `accountPage.companyCityInput` - Company city input field
- **Company State Input:** `accountPage.companyStateInput` - Company state input field
- **Company Post Code Input:** `accountPage.companyPostCodeInput` - Company postal code input field
- **Company Country Input:** `accountPage.companyCountryInput` - Company country input field
- **Business Registration Input:** `accountPage.businessRegistrationInput` - Business registration number input field
- **Language Select:** `accountPage.languageSelect` - Language selection dropdown
- **Language Select Trigger:** `accountPage.languageSelectTrigger` - Language dropdown trigger button
- **Upload Logo Label:** `accountPage.uploadLogoLabel` - Label/button to upload company logo
- **Logo Upload Input:** `accountPage.logoUploadInput` - Hidden file input for logo upload
- **Remove Logo Button:** `accountPage.removeLogoButton` - Button to remove uploaded logo
- **Cancel Button:** `accountPage.cancelButton` - Cancel button in company info modal
- **Save Changes Button:** `accountPage.saveChangesButton` - Save changes button in company info modal

#### Compliance ERSD Modal
- **ERSD Textarea:** `accountPage.ersdModal.textarea` - Textarea for editing ERSD disclosure text
- **Cancel Button:** `accountPage.ersdModal.cancelButton` - Cancel button in ERSD modal
- **Save Button:** `accountPage.ersdModal.saveButton` - Save button in ERSD modal

---

### Users Page
**File:** `src/pages/users/`

#### Main Users Page
- **Sidebar Trigger:** `usersPage.sidebarTrigger` - Sidebar toggle button
- **Audit Trail Button:** `usersPage.auditTrailButton` - Button to open user audit trail modal
- **Add New User Button:** `usersPage.addNewUserButton` - Button to open add new user modal
- **Mobile Tab Select:** `usersPage.mobileTabSelect` - Mobile dropdown for tab selection
- **Mobile Tab Select Trigger:** `usersPage.mobileTabSelectTrigger` - Mobile tab dropdown trigger
- **Desktop Tabs List:** `usersPage.desktopTabsList` - Desktop tabs container
- **All Users Tab:** `usersPage.allUsersTab` - All users tab trigger
- **Internal Users Tab:** `usersPage.internalUsersTab` - Internal users tab trigger
- **External Users Tab:** `usersPage.externalUsersTab` - External users tab trigger
- **Signature Pending Tab:** `usersPage.signaturePendingTab` - Signature pending tab trigger
- **Deactivated Users Tab:** `usersPage.deactivatedUsersTab` - Deactivated users tab trigger
- **Search Input:** `usersPage.searchInput` - User search input field
- **Rows Per Page Select:** `usersPage.rowsPerPageSelect` - Pagination rows per page dropdown
- **Rows Per Page Select Trigger:** `usersPage.rowsPerPageSelectTrigger` - Pagination dropdown trigger
- **Previous Page Button:** `usersPage.previousPageButton` - Previous page navigation button
- **Next Page Button:** `usersPage.nextPageButton` - Next page navigation button

#### Add New User Modal
- **Legal Name Input:** `usersPage.addUserLegalNameInput` - Legal name input field
- **Initials Input:** `usersPage.addUserInitialsInput` - Initials input field
- **Role Select:** `usersPage.addUserRoleSelect` - Role selection dropdown
- **Role Select Trigger:** `usersPage.addUserRoleSelectTrigger` - Role dropdown trigger
- **Email Input:** `usersPage.addUserEmailInput` - Email input field
- **Company Name Input:** `usersPage.addUserCompanyNameInput` - Company name input field
- **View All Docs Tooltip Trigger:** `usersPage.addUserViewAllDocsTooltipTrigger` - Help tooltip for view all documents
- **View All Docs Switch:** `usersPage.addUserViewAllDocsSwitch` - Toggle for view all documents permission
- **Cancel Button:** `usersPage.addUserCancelButton` - Cancel button in add user modal
- **Invite Button:** `usersPage.addUserInviteButton` - Invite button to create new user

#### Users Table
- **User Row:** `usersTable.userRow` - Individual user table row
- **Expanded Row Icon:** `usersTable.expandedRowIcon` - Chevron up icon for expanded row
- **Collapsed Row Icon:** `usersTable.collapsedRowIcon` - Chevron down icon for collapsed row
- **Edit User Button:** `usersTable.editUserButton` - Edit user information button
- **View All Docs Tooltip Trigger:** `usersTable.viewAllDocsTooltipTrigger` - Help tooltip for view all documents
- **View All Docs Switch:** `usersTable.viewAllDocsSwitch` - Disabled toggle showing view all documents status
- **Verify Digital Signature Button:** `usersTable.verifyDigitalSignatureButton` - Button to verify/view digital signature
- **Revoke Verification Button:** `usersTable.revokeVerificationButton` - Button to revoke signature verification
- **Signature Drawer Close Button:** `usersTable.signatureDrawerCloseButton` - Close button in signature verification drawer

#### User Info Modal
- **Name Input:** `userInfoModal.nameInput` - User name input field
- **Initials Input:** `userInfoModal.initialsInput` - User initials input field
- **Role Select:** `userInfoModal.roleSelect` - Role selection dropdown
- **Role Select Trigger:** `userInfoModal.roleSelectTrigger` - Role dropdown trigger
- **Reset ERSD Button:** `userInfoModal.resetErsdButton` - Button to reset ERSD signature
- **Company Input:** `userInfoModal.companyInput` - Company name input field
- **Activated Switch:** `userInfoModal.activatedSwitch` - User activation status toggle
- **Microsoft Tenant Input:** `userInfoModal.microsoftTenantInput` - Disabled Microsoft tenant display
- **Can Access All Docs Switch:** `userInfoModal.canAccessAllDocsSwitch` - Toggle for view all documents permission
- **Can Access All Docs Tooltip Trigger:** `userInfoModal.canAccessAllDocsTooltipTrigger` - Help tooltip for view all documents
- **Cancel Button:** `userInfoModal.cancelButton` - Cancel button in edit modal
- **Save Changes Button:** `userInfoModal.saveChangesButton` - Save changes button

#### User Audit Trail Modal
- **Tabs:** `userAuditTrailModal.tabs` - Tabs container for audit trail
- **Tabs List:** `userAuditTrailModal.tabsList` - Tabs list container
- **All Tab:** `userAuditTrailModal.allTab` - All audit logs tab trigger
- **Created Tab:** `userAuditTrailModal.createdTab` - Created users audit logs tab trigger
- **Page Size Select:** `userAuditTrailModal.pageSizeSelect` - Pagination page size dropdown
- **Page Size Select Trigger:** `userAuditTrailModal.pageSizeSelectTrigger` - Page size dropdown trigger
- **First Page Button:** `userAuditTrailModal.firstPageButton` - First page navigation button
- **Previous Page Button:** `userAuditTrailModal.previousPageButton` - Previous page navigation button
- **Next Page Button:** `userAuditTrailModal.nextPageButton` - Next page navigation button
- **Last Page Button:** `userAuditTrailModal.lastPageButton` - Last page navigation button
- **Close Button:** `userAuditTrailModal.closeButton` - Close modal button

#### Digital Signature Verification
- **Verification Type Radio Group:** `digitalSignatureVerification.verificationTypeRadioGroup` - Radio group for verification methods
- **Image Radio Button:** `digitalSignatureVerification.imageRadioButton` - Image verification radio option
- **Image Tooltip Trigger:** `digitalSignatureVerification.imageTooltipTrigger` - Help tooltip for image verification
- **File Input:** `digitalSignatureVerification.fileInput` - Hidden file input for image upload
- **Remove File Button:** `digitalSignatureVerification.removeFileButton` - Button to remove selected file
- **Drag Drop Tooltip Trigger:** `digitalSignatureVerification.dragDropTooltipTrigger` - Help tooltip for drag and drop
- **Select File Button:** `digitalSignatureVerification.selectFileButton` - Button to open file picker
- **Notation Radio Button:** `digitalSignatureVerification.notationRadioButton` - Register notation radio option
- **Notation Tooltip Trigger:** `digitalSignatureVerification.notationTooltipTrigger` - Help tooltip for notation verification
- **Notation Textarea:** `digitalSignatureVerification.notationTextarea` - Textarea for register notation input
- **Microsoft Radio Button:** `digitalSignatureVerification.microsoftRadioButton` - Microsoft verification radio option
- **Microsoft Tooltip Trigger:** `digitalSignatureVerification.microsoftTooltipTrigger` - Help tooltip for Microsoft verification
- **Verify Button:** `digitalSignatureVerification.verifyButton` - Button to approve/verify signature
- **Revoke Button:** `digitalSignatureVerification.revokeButton` - Button to revoke verification
- **Close Button:** `digitalSignatureVerification.closeButton` - Close verification details button

---

### Compliance Page
**File:** `src/pages/Compliance/`

*To be documented*

---

### Execution Page
**File:** `src/pages/Execution/`

#### Main Execution Page
**File:** `src/pages/Execution/DocExecutionPage.tsx`

- **Page Container:** `docExecutionPage.container` - Main container for the document execution page
- **Main Content:** `docExecutionPage.mainContent` - Main content area containing the editor
- **Left Sidebar Toggle:** `docExecutionPage.leftSidebarToggle` - Button to toggle the left sidebar
- **Editor Container:** `docExecutionPage.editorContainer` - Container for the document editor
- **Loading Container:** `docExecutionPage.loadingContainer` - Loading state container
- **Loading Spinner:** `docExecutionPage.loadingSpinner` - Loading spinner component
- **Editor:** `docExecutionPage.editor` - Main document editor component
- **Right Sidebar:** `docExecutionPage.rightSidebar` - Right sidebar component

#### Right Sidebar
**File:** `src/pages/Execution/Right-sidebar/sidebar-right.tsx`

- **Container:** `docExecutionPage.rsb.container` - Main right sidebar container
- **Main Content:** `docExecutionPage.rsb.mainContent` - Main content area of the right sidebar
- **Document Info:** `docExecutionPage.rsb.documentInfo` - Document information section
- **Document Title:** `docExecutionPage.rsb.documentTitle` - Document title display
- **Edit Workflow Button:** `docExecutionPage.rsb.editWorkflowButton` - Button to edit workflow
- **Tab Content:** `docExecutionPage.rsb.tabContent` - Container for tab content
- **Fillout Tab:** `docExecutionPage.rsb.filloutTab` - Fillout tab content
- **Controlled Copies Tab:** `docExecutionPage.rsb.controlledCopiesTab` - Controlled copies tab content
- **Owners Tab:** `docExecutionPage.rsb.ownersTab` - Owners tab content
- **Footer:** `docExecutionPage.rsb.footer` - Footer section with navigation buttons
- **Voided Message:** `docExecutionPage.rsb.voidedMessage` - Message shown when document is voided
- **Closed Stage Buttons:** `docExecutionPage.rsb.closedStageButtons` - Buttons shown in closed stage
- **Reopen Button:** `docExecutionPage.rsb.reopenButton` - Button to reopen document
- **View PDF Button:** `docExecutionPage.rsb.viewPdfButton` - Button to view final PDF
- **Navigation Buttons:** `docExecutionPage.rsb.navigationButtons` - Navigation buttons container (fillout tab)
- **Back Button:** `docExecutionPage.rsb.backButton` - Back/previous stage button (fillout tab)
- **Next Button:** `docExecutionPage.rsb.nextButton` - Next stage button (fillout tab)
- **Navigation Buttons Non-Fillout:** `docExecutionPage.rsb.navigationButtonsNonFillout` - Navigation buttons for non-fillout tabs
- **Back Button Non-Fillout:** `docExecutionPage.rsb.backButtonNonFillout` - Back button for non-fillout tabs
- **Next Button Non-Fillout:** `docExecutionPage.rsb.nextButtonNonFillout` - Next button for non-fillout tabs
- **Mini Sidebar:** `docExecutionPage.rsb.miniSidebar` - Mini sidebar with tab buttons
- **Tab Buttons:** `docExecutionPage.rsb.tabButtons` - Container for tab buttons
- **Toggle Button:** `docExecutionPage.rsb.toggleButton` - Button to toggle sidebar visibility
- **Fillout Tab Button:** `docExecutionPage.rsb.filloutTabButton` - Fillout tab button
- **Chat Tab Button:** `docExecutionPage.rsb.chatTabButton` - Chat tab button
- **Attachment Tab Button:** `docExecutionPage.rsb.attachmentTabButton` - Attachment tab button
- **Controlled Copies Tab Button:** `docExecutionPage.rsb.controlledCopiesTabButton` - Controlled copies tab button
- **Owners Tab Button:** `docExecutionPage.rsb.ownersTabButton` - Owners tab button
- **History Tab Button:** `docExecutionPage.rsb.historyTabButton` - History/audit log tab button
- **Refresh Section:** `docExecutionPage.rsb.refreshSection` - Refresh button section
- **Refresh Button:** `docExecutionPage.rsb.refreshButton` - Document refresh button

#### Right Sidebar Dialogs
- **Signing Warning Dialog:** `docExecutionPage.rsb.signingWarningDialog` - Warning dialog for incomplete signatures
- **Signing Warning Title:** `docExecutionPage.rsb.signingWarningTitle` - Title of signing warning dialog
- **Signing Warning Description:** `docExecutionPage.rsb.signingWarningDescription` - Description of signing warning
- **Signing Warning Close Button:** `docExecutionPage.rsb.signingWarningCloseButton` - Close button for signing warning
- **Void Dialog:** `docExecutionPage.rsb.voidDialog` - Document void confirmation dialog
- **Stage Go Back Modal:** `docExecutionPage.rsb.stageGoBackModal` - Modal for going back to previous stage
- **Delete Confirmation Dialog:** `docExecutionPage.rsb.deleteConfirmationDialog` - Document delete confirmation dialog
- **Delete Confirmation Title:** `docExecutionPage.rsb.deleteConfirmationTitle` - Title of delete confirmation
- **Delete Confirmation Description:** `docExecutionPage.rsb.deleteConfirmationDescription` - Description of delete confirmation
- **Delete Confirmation Cancel Button:** `docExecutionPage.rsb.deleteConfirmationCancelButton` - Cancel button for delete confirmation
- **Delete Confirmation Confirm Button:** `docExecutionPage.rsb.deleteConfirmationConfirmButton` - Confirm button for delete confirmation
- **Reopen Confirmation Dialog:** `docExecutionPage.rsb.reopenConfirmationDialog` - Document reopen confirmation dialog
- **Reopen Confirmation Title:** `docExecutionPage.rsb.reopenConfirmationTitle` - Title of reopen confirmation
- **Reopen Confirmation Description:** `docExecutionPage.rsb.reopenConfirmationDescription` - Description of reopen confirmation
- **Reopen Confirmation Cancel Button:** `docExecutionPage.rsb.reopenConfirmationCancelButton` - Cancel button for reopen confirmation
- **Reopen Confirmation Confirm Button:** `docExecutionPage.rsb.reopenConfirmationConfirmButton` - Confirm button for reopen confirmation

#### Void Document Dialog
**File:** `src/pages/Execution/Right-sidebar/void-document-dialog.tsx`

- **Dialog:** `voidDocumentDialog.dialog` - Main void document dialog
- **Content:** `voidDocumentDialog.content` - Dialog content container
- **Header:** `voidDocumentDialog.header` - Dialog header section
- **Title:** `voidDocumentDialog.title` - Dialog title with warning icon
- **Description:** `voidDocumentDialog.description` - Dialog description text
- **Body:** `voidDocumentDialog.body` - Main dialog body content
- **Reason Label:** `voidDocumentDialog.reasonLabel` - Label for reason input field
- **Reason Textarea:** `voidDocumentDialog.reasonTextarea` - Textarea for void reason input
- **Error Message:** `voidDocumentDialog.errorMessage` - Error message display
- **Preview Message:** `voidDocumentDialog.previewMessage` - Preview of void message
- **Footer:** `voidDocumentDialog.footer` - Dialog footer with buttons
- **Cancel Button:** `voidDocumentDialog.cancelButton` - Cancel void action button
- **Confirm Button:** `voidDocumentDialog.confirmButton` - Confirm void action button

#### Stage Go Back Modal
**File:** `src/pages/Execution/Right-sidebar/StageGoBackModal.tsx`

- **Dialog:** `stageGoBackModal.dialog` - Main stage go back dialog
- **Content:** `stageGoBackModal.content` - Dialog content container
- **Header:** `stageGoBackModal.header` - Dialog header section
- **Title:** `stageGoBackModal.title` - Dialog title with warning icon
- **Description:** `stageGoBackModal.description` - Dialog description text
- **Body:** `stageGoBackModal.body` - Main dialog body content
- **Stage Transition:** `stageGoBackModal.stageTransition` - Visual stage transition indicator
- **Reason Label:** `stageGoBackModal.reasonLabel` - Label for reason input field
- **Reason Textarea:** `stageGoBackModal.reasonTextarea` - Textarea for stage reversal reason
- **Error Message:** `stageGoBackModal.errorMessage` - Error message display
- **Audit Notice:** `stageGoBackModal.auditNotice` - Audit log notice text
- **Footer:** `stageGoBackModal.footer` - Dialog footer with buttons
- **Cancel Button:** `stageGoBackModal.cancelButton` - Cancel stage reversal button
- **Confirm Button:** `stageGoBackModal.confirmButton` - Confirm stage reversal button

#### Attachment Link To Document Modal
**File:** `src/pages/Execution/Right-sidebar/AttachmentLinkToDocumentModal.tsx`

- **Dialog:** `attachmentLinkToDocumentModal.dialog` - Main attachment link dialog
- **Content:** `attachmentLinkToDocumentModal.content` - Dialog content container
- **Header:** `attachmentLinkToDocumentModal.header` - Dialog header section
- **Title:** `attachmentLinkToDocumentModal.title` - Dialog title
- **Description:** `attachmentLinkToDocumentModal.description` - Dialog description text
- **Search Container:** `attachmentLinkToDocumentModal.searchContainer` - Search input container
- **Search Input:** `attachmentLinkToDocumentModal.searchInput` - Document search input field
- **Error Message:** `attachmentLinkToDocumentModal.errorMessage` - Error message display
- **Loading State:** `attachmentLinkToDocumentModal.loadingState` - Loading state display
- **Documents List:** `attachmentLinkToDocumentModal.documentsList` - Documents list container
- **Documents Header:** `attachmentLinkToDocumentModal.documentsHeader` - Documents table header
- **Document Row:** `attachmentLinkToDocumentModal.documentRow.{documentId}` - Individual document row (dynamic ID)
- **Document Number:** `attachmentLinkToDocumentModal.documentNumber.{documentId}` - Document number display (dynamic ID)
- **Document Name:** `attachmentLinkToDocumentModal.documentName.{documentId}` - Document name display (dynamic ID)
- **Document Category:** `attachmentLinkToDocumentModal.documentCategory.{documentId}` - Document category display (dynamic ID)
- **Document Status:** `attachmentLinkToDocumentModal.documentStatus.{documentId}` - Document status display (dynamic ID)
- **Empty State:** `attachmentLinkToDocumentModal.emptyState` - Empty state when no documents
- **Footer:** `attachmentLinkToDocumentModal.footer` - Dialog footer with buttons
- **Cancel Button:** `attachmentLinkToDocumentModal.cancelButton` - Cancel button

#### Sidebar Right Toggle
**File:** `src/pages/Execution/Right-sidebar/sidebar-right-toggle.tsx`

- **Tooltip Provider:** `sidebarRightToggle.tooltipProvider` - Tooltip provider wrapper
- **Tooltip:** `sidebarRightToggle.tooltip` - Tooltip component
- **Tooltip Trigger:** `sidebarRightToggle.tooltipTrigger` - Tooltip trigger wrapper
- **Button:** `sidebarRightToggle.button` - Main toggle button
- **Icon:** `sidebarRightToggle.icon` - Toggle button icon
- **Tooltip Content:** `sidebarRightToggle.tooltipContent` - Tooltip content display

#### Sidebar Right Trigger
**File:** `src/pages/Execution/Right-sidebar/sidebar-right-trigger.tsx`

- **Button:** `sidebarRightTrigger.button` - Main trigger button
- **Icon:** `sidebarRightTrigger.icon` - Trigger button icon

---

### Document Completion Page
**File:** `src/pages/DocumentCompletion/`

#### Right Sidebar Fillout Tab
**File:** `src/pages/DocumentCompletion/Right-sidebar/sidebar-right_tab2_fillout.tsx`

- **Notification Dialog Close Button:** `docCompletion.rsb.notificationDialog.closeButton` - Close button in participant notification dialog

---

## UI Components

### Buttons
**File:** `src/components/ui/button.tsx`

*To be documented*

---

### Forms
**File:** `src/components/ui/form.tsx`

*To be documented*

---

### Dropdowns/Select
**File:** `src/components/ui/select.tsx`

*To be documented*

---

### Modals/Dialogs
**File:** `src/components/ui/dialog.tsx`

*To be documented*

---

### Navigation
**File:** `src/components/`

*To be documented*

---

## Editor Components

### Master Popup Component
**File:** `src/components/editor/PopupComponents/MasterPopup.tsx`

- **Main Popup Container:** `editor.{stage}.popup` - Main popup container (stage: preApproval, execution, postApproval)
- **Drag Handle:** `editor.{stage}.dragHandle` - Draggable header bar
- **Close Button:** `editor.{stage}.closeButton` - Close popup button
- **Tab Buttons:**
  - **Sign Tab:** `editor.{stage}.tabButton.sign` - Signatures tab button
  - **Text Tab:** `editor.{stage}.tabButton.text` - Text tab button  
  - **Notes Tab:** `editor.{stage}.tabButton.notes` - Notes tab button
  - **Attachments Tab:** `editor.{stage}.tabButton.attachments` - Attachments tab button (execution only)
  - **Corrections Tab:** `editor.{stage}.tabButton.corrections` - Corrections tab button (execution only)
  - **Checkboxes Tab:** `editor.{stage}.tabButton.checkboxes` - Checkboxes tab button (execution only)
- **Text Input (Pre/Post-Approval):** `editor.{stage}.text.inputField` - Text input field for pre/post-approval stages
- **Insert Button (Pre/Post-Approval):** `editor.{stage}.text.insertButton` - Insert text button for pre/post-approval stages

### Sign Component
**File:** `src/components/editor/PopupComponents/Sign.tsx`

- **Role Dropdown:** `editor.{stage}.sign.roleDropdown` - Signing role/reason dropdown
- **Role Options:** `editor.{stage}.sign.roleOption.{roleKey}` - Individual dropdown options (e.g., preparedby, reviewedby, approvedby, customReason)
- **Sign Button:** `editor.{stage}.sign.signButton` - Main sign button
- **Custom Reason Input:** `editor.{stage}.sign.customReasonInput` - Custom reason text input (when customReason is selected)

### Insert Component (Text Tab - Execution Stage)
**File:** `src/components/editor/PopupComponents/Insert.tsx`

- **Quick Buttons:** `editor.{stage}.text.quickButton.{buttonLabel}.{index}` - Quick insert buttons (Yes, No, N/A, Initials, Pass, Fail, Time, Date)
- **Text Input Field:** `editor.{stage}.text.inputField` - Main text input field
- **Insert Button:** `editor.{stage}.text.insertButton` - Insert text button

### Notes Component
**File:** `src/components/editor/PopupComponents/Notes.tsx`

- **Textarea:** `editor.{stage}.notes.textarea` - Main notes textarea
- **Add Note Button:** `editor.{stage}.notes.addNoteButton` - Add note button
- **Mention Menu:** `editor.{stage}.notes.mentionMenu` - Mention dropdown menu
- **Mention Options:** `editor.{stage}.notes.mentionOption.{participantId}` - Individual mention options
- **Quick Note Buttons:** `editor.{stage}.notes.quickNoteButton.{index}` - Quick note buttons (Sign Here, Missing Entry, etc.)

### Attachments Component
**File:** `src/components/editor/PopupComponents/Attach.tsx`

- **File Input:** `editor.{stage}.attachments.fileInput` - Hidden file input
- **Upload Button:** `editor.{stage}.attachments.uploadButton` - File upload button
- **Clear File Button:** `editor.{stage}.attachments.clearFileButton` - Clear selected file button
- **Link Document Button:** `editor.{stage}.attachments.linkDocumentButton` - Link to document button
- **Clear Document Button:** `editor.{stage}.attachments.clearDocumentButton` - Clear selected document button
- **Name Input:** `editor.{stage}.attachments.nameInput` - Attachment name input field
- **Insert Button:** `editor.{stage}.attachments.insertButton` - Insert attachment button

### Late Entry Component
**File:** `src/components/editor/PopupComponents/LateEntry.tsx`

- **Checkbox:** `editor.{stage}.lateEntry.checkbox` - Late entry checkbox
- **Info Button:** `editor.{stage}.lateEntry.infoButton` - Late entry info tooltip button
- **Date Input:** `editor.{stage}.lateEntry.dateInput` - Late entry date input
- **Time Input:** `editor.{stage}.lateEntry.timeInput` - Late entry time input
- **Reason Input:** `editor.{stage}.lateEntry.reasonInput` - Late entry reason input

### Selection Handler Component
**File:** `src/components/editor/PopupComponents/SelectionHandler.tsx`

- **Container:** `editor.{stage}.selectionHandler.container` - Main selection handler container
- **Checkbox Section:** `editor.{stage}.selectionHandler.checkboxSection` - Checkbox operation section
- **Checkbox Button:** `editor.{stage}.selectionHandler.checkboxButton` - Check checkbox button
- **Correction Section:** `editor.{stage}.selectionHandler.correctionSection` - Text correction section
- **Original Text Input:** `editor.{stage}.selectionHandler.originalTextInput` - Read-only original text display
- **New Text Input:** `editor.{stage}.selectionHandler.newTextInput` - New text input field
- **Reason Input:** `editor.{stage}.selectionHandler.reasonInput` - Correction reason input field
- **Correct Button:** `editor.{stage}.selectionHandler.correctButton` - Apply correction button
- **Help Text:** `editor.{stage}.selectionHandler.helpText` - Help text when no selection

**Note:** `{stage}` values are: `preApproval`, `execution`, `postApproval`

### Search Component
**File:** `src/components/editor/SFEditor.tsx`

- **Search Button:** `editor.{stage}.search.button` - Floating search button
- **Search Popover:** `editor.{stage}.search.popover` - Search popover container
- **Search Input:** `editor.{stage}.search.inputField` - Search text input field
- **Clear Button:** `editor.{stage}.search.clearButton` - Clear search text button
- **Case Sensitive Button:** `editor.{stage}.search.caseSensitiveButton` - Toggle case-sensitive search (currently used for ChevronUp)
- **Whole Word Button:** `editor.{stage}.search.wholeWordButton` - Toggle whole-word search (currently used for ChevronDown)
- **Results Count:** `editor.{stage}.search.resultsCount` - Badge showing current/total matches
- **No Results Message:** `editor.{stage}.search.noResultsMessage` - Message when no results found

### Zoom Component
**File:** `src/components/editor/SFEditor.tsx`

- **Zoom Button:** `editor.{stage}.zoom.button` - Floating zoom button
- **Zoom Popover:** `editor.{stage}.zoom.popover` - Zoom options popover container

### Editor Dialog Components

#### DocuDialog Component
**File:** `src/components/editor/DocuDialog.tsx`

- **Overlay:** `docuDialog.overlay` - Dialog overlay background
- **Content:** `docuDialog.content` - Main dialog content container
- **Title:** `docuDialog.title` - Dialog title with optional icon
- **Content Area:** `docuDialog.contentArea` - Main content/message area
- **Agree Checkbox:** `docuDialog.agreeCheckbox` - Agreement checkbox (when agree prop is true)
- **Agree Label:** `docuDialog.agreeLabel` - Label for agreement checkbox
- **Button Container:** `docuDialog.buttonContainer` - Container for action buttons
- **Primary Button:** `docuDialog.primaryButton` - Primary action button
- **Secondary Button:** `docuDialog.secondaryButton` - Secondary action button

#### Document In Use Dialog
**File:** `src/components/editor/DocumentInUseDialog.tsx`

- **Dialog:** `documentInUseDialog.dialog` - Main dialog container
- **Content:** `documentInUseDialog.content` - Dialog content container
- **Header:** `documentInUseDialog.header` - Dialog header section
- **Title:** `documentInUseDialog.title` - Dialog title with users icon
- **Description:** `documentInUseDialog.description` - Dialog description text
- **Alert Container:** `documentInUseDialog.alertContainer` - Container for warning alert
- **Alert:** `documentInUseDialog.alert` - Warning alert component
- **Alert Title:** `documentInUseDialog.alertTitle` - Alert title text
- **Alert Description:** `documentInUseDialog.alertDescription` - Alert description text
- **Please Wait Text:** `documentInUseDialog.pleaseWaitText` - Please wait message
- **Footer:** `documentInUseDialog.footer` - Dialog footer section
- **OK Button:** `documentInUseDialog.okButton` - OK button to close dialog

#### Document Status Modal
**File:** `src/components/editor/DocumentStatusModal.tsx`

- **Dialog:** `documentStatusModal.dialog` - Main dialog container
- **Content:** `documentStatusModal.content` - Dialog content container
- **Header:** `documentStatusModal.header` - Dialog header section
- **Title:** `documentStatusModal.title` - Dialog title with status icon
- **Description:** `documentStatusModal.description` - Status description text
- **Locked Section:** `documentStatusModal.lockedSection` - Section shown when document is locked
- **Locked Alert:** `documentStatusModal.lockedAlert` - Warning alert for locked document
- **Locked Alert Title:** `documentStatusModal.lockedAlertTitle` - Locked alert title
- **Locked Alert Description:** `documentStatusModal.lockedAlertDescription` - Locked alert description
- **Still Locked Message:** `documentStatusModal.stillLockedMessage` - Message when document remains locked after refresh
- **Footer:** `documentStatusModal.footer` - Dialog footer section
- **Primary Button:** `documentStatusModal.primaryButton` - Primary action button (Refresh/OK)

#### Insert At Cursor Alert Modal
**File:** `src/components/editor/InsertAtCursorAlertModal.tsx`

- **Popover:** `insertAtCursorAlertModal.popover` - Main popover container
- **Trigger:** `insertAtCursorAlertModal.trigger` - Popover trigger element
- **Content:** `insertAtCursorAlertModal.content` - Popover content container
- **Header:** `insertAtCursorAlertModal.header` - Header section with icon and title
- **Title:** `insertAtCursorAlertModal.title` - Confirmation title
- **Description:** `insertAtCursorAlertModal.description` - Description text for insertion type
- **Warning Container:** `insertAtCursorAlertModal.warningContainer` - Warning message container
- **Warning Message:** `insertAtCursorAlertModal.warningMessage` - Warning message text
- **Button Container:** `insertAtCursorAlertModal.buttonContainer` - Container for action buttons
- **Cancel Button:** `insertAtCursorAlertModal.cancelButton` - Cancel button
- **Confirm Button:** `insertAtCursorAlertModal.confirmButton` - Confirm insertion button

#### Sync Message Dialog
**File:** `src/components/editor/SyncMessageDialog.tsx`

- **Dialog:** `syncMessageDialog.dialog` - Main dialog container
- **Content:** `syncMessageDialog.content` - Dialog content container
- **Header:** `syncMessageDialog.header` - Dialog header section
- **Title:** `syncMessageDialog.title` - Dialog title with warning icon
- **Description:** `syncMessageDialog.description` - Dialog description text
- **Alert Container:** `syncMessageDialog.alertContainer` - Container for warning alert
- **Alert:** `syncMessageDialog.alert` - Warning alert component
- **Alert Title:** `syncMessageDialog.alertTitle` - Alert title text
- **Alert Description:** `syncMessageDialog.alertDescription` - Alert description text
- **Review Text:** `syncMessageDialog.reviewText` - Review and retry message
- **Footer:** `syncMessageDialog.footer` - Dialog footer section
- **Got It Button:** `syncMessageDialog.gotItButton` - Got it button to close dialog

---

## Sidebar Components

### Left Sidebar
**File:** `src/components/left-sidebar/`

#### User Profile Component
**File:** `src/components/left-sidebar/user-profile.tsx`

- **User Profile Trigger:** `lsb.user-profile.trigger` - User profile dropdown trigger button
- **Help Menu Item:** `lsb.user-profile.helpMenuItem` - Help menu item in user profile dropdown
- **Logout Menu Item:** `lsb.user-profile.logoutMenuItem` - Logout menu item in user profile dropdown

#### Navigation Main Component
**File:** `src/components/left-sidebar/nav-main.tsx`

- **Navigation Button:** `lsb.nav-main.{itemTitle}` - Main navigation buttons (dynamic based on item title, e.g., `lsb.nav-main.documents-newDocument`, `lsb.nav-main.nav-account`, `lsb.nav-main.nav-users`, `lsb.nav-main.documents-title`)

#### Navigation Favorites Component
**File:** `src/components/left-sidebar/nav-favorites.tsx`

- **Document Button:** `lsb.nav-favorites.documentButton.{documentId}` - Document button for logout-required documents (dynamic ID)
- **Document Link:** `lsb.nav-favorites.documentLink.{documentId}` - Document link for regular documents (dynamic ID)
- **More Actions Trigger:** `lsb.nav-favorites.moreActions.{documentId}` - More actions dropdown trigger for documents (dynamic ID)
- **Remove From Favorites:** `lsb.nav-favorites.removeFromFavorites.{documentId}` - Remove from favorites menu item (dynamic ID)
- **Copy Link:** `lsb.nav-favorites.copyLink.{documentId}` - Copy link menu item (dynamic ID)
- **Open In New Tab:** `lsb.nav-favorites.openInNewTab.{documentId}` - Open in new tab menu item (dynamic ID)
- **Delete:** `lsb.nav-favorites.delete.{documentId}` - Delete document menu item (dynamic ID)
- **More Button:** `lsb.nav-favorites.moreButton` - More button at bottom of favorites list

#### Tenant Switcher Component
**File:** `src/components/left-sidebar/tenant-switcher.tsx`

- **Tenant Switcher Trigger:** `lsb.tenant-switcher.trigger` - Tenant switcher dropdown trigger button
- **Organization Item:** `lsb.tenant-switcher.organization.{tenantName}` - Organization selection item (dynamic tenant name)
- **Create Organization Button:** `lsb.tenant-switcher.createOrganizationButton` - Create new organization button

---

### Deactivated Account Page
**File:** `src/pages/DeactivatedAccount/DeactivatedAccount.tsx`

- **Sidebar Trigger:** `deactivatedAccountPage.sidebarTrigger` - Sidebar toggle button
- **Contact Support Button:** `deactivatedAccountPage.contactSupportButton` - Button to contact support via email

---

### Dashboard Page

---

## Search Functionality
**File:** `src/components/editor/SFEditor.tsx`

- **Search Button:** `editor.searchButton` - Floating search button to open search dialog
- **Search Input:** `editor.searchInput` - Search text input field
- **Clear Search Button:** `editor.searchClearButton` - Button to clear search text
- **Previous Match Button:** `editor.searchPreviousButton` - Navigate to previous search match
- **Next Match Button:** `editor.searchNextButton` - Navigate to next search match

---

## Inactivity Warning Modal
**File:** `src/components/InactivityWarningModal.tsx`

- **Dialog:** `inactivityWarningModal.dialog` - Main modal dialog container
- **Title:** `inactivityWarningModal.title` - Modal title
- **Description:** `inactivityWarningModal.description` - Modal description text
- **Remaining Time:** `inactivityWarningModal.remainingTime` - Time remaining display
- **Logout Button:** `inactivityWarningModal.logoutButton` - Button to log out immediately
- **Stay Logged In Button:** `inactivityWarningModal.stayLoggedInButton` - Button to stay logged in

---

## Internal Admin Page
**File:** `src/pages/InternalAdmin/InternalAdmin.tsx`

- **Page Title:** `internalAdmin.pageTitle` - Main page title
- **Tenant Cards Container:** `internalAdmin.tenantCards` - Container for tenant cards
- **XMWKB Card:** `internalAdmin.xmwkbCard` - Card for xmwkb tenant
- **XMWKB Title:** `internalAdmin.xmwkbTitle` - Title for xmwkb tenant card
- **Reset XMWKB Button:** `internalAdmin.resetXmwkbButton` - Button to reset xmwkb tenant
- **17NJ5D Card:** `internalAdmin.17nj5dCard` - Card for 17nj5d tenant
- **17NJ5D Title:** `internalAdmin.17nj5dTitle` - Title for 17nj5d tenant card
- **Reset 17NJ5D Button:** `internalAdmin.reset17nj5dButton` - Button to reset 17nj5d tenant

---

## Support Modal
**File:** `src/components/support/SupportModal.tsx`

- **Main Dialog Container:** `supportModal.dialogContainer` - Main support modal dialog
- **Create Tab Trigger:** `supportModal.createTabTrigger` - Tab trigger for creating new support ticket
- **Tickets Tab Trigger:** `supportModal.ticketsTabTrigger` - Tab trigger for viewing existing tickets

### Create Tab
- **Error Alert:** `supportModal.errorAlert` - Error alert display
- **Success Alert:** `supportModal.successAlert` - Success alert display
- **Summary Input:** `supportModal.summaryInput` - Summary input field for new ticket
- **Description Textarea:** `supportModal.descriptionTextarea` - Description textarea for new ticket
- **Drag Drop Area:** `supportModal.dragDropArea` - File drag and drop area
- **File Upload Input:** `supportModal.fileUploadInput` - Hidden file input element
- **Remove File Button:** `supportModal.removeFileButton` - Button to remove attached file
- **Submit Button:** `supportModal.submitButton` - Submit ticket creation button

### Tickets Tab
- **Tickets Error Alert:** `supportModal.ticketsErrorAlert` - Error alert for tickets tab
- **Tickets Loading:** `supportModal.ticketsLoading` - Loading state for tickets list
- **Ticket Card:** `supportModal.ticketCard` - Individual ticket card in list
- **View Details Button:** `supportModal.viewDetailsButton` - Button to view ticket details

### Ticket Detail View
- **Back to Tickets Button:** `supportModal.backToTicketsButton` - Button to return to tickets list
- **Ticket Detail Loading:** `supportModal.ticketDetailLoading` - Loading state for ticket details
- **Reply Textarea:** `supportModal.replyTextarea` - Textarea for composing ticket reply
- **Send Reply Button:** `supportModal.sendReplyButton` - Button to send ticket reply

*Last Updated: January 2025*
*Total Data Attributes: 353*
