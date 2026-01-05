# Operational Qualifications

## Preliminary User Setup for OQ

### Purpose
To create all necessary users for testing each Docufen role and their interactions in single-tenant and multi-tenant scenarios.

### Testing Strategy Overview
1. **Two Primary Organisations**: Pharma 17NJ5D and Biotech XMWKB
2. **Browser Profile Colour Coding**: Assign distinct colours to visually differentiate roles during testing
3. **Systematic Role Coverage**: Test all five roles with appropriate permission boundaries
4. **Multi-Tenant Scenarios**: Test external collaboration and data isolation

The following two Microsoft Developer Sandbox accounts will be used for validation testing.

Tenant Name 17nj5d
Tenant ID: ааб3e253-c0b0-4641-9394-f7f68f3d7126
Primary domain: 17nj5d.onmicrosoft.com
License: Microsoft Entra ID P2

Tenant Name: xmwkb
Tenant ID: 97037407-1985-4765-8dfd-ce22d9355483
Primary domain: xmwkb.onmicrosoft.com
License: Microsoft Entra ID P2

### User Role Assignments

| # | Organisation | Docufen Role | User Principal Name | Display Name | Browser Profile Colour | Primary Testing Focus |
|---|--------------|--------------|---------------------|--------------|----------------------|----------------------|
| 1 | Pharma 17NJ5D | Trial Administrator | MeganB@17nj5d.onmicrosoft.com | Megan Bowen | 🔴 Red | Initial setup, trial features, role delegation |
| 2 | Pharma 17NJ5D | User Manager | GradyA@17nj5d.onmicrosoft.com | Grady Archie | 🟠 Orange | User management, signature verification |
| 3 | Pharma 17NJ5D | Creator | DiegoS@17nj5d.onmicrosoft.com | Diego Siciliani | 🟡 Yellow | Document creation, workflow management |
| 4 | Pharma 17NJ5D | Creator | HenriettaM@17nj5d.onmicrosoft.com | Henrietta Mueller | 🟢 Green | Document sharing, participant management |
| 5 | Pharma 17NJ5D | Collaborator | JohannaL@17nj5d.onmicrosoft.com | Johanna Lorenz | 🔵 Blue | Document participation, limited permissions |
| 6 | Pharma 17NJ5D | Collaborator | LeeG@17nj5d.onmicrosoft.com | Lee Gu | 🟣 Purple | Execution stage testing |
| 7 | Biotech XMWKB | Trial Administrator → Administrator | julia@xmwkb.onmicrosoft.com | Julia Smith | 🟤 Brown | External user → Own tenant creation |
| 8 | Biotech XMWKB | User Manager | amelia@xmwkb.onmicrosoft.com | Amelia Chen | ⚫ Black | Cross-tenant user management |
| 9 | Biotech XMWKB | Creator | charlotte@xmwkb.onmicrosoft.com | Charlotte Smith | 🌸 Pink | Cross-tenant document sharing |
| 10 | Biotech XMWKB | Collaborator | ethan@xmwkb.onmicrosoft.com | Ethan Brown | 🧡 Coral | External collaboration testing |

### Reserved Users for Additional Scenarios

| Organisation | User | Reserved For |
|--------------|------|--------------|
| Pharma 17NJ5D | Patti Fernandez | Administrator role (post-trial conversion) |
| Pharma 17NJ5D | Joni Sherman | Additional Creator for complex workflows |
| Pharma 17NJ5D | Miriam Graham | Quality Approver scenarios |
| Biotech XMWKB | Grace Liu | Additional Creator |
| Biotech XMWKB | Henry Singh | Signature verification testing |
| Biotech XMWKB | Logan Lee | Deactivated user scenarios |

### Key Testing Scenarios by Role

#### 1. Trial Administrator (Megan Bowen)
- Complete setup wizard
- Designate User Manager (Grady Archie)
- Create practice documents
- Test trial limitations
- Monitor trial expiration

#### 2. User Manager (Grady Archie)
- Create users (Diego, Henrietta, Johanna, Lee)
- Verify digital signatures
- Manage ERSD acceptances
- Deactivate/reactivate users
- Cannot modify other User Managers

#### 3. Creators (Diego & Henrietta)
- Upload Word documents
- Share documents with different permissions:
  - Diego shares with Johanna as "Approver"
  - Henrietta shares with Lee as "Executor"
- Manage workflow stages
- Create controlled copies
- Test document voiding

#### 4. Collaborators (Johanna & Lee)
- Access shared documents only
- Test permission boundaries:
  - Johanna: Full access (Pre-Approval, Execution, Post-Approval)
  - Lee: Execution stage only
- Verify inability to create or share documents

#### 5. Multi-Tenant Scenarios
- Julia Smith: Start as external user in Pharma, then create Biotech tenant
- Charlotte Smith: Share documents with Diego (cross-tenant)
- Test external user identification badges
- Verify data isolation between tenants



## Test Scripts

## 1. LOGIN & AUTHENTICATION

### 1.1 Authentication

| TS ID | FS ID(s) | Test Name | Test Procedure | Expected Result | Actual Result as Expected (Yes / No / N/A) | Attachments | Pass/Fail |
|-------|----------|-----------|----------------|-----------------|---------------------------------------------|-------------|-----------|
| TS.1.1-01 | FS.1.1-01 | Microsoft SSO Login | 1. Navigate to Docufen login page. 2. Click "Login with Microsoft" button. 3. Enter Microsoft credentials. 4. Complete Microsoft authentication. 5. Verify redirect to Docufen (SC) | 1. Login page displays. 2. Microsoft login page opens. 3. Credentials accepted. 4. Authentication successful. 5. Returns to Docufen authenticated | | | |
| TS.1.1-02 | FS.1.1-02 | Tenant Selection | 1. Login as Julia (has access to both tenants). 2. View tenant selection dropdown. 3. Select Pharma 17NJ5D. 4. Verify access to 17NJ5D. 5. Switch to Biotech XMWKB (SC) | 1. Login successful. 2. Dropdown shows both tenants. 3. 17NJ5D selected. 4. Shows 17NJ5D data. 5. Successfully switches tenant | | | |
| TS.1.1-03 | FS.1.1-03 | Existing Session Redirect | 1. Login as Diego (Creator). 2. Note landing on Documents page. 3. Open new tab, go to login URL. 4. Verify auto-redirect without login (SC) | 1. Initial login successful. 2. Documents page shown. 3. New tab opened. 4. Bypasses login, goes to Documents | | | |
| TS.1.1-04 | FS.1.1-04 | Role-Based Navigation | 1. Login as new user (no role). 2. Verify redirect to Setup wizard. 3. Login as Grady (User Manager). 4. Verify redirect to Users page. 5. Login as Megan (Trial Admin) to Account (SC) | 1. New user authenticated. 2. Setup wizard displays. 3. User Manager logged in. 4. Users page displays. 5. Account page displays | | | |
| TS.1.1-05 | FS.1.1-05 | Authentication Error Handling | 1. Click login with Microsoft. 2. Cancel authentication. 3. Return to Docufen. 4. Verify error message. 5. Check retry option available (SC) | 1. MS login initiated. 2. Auth cancelled. 3. Returns to login page. 4. Error message displayed. 5. Can retry login | | | |
| TS.1.1-06 | FS.1.1-06 | Microsoft Object ID Capture | 1. Login as Henrietta. 2. Navigate to Users page. 3. Expand Henrietta's details. 4. Verify Azure Object ID displayed. 5. Check ID format (SC) | 1. Login successful. 2. Users page loads. 3. User details expand. 4. Object ID visible. 5. Valid GUID format | | | |

### 1.2 Access Control & Status

| TS ID | FS ID(s) | Test Name | Test Procedure | Expected Result | Actual Result as Expected (Yes / No / N/A) | Attachments | Pass/Fail |
|-------|----------|-----------|----------------|-----------------|---------------------------------------------|-------------|-----------|
| TS.1.2-01 | FS.1.2-01 | Deactivated User Detection | 1. Deactivate Lee's account. 2. Attempt login as Lee. 3. Complete MS authentication. 4. View restriction message. 5. Verify cannot access app (SC) | 1. Account deactivated. 2. Login attempted. 3. MS auth succeeds. 4. "Account disabled" message. 5. No access to features | | | |
| TS.1.2-02 | FS.1.2-02 | Digital Signature Verification Check | 1. Login as unverified Ethan. 2. Complete authentication. 3. View signature warning. 4. Navigate to documents. 5. Verify cannot sign (SC) | 1. Login initiated. 2. Auth successful. 3. Warning displayed. 4. Can access documents. 5. Signing disabled | | | |
| TS.1.2-03 | FS.1.2-03 | Trial Expiration Check | 1. Set trial expiry to yesterday. 2. Login as Diego. 3. View expiration message. 4. Check upgrade options. 5. Verify feature block (SC) | 1. Trial expired. 2. Login completes. 3. "Trial expired" shown. 4. Azure/Stripe options visible. 5. Cannot access features | | | |
| TS.1.2-04 | FS.1.2-04 | User Status Validation | 1. Create invited user. 2. First login as invited user. 3. Verify status changes to Active. 4. Check in user list (SC) | 1. User created as Invited. 2. First login successful. 3. Status updates automatically. 4. Shows Active in list | | | |
| TS.1.2-05 | FS.1.2-05 | External User Identification | 1. Login as Charlotte (xmwkb). 2. Access Pharma 17NJ5D. 3. View user profile. 4. Check External badge. 5. Verify company shown (SC) | 1. External user login. 2. Cross-tenant access. 3. Profile displays. 4. External badge visible. 5. Shows "Biotech XMWKB" | | | |
| TS.1.2-06 | FS.1.2-06 | Multi-Tenant Access Check | 1. Login as user with 3 tenants. 2. View tenant switcher. 3. Select different tenant. 4. Verify data isolation. 5. Switch back (SC) | 1. Multi-tenant user. 2. All 3 tenants listed. 3. Tenant switches. 4. Only selected tenant data. 5. Original tenant restored | | | |

### 1.3 Compliance

| TS ID | FS ID(s) | Test Name | Test Procedure | Expected Result | Actual Result as Expected (Yes / No / N/A) | Attachments | Pass/Fail |
|-------|----------|-----------|----------------|-----------------|---------------------------------------------|-------------|-----------|
| TS.1.3-01 | FS.1.3-01 | ERSD Agreement Display | 1. Reset ERSD for Johanna. 2. Login as Johanna. 3. View ERSD text. 4. Verify in selected language. 5. Check checkbox required (SC) | 1. ERSD reset done. 2. Login successful. 3. ERSD agreement shows. 4. Correct language displayed. 5. Must check to continue | | | |
| TS.1.3-02 | FS.1.3-02 | ERSD Acceptance Tracking | 1. Accept ERSD as Johanna. 2. Check audit trail. 3. Verify timestamp recorded. 4. Check user ID logged. 5. Verify acceptance saved (SC) | 1. ERSD accepted. 2. Audit trail accessed. 3. Timestamp present. 4. Johanna's ID recorded. 5. Acceptance permanent | | | |
| TS.1.3-03 | FS.1.3-03 | ERSD Rejection Handling | 1. Reset ERSD for Lee. 2. Login as Lee. 3. Click Decline on ERSD. 4. Verify access blocked. 5. Check can reconsider (SC) | 1. ERSD reset. 2. Login shows ERSD. 3. Declined clicked. 4. Cannot access system. 5. Can go back to accept | | | |
| TS.1.3-04 | FS.1.3-04 | User Manager ERSD Visibility | 1. Login as Grady (User Manager). 2. Navigate to Users page. 3. View ERSD column. 4. Check all dates shown. 5. Verify format correct (SC) | 1. User Manager access. 2. Users page loads. 3. ERSD dates visible. 4. Shows acceptance dates. 5. Date/time formatted | | | |
| TS.1.3-05 | FS.1.3-05 | ERSD Reset Capability | 1. As Grady, select Diego. 2. Click Reset ERSD. 3. Confirm reset. 4. Have Diego login. 5. Verify ERSD required (SC) | 1. User selected. 2. Reset option available. 3. Reset confirmed. 4. Diego must re-accept. 5. ERSD shown on login | | | |

## 2. SETUP WIZARD

### 2.1 Multi-Step Wizard

| TS ID | FS ID(s) | Test Name | Test Procedure | Expected Result | Actual Result as Expected (Yes / No / N/A) | Attachments | Pass/Fail |
|-------|----------|-----------|----------------|-----------------|---------------------------------------------|-------------|-----------|
| TS.2.1-01 | FS.2.1-01 | Setup Wizard Access Control | 1. Access /setup without auth. 2. Verify redirect to login. 3. Login and access /setup. 4. Verify wizard loads (SC) | 1. Unauthenticated access. 2. Redirects to /login. 3. Authentication successful. 4. Setup wizard displays | | | |
| TS.2.1-02 | FS.2.1-02 | Existing Account Detection | 1. Login as Diego (has role). 2. Navigate to /setup. 3. Verify redirect. 4. Check lands on Documents (SC) | 1. Existing user login. 2. Setup URL accessed. 3. Redirects immediately. 4. Documents page shown | | | |
| TS.2.1-03 | FS.2.1-03 | Four-Step Navigation | 1. Access setup as new user. 2. View step indicators. 3. Count 4 steps shown. 4. Verify Account Setup highlighted. 5. Check other steps disabled (SC) | 1. New user access. 2. Progress bar visible. 3. Shows 4 distinct steps. 4. Step 1 active/highlighted. 5. Steps 2-4 grayed out | | | |
| TS.2.1-04 | FS.2.1-04 | Step Progression Control | 1. Leave required field empty. 2. Click Next button. 3. Fill all required fields. 4. Click Next again. 5. Verify advances to step 2 (SC) | 1. Form incomplete. 2. Next button disabled/errors. 3. Form completed. 4. Next button works. 5. User Manager step shown | | | |
| TS.2.1-05 | FS.2.1-05 | Trial Period Display | 1. Complete steps 1-2. 2. Reach Trial Activation. 3. View trial message. 4. Verify shows "14 days" (SC) | 1. First steps done. 2. Step 3 displayed. 3. Trial info visible. 4. "14 days remaining" shown | | | |
| TS.2.1-06 | FS.2.1-06 | Browser History Integration | 1. Navigate to login, then setup. 2. Click browser back on step 1. 3. Verify returns to login. 4. Go forward to setup. 5. State preserved (SC) | 1. Navigation recorded. 2. Browser back works. 3. Returns to login page. 4. Forward returns to setup. 5. Form data retained | | | |

### 2.2 Account Configuration

| TS ID | FS ID(s) | Test Name | Test Procedure | Expected Result | Actual Result as Expected (Yes / No / N/A) | Attachments | Pass/Fail |
|-------|----------|-----------|----------------|-----------------|---------------------------------------------|-------------|-----------|
| TS.2.2-01 | FS.2.2-01 | Company Name Entry | 1. Leave company name empty. 2. Try to proceed. 3. Enter "Test Pharma Co". 4. Field validates. 5. Can proceed (SC) | 1. Field empty. 2. Error "Company name required". 3. Name entered. 4. Error clears. 5. Next button enabled | | | |
| TS.2.2-02 | FS.2.2-02 | Address Collection | 1. Enter partial address. 2. Leave city empty. 3. See validation errors. 4. Complete all fields. 5. Errors clear (SC) | 1. Street entered only. 2. City field empty. 3. "City required" shown. 4. All fields filled. 5. Validation passes | | | |
| TS.2.2-03 | FS.2.2-03 | Country Selection | 1. Leave country unselected. 2. Try to continue. 3. Select "United States". 4. Validation passes (SC) | 1. No country selected. 2. "Country required" error. 3. US selected from dropdown. 4. Error cleared | | | |
| TS.2.2-04 | FS.2.2-04 | Business Registration | 1. Leave BRN empty. 2. See required error. 3. Enter "BRN-123456". 4. Field accepts (SC) | 1. Field empty. 2. "Business registration required". 3. BRN entered. 4. Validation passes | | | |
| TS.2.2-05 | FS.2.2-05 | Language Preference | 1. Check default language. 2. Open dropdown. 3. Select Spanish. 4. UI updates to Spanish. 5. Select English back (SC) | 1. English default shown. 2. Dropdown has options. 3. Spanish selected. 4. Labels change to Spanish. 5. Returns to English | | | |
| TS.2.2-06 | FS.2.2-06 | Form Validation Engine | 1. Fill some fields. 2. Leave others empty. 3. Check Next disabled. 4. See field errors. 5. Complete all, Next enables (SC) | 1. Partial completion. 2. Required fields empty. 3. Next button grayed. 4. Specific errors shown. 5. Button activates | | | |
| TS.2.2-07 | FS.2.2-07 | Validation State Persistence | 1. Trigger validation errors. 2. Click Back to browser. 3. Return to setup. 4. Errors still shown. 5. Form data retained (SC) | 1. Errors displayed. 2. Navigate away. 3. Return to form. 4. Same errors visible. 5. Previous entries kept | | | |
| TS.2.2-08 | FS.2.2-08 | Internationalization Support | 1. Set language to Spanish. 2. View all labels. 3. Check placeholders. 4. Trigger error. 5. Error in Spanish (SC) | 1. Spanish selected. 2. Labels in Spanish. 3. Placeholders translated. 4. Validation triggered. 5. Spanish error text | | | |

### 2.3 User Management Setup

| TS ID | FS ID(s) | Test Name | Test Procedure | Expected Result | Actual Result as Expected (Yes / No / N/A) | Attachments | Pass/Fail |
|-------|----------|-----------|----------------|-----------------|---------------------------------------------|-------------|-----------|
| TS.2.3-01 | FS.2.3-01 | Trial Administrator Display | 1. Reach User Manager step. 2. View admin section. 3. See current user shown. 4. Edit name to "Admin User". 5. Initials update to "AU" (SC) | 1. Step 2 displayed. 2. Admin section visible. 3. Shows logged-in user. 4. Name editable. 5. Initials auto-generated | | | |
| TS.2.3-02 | FS.2.3-02 | Email Display Read-Only | 1. View admin email field. 2. Try to click/edit. 3. Verify non-editable. 4. Shows current user email (SC) | 1. Email field visible. 2. Cannot select/edit. 3. Field is read-only. 4. Correct email shown | | | |
| TS.2.3-03 | FS.2.3-03 | Auto-Initials Generation | 1. Enter "John Smith". 2. See initials "JS". 3. Change to "Mary Jane Doe". 4. Initials become "MJD". 5. Max 3 chars enforced (SC) | 1. Name entered. 2. "JS" generated. 3. Name changed. 4. "MJD" shown. 5. Limited to 3 characters | | | |
| TS.2.3-04 | FS.2.3-04 | User Manager Addition Form | 1. View User Manager section. 2. Enter "Test Manager". 3. Initials auto-generate. 4. Enter email. 5. All fields work (SC) | 1. Form section visible. 2. Name accepted. 3. Initials appear. 4. Email field works. 5. Form functional | | | |
| TS.2.3-05 | FS.2.3-05 | Email Uniqueness Validation | 1. Add manager with admin email. 2. See duplicate error. 3. Add two managers same email. 4. Second shows error (SC) | 1. Admin email used. 2. "Email already in use". 3. First manager added. 4. "Duplicate email" error | | | |
| TS.2.3-06 | FS.2.3-06 | Mandatory User Manager | 1. Try Next without manager. 2. See validation error. 3. Add one manager. 4. Next button enables (SC) | 1. No managers added. 2. "Add at least one" error. 3. Manager added. 4. Can proceed to next | | | |
| TS.2.3-07 | FS.2.3-07 | Multiple User Manager Support | 1. Add first manager. 2. Add second manager. 3. Add third manager. 4. All show in list. 5. Can remove each (SC) | 1. First added to list. 2. Second appears below. 3. Third added. 4. All 3 displayed. 5. X button removes | | | |
| TS.2.3-08 | FS.2.3-08 | Email Format Validation | 1. Enter "notanemail". 2. See format error. 3. Enter "test@". 4. Still invalid. 5. Enter "test@example.com" valid (SC) | 1. Invalid format. 2. "Invalid email" shown. 3. Incomplete email. 4. Error persists. 5. Valid email accepted | | | |

### 2.4 Trial Activation

| TS ID | FS ID(s) | Test Name | Test Procedure | Expected Result | Actual Result as Expected (Yes / No / N/A) | Attachments | Pass/Fail |
|-------|----------|-----------|----------------|-----------------|---------------------------------------------|-------------|-----------|
| TS.2.4-01 | FS.2.4-01 | Trial Activation API | 1. Complete steps 1-2. 2. Click Finish on step 3. 3. Monitor network tab. 4. See POST to /account/create/. 5. 201 response (SC) | 1. Prerequisites done. 2. Activation triggered. 3. Network activity. 4. API call made. 5. Success response | | | |
| TS.2.4-02 | FS.2.4-02 | Loading State Display | 1. Click Finish button. 2. See loading spinner. 3. "Activating..." message. 4. Button disabled. 5. No navigation allowed (SC) | 1. Activation starts. 2. Spinner appears. 3. Message displayed. 4. Cannot re-click. 5. Navigation locked | | | |
| TS.2.4-03 | FS.2.4-03 | Success State Transition | 1. Wait for API response. 2. See success state. 3. Auto-advance to step 4. 4. Account Creation shown (SC) | 1. API completes. 2. Success indicated. 3. Automatic progression. 4. Final step displayed | | | |

### 2.5 Account Provisioning

| TS ID | FS ID(s) | Test Name | Test Procedure | Expected Result | Actual Result as Expected (Yes / No / N/A) | Attachments | Pass/Fail |
|-------|----------|-----------|----------------|-----------------|---------------------------------------------|-------------|-----------|
| TS.2.5-01 | FS.2.5-01 | Tenant Account Creation | 1. Reach final step. 2. See "Creating tenant". 3. Loading indicator shown. 4. Message visible (SC) | 1. Step 4 displayed. 2. Text shown. 3. Spinner animated. 4. Clear messaging | | | |
| TS.2.5-02 | FS.2.5-02 | Cosmos DB Setup Display | 1. After tenant creation. 2. See "Setting up Cosmos DB". 3. Progressive indicator. 4. Previous item checked (SC) | 1. First step done. 2. Cosmos DB message. 3. Loading continues. 4. Tenant has checkmark | | | |
| TS.2.5-03 | FS.2.5-03 | Azure Blob Storage Setup | 1. After Cosmos DB. 2. See "Creating Blob Storage". 3. Loading animation. 4. Previous items checked (SC) | 1. Second step done. 2. Blob storage message. 3. Spinner active. 4. Two checkmarks shown | | | |
| TS.2.5-04 | FS.2.5-04 | Progressive Status Updates | 1. Watch full sequence. 2. Each step shows spinner. 3. Then shows checkmark. 4. Next step begins. 5. Sequential flow (SC) | 1. Animation flows. 2. Spinners display. 3. Green checks appear. 4. Next activates. 5. Proper sequence | | | |
| TS.2.5-05 | FS.2.5-05 | Navigation Lock | 1. During provisioning. 2. Try browser back. 3. Try clicking Back. 4. Both disabled. 5. Must wait (SC) | 1. Process running. 2. Browser back blocked. 3. Back button disabled. 4. Cannot navigate. 5. Forced to complete | | | |
| TS.2.5-06 | FS.2.5-06 | Automatic Redirect | 1. All steps complete. 2. All show checkmarks. 3. Wait 1.5 seconds. 4. Auto-redirect occurs. 5. Land on /account (SC) | 1. Provisioning done. 2. Three green checks. 3. Brief pause. 4. Redirects automatically. 5. Account page loads | | | |
| TS.2.5-07 | FS.2.5-07 | Visual Completion Feedback | 1. Watch each spinner. 2. Becomes green check. 3. Check icon style. 4. All three consistent. 5. Clear success state (SC) | 1. Spinners visible. 2. Transform to checks. 3. Green color. 4. Matching style. 5. Obviously complete | | | |

### 2.6 Negative and Edge Case Tests

| TS ID | FS ID(s) | Test Name | Test Procedure | Expected Result | Actual Result as Expected (Yes / No / N/A) | Attachments | Pass/Fail |
|-------|----------|-----------|----------------|-----------------|---------------------------------------------|-------------|-----------|
| TS.2.6-01 | FS.2.1-04 | Network Failure During Setup | 1. Fill step 1 completely. 2. Disconnect network. 3. Click Next. 4. Check error handling (SC) | 1. Form filled. 2. Network off. 3. Next clicked. 4. Error message shown | | | |
| TS.2.6-02 | FS.2.3-03 | Special Characters in Names | 1. Enter "John<script>". 2. Check sanitization. 3. Enter "Mary & Joe". 4. Verify handling (SC) | 1. Script tags entered. 2. Sanitized/rejected. 3. Ampersand entered. 4. Properly handled | | | |
| TS.2.6-03 | FS.2.4-01 | API Timeout Handling | 1. Slow network simulation. 2. Click activate. 3. Wait 30+ seconds. 4. Check timeout behavior (SC) | 1. Network throttled. 2. Activation starts. 3. Long wait. 4. Timeout error shown | | | |
| TS.2.6-04 | FS.2.1-02 | Race Condition Prevention | 1. Two tabs open setup. 2. Complete in first tab. 3. Try second tab. 4. Check behavior (SC) | 1. Both at setup. 2. First completes. 3. Second redirects. 4. Cannot double-setup | | | |





### 3. ACCOUNT

#### 3.1 Company Information Management

| TS ID | FS ID(s) | Test Name | Test Procedure | Expected Result | Actual Result as Expected (Yes / No / N/A) | Attachments | Pass/Fail |
|-------|----------|-----------|----------------|-----------------|---------------------------------------------|-------------|-----------|
| TS.3.1-01 | FS.3.1-01 | View Account Details | 1\. Login as Megan Bowen (Trial Administrator). 2\. Navigate to Account page. 3\. View company information section (SC) | 1\. Account page loads. 2\. Company name not empty displayed. 3\. All company details visible |  |  |  |
| TS.3.1-02 | FS.3.1-02 | Edit Company Name | 1\. Click Edit button on company information. 2\. Change to Pharma Corp 17NJ5D. 3\. Save changes. 4\. Verify name shows as Pharma Corp 17NJ5D (SC). 5\. Reload the page (F5/refresh). 6\. Verify name still shows as Pharma Corp 17NJ5D (SC) | 1\. Edit form appears. 2\. Name updates successfully. 3\. Name is updated. 4\. New name displays correctly. 5\. Page reloads successfully. 6\. Name persists as Pharma Corp 17NJ5D |  |  |  |
| TS.3.1-03 | FS.3.1-03 | Edit Address Information | 1\. Click Edit Company information. 2\. Update street to 456 Research Blvd. 3\. Update postal code to 07002\. 4\. Save changes. 5\. Verify address shows 456 Research Blvd and postal 07002 (SC). 6\. Reload the page (F5/refresh). 7\. Verify address still shows 456 Research Blvd and postal 07002 (SC) | 1\. Address form editable. 2\. All fields accept input. 3\. Save successful. 4\. New address and postal code display. 5\. Page reloads. 6\. Address persists as 456 Research Blvd. 7\. Postal code persists as 07002 |  |  |  |
| TS.3.1-04 | FS.3.1-04 | Edit Business Registration | 1\. Click Edit Company information. 2\. Change to BRN-2024-456. 3\. Save changes. 4\. Verify registration shows BRN-2024-456 (SC). 5\. Reload the page (F5/refresh). 6\. Verify registration still shows BRN-2024-456 (SC) | 1\. Field becomes editable. 2\. New value saves successfully. 3\. Success notification shown. 4\. BRN-2024-456 displays. 5\. Page reloads. 6\. Registration persists as BRN-2024-456 |  |  |  |
| TS.3.1-05 | FS.3.1-05 | Language Preference Update | 1\. Navigate to language settings. 2\. Change from English to Spanish. 3\. Save preference. 4\. Verify interface is in Spanish (SC). 5\. Reload the page (F5/refresh). 6\. Verify interface remains in Spanish (SC). 7\. Reset to English and Save (SC) | 1\. Language dropdown available. 2\. Selection changes to Spanish. 3\. Save successful. 4\. All UI text shows in Spanish. 5\. Page reloads. 6\. Spanish interface persists 7\. English is restored and persists. |  |  |  |
| TS.3.1-06 | FS.3.1-01, FS.3.1-02 | Empty Company Name Validation | 1\. Click Edit on company name. 2\. Clear the field completely. 3\. Try to save (SC) | 1\. Edit form appears. 2\. Field clears. 3\. Error message "Company name required" |  |  |  |
| TS.3.1-07 | FS.3.1-01 | Creator Permissions Only | 1\. Login as Diego (Creator role), Login as Grady (User Manager) and Julia Smith (External) (Collaborator) 2\. Navigate to Account page. /account | 1\. Site redirects Creator and Collaborator to /documents and the User Manager is redirected to /users |  |  |  |
| TS.3.1-08 | FS.3.1-04, | Upload Company Logo | 1\. Click Edit company info button. 2\. Click Upload Logo. 3\. Select a PNG file (max 512KB). 4\. Save changes. 5\. Verify logo displays on account page (SC). 6\. Reload the page (F5/refresh). 7\. Verify logo still displays (SC) | 1\. Edit modal opens. 2\. File picker opens. 3\. Logo preview shows. 4\. Save successful. 5\. Logo displays on account page. 6\. Page reloads. 7\. Logo persists and displays correctly |  |  |  |
| TS.3.1-09 | FS.3.1-04 | Remove Company Logo | 1\. Click Edit with existing logo. 2\. Click X on logo preview. 3\. Save changes. 4\. Verify no logo displays (SC). 5\. Reload the page (F5/refresh). 6\. Verify logo still absent (SC) | 1\. Edit modal opens with logo. 2\. Logo preview disappears. 3\. Save successful. 4\. No logo shown on page. 5\. Page reloads. 6\. Logo remains removed |  |  |  |
| TS.3.1-10 | FS.3.1-04 | Invalid Logo File Type | 1\. Click Edit company info. 2\. Click Upload Logo. 3\. Try to select a PDF file. 4\. Check error message (SC) | 1\. Edit modal opens. 2\. File picker opens. 3\. PDF file rejected. 4\. Error: "Invalid file type" shown |  |  |  |
| TS.3.1-11 | FS.3.1-04 | Logo File Size Limit | 1\. Click Edit company info. 2\. Click Upload Logo. 3\. Select image larger than 512KB. 4\. Check error message (SC) | 1\. Edit modal opens. 2\. File picker opens. 3\. Large file rejected. 4\. Error: "File size exceeds 2MB" shown |  |  |  |

#### 3.2 Compliance Management

| TS ID | FS ID(s) | Test Name | Test Procedure | Expected Result | Actual Result as Expected (Yes / No / N/A) | Attachments | Pass/Fail |
|-------|----------|-----------|----------------|-----------------|---------------------------------------------|-------------|-----------|
| TS.3.2-01 | FS.3.2-01 | View ERSD Status | 1\. Login as Grady (User Manager). 2\. Navigate to Account \> Compliance. 3\. View ERSD acceptance grid (SC) | 1\. Compliance tab visible. 2\. Grid shows all users. 3\. Acceptance dates displayed |  |  |  |
| TS.3.2-02 | FS.3.2-02 | Default ERSD | 1\. Delete current ERSD 2\.  Edit ERSD to “This is a custom ERSD” and save and reload. Click edit again a check the ERSD saved persists.(SC) | 1\. Default is deleted and default is restored 2\. The custom ERSD shown and persists.  |  |  |  |
| TS.3.2-03 | FS.3.2-03 | Reset ERSD Acceptance | 1\. Select Johanna Lorenz. 2\. Click "Reset ERSD". 3\. Confirm action. 4\. Verify status shows "Not Accepted" (SC). 5\. Reload the page (F5/refresh). 6\. Verify Johanna's status still shows "Not Accepted" (SC) | 1\. Reset button enabled. 2\. Confirmation dialog appears. 3\. Reset completes. 4\. Status changes to "Not Accepted". 5\. Page reloads successfully. 6\. Johanna's ERSD status persists as "Not Accepted" |  |  |  |
| TS.3.2-04 | FS.3.2-04 | Force ERSD Re-acceptance | 1\. Login as Johanna after reset. 2\. See ERSD prompt. 3\. Accept terms. 4\. Verify access granted (SC). 5\. Logout. 6\. Login again as Johanna. 7\. Verify no ERSD prompt appears (SC) | 1\. ERSD agreement displays. 2\. Must accept to continue. 3\. Access granted after acceptance. 4\. System accessible. 5\. Logout successful. 6\. Second login successful. 7\. No ERSD prompt on re-login |  |  |  |
| TS.3.2-05 | FS.3.2-??, FS.3.2-?? | Unauthorized Reset Attempt | 1\. Login as Diego (Creator) and Lee(Collaborator).  2\. Navigate to /users.  | 2\. User redirected to /documents |  |  |  |
| TS.3.2-06 | FS.3.2-04 | ERSD Rejection Handling | 1\. Reset Lee Gu's ERSD. 2\. Login as Lee. 3\. Decline ERSD agreement (SC) | 1\. ERSD prompt appears. 2\. Decline option available. 3\. User cannot get passed ERSD screen even if they enter /documents into url (they are redirected back to ERSD) |  |  |  |
| TS.3.2-07 | FS.3.2-05 | Edit ERSD Text | 1\. Login as Grady (User Manager). 2\. Navigate to Account page. 3\. Click Edit ERSD button. 4\. Modify text to include "Updated ERSD Text". 5\. Save changes. 6\. Open ERSD modal again. 7\. Verify text shows "Updated ERSD Text" (SC). 8\. Reload page (F5/refresh). 9\. Open ERSD modal. 10\. Verify text still shows "Updated ERSD Text" (SC) | 1\. Account page loads. 2\. ERSD edit button visible. 3\. Modal opens with current text. 4\. Text editable. 5\. Save successful. 6\. Modal reopens. 7\. Updated text confirmed. 8\. Page reloads. 9\. Modal opens. 10\. Modified text persists |  |  |  |
| TS.3.2-08 | FS.3.2-05 | ERSD Text Character Count | 1\. Click Edit ERSD button. 2\. Type in text area. 3\. Monitor character count display. 4\. Add text until 1000 chars (SC) | 1\. Modal opens. 2\. Character count shows at bottom. 3\. Count updates as typing. 4\. Shows "1000 characters" |  |  |  |
| TS.3.2-09 | FS.3.2-05 | Cancel ERSD Text Edit | 1\. Click Edit ERSD button. 2\. Modify the text. 3\. Click Cancel. 4\. Open modal again. 5\. Verify original text (SC) | 1\. Modal opens. 2\. Text modified. 3\. Modal closes. 4\. Modal reopens. 5\. Original text unchanged |  |  |  |
| TS.3.2-10 | FS.3.2-06 | Enable Digital Signatures | 1\. Login as Megan (Administrator). 2\. Navigate to Account page. 3\. Toggle Digital Signatures switch ON. 4\. Verify switch shows ON state (SC). 5\. Reload page (F5/refresh). 6\. Verify switch still shows ON (SC) | 1\. Account page loads. 2\. Digital signatures switch visible. 3\. Switch toggles to ON. 4\. Switch shows enabled state. 5\. Page reloads. 6\. Switch remains ON |  |  |  |
| TS.3.2-11 | FS.3.2-06 | Disable Digital Signatures | 1\. With signatures enabled. 2\. Toggle switch OFF. 3\. Verify switch shows OFF state (SC). 4\. Reload page (F5/refresh). 5\. Verify switch still shows OFF (SC) | 1\. Switch currently ON. 2\. Switch toggles to OFF. 3\. Switch shows disabled state. 4\. Page reloads. 5\. Switch remains OFF |  |  |  |

#### 3.3 License Management

| TS ID | FS ID(s) | Test Name | Test Procedure | Expected Result | Actual Result as Expected (Yes / No / N/A) | Attachments | Pass/Fail |
|-------|----------|-----------|----------------|-----------------|---------------------------------------------|-------------|-----------|
| TS.3.3-01 | FS.3.3-01 | View Trial Status | 1\. Login as Megan (Trial Admin). 2\. Navigate to License section. 3\. Check trial countdown (SC) | 1\. License tab available. 2\. Shows "Trial \- X days remaining". 3\. Countdown accurate |  |  |  |
| TS.3.3-02 | FS.3.3-02 | Azure Marketplace Link | 1\. Click "Upgrade Now". 2\. Select Azure Marketplace. 3\. Verify redirect (SC) | 1\. Upgrade button visible. 2\. Azure option available. 3\. Redirects to marketplace |  |  |  |
| TS.3.3-03 | FS.3.3-03 | Stripe Payment Option | 1\. Click "Upgrade Now". 2\. Select Stripe payment. 3\. Enter test card (SC) | 1\. Stripe option available. 2\. Payment form loads. 3\. Test payment processes |  |  |  |
| TS.3.3-04 | FS.3.3-04 | View Active License | 1\. Complete test payment. 2\. Return to License tab. 3\. Check status (SC) | 1\. Payment confirmed. 2\. Status shows "Active". 3\. No expiration warnings |  |  |  |
| TS.3.3-05 | FS.3.3-05 | Trial Expiration Warning | 1\. Use system with 1 day left, login with Megan Bowen, view warning banner (SC) | 1.Banner shows between 1 and 14 days remaining, and Upgrade link provided |  |  |  |
| TS.3.3-06 | FS.3.3-02 | Post-Trial Access Block | 1\. Change the expiry time of account to yesterday. 2\. Login as Diego. 3\. Try accessing documents (SC) | 1\. Login succeeds. 2\. Access blocked message. 3\. Only upgrade options available |  |  |  |

#### 3.4 Azure Infrastructure Display

| TS ID | FS ID(s) | Test Name | Test Procedure | Expected Result | Actual Result as Expected (Yes / No / N/A) | Attachments | Pass/Fail |
|-------|----------|-----------|----------------|-----------------|---------------------------------------------|-------------|-----------|
| TS.3.4-01 | FS.3.4-01 | View Cosmos DB Details | 1\. Login as Megan (Admin). 2\. View CosmosDB panel (SC). | 1\. CosmosDB tab visible. 2\. Shows database id \<tenant name\>-MS-Cosmos-db. Note: Megan’s tenant name is 17nj5d |  |  |  |
| TS.3.4-02 | FS.3.4-02 | View Blob Storage Info | 1\. Scroll to Blob Storage section. 2\. Check container name. (SC) | 1\. Blob Storage section visible. 2\. Container name shown. (\<tenant name\>-MS-Azure-blob) Note: Megan’s tenant name is 17nj5d  |  |  |  |

#### 3.5 Negative and Edge Case Tests

| TS ID | FS ID(s) | Test Name | Test Procedure | Expected Result | Actual Result as Expected (Yes / No / N/A) | Attachments | Pass/Fail |
|-------|----------|-----------|----------------|-----------------|---------------------------------------------|-------------|-----------|
| TS.3.5-01 | FS.3.1-02 | SQL Injection in Company Name | 1\. Edit company name. 2\. Enter SQL injection payload (DROP TABLE). 3\. Save changes. 4\. Verify payload saved as plain text (SC). 5\. Reload page (F5/refresh). 6\. Verify text still shows as plain text, no execution (SC) | 1\. Input accepted. 2\. Save successful. 3\. Payload displays as literal text. 4\. No database errors. 5\. Page reloads. 6\. SQL text persists without execution |  |  |  |
| TS.3.5-02 | FS.3.1-03 | XSS in Address Field | 1\. Edit address. 2\. Enter script tags with JavaScript alert. 3\. Save changes. 4\. Verify script shows as plain text (SC). 5\. Reload page (F5/refresh). 6\. Verify script still shows as text, no execution (SC) | 1\. Input accepted. 2\. Save successful. 3\. Script displays as text. 4\. No JavaScript execution. 5\. Page reloads. 6\. Script remains as plain text |  |  |  |
| TS.3.5-03 | FS.3.2-03 | Concurrent ERSD Reset | 1\. Two User Managers open same user. 2\. Both click Reset simultaneously. 3\. Check result (SC) | 1\. Both attempts process. 2\. One succeeds, one fails gracefully. 3\. No data corruption |  |  |  |
| TS.3.5-04 | FS.3.3-03 | Payment During Trial End | 1\. Start payment at 23:59 on last day. 2\. Complete after midnight. 3\. Check license status (SC) | 1\. Payment processes. 2\. License activates properly. 3\. No trial expiration block |  |  |  |



## 4. ANALYTICS

Save all the playwright scripts in docufen\_client/playwright/tests/4.Analytics

### 4.1 Page Metrics

| TS ID | FS ID(s) | Test Name | Test Procedure | Expected Result | Actual Result as Expected (Yes / No / N/A) | Attachments | Pass/Fail |
|-------|----------|-----------|----------------|-----------------|---------------------------------------------|-------------|-----------|
| TS.4.1-01 | FS.4.1-01 | View Page Count Totals | 1\. Login as Megan (Administrator). 2\. Navigate to Analytics \> Page Metrics. 3\. View total pages by category (SC) | 1\. Analytics page loads. 2\. Shows total document pages. 3\. Shows attachment and audit trail pages |  |  |  |
| TS.4.1-02 | FS.4.1-01 | Category Breakdown | 1\. View page metrics dashboard. 2\. Check document pages breakdown. 3\. Verify Pre-Approval, Execution, Post-Approval, Closed counts (SC) | 1\. Dashboard shows categories. 2\. Document pages split by stage. 3\. All stage counts visible |  |  |  |
| TS.4.1-03 | FS.4.1-02 | Filter Last 7 Days | 1\. Click time tab. 2\. Select "Last 7 days". 3\. Verify metrics update (SC) | 1\. Last 7 day tab. 2\. Selection changes to 7 days. 3\. All metrics refresh for 7-day period |  |  |  |
| TS.4.1-04 | FS.4.1-02 | Filter Last 30 Days | 1\. Change filter to "Last 30 days". 2\. Verify counts increase. 3\. Check chart updates (SC) | 1\. Filter changes to 30 days. 2\. Page counts ≥ 7-day counts. 3\. Chart shows 30-day data |  |  |  |
| TS.4.1-05 | FS.4.1-02 | Filter Last 90 Days | 1\. Select "Last 90 days". 2\. Verify extended date range. 3\. Check all metrics update (SC) | 1\. Filter set to 90 days. 2\. Date range shows 3 months. 3\. Metrics reflect 90-day totals |  |  |  |
| TS.4.1-06 | FS.4.1-03 | Stacked Area Chart | 1\. View usage chart. 2\. Hover over data points. 3\. Verify tooltip shows daily breakdown (SC) | 1\. Chart displays correctly. 2\. Hover shows details. 3\. Tooltip shows docs/attachments/audit counts |  |  |  |
| TS.4.1-07 | FS.4.1-04 | Month Selector | 1\. Click month dropdown. 2\. View available months. 3\. Select specific month (SC) | 1\. Dropdown shows months with data. 2\. "All Time" option visible. 3\. Selection updates all metrics |  |  |  |
| TS.4.1-08 | FS.4.1-04 | All Time View | 1\. Select "All Time" from dropdown. 2\. Verify complete history shown. 3\. Check total counts (SC) | 1\. All Time selected. 2\. Shows data from account creation. 3\. Highest page counts displayed |  |  |  |
|  |  |  |  |  |  |  |  |
| TS.4.1-09 | FS.4.1-01 | Attachment Type Counts | 1\. Create document with mixed attachments. 2\. Add 2 images, 1 PDF (3 pages), 1 video. 3\. Check attachment count \= 5 pages (SC) | 1\. Document created. 2\. Attachments uploaded. 3\. Metrics show 5 attachment pages |  |  |  |

### 4.2 Billing Transactions

| TS ID | FS ID(s) | Test Name | Test Procedure | Expected Result | Actual Result as Expected (Yes / No / N/A) | Attachments | Pass/Fail |
|-------|----------|-----------|----------------|-----------------|---------------------------------------------|-------------|-----------|
| TS.4.2-01 | FS.4.2-01 | Transaction Log Display | 1\. Navigate to Analytics \> Billing. 2\. View transaction table. 3\. Check columns displayed (SC) | 1\. Billing tab loads. 2\. Table shows all transactions. 3\. Columns: timestamp, document, category, user, type, pages |  |  |  |
| TS.4.2-02 | FS.4.2-01 | UTC Timestamp Format | 1\. View transaction timestamps. 2\. Verify format. 3\. Check date/time display (SC) | 1\. Timestamps visible. 2\. Shows in local timezone. 3\. Format: DD-MMM-YYY HH:MM:SS (locale dependently) |  |  |  |
| TS.4.2-03 | FS.4.2-02 | Document Name Search | 1\. Type "Protocol" in search. 2\. View filtered results. 3\. Verify only matching documents (SC) | 1\. Search field accepts input. 2\. Table filters in real-time. 3\. Only "Protocol" documents shown |  |  |  |
| TS.4.2-04 | FS.4.2-02 | Search Clear | 1\. Clear search field. 2\. Verify all transactions return. 3\. Check pagination reset (SC) | 1\. Search cleared. 2\. Full transaction list restored. 3\. Returns to page 1 |  |  |  |
| TS.4.2-05 | FS.4.2-03 | Date Range Filter | 1\. Set start date to last week. 2\. Set end date to today. 3\. Apply filter and verify results (SC) | 1\. Date pickers functional. 2\. Range selected. 3\. Only transactions in range shown |  |  |  |
| TS.4.2-06 | FS.4.2-03 | Filter Persistence | 1\. Apply date filter. 2\. Navigate pages. 3\. Verify filter remains active (SC) | 1\. Filter applied. 2\. Pagination works. 3\. Date filter persists across pages |  |  |  |
| TS.4.2-07 | FS.4.2-04 | CSV Export All | 1\. Clear all filters. 2\. Click "Export to CSV". 3\. Verify file downloads (SC) | 1\. No filters active. 2\. Export button clicked. 3\. CSV file downloads with all transactions |  |  |  |
| TS.4.2-08 | FS.4.2-04 | CSV Export Filtered | 1\. Apply search and date filters. 2\. Export to CSV. 3\. Open file and verify filtered data (SC) | 1\. Filters applied. 2\. Export successful. 3\. CSV contains only filtered records |  |  |  |
| TS.4.2-09 | FS.4.2-05 | User Attribution | 1\. View transaction user column. 2\. Verify shows initials. 3\. Hover for full name (SC) | 1\. User column visible. 2\. Shows user initials (e.g., MB). 3\. Tooltip shows "Megan Bowen" |  |  |  |
| TS.4.2-10 | FS.4.2-01 | Pagination Controls | 1\. View table with 20+ transactions. 2\. Navigate to page 2\. 3\. Change rows per page to 50 (SC) | 1\. Pagination controls visible. 2\. Page 2 loads correctly. 3\. Table shows 50 rows |  |  |  |

### 4.3 ROI Analytics

| TS ID | FS ID(s) | Test Name | Test Procedure | Expected Result | Actual Result as Expected (Yes / No / N/A) | Attachments | Pass/Fail |
|-------|----------|-----------|----------------|-----------------|---------------------------------------------|-------------|-----------|
| TS.4.3-01 | FS.4.3-01 | Configure Paper Cost | 1\. Navigate to ROI Analytics. 2\. Click "Set Paper Cost". 3\. Enter $0.10 per page. 4\. Save (SC) | 1\. ROI tab loads. 2\. Modal opens. 3\. Accepts 0.10 value. 4\. Cost saved and displayed |  |  |  |
| TS.4.3-02 | FS.4.3-01 | Validate Positive Numbers | 1\. Open paper cost modal. 2\. Try entering \-5. 3\. Try entering 0\. 4\. Check validation (SC) | 1\. Modal opens. 2\. Negative rejected. 3\. Zero rejected. 4\. Error: "Must be positive number" |  |  |  |
| TS.4.3-03 | FS.4.3-02 | Tiered Pricing Display | 1\. View pricing tiers section. 2\. Check all tier thresholds. 3\. Verify current tier highlighted (SC) | 1\. Tiers displayed. 2\. Shows 0-1000, 1001-5000, 5001-10000, 10001-20000 and 20001+. 3\. Current usage tier highlighted |  |  |  |
| TS.4.3-04 | FS.4.3-03 | Savings Calculation | 1\. Set paper cost $3.00. 2\. Process 1000 pages (tier 1: $0.79). 3\. Verify savings \= $1210 (SC) | 1\. Paper cost set. 2\. Usage shows 1000 pages. 3\. Savings: ($3.00 \- $0.79) × 1000 \= $1210 |  |  |  |
| TS.4.3-05 | FS.4.3-04 | ROI Percentage | 1\. With above costs. 2\. Check ROI percentage. 3\. Verify calculation (SC) | 1\. Costs configured. 2\. ROI displayed. 3\. Shows 280% (2210/790 × 100\) for 1000 pages |   |  |  |
| TS.4.3-06 | FS.4.3-05 | Investment Input | 1\. Click "Track Investment". 2\. Enter $5000. 3\. Save and verify display (SC) | 1\. Investment modal opens. 2\. Accepts 5000\. 3\. Investment amount displayed |  |  |  |
| TS.4.3-07 | FS.4.3-06 | Break-Even Chart | 1\. With investment and savings. 2\. View break-even chart. 3\. Verify intersection point (SC) | 1\. Chart displays. 2\. Shows savings vs investment lines. 3\. Break-even point marked |  |  |  |
| TS.4.3-08 | FS.4.3-06 | 3-Year Projection | 1\. View card. 2 Check accurately calculates return. 3\. Verify cumulative savings (SC) | 1\. Card shows 3 years. 2.return . 3\. Savings line continues upward |  |  |  |
| TS.4.3-09 | FS.4.3-08 | Month Selection Required | 1\. Try selecting "All Time". 2\. Verify disabled for ROI. 3\. Select specific month (SC) | 1\. All Time option present. 2\. Disabled/unselectable. 3\. Must select actual month |  |  |  |
| TS.4.3-10 | FS.4.3-07 | Tier Transition | 1.Select January. 2\. Select Feb 2025\. 3\. Select Mar 2025 4\. Select Apr. 5\. Select May:  Verify rates for each. 6\. Check ROI updates (SC) | 1\. Rate shows 0.79. 2\. Rate shows 0.67. 3\. Rate shows 0.59 4\. Rate shows 0.51 5\. Rate shows 0.41 6\. ROIs are correct |   |  |  |

### 4.4 Negative and Edge Case Tests

| TS ID | FS ID(s) | Test Name | Test Procedure | Expected Result | Actual Result as Expected (Yes / No / N/A) | Attachments | Pass/Fail |
|-------|----------|-----------|----------------|-----------------|---------------------------------------------|-------------|-----------|
| TS.4.4-01 | FS.4.1-01 | No Data Empty State | 1\. Create new tenant with no documents. 2\. Navigate to Page Metrics. 3\. Verify empty state display. 4\. Check chart shows no data message (SC) | 1\. Clean tenant created. 2\. Page Metrics loads. 3\. Shows "No page data available" message. 4\. Chart displays "Start creating documents to see metrics" |  |  |  |
| TS.4.4-02 | FS.4.2-02 | SQL Injection in Search | 1\. Search for "'; DROP TABLE--". 2\. Search for "1' OR '1'='1". 3\. Verify no SQL execution. 4\. Check results filtered correctly (SC) | 1\. Search processed safely. 2\. No SQL injection. 3\. Shows no results. 4\. Search works as text only |  |  |  |
| TS.4.4-03 | FS.4.3-01 | Negative Cost Validation | 1\. Set paper cost modal. 2\. Enter "-10". 3\. Try to save. 4\. Enter "0" and verify (SC) | 1\. Modal opens. 2\. Negative value entered. 3\. Error "Must be positive". 4\. Zero also shows error |  |  |  |
| TS.4.4-04 | FS.4.2-04 | Empty CSV Export | 1\. Filter to show no results. 2\. Click Export CSV. 3\. Open downloaded file. 4\. Verify headers present (SC) | 1\. No transactions shown. 2\. CSV downloads. 3\. File contains headers only. 4\. Valid CSV structure |  |  |  |
| TS.4.4-05 | FS.4.3-04 | Division by Zero ROI | 1\. Set paper cost = $0.79. 2\. Current tier also $0.79. 3\. Check ROI calculation. 4\. Verify no infinity/NaN (SC) | 1\. Same costs entered. 2\. No savings (0%). 3\. ROI shows "0%". 4\. No calculation errors |  |  |  |
| TS.4.4-06 | FS.4.1-01, RS.39 | Non-Admin Access Denied | 1\. Login as Diego (Creator). 2\. Try navigate to /billing. 3\. Check redirect. 4\. Try direct URL access (SC) | 1\. Creator logged in. 2\. No Analytics menu item. 3\. Redirects to /documents. 4\. Direct URL also redirects |  |  |  |


## 5. USERS

### 5.1 User List Management

| TS ID | FS ID(s) | Test Name | Test Procedure | Expected Result | Actual Result as Expected (Yes / No / N/A) | Attachments | Pass/Fail |
|-------|----------|-----------|----------------|-----------------|---------------------------------------------|-------------|-----------|
| TS.5.1-01 | FS.5.1-01 | User Status Filtering | 1. Login as Grady (User Manager). 2. Navigate to Users page. 3. View All Users tab count. 4. Click Internal tab and verify count. 5. Click External tab and verify count. 6. Click Signature Pending tab. 7. Click Deactivated tab (SC) | 1. Users page loads. 2. All tabs visible with counts. 3. All Users shows total count. 4. Internal shows only 17nj5d users. 5. External shows xmwkb users. 6. Signature Pending shows unverified users. 7. Deactivated shows inactive users | | | |
| TS.5.1-02 | FS.5.1-02 | User Search | 1. In search box, type "Diego". 2. Verify results filter. 3. Clear and search "17nj5d". 4. Clear and search "DS" (initials). 5. Search non-existent user "xyz" (SC) | 1. Search box accepts input. 2. Shows only Diego Siciliani. 3. Shows all 17nj5d.onmicrosoft.com users. 4. Shows users with DS initials. 5. Shows "No users found" message | | | |
| TS.5.1-03 | FS.5.1-03 | Pagination Controls | 1. With 10+ users, check default 10 per page. 2. Change to 5 rows per page. 3. Navigate to page 2. 4. Change to 20 rows per page. 5. Verify all users now on page 1 (SC) | 1. Shows 10 users by default. 2. Shows only 5 users. 3. Page 2 loads next 5 users. 4. Shows up to 20 users. 5. Pagination disappears if all fit | | | |
| TS.5.1-04 | FS.5.1-04 | External User Identification | 1. View user list with Julia (xmwkb). 2. Verify External badge shown. 3. Check company name displays. 4. Expand row for full details (SC) | 1. Julia shows in list. 2. "External" badge visible. 3. Shows "Biotech XMWKB" company. 4. Expanded view shows tenant details | | | |
| TS.5.1-05 | FS.5.1-05 | User Activity Access | 1. Click on Charlotte (xmwkb user). 2. Expand row details. 3. Click "Audit Trail" button. 4. View activity history. 5. Check Created tab (SC) | 1. Row expands on click. 2. Audit Trail button visible. 3. Modal opens with activity. 4. Shows all user actions. 5. Created tab shows documents created | | | |

### 5.2 User Creation and Invitation

| TS ID | FS ID(s) | Test Name | Test Procedure | Expected Result | Actual Result as Expected (Yes / No / N/A) | Attachments | Pass/Fail |
|-------|----------|-----------|----------------|-----------------|---------------------------------------------|-------------|-----------|
| TS.5.2-01 | FS.5.2-01 | User Information Capture | 1. Click "Add New User" button. 2. Enter "Test User" in Legal Name. 3. Verify initials auto-generate to "TU". 4. Change name to "John Paul Smith". 5. Verify initials update to "JPS" (SC) | 1. Modal opens. 2. Name field accepts input. 3. Initials show "TU" automatically. 4. Name updates. 5. Initials limited to 3 chars "JPS" | | | |
| TS.5.2-02 | FS.5.2-02 | Role Assignment Control | 1. As Grady (User Manager), open Add User. 2. Check role dropdown options. 3. Verify no Administrator roles. 4. Login as Megan (Trial Admin). 5. Check all roles available (SC) | 1. Modal opens. 2. Dropdown shows roles. 3. Only Creator/Collaborator shown. 4. Login successful. 5. All 5 roles available to select | | | |
| TS.5.2-03 | FS.5.2-03 | External User Support | 1. Enter email "test@external.com". 2. Company field becomes visible. 3. Enter "External Corp". 4. Save user. 5. Verify External badge in list (SC) | 1. Email accepted. 2. Company field appears. 3. Company name accepted. 4. User created successfully. 5. Shows as External user | | | |
| TS.5.2-04 | FS.5.2-04 | Document Access Permission | 1. In Add User modal, locate toggle. 2. Verify "View All Documents" OFF default. 3. Toggle ON. 4. Save user. 5. Check user can view all docs (SC) | 1. Toggle visible in form. 2. Default state is OFF. 3. Toggle switches to ON. 4. User created. 5. User sees all documents | | | |
| TS.5.2-05 | FS.5.2-05 | Email Validation | 1. Try email "invalid-email". 2. Try "TEST@EXAMPLE.COM". 3. Enter "test@example.com". 4. Try to create duplicate email (SC) | 1. Shows "Invalid email" error. 2. Accepts and converts to lowercase. 3. Email valid. 4. Error "User already exists" | | | |
| TS.5.2-06 | FS.5.2-06 | Invitation Status Assignment | 1. Create new user successfully. 2. Check status in user list. 3. Verify shows "Invited". 4. Have user login. 5. Check status changes to "Active" (SC) | 1. User created. 2. Appears in list. 3. Status shows "Invited". 4. User logs in successfully. 5. Status updates to "Active" | | | |

### 5.3 User Role Management

| TS ID | FS ID(s) | Test Name | Test Procedure | Expected Result | Actual Result as Expected (Yes / No / N/A) | Attachments | Pass/Fail |
|-------|----------|-----------|----------------|-----------------|---------------------------------------------|-------------|-----------|
| TS.5.3-01 | FS.5.3-01 | Self-Demotion Prevention | 1. Login as Megan (Trial Admin). 2. Navigate to Users, find self. 3. Click edit on own account. 4. Try to change role to Creator. 5. Verify can only switch to Site Admin (SC) | 1. Login successful. 2. Own account visible. 3. Edit modal opens. 4. Creator option disabled. 5. Only Site Admin selectable | | | |
| TS.5.3-02 | FS.5.3-02 | User Manager Role Restrictions | 1. Login as Grady (User Manager). 2. Try to edit Megan (Admin). 3. Verify edit disabled. 4. Edit Diego (Creator). 5. Verify cannot promote to Admin (SC) | 1. Login successful. 2. No edit option for Admin. 3. Edit blocked with message. 4. Edit modal opens. 5. Admin roles not in dropdown | | | |
| TS.5.3-03 | FS.5.3-03 | Role Hierarchy Enforcement | 1. As Megan, view capabilities list. 2. Change Henrietta to Site Admin. 3. Verify loses document access. 4. Change to User Manager. 5. Verify only user management access (SC) | 1. Full capabilities shown. 2. Role changes successfully. 3. Document menu items hidden. 4. Role updated. 5. Only Users menu visible | | | |
| TS.5.3-04 | FS.5.3-04 | Role Change Audit | 1. Change Lee from Collaborator to Creator. 2. Open Lee's audit trail. 3. Find role change entry. 4. Verify shows old/new role. 5. Check modifier identity (SC) | 1. Role updated successfully. 2. Audit trail opens. 3. Role change logged. 4. Shows "Collaborator → Creator". 5. Shows "Changed by Grady A" | | | |
| TS.5.3-05 | FS.5.3-05 | User Deactivation | 1. Edit Johanna's account. 2. Toggle status to Deactivated. 3. Save changes. 4. Verify in Deactivated tab. 5. Check audit trail preserved (SC) | 1. Edit modal opens. 2. Status toggle available. 3. Changes saved. 4. Shows in Deactivated filter. 5. Full history still accessible | | | |

### 5.4 Digital Signature Verification

| TS ID | FS ID(s) | Test Name | Test Procedure | Expected Result | Actual Result as Expected (Yes / No / N/A) | Attachments | Pass/Fail |
|-------|----------|-----------|----------------|-----------------|---------------------------------------------|-------------|-----------|
| TS.5.4-01 | FS.5.4-01 | Signature Image Upload | 1. Click "Verify Digital Signature" for Diego. 2. Select "Image Upload" method. 3. Upload PNG signature file. 4. Save verification. 5. Check status updated (SC) | 1. Modal opens. 2. Three methods shown. 3. File uploads successfully. 4. Verification saved. 5. Status shows "Verified" | | | |
| TS.5.4-02 | FS.5.4-02 | Register Notation Entry | 1. Verify Henrietta's signature. 2. Select "Register Notation". 3. Enter "Register Page 45, Entry 3". 4. Save notation. 5. View verification details (SC) | 1. Modal opens. 2. Text field appears. 3. Notation accepted. 4. Verification saved. 5. Shows notation in details | | | |
| TS.5.4-03 | FS.5.4-03 | Microsoft ID Verification | 1. Verify Charlotte's signature. 2. Select "Microsoft User ID". 3. Confirm Azure AD details shown. 4. Save verification. 5. Check linked to MS identity (SC) | 1. Modal opens. 2. MS option available. 3. Shows tenant/object ID. 4. Verification saved. 5. Shows "MS Verified" | | | |
| TS.5.4-04 | FS.5.4-04 | Verification Recording | 1. View verified user details. 2. Check verifier identity shown. 3. Check timestamp displayed. 4. Check method recorded. 5. Verify in audit trail (SC) | 1. Details expand. 2. Shows "Verified by Grady A". 3. Shows date/time. 4. Shows verification method. 5. Audit log entry created | | | |
| TS.5.4-05 | FS.5.4-05 | Signature Revocation | 1. Open verified user (Diego). 2. Click "Revoke Verification". 3. Confirm revocation. 4. Check status cleared. 5. Verify cannot sign docs (SC) | 1. Verification details shown. 2. Revoke button available. 3. Confirmation required. 4. Status shows "Not Verified". 5. Signing disabled in documents | | | |
| TS.5.4-06 | FS.5.4-06 | Signing Permission Control | 1. Login as unverified user (Lee). 2. Open document for signing. 3. Try to add signature. 4. Get verified by Grady. 5. Retry signing (SC) | 1. Login successful. 2. Document opens. 3. "Signature not verified" message. 4. Verification complete. 5. Can now sign document | | | |

### 5.5 User Information Management

| TS ID | FS ID(s) | Test Name | Test Procedure | Expected Result | Actual Result as Expected (Yes / No / N/A) | Attachments | Pass/Fail |
|-------|----------|-----------|----------------|-----------------|---------------------------------------------|-------------|-----------|
| TS.5.5-01 | FS.5.5-01 | User Details Modification | 1. Edit Johanna's profile. 2. Change name to "Johanna M Lorenz". 3. Update initials to "JML". 4. Try to change email. 5. Save changes (SC) | 1. Edit modal opens. 2. Name field editable. 3. Initials update. 4. Email field read-only. 5. Changes saved successfully | | | |
| TS.5.5-02 | FS.5.5-02 | ERSD Agreement Reset | 1. As User Manager, edit Lee. 2. Click "Reset ERSD". 3. Confirm reset action. 4. Have Lee login. 5. Verify ERSD prompt appears (SC) | 1. Edit modal opens. 2. Reset ERSD button visible. 3. Confirmation required. 4. Login shows ERSD. 5. Must accept to continue | | | |
| TS.5.5-03 | FS.5.5-03 | Microsoft Tenant Display | 1. View Diego's expanded details. 2. Check MS Tenant Name shown. 3. Verify shows "17nj5d". 4. Check Azure Object ID visible. 5. Verify fields read-only (SC) | 1. Details expand. 2. Tenant field visible. 3. Shows correct tenant. 4. Object ID displayed. 5. Fields not editable | | | |
| TS.5.5-04 | FS.5.5-04 | Modification Tracking | 1. Change Ethan's name. 2. Update role to Creator. 3. Save changes. 4. Open audit trail. 5. Verify both changes logged (SC) | 1. Name updated. 2. Role changed. 3. Save successful. 4. Audit trail shows entries. 5. Shows old/new values for each | | | |

### 5.6 Negative and Edge Case Tests

| TS ID | FS ID(s) | Test Name | Test Procedure | Expected Result | Actual Result as Expected (Yes / No / N/A) | Attachments | Pass/Fail |
|-------|----------|-----------|----------------|-----------------|---------------------------------------------|-------------|-----------|
| TS.5.6-01 | FS.5.2-01 | Empty Required Fields | 1. Click Add New User. 2. Leave Legal Name empty. 3. Enter only email. 4. Try to save (SC) | 1. Modal opens. 2. Name field empty. 3. Email entered. 4. Error "Legal name required" | | | |
| TS.5.6-02 | FS.5.2-01 | Special Characters in Name | 1. Enter name "Test<script>alert()</script>". 2. Enter valid email. 3. Save user. 4. View in list (SC) | 1. Name accepted. 2. Email valid. 3. User created. 4. Script shown as plain text | | | |
| TS.5.6-03 | FS.5.4-01 | Oversized Image Upload | 1. Try uploading 10MB image. 2. Check error message. 3. Upload 4.9MB image. 4. Verify success (SC) | 1. Upload rejected. 2. "File exceeds 5MB" error. 3. File accepted. 4. Verification saved | | | |
| TS.5.6-04 | FS.5.1-02 | Search Performance | 1. Create 100 test users. 2. Search for specific user. 3. Measure response time. 4. Clear and search again (SC) | 1. Users created. 2. Results appear < 1 second. 3. Performance acceptable. 4. Search remains responsive | | | |
| TS.5.6-05 | FS.5.3-02 | Concurrent Role Updates | 1. Two User Managers open same user. 2. Both try to change role. 3. Save simultaneously. 4. Check final state (SC) | 1. Both can edit. 2. Changes made. 3. One succeeds, one fails. 4. Appropriate error shown | | | |


## 6. DOCUMENTS

### 6.1 Document List Management

| TS ID | FS ID(s) | Test Name | Test Procedure | Expected Result | Actual Result as Expected (Yes / No / N/A) | Attachments | Pass/Fail |
|-------|----------|-----------|----------------|-----------------|---------------------------------------------|-------------|-----------|
| TS.6.1-01 | FS.6.1-01 | Document Access Control | 1. Login as Diego (Creator). 2. Navigate to Documents page. 3. View document list. 4. Login as Henrietta with "View All Docs" enabled. 5. Toggle to "Everyone's Documents" (SC) | 1. Documents page loads. 2. Shows only Diego's owned/shared docs. 3. Document count shown. 4. Henrietta logged in. 5. Shows all organization documents | | | |
| TS.6.1-02 | FS.6.1-02 | Workflow Status Filtering | 1. View All Documents tab. 2. Click Pre-Approval tab and note count. 3. Click Execution tab. 4. Click Post-Approval tab. 5. Click Completed tab. 6. Click Final PDF tab. 7. Click Voided tab (SC) | 1. All documents shown. 2. Only Pre-Approval stage docs. 3. Only Execution stage docs. 4. Only Post-Approval docs. 5. Only Completed docs. 6. Only finalized PDFs. 7. Only voided documents | | | |
| TS.6.1-03 | FS.6.1-03 | Document Search | 1. In search box, type "Protocol". 2. Verify results update. 3. Clear and search "EXT-2024". 4. Clear and search by owner "Diego". 5. Search non-existent "xyz123" (SC) | 1. Search accepts input. 2. Shows only Protocol documents. 3. Shows docs with EXT-2024 reference. 4. Shows Diego's documents. 5. Shows "No documents found" | | | |
| TS.6.1-04 | FS.6.1-04 | Access Toggle | 1. Login as user with canAccessAllDocuments. 2. Default shows "My Documents". 3. Click toggle to "Everyone's Documents". 4. Verify document count increases. 5. Toggle back to "My Documents" (SC) | 1. Toggle visible in UI. 2. Shows personal documents only. 3. Toggle switches successfully. 4. Shows all org documents. 5. Returns to personal view | | | |
| TS.6.1-05 | FS.6.1-05 | Document Status Display | 1. Create docs in each stage. 2. View Pre-Approval doc (orange icon). 3. View Execution doc (blue icon). 4. View Post-Approval (purple icon). 5. View Completed (green icon). 6. View Voided (red icon) (SC) | 1. Documents created. 2. Orange status indicator. 3. Blue status indicator. 4. Purple status indicator. 5. Green status indicator. 6. Red void indicator | | | |

### 6.2 Document Information Management

| TS ID | FS ID(s) | Test Name | Test Procedure | Expected Result | Actual Result as Expected (Yes / No / N/A) | Attachments | Pass/Fail |
|-------|----------|-----------|----------------|-----------------|---------------------------------------------|-------------|-----------|
| TS.6.2-01 | FS.6.2-01 | Document Details Editing | 1. Open document owned by Diego. 2. Click edit document info. 3. Change name to "Updated Protocol v2". 4. Change external ref to "EXT-2025-001". 5. Change category to "validation". 6. Verify ID unchanged (SC) | 1. Document opens. 2. Edit dialog appears. 3. Name field editable. 4. External ref editable. 5. Category updates. 6. Document ID remains same | | | |
| TS.6.2-02 | FS.6.2-02 | Owner Management | 1. As Diego, edit own document. 2. Click "Add Owner" button. 3. Select Henrietta as co-owner. 4. Save changes. 5. Login as Henrietta and verify full access (SC) | 1. Edit dialog opens. 2. Owner section visible. 3. User selector shows. 4. Owner added successfully. 5. Henrietta can edit document | | | |
| TS.6.2-03 | FS.6.2-03 | Role-Based Edit Restrictions | 1. Login as Johanna (Collaborator). 2. Try to edit document info. 3. Login as Grady (Site Admin). 4. Try to edit document. 5. Verify edit disabled (SC) | 1. Johanna logged in. 2. No edit button visible. 3. Grady logged in. 4. Edit option not available. 5. Appropriate role message shown | | | |
| TS.6.2-04 | FS.6.2-04 | Final PDF Access | 1. Navigate to Final PDF tab. 2. Open finalized document. 3. Click "Download PDF" button. 4. Verify PDF contains document. 5. Check audit trail included (SC) | 1. Final PDFs listed. 2. Document details shown. 3. PDF downloads. 4. Document content present. 5. Complete audit trail in PDF | | | |

### 6.3 Document Deletion Controls

| TS ID | FS ID(s) | Test Name | Test Procedure | Expected Result | Actual Result as Expected (Yes / No / N/A) | Attachments | Pass/Fail |
|-------|----------|-----------|----------------|-----------------|---------------------------------------------|-------------|-----------|
| TS.6.3-01 | FS.6.3-01 | Admin-Only Deletion | 1. Login as Diego (Creator). 2. Open own finalized document. 3. Verify no delete option. 4. Login as Megan (Admin). 5. Verify delete button visible (SC) | 1. Creator logged in. 2. Document opens. 3. No delete button shown. 4. Admin logged in. 5. Delete button available | | | |
| TS.6.3-02 | FS.6.3-02 | Finalized State Requirement | 1. As Megan, open Pre-Approval doc. 2. Check for delete option. 3. Open Execution stage doc. 4. Check for delete option. 5. Open Final PDF doc. 6. Verify delete available (SC) | 1. Pre-Approval doc opens. 2. No delete option. 3. Execution doc opens. 4. No delete option. 5. Finalized doc opens. 6. Delete button visible | | | |
| TS.6.3-03 | FS.6.3-03 | Compliance Warning Display | 1. Click delete on finalized doc. 2. Read criminal offense warning. 3. Try to proceed without checkbox. 4. Check confirmation box. 5. Complete deletion (SC) | 1. Delete dialog opens. 2. Warning text displayed. 3. Delete button disabled. 4. Checkbox enables button. 5. Document deleted successfully | | | |

### 6.4 Negative and Edge Case Tests

| TS ID | FS ID(s) | Test Name | Test Procedure | Expected Result | Actual Result as Expected (Yes / No / N/A) | Attachments | Pass/Fail |
|-------|----------|-----------|----------------|-----------------|---------------------------------------------|-------------|-----------|
| TS.6.4-01 | FS.6.1-03 | Search Injection Test | 1. Search for "<script>alert()</script>". 2. Search for "'; DROP TABLE". 3. Verify no execution. 4. Check results display (SC) | 1. Search accepts text. 2. No SQL execution. 3. Scripts shown as text. 4. Safe error handling | | | |
| TS.6.4-02 | FS.6.2-01 | Empty Document Name | 1. Edit document info. 2. Clear name field completely. 3. Try to save. 4. Check validation error (SC) | 1. Edit dialog opens. 2. Name cleared. 3. Save disabled/fails. 4. "Name required" error | | | |
| TS.6.4-03 | FS.6.2-01 | Special Characters in Name | 1. Edit document name. 2. Enter "Test/Doc\\Name:*?<>|". 3. Save changes. 4. Verify sanitization (SC) | 1. Edit dialog opens. 2. Special chars entered. 3. Save processes. 4. Invalid chars removed/escaped | | | |
| TS.6.4-04 | FS.6.1-01 | Large Document List | 1. Create 200 test documents. 2. Load documents page. 3. Measure load time. 4. Test pagination performance (SC) | 1. Documents created. 2. Page loads < 3 seconds. 3. Smooth scrolling. 4. Pagination responsive | | | |
| TS.6.4-05 | FS.6.3-01 | Concurrent Deletion Attempt | 1. Two admins open same doc. 2. Both click delete. 3. Both confirm deletion. 4. Check result (SC) | 1. Both see document. 2. Delete dialogs open. 3. One succeeds. 4. Other gets "not found" error | | | |
| TS.6.4-06 | FS.6.2-02 | Circular Ownership | 1. Diego owns Doc A. 2. Add Henrietta as owner. 3. Henrietta creates Doc B. 4. Try to add Diego as owner. 5. Verify no issues (SC) | 1. Doc A created. 2. Co-owner added. 3. Doc B created. 4. Co-owner added. 5. Both can manage both docs | | | |
| TS.6.4-07 | FS.6.1-02 | Tab Count Accuracy | 1. Note counts on all tabs. 2. Move doc from Pre-Approval to Execution. 3. Refresh page. 4. Verify counts updated correctly (SC) | 1. Initial counts recorded. 2. Document stage changed. 3. Page refreshed. 4. Counts reflect changes | | | |


## 7. DOCUMENT COMPLETION

### 7.1 Create New Document

| TS ID | FS ID(s) | Test Name | Test Procedure | Expected Result | Actual Result as Expected (Yes / No / N/A) | Attachments | Pass/Fail |
|-------|----------|-----------|----------------|-----------------|---------------------------------------------|-------------|-----------|
| TS.7.1-01 | FS.7.1-01 | Create Document Button | 1. Login as Diego (Creator). 2. Navigate to Documents page. 3. Click "Create New Document". 4. Verify dialog opens. 5. Check all fields present (SC) | 1. Creator access granted. 2. Documents page loads. 3. Button clicked. 4. Modal dialog appears. 5. Name, reference, category, upload fields shown | | | |
| TS.7.1-02 | FS.7.1-02 | Document Name Input | 1. Leave name empty. 2. Try to create. 3. Enter "Test Protocol v1.0". 4. Field accepts text. 5. Shows as required (SC) | 1. Name field empty. 2. Create button disabled. 3. Text entered. 4. Field populated. 5. Required indicator (*) visible | | | |
| TS.7.1-03 | FS.7.1-03 | External Reference Input | 1. Enter "EXT-2024-001". 2. Clear field. 3. Leave empty. 4. Can still create. 5. Optional field (SC) | 1. Reference entered. 2. Field cleared. 3. Field empty. 4. Create button enabled. 5. No required indicator | | | |
| TS.7.1-04 | FS.7.1-04 | Document Category Selection | 1. Click category dropdown. 2. View all options. 3. Select "validation". 4. Change to "batch record". 5. Select "Other" (SC) | 1. Dropdown opens. 2. Predefined categories shown. 3. Validation selected. 4. Changed successfully. 5. Other option available | | | |
| TS.7.1-05 | FS.7.1-05 | Custom Category Input | 1. Select "Other" category. 2. Custom field appears. 3. Enter "Equipment Log". 4. Text accepted. 5. Create enabled (SC) | 1. Other selected. 2. Text field shown. 3. Custom text entered. 4. Field populated. 5. Can proceed | | | |
| TS.7.1-06 | FS.7.1-06 | File Upload Browse | 1. Click upload button. 2. File browser opens. 3. Navigate to test.docx. 4. Select file. 5. File shown (SC) | 1. Upload clicked. 2. OS browser appears. 3. File located. 4. File selected. 5. Filename displayed | | | |
| TS.7.1-07 | FS.7.1-07 | File Upload Drag Drop | 1. Open file explorer. 2. Drag test.docx to drop zone. 3. Drop file. 4. File accepted. 5. Name shown (SC) | 1. Explorer open. 2. File dragged. 3. Drop zone highlighted. 4. File uploads. 5. Success indication | | | |
| TS.7.1-08 | FS.7.1-08 | File Format Validation | 1. Try uploading .pdf file. 2. See rejection. 3. Try .txt file. 4. Upload .docx file. 5. Only docx accepted (SC) | 1. PDF selected. 2. Error "Invalid format". 3. TXT rejected. 4. DOCX accepted. 5. Format enforced | | | |
| TS.7.1-09 | FS.7.1-09 | Upload Progress Display | 1. Upload large docx (10MB). 2. Watch progress. 3. See percentage. 4. Reaches 100%. 5. Complete message (SC) | 1. Large file selected. 2. Progress bar appears. 3. Shows 0-100%. 4. Upload completes. 5. Success shown | | | |
| TS.7.1-10 | FS.7.1-10 | Document ID Generation | 1. Create document. 2. Check network response. 3. Find document ID. 4. Verify UUID format. 5. Unique ID created (SC) | 1. Document created. 2. API response captured. 3. ID field present. 4. Valid UUID format. 5. Globally unique | | | |
| TS.7.1-11 | FS.7.1-11 | Timezone Display | 1. View create dialog. 2. Check timezone shown. 3. Verify local timezone. 4. Format correct. 5. Updates if changed (SC) | 1. Dialog open. 2. Timezone visible. 3. Matches system. 4. Shows UTC offset. 5. Dynamic update | | | |
| TS.7.1-12 | FS.7.1-12 | Form Validation | 1. Fill only name. 2. Create disabled. 3. Add file upload. 4. Create enables. 5. All required fields checked (SC) | 1. Name entered. 2. Button grayed out. 3. File uploaded. 4. Button activates. 5. Validation works | | | |
| TS.7.1-13 | FS.7.1-13 | Create Document Submit | 1. Fill all fields. 2. Click Create. 3. Monitor network. 4. See POST request. 5. Success response (SC) | 1. Form complete. 2. Create clicked. 3. Network activity. 4. API call made. 5. 201 Created | | | |
| TS.7.1-14 | FS.7.1-14 | Error Handling | 1. Disconnect network. 2. Try to create. 3. See error message. 4. Reconnect. 5. Retry succeeds (SC) | 1. Network off. 2. Create attempted. 3. Error displayed. 4. Network restored. 5. Creation works | | | |
| TS.7.1-15 | FS.7.1-15 | Success Navigation | 1. Create document successfully. 2. Wait for redirect. 3. Land on editor. 4. Document loaded. 5. Ready to edit (SC) | 1. Creation complete. 2. Auto-redirect. 3. Editor page shown. 4. Content visible. 5. Edit enabled | | | |

### 7.2 Create Practice Document

| TS ID | FS ID(s) | Test Name | Test Procedure | Expected Result | Actual Result as Expected (Yes / No / N/A) | Attachments | Pass/Fail |
|-------|----------|-----------|----------------|-----------------|---------------------------------------------|-------------|-----------|
| TS.7.2-01 | FS.7.2-01 | Trial Only Availability | 1. Login during trial period. 2. See "Create Demo Doc". 3. Activate full license. 4. Button disappears. 5. Trial-only feature (SC) | 1. Trial active. 2. Demo button visible. 3. License activated. 4. Button removed. 5. Feature restricted | | | |
| TS.7.2-02 | FS.7.2-02 | One Click Creation | 1. Click "Create Demo Doc". 2. No dialog shown. 3. Document creates instantly. 4. Uses template. 5. Opens in editor (SC) | 1. Button clicked. 2. Direct creation. 3. Immediate response. 4. Template loaded. 5. Editor ready | | | |
| TS.7.2-03 | FS.7.2-03 | Pre-configured Metadata | 1. Check document name. 2. Verify "Docufen Practice Document". 3. Check reference "PD-001". 4. Category is "validation". 5. All preset (SC) | 1. Name field checked. 2. Correct name. 3. Reference set. 4. Category assigned. 5. Metadata configured | | | |

### 7.3 Create Controlled Copy

| TS ID | FS ID(s) | Test Name | Test Procedure | Expected Result | Actual Result as Expected (Yes / No / N/A) | Attachments | Pass/Fail |
|-------|----------|-----------|----------------|-----------------|---------------------------------------------|-------------|-----------|
| TS.7.3-01 | FS.7.3-01 | Parent Document Validation | 1. Create controlled copy. 2. Try to copy the copy. 3. Get error 409. 4. Message shown. 5. Single level only (SC) | 1. First copy created. 2. Copy of copy attempted. 3. Error returned. 4. "Cannot copy a copy". 5. Hierarchy enforced | | | |
| TS.7.3-02 | FS.7.3-02 | Role Based Creation | 1. Login as Johanna (Collaborator). 2. No copy option. 3. Login as Diego (Creator). 4. Copy button visible. 5. Role restricted (SC) | 1. Collaborator login. 2. Button hidden. 3. Creator login. 4. Button shown. 5. Permission enforced | | | |
| TS.7.3-03 | FS.7.3-03 | Sequential Copy Numbering | 1. Create first copy. 2. Check number "01". 3. Create second copy. 4. Number is "02". 5. Sequential order (SC) | 1. Copy created. 2. Shows "01". 3. Second created. 4. Shows "02". 5. Auto-increment works | | | |
| TS.7.3-04 | FS.7.3-04 | Parent Child Relationship | 1. Create copy. 2. Check child's parentDocument. 3. Check parent's activeChildren. 4. Both linked. 5. Bidirectional (SC) | 1. Copy made. 2. Parent ID stored. 3. Child in array. 4. References valid. 5. Relationship intact | | | |
| TS.7.3-05 | FS.7.3-05 | Content Duplication | 1. Add content to parent. 2. Create controlled copy. 3. Check copy content. 4. Pre-approval preserved. 5. Execution cleared (SC) | 1. Parent has content. 2. Copy created. 3. Structure copied. 4. Pre-approval same. 5. Execution empty | | | |
| TS.7.3-06 | FS.7.3-06 | Copy Creation Audit | 1. Create controlled copy. 2. Check parent audit log. 3. Find copy entry. 4. Shows copy name. 5. URL included (SC) | 1. Copy made. 2. Audit checked. 3. Entry found. 4. Name recorded. 5. Link provided | | | |
| TS.7.3-07 | FS.7.3-07 | Document Locking Check | 1. Open parent document. 2. Another user creates copy. 3. Get error 412. 4. "Document locked". 5. Unlock to proceed (SC) | 1. Parent opened. 2. Copy attempted. 3. Lock error. 4. Message shown. 5. Must close first | | | |

### 7.4 Workflow and Document Access

#### 7.4.1 Add/Remove Participants

| TS ID | FS ID(s) | Test Name | Test Procedure | Expected Result | Actual Result as Expected (Yes / No / N/A) | Attachments | Pass/Fail |
|-------|----------|-----------|----------------|-----------------|---------------------------------------------|-------------|-----------|
| TS.7.4.1-01 | FS.7.4.1-01 | Participant Dialog Access | 1. Open document as owner. 2. Click participants tab. 3. Modal opens. 4. All groups shown. 5. Can manage all (SC) | 1. Owner access. 2. Tab clicked. 3. Dialog appears. 4. 5 groups visible. 5. All editable | | | |
| TS.7.4.1-02 | FS.7.4.1-02 | Owner Only Modification | 1. Open as non-owner. 2. View participants. 3. Try to add user. 4. Buttons disabled. 5. Read-only view (SC) | 1. Participant access. 2. Can view list. 3. Add disabled. 4. No edit allowed. 5. View only mode | | | |
| TS.7.4.1-03 | FS.7.4.1-03 | User Search Selection | 1. Click add user. 2. Type "Diego". 3. See filtered results. 4. Select Diego. 5. User added (SC) | 1. Add clicked. 2. Search works. 3. Diego shown. 4. Selected. 5. Added to group | | | |
| TS.7.4.1-04 | FS.7.4.1-04 | External User Support | 1. Add Julia (external). 2. See External badge. 3. Company shown. 4. Add to group. 5. Works cross-tenant (SC) | 1. Julia searched. 2. Badge visible. 3. "Biotech XMWKB". 4. Successfully added. 5. External supported | | | |
| TS.7.4.1-05 | FS.7.4.1-05 | Participant Change Audit | 1. Add user to group. 2. Check audit log. 3. Find add entry. 4. Remove user. 5. Removal logged (SC) | 1. User added. 2. Audit checked. 3. Add recorded. 4. User removed. 5. Remove recorded | | | |
| TS.7.4.1-06 | FS.7.4.1-06 | Auto Save Debounce | 1. Add multiple users quickly. 2. Watch network. 3. Single API call. 4. 2-second delay. 5. Batch saved (SC) | 1. Users added. 2. Network monitored. 3. One request. 4. Debounced. 5. Efficient save | | | |

#### 7.4.2 In Pre-Approval

| TS ID | FS ID(s) | Test Name | Test Procedure | Expected Result | Actual Result as Expected (Yes / No / N/A) | Attachments | Pass/Fail |
|-------|----------|-----------|----------------|-----------------|---------------------------------------------|-------------|-----------|
| TS.7.4.2-01 | FS.7.4.2-01 | Pre-Approval Group Display | 1. Open participants. 2. Find Pre-Approval group. 3. List shows approvers. 4. Count displayed. 5. Group identified (SC) | 1. Dialog open. 2. Group visible. 3. Users listed. 4. Number shown. 5. Clear labeling | | | |
| TS.7.4.2-02 | FS.7.4.2-02 | Stage Specific Addition | 1. Add user to Pre-Approval. 2. Check document access. 3. User can view doc. 4. Can sign in stage. 5. Permission granted (SC) | 1. User added. 2. Access verified. 3. Document visible. 4. Signing enabled. 5. Rights assigned | | | |
| TS.7.4.2-03 | FS.7.4.2-03 | Pre-Approval Removal | 1. Remove user from group. 2. Confirm removal. 3. Check access revoked. 4. Not in doc list. 5. Clean removal (SC) | 1. Remove clicked. 2. Confirmed. 3. Access checked. 4. Doc not visible. 5. Fully removed | | | |
| TS.7.4.2-04 | FS.7.4.2-04 | Signing Status Display | 1. View Pre-Approval list. 2. Check status icons. 3. Signed shows check. 4. Unsigned shows dash. 5. Timestamps shown (SC) | 1. List viewed. 2. Icons visible. 3. Check mark. 4. Dash mark. 5. Times displayed | | | |
| TS.7.4.2-05 | FS.7.4.2-05 | Email Notification Trigger | 1. Add user in Pre-Approval stage. 2. Check email sent. 3. Contains doc link. 4. Stage mentioned. 5. User notified (SC) | 1. User added. 2. Email triggered. 3. Link included. 4. "Pre-Approval" stated. 5. Notification sent | | | |

#### 7.4.3 In Execution (no signing order)

| TS ID | FS ID(s) | Test Name | Test Procedure | Expected Result | Actual Result as Expected (Yes / No / N/A) | Attachments | Pass/Fail |
|-------|----------|-----------|----------------|-----------------|---------------------------------------------|-------------|-----------|
| TS.7.4.3-01 | FS.7.4.3-01 | Execution Group Management | 1. View Execution group. 2. Add multiple users. 3. All shown in list. 4. No order shown. 5. Parallel access (SC) | 1. Group visible. 2. Users added. 3. List updated. 4. No numbers. 5. Equal access | | | |
| TS.7.4.3-02 | FS.7.4.3-02 | Parallel Signing Capability | 1. Add 3 executors. 2. All can sign simultaneously. 3. No blocking. 4. Any order works. 5. True parallel (SC) | 1. Executors added. 2. All sign together. 3. No restrictions. 4. Random order OK. 5. Concurrent allowed | | | |
| TS.7.4.3-03 | FS.7.4.3-03 | Executor Addition Removal | 1. Add executor. 2. Immediate access. 3. Remove executor. 4. Access revoked. 5. Real-time update (SC) | 1. User added. 2. Can execute. 3. User removed. 4. Cannot access. 5. Instant effect | | | |
| TS.7.4.3-04 | FS.7.4.3-04 | Executor Notifications | 1. Move to Execution. 2. All executors notified. 3. Emails sent together. 4. Stage specified. 5. Bulk notification (SC) | 1. Stage changed. 2. Notifications triggered. 3. Simultaneous send. 4. "Execution" mentioned. 5. All informed | | | |

#### 7.4.4 In Post-Approval

| TS ID | FS ID(s) | Test Name | Test Procedure | Expected Result | Actual Result as Expected (Yes / No / N/A) | Attachments | Pass/Fail |
|-------|----------|-----------|----------------|-----------------|---------------------------------------------|-------------|-----------|
| TS.7.4.4-01 | FS.7.4.4-01 | Post-Approval Group Display | 1. View Post-Approval group. 2. Final approvers listed. 3. Clear identification. 4. Status shown. 5. Group visible (SC) | 1. Group found. 2. Users displayed. 3. "Post-Approval" label. 4. Sign status visible. 5. Properly shown | | | |
| TS.7.4.4-02 | FS.7.4.4-02 | Post-Approval Assignment | 1. Add QA reviewer. 2. Add final approver. 3. Both in group. 4. Can review doc. 5. Verification enabled (SC) | 1. QA added. 2. Approver added. 3. List updated. 4. Access granted. 5. Can verify | | | |
| TS.7.4.4-03 | FS.7.4.4-03 | Completion Verification | 1. Check signing status. 2. Unsigned show pending. 3. Signed show complete. 4. Progress visible. 5. Clear tracking (SC) | 1. Status checked. 2. Pending indicated. 3. Complete marked. 4. Progress shown. 5. Easy monitoring | | | |

#### 7.4.5 Signing Order

| TS ID | FS ID(s) | Test Name | Test Procedure | Expected Result | Actual Result as Expected (Yes / No / N/A) | Attachments | Pass/Fail |
|-------|----------|-----------|----------------|-----------------|---------------------------------------------|-------------|-----------|
| TS.7.4.5-01 | FS.7.4.5-01 | Signing Order Toggle | 1. Find order checkbox. 2. Check Pre-Approval. 3. Order enabled. 4. Uncheck Execution. 5. Independent control (SC) | 1. Checkbox found. 2. Pre-Approval ordered. 3. Numbers appear. 4. Execution parallel. 5. Per-group setting | | | |
| TS.7.4.5-02 | FS.7.4.5-02 | Participant Reordering | 1. Enable signing order. 2. Drag user up. 3. Order changes. 4. Numbers update. 5. New sequence (SC) | 1. Order on. 2. Dragged. 3. Position changed. 4. 1,2,3 updated. 5. Reordered | | | |
| TS.7.4.5-03 | FS.7.4.5-03 | Sequential Enforcement | 1. User 2 tries to sign. 2. Blocked message. 3. "User 1 must sign first". 4. Cannot proceed. 5. Order enforced (SC) | 1. Out of order attempt. 2. Action blocked. 3. Clear message. 4. Sign disabled. 5. Sequence required | | | |
| TS.7.4.5-04 | FS.7.4.5-04 | Next Signer Identification | 1. View participant list. 2. Next signer highlighted. 3. "Next to Sign" label. 4. Clear indication. 5. User knows turn (SC) | 1. List viewed. 2. Highlighting visible. 3. Label shown. 4. Obviously next. 5. Clear guidance | | | |
| TS.7.4.5-05 | FS.7.4.5-05 | Sequential Email | 1. Enable signing order. 2. First user notified. 3. Others not emailed. 4. After sign, next notified. 5. One at a time (SC) | 1. Order enabled. 2. Only first emailed. 3. Others waiting. 4. Next gets email. 5. Sequential notify | | | |

#### 7.4.6 Owners (add/remove)

| TS ID | FS ID(s) | Test Name | Test Procedure | Expected Result | Actual Result as Expected (Yes / No / N/A) | Attachments | Pass/Fail |
|-------|----------|-----------|----------------|-----------------|---------------------------------------------|-------------|-----------|
| TS.7.4.6-01 | FS.7.4.6-01 | Owner Management Section | 1. View Owners group. 2. Current owners listed. 3. Can add/remove. 4. Full control shown. 5. Section available (SC) | 1. Group visible. 2. Owners displayed. 3. Buttons active. 4. Permissions clear. 5. Management enabled | | | |
| TS.7.4.6-02 | FS.7.4.6-02 | Owner Addition Rights | 1. Add Creator as owner. 2. Add User Manager. 3. Try Site Admin. 4. Blocked from ownership. 5. Role restrictions (SC) | 1. Creator added. 2. Manager added. 3. Admin rejected. 4. "Cannot be owner". 5. Rules enforced | | | |
| TS.7.4.6-03 | FS.7.4.6-03 | Minimum Owner Requirement | 1. Two owners exist. 2. Remove first owner. 3. Try remove last owner. 4. Error shown. 5. One required (SC) | 1. Two present. 2. First removed. 3. Last remove attempted. 4. "Cannot remove last". 5. Minimum enforced | | | |
| TS.7.4.6-04 | FS.7.4.6-04 | Owner Permission Transfer | 1. Add new owner. 2. Check permissions. 3. Can edit doc. 4. Can manage users. 5. Full rights (SC) | 1. Owner added. 2. Rights checked. 3. Edit enabled. 4. Manage enabled. 5. Complete control | | | |
| TS.7.4.6-05 | FS.7.4.6-05 | Self Removal Prevention | 1. Single owner exists. 2. Try remove self. 3. Action blocked. 4. Must add another first. 5. Continuity ensured (SC) | 1. Only owner. 2. Self-remove tried. 3. Blocked. 4. "Add owner first". 5. Protection works | | | |

#### 7.4.7 Viewers (add/remove)

| TS ID | FS ID(s) | Test Name | Test Procedure | Expected Result | Actual Result as Expected (Yes / No / N/A) | Attachments | Pass/Fail |
|-------|----------|-----------|----------------|-----------------|---------------------------------------------|-------------|-----------|
| TS.7.4.7-01 | FS.7.4.7-01 | Viewer Group Display | 1. Find Viewers group. 2. Read-only users listed. 3. Clear labeling. 4. Can add users. 5. Group functional (SC) | 1. Group found. 2. Viewers shown. 3. "Viewers" label. 4. Add button works. 5. Section ready | | | |
| TS.7.4.7-02 | FS.7.4.7-02 | Read Only Access Grant | 1. Add user as viewer. 2. User opens document. 3. Can view content. 4. Cannot edit. 5. Read-only enforced (SC) | 1. Viewer added. 2. Document accessed. 3. Content visible. 4. Edit disabled. 5. View only mode | | | |
| TS.7.4.7-03 | FS.7.4.7-03 | Viewer Addition Process | 1. Click add viewer. 2. Select any user. 3. User added. 4. Shows in doc list. 5. Relationship created (SC) | 1. Add clicked. 2. User selected. 3. Successfully added. 4. Doc visible to user. 5. Link established | | | |
| TS.7.4.7-04 | FS.7.4.7-04 | Viewer Removal | 1. Remove viewer. 2. Confirm removal. 3. Check user's list. 4. Document gone. 5. Access revoked (SC) | 1. Remove clicked. 2. Confirmed. 3. List checked. 4. Not visible. 5. Fully removed | | | |
| TS.7.4.7-05 | FS.7.4.7-05 | Viewer Restrictions | 1. Login as viewer. 2. Open document. 3. Try to edit. 4. Try to sign. 5. All disabled (SC) | 1. Viewer logged in. 2. Doc opened. 3. Edit blocked. 4. Sign blocked. 5. Read-only confirmed | | | |

### 7.5 Delete and Void

#### 7.5.1 Delete/Void Button Logic

| TS ID | FS ID(s) | Test Name | Test Procedure | Expected Result | Actual Result as Expected (Yes / No / N/A) | Attachments | Pass/Fail |
|-------|----------|-----------|----------------|-----------------|---------------------------------------------|-------------|-----------|
| TS.7.5.1-01 | FS.7.5.1-01 | Owner Only Access | 1. Open doc as owner. 2. See Delete/Void button. 3. Open as participant. 4. No button shown. 5. Owner restricted (SC) | 1. Owner view. 2. Button visible. 3. Participant view. 4. Button hidden. 5. Access controlled | | | |
| TS.7.5.1-02 | FS.7.5.1-02 | Dynamic Button Label | 1. New empty document. 2. Shows "Delete". 3. Add content. 4. Changes to "Void". 5. Dynamic update (SC) | 1. Empty doc. 2. Delete label. 3. Content added. 4. Void label. 5. Real-time change | | | |
| TS.7.5.1-03 | FS.7.5.1-03 | Content Detection Logic | 1. Check empty doc. 2. hasContent = false. 3. Add text. 4. hasContent = true. 5. Logic works (SC) | 1. Empty checked. 2. False state. 3. Text added. 4. True state. 5. Detection accurate | | | |
| TS.7.5.1-04 | FS.7.5.1-04 | Real Time Button Update | 1. Watch button label. 2. Type first character. 3. Instantly changes. 4. Delete all content. 5. Reverts to Delete (SC) | 1. Monitoring button. 2. Character entered. 3. Immediate change. 4. Content removed. 5. Reverts correctly | | | |
| TS.7.5.1-05 | FS.7.5.1-05 | Icon Differentiation | 1. View Delete button. 2. Trash icon shown. 3. Add content for Void. 4. Ban icon shown. 5. Visual distinction (SC) | 1. Delete viewed. 2. Trash2 icon. 3. Content added. 4. BanIcon displayed. 5. Icons differ | | | |

#### 7.5.2 Document Deletion (Empty Documents)

| TS ID | FS ID(s) | Test Name | Test Procedure | Expected Result | Actual Result as Expected (Yes / No / N/A) | Attachments | Pass/Fail |
|-------|----------|-----------|----------------|-----------------|---------------------------------------------|-------------|-----------|
| TS.7.5.2-01 | FS.7.5.2-01 | Delete Empty Document | 1. Create new document. 2. Click Delete. 3. Confirm deletion. 4. Document removed. 5. Database cleaned (SC) | 1. Doc created. 2. Delete clicked. 3. Confirmed. 4. Doc gone. 5. No traces remain | | | |
| TS.7.5.2-02 | FS.7.5.2-02 | Delete Confirmation Dialog | 1. Click Delete button. 2. Dialog appears. 3. Shows "Delete this document?". 4. Cancel option. 5. Confirm option (SC) | 1. Delete clicked. 2. Modal shown. 3. Question displayed. 4. Can cancel. 5. Can confirm | | | |
| TS.7.5.2-03 | FS.7.5.2-03 | Post Delete Navigation | 1. Delete document. 2. Auto-redirect. 3. Land on documents list. 4. Deleted doc not shown. 5. Clean redirect (SC) | 1. Deletion done. 2. Redirected. 3. List page shown. 4. Doc absent. 5. Smooth transition | | | |

#### 7.5.3 Document Voiding

| TS ID | FS ID(s) | Test Name | Test Procedure | Expected Result | Actual Result as Expected (Yes / No / N/A) | Attachments | Pass/Fail |
|-------|----------|-----------|----------------|-----------------|---------------------------------------------|-------------|-----------|
| TS.7.5.3-01 | FS.7.5.3-01 | Void Trigger Conditions | 1. Add signature. 2. Button shows Void. 3. Add text entry. 4. Still shows Void. 5. Content detected (SC) | 1. Signature added. 2. Void appears. 3. Text added. 4. Remains Void. 5. Any content triggers | | | |
| TS.7.5.3-02 | FS.7.5.3-02 | Void Reason Dialog | 1. Click Void button. 2. Modal opens. 3. Reason field required. 4. Shows doc name. 5. Context provided (SC) | 1. Void clicked. 2. Dialog shown. 3. Text area empty. 4. Doc name visible. 5. Clear context | | | |
| TS.7.5.3-03 | FS.7.5.3-03 | Reason Text Validation | 1. Leave reason empty. 2. Submit disabled. 3. Enter "Test". 4. Still disabled. 5. Enter valid reason (SC) | 1. Empty reason. 2. Cannot submit. 3. Too short. 4. Still blocked. 5. Min chars required | | | |
| TS.7.5.3-04 | FS.7.5.3-04 | Void Stage Transition | 1. Document in Execution. 2. Void with reason. 3. Stage changes to Voided. 4. Red indicator. 5. Status updated (SC) | 1. Execution stage. 2. Voided. 3. Stage = Voided. 4. Red badge shown. 5. Properly marked | | | |
| TS.7.5.3-05 | FS.7.5.3-05 | Void Audit Recording | 1. Void document. 2. Check audit log. 3. Find void entry. 4. Shows reason. 5. Actor recorded (SC) | 1. Doc voided. 2. Audit checked. 3. Entry found. 4. Reason captured. 5. User identified | | | |
| TS.7.5.3-06 | FS.7.5.3-06 | Content Preservation | 1. Void document. 2. View content. 3. All preserved. 4. Read-only mode. 5. Nothing lost (SC) | 1. Voided. 2. Content checked. 3. Everything intact. 4. Cannot edit. 5. Fully preserved | | | |
| TS.7.5.3-07 | FS.7.5.3-07 | Void Irreversibility | 1. View voided doc. 2. No unvoid option. 3. No stage change. 4. Permanently voided. 5. Cannot reverse (SC) | 1. Voided doc open. 2. No undo button. 3. Stage locked. 4. Status permanent. 5. Irreversible | | | |

### 7.6 Stage Management

#### 7.6.1 Forward

| TS ID | FS ID(s) | Test Name | Test Procedure | Expected Result | Actual Result as Expected (Yes / No / N/A) | Attachments | Pass/Fail |
|-------|----------|-----------|----------------|-----------------|---------------------------------------------|-------------|-----------|
| TS.7.6.1-01 | FS.7.6.1-01 | Owner Only Stage Control | 1. Open as owner. 2. Stage buttons visible. 3. Open as participant. 4. Buttons hidden. 5. Owner only (SC) | 1. Owner access. 2. Can advance. 3. Participant access. 4. Cannot advance. 5. Restricted | | | |
| TS.7.6.1-02 | FS.7.6.1-02 | Sequential Stage Progress | 1. In Pre-Approval. 2. Can go to Execute. 3. Cannot skip to Closed. 4. Must follow order. 5. Sequence enforced (SC) | 1. Pre-Approval stage. 2. Execute available. 3. Closed blocked. 4. No skipping. 5. Order required | | | |
| TS.7.6.1-03 | FS.7.6.1-03 | Pre-Approval Completion | 1. Missing signatures. 2. Try to advance. 3. Blocked with message. 4. All sign. 5. Can advance (SC) | 1. Signatures pending. 2. Advance blocked. 3. "Signatures required". 4. All signed. 5. Proceed enabled | | | |
| TS.7.6.1-04 | FS.7.6.1-04 | Post-Approval Completion | 1. In Post-Approval. 2. One unsigned. 3. Cannot close. 4. All sign. 5. Can close document (SC) | 1. Post-Approval stage. 2. Signature missing. 3. Close blocked. 4. Completed. 5. Close enabled | | | |
| TS.7.6.1-05 | FS.7.6.1-05 | Missing Signatures Modal | 1. Try advance incomplete. 2. Modal shows. 3. Lists unsigned users. 4. Clear message. 5. Must complete first (SC) | 1. Advance attempted. 2. Modal appears. 3. Users listed. 4. "Must sign" shown. 5. Guidance provided | | | |
| TS.7.6.1-06 | FS.7.6.1-06 | Stage Change Audit | 1. Advance stage. 2. Check audit log. 3. Stage change logged. 4. Previous/new shown. 5. Actor recorded (SC) | 1. Stage advanced. 2. Audit checked. 3. Entry present. 4. Both stages shown. 5. User identified | | | |
| TS.7.6.1-07 | FS.7.6.1-07 | Finalization Trigger | 1. Document closed. 2. Click Final PDF. 3. PDF generation starts. 4. Loading shown. 5. Process initiated (SC) | 1. Closed stage. 2. Finalize clicked. 3. Generation begins. 4. Progress indicator. 5. PDF creating | | | |
| TS.7.6.1-08 | FS.7.6.1-08 | Stage Skip Options | 1. No Pre-Approval needed. 2. Skip to Execute. 3. No Post-Approval needed. 4. Skip to Closed. 5. Optional stages (SC) | 1. Pre-Approval empty. 2. Direct to Execute. 3. Post-Approval empty. 4. Direct to Closed. 5. Flexibility allowed | | | |

#### 7.6.2 Backward

| TS ID | FS ID(s) | Test Name | Test Procedure | Expected Result | Actual Result as Expected (Yes / No / N/A) | Attachments | Pass/Fail |
|-------|----------|-----------|----------------|-----------------|---------------------------------------------|-------------|-----------|
| TS.7.6.2-01 | FS.7.6.2-01 | Owner Only Reversion | 1. Open as owner. 2. Back button visible. 3. Open as participant. 4. No back button. 5. Owner restricted (SC) | 1. Owner view. 2. Can revert. 3. Participant view. 4. Cannot revert. 5. Protected | | | |
| TS.7.6.2-02 | FS.7.6.2-02 | Mandatory Reason Entry | 1. Click back button. 2. Modal opens. 3. Reason required. 4. Cannot skip. 5. Must explain (SC) | 1. Back clicked. 2. Dialog shown. 3. Text area empty. 4. Submit disabled. 5. Reason mandatory | | | |
| TS.7.6.2-03 | FS.7.6.2-03 | Reason Validation | 1. Enter "abc". 2. Too short error. 3. Enter valid reason. 4. Can submit. 5. Min length enforced (SC) | 1. Short text. 2. Error shown. 3. Longer reason. 4. Submit enabled. 5. Validation works | | | |
| TS.7.6.2-04 | FS.7.6.2-04 | Backward Stage Order | 1. From Closed. 2. Can go to Post-Approval. 3. From Post-Approval to Execute. 4. Any previous stage. 5. Flexible revert (SC) | 1. Closed stage. 2. Post-Approval available. 3. Execute available. 4. All previous shown. 5. Full flexibility | | | |
| TS.7.6.2-05 | FS.7.6.2-05 | Reversion Audit | 1. Revert with reason. 2. Check audit log. 3. Reversion logged. 4. Reason captured. 5. Full tracking (SC) | 1. Stage reverted. 2. Audit checked. 3. Entry found. 4. Reason recorded. 5. Complete record | | | |
| TS.7.6.2-06 | FS.7.6.2-06 | State Preservation | 1. Add content in Execute. 2. Revert to Pre-Approval. 3. Content preserved. 4. Nothing lost. 5. Data intact (SC) | 1. Content added. 2. Stage reverted. 3. Content remains. 4. All preserved. 5. No data loss | | | |

### 7.7 Pre-Approval

#### 7.7.1 Sign

| TS ID | FS ID(s) | Test Name | Test Procedure | Expected Result | Actual Result as Expected (Yes / No / N/A) | Attachments | Pass/Fail |
|-------|----------|-----------|----------------|-----------------|---------------------------------------------|-------------|-----------|
| TS.7.7.1-01 | FS.7.7.1-01 | Pre-Approval Participant | 1. Not in Pre-Approval group. 2. Try to sign. 3. Option not available. 4. Add to group. 5. Can sign now (SC) | 1. Not participant. 2. Sign blocked. 3. No access. 4. Added to group. 5. Sign enabled | | | |
| TS.7.7.1-02 | FS.7.7.1-02 | Digital Signature Auth | 1. Click sign. 2. MS auth popup. 3. Authenticate. 4. Signature placed. 5. Verified identity (SC) | 1. Sign clicked. 2. Auth required. 3. MS login done. 4. Signature added. 5. Identity confirmed | | | |
| TS.7.7.1-03 | FS.7.7.1-03 | Signature Role Selection | 1. Sign dialog opens. 2. Role dropdown shown. 3. Select "Reviewed By". 4. Change to "Approved By". 5. Custom reason option (SC) | 1. Dialog shown. 2. Roles available. 3. Reviewed selected. 4. Changed role. 5. Custom available | | | |
| TS.7.7.1-04 | FS.7.7.1-04 | Signature Format Display | 1. Place signature. 2. Blue font color. 3. Shows name, initials. 4. Role displayed. 5. Timestamp included (SC) | 1. Signature placed. 2. Blue text. 3. "Diego S (DS)". 4. "Reviewed By". 5. Date/time shown | | | |
| TS.7.7.1-05 | FS.7.7.1-05 | Signing Order Enforce | 1. Enable signing order. 2. User 2 tries first. 3. Blocked message. 4. User 1 signs. 5. User 2 can sign (SC) | 1. Order enabled. 2. Out of order. 3. "Wait for User 1". 4. First signs. 5. Second allowed | | | |
| TS.7.7.1-06 | FS.7.7.1-06 | Signature Audit | 1. Sign document. 2. Check audit log. 3. PreApproveSign entry. 4. Role recorded. 5. Time captured (SC) | 1. Signed. 2. Audit viewed. 3. Entry found. 4. "Reviewed By" shown. 5. Timestamp present | | | |
| TS.7.7.1-07 | FS.7.7.1-07 | Late Entry Signature | 1. Enable late entry. 2. Select past date. 3. Enter reason. 4. Sign with clock icon. 5. Backdated signature (SC) | 1. Late entry on. 2. Date selected. 3. Reason provided. 4. Clock symbol shown. 5. Past date recorded | | | |

#### 7.7.2 Text

| TS ID | FS ID(s) | Test Name | Test Procedure | Expected Result | Actual Result as Expected (Yes / No / N/A) | Attachments | Pass/Fail |
|-------|----------|-----------|----------------|-----------------|---------------------------------------------|-------------|-----------|
| TS.7.7.2-01 | FS.7.7.2-01 | Custom Text Entry | 1. Click text option. 2. Enter "Reviewed on site". 3. Insert text. 4. Blue color. 5. Text added (SC) | 1. Text clicked. 2. Custom entered. 3. Inserted. 4. Blue font. 5. Successfully added | | | |
| TS.7.7.2-02 | FS.7.7.2-02 | Blue Text Rendering | 1. Insert any text. 2. Check color. 3. Always blue. 4. Original stays black. 5. Clear distinction (SC) | 1. Text inserted. 2. Color checked. 3. Blue confirmed. 4. Black preserved. 5. Visually distinct | | | |
| TS.7.7.2-03 | FS.7.7.2-03 | Text Entry Audit | 1. Add text. 2. Check audit log. 3. PreApproveText entry. 4. Content recorded. 5. User tracked (SC) | 1. Text added. 2. Audit viewed. 3. Entry present. 4. Text captured. 5. User shown | | | |
| TS.7.7.2-04 | FS.7.7.2-04 | Late Entry Text | 1. Enable late entry. 2. Add text. 3. Clock icon shown. 4. Original date recorded. 5. Reason captured (SC) | 1. Late mode on. 2. Text added. 3. Clock visible. 4. Past date saved. 5. Reason logged | | | |

#### 7.7.3 Notes  

| TS ID | FS ID(s) | Test Name | Test Procedure | Expected Result | Actual Result as Expected (Yes / No / N/A) | Attachments | Pass/Fail |
|-------|----------|-----------|----------------|-----------------|---------------------------------------------|-------------|-----------|
| TS.7.7.3-01 | FS.7.7.3-01 | Note Creation | 1. Click note option. 2. Enter comment. 3. Save note. 4. Bookmark created. 5. Note visible (SC) | 1. Note clicked. 2. Comment typed. 3. Saved. 4. Bookmark added. 5. In chat sidebar | | | |
| TS.7.7.3-02 | FS.7.7.3-02 | Participant Mentions | 1. Type @ in note. 2. User list appears. 3. Select @Diego. 4. Email sent. 5. Mention works (SC) | 1. @ typed. 2. Dropdown shown. 3. Diego selected. 4. Notification sent. 5. Feature functional | | | |
| TS.7.7.3-03 | FS.7.7.3-03 | Quick Note Templates | 1. View note options. 2. See "Sign Here". 3. Click template. 4. Note created. 5. Quick feedback (SC) | 1. Options shown. 2. Template visible. 3. One-click. 4. Note added. 5. Efficient entry | | | |
| TS.7.7.3-04 | FS.7.7.3-04 | Note Bookmark | 1. Create note. 2. Check document. 3. Bookmark icon shown. 4. Click bookmark. 5. Jumps to location (SC) | 1. Note created. 2. Doc checked. 3. Icon visible. 4. Clicked. 5. Navigation works | | | |
| TS.7.7.3-05 | FS.7.7.3-05 | Note Activity Tracking | 1. Add note. 2. Check audit. 3. Note creation logged. 4. Content recorded. 5. Location tracked (SC) | 1. Note added. 2. Audit viewed. 3. Entry found. 4. Text captured. 5. Position saved | | | |

### 7.8 Execution

#### 7.8.1 Sign

| TS ID | FS ID(s) | Test Name | Test Procedure | Expected Result | Actual Result as Expected (Yes / No / N/A) | Attachments | Pass/Fail |
|-------|----------|-----------|----------------|-----------------|---------------------------------------------|-------------|-----------|
| TS.7.8.1-01 | FS.7.8.1-01 | Execution Participant | 1. Not executor. 2. Cannot sign. 3. Add as executor. 4. Can sign now. 5. Access controlled (SC) | 1. Not in group. 2. Sign blocked. 3. Added. 4. Sign enabled. 5. Permission works | | | |
| TS.7.8.1-02 | FS.7.8.1-02 | Execution Signature Roles | 1. Click sign. 2. See execution roles. 3. "Performed By" shown. 4. "Verified By" available. 5. Execution specific (SC) | 1. Sign clicked. 2. Roles displayed. 3. Performed option. 4. Verified option. 5. Stage appropriate | | | |
| TS.7.8.1-03 | FS.7.8.1-03 | Parallel Signing | 1. Multiple executors. 2. All sign together. 3. No order enforced. 4. Simultaneous OK. 5. True parallel (SC) | 1. Many executors. 2. Concurrent signing. 3. No blocking. 4. All at once. 5. Parallel confirmed | | | |
| TS.7.8.1-04 | FS.7.8.1-04 | Digital Authentication | 1. Sign in execution. 2. MS auth required. 3. Verify identity. 4. Signature placed. 5. Authenticated (SC) | 1. Sign clicked. 2. Auth popup. 3. Identity confirmed. 4. Signature added. 5. Secure signing | | | |
| TS.7.8.1-05 | FS.7.8.1-05 | Blue Signature Format | 1. Place signature. 2. Blue font used. 3. In table cell. 4. Shows all details. 5. Formatted correctly (SC) | 1. Signed. 2. Blue color. 3. Cell location. 4. Name/role/time. 5. Proper format | | | |

#### 7.8.2 Text

| TS ID | FS ID(s) | Test Name | Test Procedure | Expected Result | Actual Result as Expected (Yes / No / N/A) | Attachments | Pass/Fail |
|-------|----------|-----------|----------------|-----------------|---------------------------------------------|-------------|-----------|
| TS.7.8.2-01 | FS.7.8.2-01 | Text Entry Options | 1. Click in cell. 2. Popup shows. 3. Quick buttons visible. 4. Custom text option. 5. Multiple choices (SC) | 1. Cell clicked. 2. Popup appears. 3. Buttons shown. 4. Text field available. 5. Options provided | | | |
| TS.7.8.2-02 | FS.7.8.2-02 | Initials Insertion | 1. Click Initials button. 2. "DS" inserted. 3. With timestamp. 4. Blue color. 5. Quick entry (SC) | 1. Button clicked. 2. Initials added. 3. Time included. 4. Blue text. 5. Efficient | | | |
| TS.7.8.2-03 | FS.7.8.2-03 | Timestamp Functions | 1. Click Current Date. 2. Today's date inserted. 3. Click Current Time. 4. Time inserted. 5. Formatted correctly (SC) | 1. Date clicked. 2. "24-Jun-2025". 3. Time clicked. 4. "14:30:25". 5. Proper format | | | |
| TS.7.8.2-04 | FS.7.8.2-04 | Blue Text Display | 1. Insert any text. 2. Always blue. 3. Original black. 4. Clear difference. 5. Consistent color (SC) | 1. Text added. 2. Blue confirmed. 3. Black preserved. 4. Distinguished. 5. Always blue | | | |

#### 7.8.3 Custom Text

| TS ID | FS ID(s) | Test Name | Test Procedure | Expected Result | Actual Result as Expected (Yes / No / N/A) | Attachments | Pass/Fail |
|-------|----------|-----------|----------------|-----------------|---------------------------------------------|-------------|-----------|
| TS.7.8.3-01 | FS.7.8.3-01 | Custom Text Input | 1. Select custom text. 2. Type "Test complete". 3. Insert text. 4. Added to cell. 5. Free text works (SC) | 1. Custom selected. 2. Text typed. 3. Inserted. 4. In cell. 5. Custom functional | | | |
| TS.7.8.3-02 | FS.7.8.3-02 | Cell Content Append | 1. Cell has content. 2. Add custom text. 3. Appends to end. 4. Doesn't overwrite. 5. Preserves existing (SC) | 1. Existing content. 2. Text added. 3. Added at end. 4. Original kept. 5. Append mode | | | |

#### 7.8.4 Yes, No, N/A

| TS ID | FS ID(s) | Test Name | Test Procedure | Expected Result | Actual Result as Expected (Yes / No / N/A) | Attachments | Pass/Fail |
|-------|----------|-----------|----------------|-----------------|---------------------------------------------|-------------|-----------|
| TS.7.8.4-01 | FS.7.8.4-01 | Quick Response Buttons | 1. Click Yes button. 2. "Yes" inserted. 3. Click No button. 4. "No" inserted. 5. Quick entry (SC) | 1. Yes clicked. 2. Yes added. 3. No clicked. 4. No added. 5. One-click entry | | | |
| TS.7.8.4-02 | FS.7.8.4-02 | Pass Fail Options | 1. Find Pass button. 2. Click Pass. 3. "Pass" inserted. 4. Try Fail. 5. Quality options (SC) | 1. Pass found. 2. Pass clicked. 3. Pass added. 4. Fail works. 5. QC options | | | |
| TS.7.8.4-03 | FS.7.8.4-03 | Single Click Entry | 1. Click N/A. 2. "N/A DS 24-Jun-2025" inserted. 3. One click. 4. Full entry. 5. Efficient (SC) | 1. N/A clicked. 2. Complete entry. 3. Single action. 4. All info added. 5. Quick process | | | |

#### 7.8.5 Bulk N/A

| TS ID | FS ID(s) | Test Name | Test Procedure | Expected Result | Actual Result as Expected (Yes / No / N/A) | Attachments | Pass/Fail |
|-------|----------|-----------|----------------|-----------------|---------------------------------------------|-------------|-----------|
| TS.7.8.5-01 | FS.7.8.5-01 | Multi Cell Selection | 1. Click first cell. 2. Drag to select 5 cells. 3. Cells highlighted. 4. Selection visible. 5. Multi-select works (SC) | 1. First clicked. 2. Dragged down. 3. 5 cells selected. 4. Highlight shown. 5. Selection functional | | | |
| TS.7.8.5-02 | FS.7.8.5-02 | Bulk Insert NA | 1. Select multiple cells. 2. Click Bulk N/A. 3. All cells filled. 4. Same timestamp. 5. Bulk operation (SC) | 1. Cells selected. 2. Bulk clicked. 3. All populated. 4. Identical time. 5. Efficient fill | | | |
| TS.7.8.5-03 | FS.7.8.5-03 | Selection Highlighting | 1. Select cells. 2. Blue highlight shown. 3. Clear boundaries. 4. Visual feedback. 5. User knows selection (SC) | 1. Selected. 2. Blue highlight. 3. Edges clear. 4. Visible selection. 5. Good feedback | | | |
| TS.7.8.5-04 | FS.7.8.5-04 | Execution Only | 1. Try in Pre-Approval. 2. No bulk option. 3. In Execution stage. 4. Bulk available. 5. Stage specific (SC) | 1. Pre-Approval checked. 2. Not available. 3. Execution stage. 4. Option shown. 5. Limited to execution | | | |

#### 7.8.6 Notes

| TS ID | FS ID(s) | Test Name | Test Procedure | Expected Result | Actual Result as Expected (Yes / No / N/A) | Attachments | Pass/Fail |
|-------|----------|-----------|----------------|-----------------|---------------------------------------------|-------------|-----------|
| TS.7.8.6-01 | FS.7.8.6-01 | Execution Notes | 1. Add note in execution. 2. Type comment. 3. Save note. 4. Shows in chat. 5. Note functional (SC) | 1. Note added. 2. Comment entered. 3. Saved. 4. In sidebar. 5. Works correctly | | | |
| TS.7.8.6-02 | FS.7.8.6-02 | Participant Mentions | 1. Mention @Henrietta. 2. Email sent. 3. Contains note text. 4. Link to document. 5. Notification works (SC) | 1. Mentioned. 2. Email triggered. 3. Note included. 4. Doc link present. 5. Notified properly | | | |

#### 7.8.7 Attachments - Files

| TS ID | FS ID(s) | Test Name | Test Procedure | Expected Result | Actual Result as Expected (Yes / No / N/A) | Attachments | Pass/Fail |
|-------|----------|-----------|----------------|-----------------|---------------------------------------------|-------------|-----------|
| TS.7.8.7.1-01 | FS.7.8.7.1-01 | File Upload Support | 1. Upload JPG image. 2. Upload PDF document. 3. Upload MP4 video. 4. All accepted. 5. Multiple types (SC) | 1. JPG uploaded. 2. PDF uploaded. 3. MP4 uploaded. 4. All successful. 5. Types supported | | | |
| TS.7.8.7.1-02 | FS.7.8.7.1-02 | Attachment Naming | 1. Upload file. 2. Name field required. 3. Enter "Test Results". 4. Name saved. 5. Descriptive naming (SC) | 1. File uploaded. 2. Name empty. 3. Description entered. 4. Name stored. 5. Named properly | | | |
| TS.7.8.7.1-03 | FS.7.8.7.1-03 | File Hash Verification | 1. Upload file. 2. Check network response. 3. Hash calculated. 4. SHA-256 format. 5. Integrity tracked (SC) | 1. File uploaded. 2. Response checked. 3. Hash present. 4. Valid SHA-256. 5. Hash stored | | | |
| TS.7.8.7.1-04 | FS.7.8.7.1-04 | Attachment Preview | 1. Click attachment. 2. Preview opens. 3. Navigation arrows. 4. Can view content. 5. Preview functional (SC) | 1. Clicked. 2. Preview shown. 3. Arrows work. 4. Content visible. 5. Preview works | | | |
| TS.7.8.7.1-05 | FS.7.8.7.1-05 | Attachment Audit | 1. Upload attachment. 2. Check audit log. 3. Upload recorded. 4. File details shown. 5. User tracked (SC) | 1. File uploaded. 2. Audit viewed. 3. Entry found. 4. Name/size/hash. 5. Uploader shown | | | |

#### 7.8.7.2 Documents (link to)

| TS ID | FS ID(s) | Test Name | Test Procedure | Expected Result | Actual Result as Expected (Yes / No / N/A) | Attachments | Pass/Fail |
|-------|----------|-----------|----------------|-----------------|---------------------------------------------|-------------|-----------|
| TS.7.8.7.2-01 | FS.7.8.7.2-01 | Document Linking | 1. Click link document. 2. Search for doc. 3. Select document. 4. Link created. 5. Reference added (SC) | 1. Link clicked. 2. Search works. 3. Doc selected. 4. Linked. 5. Reference shown | | | |
| TS.7.8.7.2-02 | FS.7.8.7.2-02 | Link Validation | 1. Try non-existent doc. 2. Not found error. 3. Try no-access doc. 4. Permission denied. 5. Validation works (SC) | 1. Invalid ID. 2. Error shown. 3. No permission. 4. Access denied. 5. Properly validated | | | |
| TS.7.8.7.2-03 | FS.7.8.7.2-03 | Link Display | 1. View linked doc. 2. Shows doc name. 3. Shows doc ID. 4. Clickable link. 5. Clear reference (SC) | 1. Link viewed. 2. Name visible. 3. ID shown. 4. Can click. 5. Good display | | | |

#### 7.8.8 True Copy Verification

| TS ID | FS ID(s) | Test Name | Test Procedure | Expected Result | Actual Result as Expected (Yes / No / N/A) | Attachments | Pass/Fail |
|-------|----------|-----------|----------------|-----------------|---------------------------------------------|-------------|-----------|
| TS.7.8.8-01 | FS.7.8.8-01 | Verification Enable | 1. View attachment. 2. Verify button shown. 3. Click verify. 4. Checkbox required. 5. Can verify (SC) | 1. Attachment viewed. 2. Button visible. 3. Dialog opens. 4. Must confirm. 5. Verification enabled | | | |
| TS.7.8.8-02 | FS.7.8.8-02 | Verification Limit | 1. First person verifies. 2. Second verifies. 3. Third tries. 4. Button disabled. 5. Max 2 reached (SC) | 1. First verified. 2. Second verified. 3. Third blocked. 4. "Max reached". 5. Limit enforced | | | |
| TS.7.8.8-03 | FS.7.8.8-03 | Digital Certification | 1. Check "true copy". 2. Digital signature required. 3. MS auth popup. 4. Sign to verify. 5. Certified copy (SC) | 1. Checkbox checked. 2. Sign required. 3. Auth shown. 4. Signed. 5. Verification complete | | | |
| TS.7.8.8-04 | FS.7.8.8-04 | Verification Display | 1. View verified attachment. 2. Stamp icon shown. 3. Verifier names. 4. Verification dates. 5. Status clear (SC) | 1. Attachment viewed. 2. Stamp visible. 3. Names listed. 4. Dates shown. 5. Verified status | | | |

#### 7.8.9 Corrections

| TS ID | FS ID(s) | Test Name | Test Procedure | Expected Result | Actual Result as Expected (Yes / No / N/A) | Attachments | Pass/Fail |
|-------|----------|-----------|----------------|-----------------|---------------------------------------------|-------------|-----------|
| TS.7.8.9-01 | FS.7.8.9-01 | Text Selection | 1. Select wrong text. 2. Highlight works. 3. Right-click menu. 4. Correction option. 5. Can select text (SC) | 1. Text selected. 2. Highlighted. 3. Menu appears. 4. Option shown. 5. Selection works | | | |
| TS.7.8.9-02 | FS.7.8.9-02 | Strikethrough Format | 1. Apply correction. 2. Original struck through. 3. Single line. 4. Still readable. 5. Proper format (SC) | 1. Correction applied. 2. Strikethrough shown. 3. One line through. 4. Text visible. 5. Format correct | | | |
| TS.7.8.9-03 | FS.7.8.9-03 | Correction Entry | 1. Enter corrected text. 2. Shows in brackets. 3. After strikethrough. 4. Blue color. 5. Clear correction (SC) | 1. Text entered. 2. [corrected text]. 3. Positioned after. 4. Blue font. 5. Visible correction | | | |
| TS.7.8.9-04 | FS.7.8.9-04 | Correction Marker | 1. Make correction. 2. Superscript added. 3. Shows "*1DS". 4. Counter increments. 5. Traceable (SC) | 1. Corrected. 2. Marker appears. 3. *1DS shown. 4. Next is *2DS. 5. Numbered tracking | | | |
| TS.7.8.9-05 | FS.7.8.9-05 | Reason Capture | 1. Correction dialog. 2. Reason required. 3. Enter "Typo fix". 4. Reason saved. 5. Documented (SC) | 1. Dialog shown. 2. Field empty. 3. Reason entered. 4. Stored. 5. Reason recorded | | | |

#### 7.8.10 Checkboxes

| TS ID | FS ID(s) | Test Name | Test Procedure | Expected Result | Actual Result as Expected (Yes / No / N/A) | Attachments | Pass/Fail |
|-------|----------|-----------|----------------|-----------------|---------------------------------------------|-------------|-----------|
| TS.7.8.10-01 | FS.7.8.10-01 | Checkbox Detection | 1. Find ☐ in document. 2. Hover shows hand. 3. Clickable state. 4. Ready to check. 5. Detected properly (SC) | 1. Checkbox found. 2. Cursor changes. 3. Interactive. 4. Can click. 5. Recognition works | | | |
| TS.7.8.10-02 | FS.7.8.10-02 | Check Mark Toggle | 1. Click unchecked ☐. 2. Changes to ☑. 3. Click again. 4. Stays checked. 5. One-way toggle (SC) | 1. Clicked. 2. Becomes ☑. 3. Re-clicked. 4. Remains ☑. 5. No uncheck | | | |
| TS.7.8.10-03 | FS.7.8.10-03 | Check Marker | 1. Check box. 2. Marker added. 3. Shows "*1DS". 4. Next check "*2DS". 5. Sequential marking (SC) | 1. Box checked. 2. Marker appears. 3. *1DS shown. 4. *2DS for next. 5. Numbered sequence | | | |
| TS.7.8.10-04 | FS.7.8.10-04 | Checkbox Tracking | 1. Check box. 2. View audit log. 3. Checkbox action logged. 4. Location recorded. 5. User identified (SC) | 1. Checked. 2. Audit viewed. 3. Entry found. 4. Position saved. 5. Checker shown | | | |

#### 7.8.11 Late Entry

| TS ID | FS ID(s) | Test Name | Test Procedure | Expected Result | Actual Result as Expected (Yes / No / N/A) | Attachments | Pass/Fail |
|-------|----------|-----------|----------------|-----------------|---------------------------------------------|-------------|-----------|
| TS.7.8.11-01 | FS.7.8.11-01 | Late Entry Toggle | 1. Find late entry checkbox. 2. Check to enable. 3. Date picker appears. 4. Reason field shown. 5. Mode activated (SC) | 1. Checkbox found. 2. Checked. 3. Calendar shown. 4. Reason required. 5. Late mode on | | | |
| TS.7.8.11-02 | FS.7.8.11-02 | Date Time Selection | 1. Select yesterday. 2. Pick 2:00 PM. 3. Date accepted. 4. Time accepted. 5. Past datetime set (SC) | 1. Yesterday selected. 2. 14:00 chosen. 3. Date valid. 4. Time valid. 5. Datetime configured | | | |
| TS.7.8.11-03 | FS.7.8.11-03 | Reason Requirement | 1. Leave reason empty. 2. Cannot proceed. 3. Enter "Forgot yesterday". 4. Min 3 chars required. 5. Valid reason (SC) | 1. Empty reason. 2. Blocked. 3. Reason entered. 4. Length checked. 5. Reason accepted | | | |
| TS.7.8.11-04 | FS.7.8.11-04 | Clock Symbol | 1. Complete late entry. 2. Entry shows ⏰. 3. Visual indicator. 4. Clear marking. 5. Late entry obvious (SC) | 1. Entry made. 2. Clock shown. 3. Symbol visible. 4. Stands out. 5. Clearly marked | | | |
| TS.7.8.11-05 | FS.7.8.11-05 | Late Entry Audit | 1. Make late entry. 2. Check audit. 3. Original date shown. 4. Actual time shown. 5. Reason recorded (SC) | 1. Entry made. 2. Audit checked. 3. Past date logged. 4. Current time logged. 5. Reason captured | | | |

#### 7.8.12 Multi-Entry and Expansive Cell

| TS ID | FS ID(s) | Test Name | Test Procedure | Expected Result | Actual Result as Expected (Yes / No / N/A) | Attachments | Pass/Fail |
|-------|----------|-----------|----------------|-----------------|---------------------------------------------|-------------|-----------|
| TS.7.8.12-01 | FS.7.8.12-01 | Automatic Cell Expansion | 1. Enter long text. 2. Cell expands. 3. All text visible. 4. No truncation. 5. Auto-sizing works (SC) | 1. Long text entered. 2. Cell grows. 3. Fully visible. 4. Nothing cut off. 5. Dynamic sizing | | | |
| TS.7.8.12-02 | FS.7.8.12-02 | Multi Entry | 1. Add first entry. 2. Click same cell. 3. Add second entry. 4. Both shown. 5. Multiple entries (SC) | 1. First added. 2. Cell re-selected. 3. Second added. 4. Both visible. 5. Multi-entry works | | | |
| TS.7.8.12-03 | FS.7.8.12-03 | Content Protection | 1. Try edit first entry. 2. Cannot modify. 3. Locked state. 4. Only append. 5. Protection works (SC) | 1. Edit attempted. 2. Blocked. 3. Read-only. 4. Can add new. 5. Previous protected | | | |
| TS.7.8.12-04 | FS.7.8.12-04 | Paragraph Separation | 1. View multi-entries. 2. Line spacing between. 3. Clear separation. 4. Easy to read. 5. Well formatted (SC) | 1. Entries viewed. 2. Spacing visible. 3. Distinct paragraphs. 4. Readable. 5. Good layout | | | |
| TS.7.8.12-05 | FS.7.8.12-05 | Entry Traceability | 1. Check audit for cell. 2. All entries logged. 3. Sequence preserved. 4. Users identified. 5. Full history (SC) | 1. Audit checked. 2. Each entry found. 3. Order correct. 4. Authors shown. 5. Complete trail | | | |

### 7.9 Post-Approval

#### 7.9.1 Sign

| TS ID | FS ID(s) | Test Name | Test Procedure | Expected Result | Actual Result as Expected (Yes / No / N/A) | Attachments | Pass/Fail |
|-------|----------|-----------|----------------|-----------------|---------------------------------------------|-------------|-----------|
| TS.7.9.1-01 | FS.7.9.1-01 | Post-Approval Participant | 1. Not in Post-Approval. 2. Cannot sign. 3. Add to group. 4. Can sign now. 5. Access controlled (SC) | 1. Not participant. 2. Sign blocked. 3. Added. 4. Sign enabled. 5. Permission enforced | | | |
| TS.7.9.1-02 | FS.7.9.1-02 | Post-Approval Roles | 1. Click sign. 2. Role options shown. 3. Select "Approved By". 4. Appropriate roles. 5. Final approval roles (SC) | 1. Sign clicked. 2. Roles displayed. 3. Approved selected. 4. Correct options. 5. Stage specific | | | |
| TS.7.9.1-03 | FS.7.9.1-03 | Sequential Signing | 1. Enable order. 2. Second tries first. 3. Blocked message. 4. First signs. 5. Second allowed (SC) | 1. Order on. 2. Out of sequence. 3. Must wait message. 4. First completed. 5. Next can sign | | | |
| TS.7.9.1-04 | FS.7.9.1-04 | Digital Authentication | 1. Sign document. 2. MS auth required. 3. Complete auth. 4. Signature placed. 5. Identity verified (SC) | 1. Sign clicked. 2. Auth popup. 3. Authenticated. 4. Signed. 5. Secure signature | | | |
| TS.7.9.1-05 | FS.7.9.1-05 | Blue Signature Format | 1. View signature. 2. Blue font color. 3. Shows all details. 4. In designated area. 5. Properly formatted (SC) | 1. Signature viewed. 2. Blue text. 3. Name/role/time. 4. Correct location. 5. Format correct | | | |
| TS.7.9.1-06 | FS.7.9.1-06 | Post-Approval Audit | 1. Sign document. 2. Check audit. 3. PostApproveSign entry. 4. Details recorded. 5. Tracked properly (SC) | 1. Signed. 2. Audit viewed. 3. Entry found. 4. All info captured. 5. Audit complete | | | |

#### 7.9.2 Text

| TS ID | FS ID(s) | Test Name | Test Procedure | Expected Result | Actual Result as Expected (Yes / No / N/A) | Attachments | Pass/Fail |
|-------|----------|-----------|----------------|-----------------|---------------------------------------------|-------------|-----------|
| TS.7.9.2-01 | FS.7.9.2-01 | Limited Text Entry | 1. Click text option. 2. Fewer options than execution. 3. Basic text only. 4. Insert text. 5. Limited functionality (SC) | 1. Text clicked. 2. Reduced options. 3. Basic only. 4. Text added. 5. Limitations confirmed | | | |
| TS.7.9.2-02 | FS.7.9.2-02 | Blue Text Format | 1. Add any text. 2. Check color. 3. Always blue. 4. Consistent format. 5. Stage agnostic (SC) | 1. Text added. 2. Color checked. 3. Blue confirmed. 4. Same as other stages. 5. Consistent color | | | |
| TS.7.9.2-03 | FS.7.9.2-03 | Text Entry Audit | 1. Add text. 2. Check audit log. 3. PostApproveText entry. 4. Content recorded. 5. User tracked (SC) | 1. Text added. 2. Audit viewed. 3. Entry present. 4. Text captured. 5. Author shown | | | |

#### 7.9.3 Notes

| TS ID | FS ID(s) | Test Name | Test Procedure | Expected Result | Actual Result as Expected (Yes / No / N/A) | Attachments | Pass/Fail |
|-------|----------|-----------|----------------|-----------------|---------------------------------------------|-------------|-----------|
| TS.7.9.3-01 | FS.7.9.3-01 | Final Review Comments | 1. Add review note. 2. Quality feedback. 3. Note saved. 4. In chat sidebar. 5. Review documented (SC) | 1. Note added. 2. Feedback entered. 3. Saved. 4. Visible in chat. 5. Review recorded | | | |
| TS.7.9.3-02 | FS.7.9.3-02 | Participant Communication | 1. Mention @approver. 2. Notification sent. 3. Email contains note. 4. Link to document. 5. Communication works (SC) | 1. Mentioned. 2. Email triggered. 3. Note in email. 4. Doc link included. 5. Notified properly | | | |
| TS.7.9.3-03 | FS.7.9.3-03 | Note Templates | 1. View templates. 2. Approval specific options. 3. Click template. 4. Note created. 5. Quick feedback (SC) | 1. Templates shown. 2. Stage appropriate. 3. One-click. 4. Note added. 5. Efficient entry | | | |

### 7.10 Closed

| TS ID | FS ID(s) | Test Name | Test Procedure | Expected Result | Actual Result as Expected (Yes / No / N/A) | Attachments | Pass/Fail |
|-------|----------|-----------|----------------|-----------------|---------------------------------------------|-------------|-----------|
| TS.7.10-01 | FS.7.10-01 | Owner Only Closure | 1. Participant tries close. 2. No button shown. 3. Owner opens doc. 4. Close button visible. 5. Owner restricted (SC) | 1. Participant view. 2. Cannot close. 3. Owner view. 4. Can close. 5. Permission enforced | | | |
| TS.7.10-02 | FS.7.10-02 | Closure Audit | 1. Close document. 2. Check audit log. 3. Stage change logged. 4. Actor recorded. 5. Timestamp captured (SC) | 1. Doc closed. 2. Audit viewed. 3. ChangedStage entry. 4. Closer identified. 5. Time recorded | | | |
| TS.7.10-03 | FS.7.10-03 | Completed Status | 1. View closed doc. 2. Green checkmark shown. 3. Status "Completed". 4. In Completed tab. 5. Clear status (SC) | 1. Doc viewed. 2. Green indicator. 3. Completed label. 4. Correct tab. 5. Status obvious | | | |
| TS.7.10-04 | FS.7.10-04 | Content Preservation | 1. View closed doc. 2. All content intact. 3. Cannot edit. 4. Read-only mode. 5. Preserved state (SC) | 1. Content viewed. 2. Everything present. 3. Edit disabled. 4. View only. 5. Fully preserved | | | |
| TS.7.10-05 | FS.7.10-05 | Ready for Finalization | 1. Document closed. 2. Final PDF button shown. 3. Can advance. 4. Next stage available. 5. Ready to finalize (SC) | 1. In closed state. 2. Button visible. 3. Clickable. 4. Can proceed. 5. Finalization enabled | | | |
| TS.7.10-06 | FS.7.10-06 | Backward Navigation | 1. From closed stage. 2. Can go back. 3. Reason required. 4. Returns to Post-Approval. 5. Reversion allowed (SC) | 1. Closed stage. 2. Back button shown. 3. Reason dialog. 4. Stage reverted. 5. Backward works | | | |

### 7.11 Final PDF

#### 7.11.1 PDF Generation

| TS ID | FS ID(s) | Test Name | Test Procedure | Expected Result | Actual Result as Expected (Yes / No / N/A) | Attachments | Pass/Fail |
|-------|----------|-----------|----------------|-----------------|---------------------------------------------|-------------|-----------|
| TS.7.11.1-01 | FS.7.11.1-01 | PDF Creation Trigger | 1. Click Final PDF. 2. Generation starts. 3. API call made. 4. Processing begins. 5. PDF creating (SC) | 1. Button clicked. 2. Process initiated. 3. API called. 4. Server processing. 5. Generation started | | | |
| TS.7.11.1-02 | FS.7.11.1-02 | Loading State Display | 1. During generation. 2. Spinner shown. 3. "Creating PDF..." message. 4. Progress indication. 5. User feedback (SC) | 1. Processing. 2. Spinner visible. 3. Message displayed. 4. Loading state. 5. Clear feedback | | | |
| TS.7.11.1-03 | FS.7.11.1-03 | Error Handling | 1. Simulate failure. 2. Error message shown. 3. Stays in Closed. 4. Can retry. 5. Graceful failure (SC) | 1. Error triggered. 2. Message displayed. 3. Stage unchanged. 4. Retry available. 5. Handled well | | | |

#### 7.11.2 PDF Content

| TS ID | FS ID(s) | Test Name | Test Procedure | Expected Result | Actual Result as Expected (Yes / No / N/A) | Attachments | Pass/Fail |
|-------|----------|-----------|----------------|-----------------|---------------------------------------------|-------------|-----------|
| TS.7.11.2-01 | FS.7.11.2-01 | Executed Document | 1. View PDF. 2. All signatures included. 3. All text entries. 4. Complete document. 5. Nothing missing (SC) | 1. PDF opened. 2. Signatures present. 3. Text visible. 4. Fully complete. 5. All content included | | | |
| TS.7.11.2-02 | FS.7.11.2-02 | Attachment Package | 1. Check attachments. 2. All included in PDF. 3. With labels. 4. In order uploaded. 5. Complete package (SC) | 1. Attachments checked. 2. All present. 3. Labels shown. 4. Correct order. 5. Package complete | | | |
| TS.7.11.2-03 | FS.7.11.2-03 | Audit Trail Inclusion | 1. Scroll to end. 2. Audit trail present. 3. All actions listed. 4. Chronological order. 5. Complete history (SC) | 1. End reached. 2. Audit included. 3. Every action shown. 4. Time ordered. 5. Full trail | | | |
| TS.7.11.2-04 | FS.7.11.2-04 | Visual Formatting | 1. Check original text. 2. Black color preserved. 3. Check entries. 4. Blue color preserved. 5. Format maintained (SC) | 1. Original checked. 2. Black text. 3. Entries checked. 4. Blue text. 5. Colors correct | | | |
| TS.7.11.2-05 | FS.7.11.2-05 | QMS Compatibility | 1. Download PDF. 2. Check format. 3. PDF/A compliant. 4. Searchable text. 5. QMS ready (SC) | 1. Downloaded. 2. Format checked. 3. Compliant. 4. Text searchable. 5. Compatible format | | | |

#### 7.11.3 Finalized State

| TS ID | FS ID(s) | Test Name | Test Procedure | Expected Result | Actual Result as Expected (Yes / No / N/A) | Attachments | Pass/Fail |
|-------|----------|-----------|----------------|-----------------|---------------------------------------------|-------------|-----------|
| TS.7.11.3-01 | FS.7.11.3-01 | Stage Assignment | 1. After PDF generation. 2. Stage = Finalised. 3. Status updated. 4. In Final PDF tab. 5. Properly staged (SC) | 1. PDF complete. 2. Finalised stage. 3. Status changed. 4. Correct tab. 5. Stage correct | | | |
| TS.7.11.3-02 | FS.7.11.3-02 | PDF URL Storage | 1. Check document state. 2. PDF URL present. 3. Valid URL format. 4. Accessible link. 5. URL stored (SC) | 1. State checked. 2. URL found. 3. Format valid. 4. Link works. 5. Properly stored | | | |
| TS.7.11.3-03 | FS.7.11.3-03 | Finalization Audit | 1. Check audit log. 2. Finalization entry. 3. ChangedStage recorded. 4. PDF generation noted. 5. Complete audit (SC) | 1. Audit viewed. 2. Entry found. 3. Stage change logged. 4. PDF noted. 5. Audit complete | | | |
| TS.7.11.3-04 | FS.7.11.3-04 | View PDF Button | 1. Document finalized. 2. View PDF button shown. 3. Click button. 4. PDF opens. 5. Easy access (SC) | 1. Finalized state. 2. Button visible. 3. Clicked. 4. PDF displayed. 5. Access works | | | |

### 7.12 Re-Open

#### 7.12.1 Re-Open Capability  

| TS ID | FS ID(s) | Test Name | Test Procedure | Expected Result | Actual Result as Expected (Yes / No / N/A) | Attachments | Pass/Fail |
|-------|----------|-----------|----------------|-----------------|---------------------------------------------|-------------|-----------|
| TS.7.12.1-01 | FS.7.12.1-01 | Owner Only Re-Open | 1. Non-owner views finalized. 2. No re-open button. 3. Owner views. 4. Re-open visible. 5. Owner restricted (SC) | 1. Non-owner access. 2. Button hidden. 3. Owner access. 4. Button shown. 5. Permission enforced | | | |
| TS.7.12.1-02 | FS.7.12.1-02 | Re-Open Button Display | 1. View finalized doc. 2. Re-open button shown. 3. Amber warning icon. 4. Clear visibility. 5. Obvious action (SC) | 1. Doc viewed. 2. Button present. 3. Warning color. 4. Stands out. 5. Clear option | | | |
| TS.7.12.1-03 | FS.7.12.1-03 | Confirmation Dialog | 1. Click re-open. 2. Warning dialog. 3. PDF invalidation warning. 4. Must confirm. 5. Protection step (SC) | 1. Clicked. 2. Dialog shown. 3. Warning displayed. 4. Confirmation required. 5. Safety check | | | |
| TS.7.12.1-04 | FS.7.12.1-04 | Warning Text | 1. Read warning. 2. GxP implications stated. 3. System update mentioned. 4. Clear consequences. 5. Comprehensive warning (SC) | 1. Warning read. 2. Compliance noted. 3. Updates mentioned. 4. Impact clear. 5. Full disclosure | | | |
| TS.7.12.1-05 | FS.7.12.1-05 | Re-Open Audit | 1. Re-open document. 2. Check audit. 3. Re-open recorded. 4. Owner identified. 5. Time logged (SC) | 1. Re-opened. 2. Audit checked. 3. Entry found. 4. Actor shown. 5. Timestamp present | | | |

#### 7.12.2 State Restoration

| TS ID | FS ID(s) | Test Name | Test Procedure | Expected Result | Actual Result as Expected (Yes / No / N/A) | Attachments | Pass/Fail |
|-------|----------|-----------|----------------|-----------------|---------------------------------------------|-------------|-----------|
| TS.7.12.2-01 | FS.7.12.2-01 | Stage Reversion | 1. Re-open finalized. 2. Stage changes. 3. Now Post-Approval. 4. Not finalized. 5. Stage reverted (SC) | 1. Re-opened. 2. Stage updated. 3. Post-Approval stage. 4. Finalised cleared. 5. Properly reverted | | | |
| TS.7.12.2-02 | FS.7.12.2-02 | PDF Invalidation | 1. Check PDF URL. 2. URL cleared. 3. Old PDF invalid. 4. Cannot access. 5. Properly invalidated (SC) | 1. URL checked. 2. Now empty. 3. Link broken. 4. 404 error. 5. PDF removed | | | |
| TS.7.12.2-03 | FS.7.12.2-03 | Content Preservation | 1. Check document. 2. All content intact. 3. Signatures preserved. 4. Attachments remain. 5. Nothing lost (SC) | 1. Doc checked. 2. Content present. 3. Signatures intact. 4. Attachments OK. 5. Fully preserved | | | |
| TS.7.12.2-04 | FS.7.12.2-04 | Edit Capability | 1. Document re-opened. 2. Can add content. 3. Can add signatures. 4. Full edit mode. 5. Editing restored (SC) | 1. Re-opened state. 2. Content addable. 3. Signing enabled. 4. All functions work. 5. Edit capability back | | | |

### 7.13 Audit Log

#### 7.13.1 Audit Trail Generation

| TS ID | FS ID(s) | Test Name | Test Procedure | Expected Result | Actual Result as Expected (Yes / No / N/A) | Attachments | Pass/Fail |
|-------|----------|-----------|----------------|-----------------|---------------------------------------------|-------------|-----------|
| TS.7.13.1-01 | FS.7.13.1-01 | Automatic Capture | 1. Perform any action. 2. No manual logging. 3. Check audit. 4. Action recorded. 5. Automatic tracking (SC) | 1. Action done. 2. No user input. 3. Audit checked. 4. Entry present. 5. Auto-captured | | | |
| TS.7.13.1-02 | FS.7.13.1-02 | User Identification | 1. Check audit entry. 2. Legal name shown. 3. Initials shown. 4. Email shown. 5. MS ID shown (SC) | 1. Entry viewed. 2. Full name. 3. Initials present. 4. Email included. 5. Object ID recorded | | | |
| TS.7.13.1-03 | FS.7.13.1-03 | Timestamp Recording | 1. Check timestamp. 2. Precise time shown. 3. Timezone included. 4. Chronological order. 5. Accurate timing (SC) | 1. Time checked. 2. To the second. 3. UTC offset shown. 4. Proper order. 5. Time accurate | | | |
| TS.7.13.1-04 | FS.7.13.1-04 | IP Address Tracking | 1. View audit entry. 2. IP address shown. 3. Valid format. 4. Actual user IP. 5. Location tracked (SC) | 1. Entry viewed. 2. IP present. 3. xxx.xxx.xxx.xxx. 4. Matches user. 5. IP captured | | | |
| TS.7.13.1-05 | FS.7.13.1-05 | Immutable Storage | 1. Try edit audit. 2. No edit option. 3. Try delete. 4. No delete option. 5. Read-only audit (SC) | 1. Edit attempted. 2. Cannot edit. 3. Delete tried. 4. Cannot delete. 5. Immutable confirmed | | | |

#### 7.13.2 Document Actions Tracking

| TS ID | FS ID(s) | Test Name | Test Procedure | Expected Result | Actual Result as Expected (Yes / No / N/A) | Attachments | Pass/Fail |
|-------|----------|-----------|----------------|-----------------|---------------------------------------------|-------------|-----------|
| TS.7.13.2-01 | FS.7.13.2-01 | Signature Actions | 1. Sign document. 2. Check audit. 3. Signature tracked. 4. Role recorded. 5. Auth time shown (SC) | 1. Signed. 2. Audit checked. 3. Sign entry found. 4. Role captured. 5. Auth timestamp | | | |
| TS.7.13.2-02 | FS.7.13.2-02 | Text Entry Actions | 1. Add text. 2. Check audit. 3. Text action logged. 4. Content recorded. 5. Format details (SC) | 1. Text added. 2. Audit viewed. 3. Entry found. 4. Text captured. 5. Details logged | | | |
| TS.7.13.2-03 | FS.7.13.2-03 | Attachment Actions | 1. Upload file. 2. Check audit. 3. Upload logged. 4. File details shown. 5. Complete record (SC) | 1. File uploaded. 2. Audit checked. 3. Entry present. 4. Name/size/hash. 5. Full details | | | |
| TS.7.13.2-04 | FS.7.13.2-04 | Correction Actions | 1. Make correction. 2. Check audit. 3. Original preserved. 4. New text shown. 5. Reason recorded (SC) | 1. Corrected. 2. Audit viewed. 3. Original text saved. 4. Correction shown. 5. Reason included | | | |
| TS.7.13.2-05 | FS.7.13.2-05 | Stage Transitions | 1. Change stage. 2. Check audit. 3. Transition logged. 4. Both stages shown. 5. Reason if backward (SC) | 1. Stage changed. 2. Audit checked. 3. Entry found. 4. From/to recorded. 5. Reason captured | | | |
| TS.7.13.2-06 | FS.7.13.2-06 | Late Entry Tracking | 1. Make late entry. 2. Check audit. 3. Original date shown. 4. Actual time shown. 5. Reason included (SC) | 1. Late entry made. 2. Audit viewed. 3. Past date logged. 4. Current time logged. 5. Reason present | | | |

#### 7.13.3 Audit Log Display

| TS ID | FS ID(s) | Test Name | Test Procedure | Expected Result | Actual Result as Expected (Yes / No / N/A) | Attachments | Pass/Fail |
|-------|----------|-----------|----------------|-----------------|---------------------------------------------|-------------|-----------|
| TS.7.13.3-01 | FS.7.13.3-01 | Three Log Structure | 1. View audit page. 2. Document trail shown. 3. Attachment log shown. 4. User log shown. 5. Three sections (SC) | 1. Page viewed. 2. Doc section present. 3. Attachment section. 4. User section. 5. All three visible | | | |
| TS.7.13.3-02 | FS.7.13.3-02 | Chronological Order | 1. Check doc trail. 2. Recent first. 3. Oldest last. 4. Time ordered. 5. Proper sequence (SC) | 1. Trail viewed. 2. Newest on top. 3. Oldest bottom. 4. Time descending. 5. Correct order | | | |
| TS.7.13.3-03 | FS.7.13.3-03 | Action Descriptions | 1. View action types. 2. Human readable. 3. Not just codes. 4. Clear meaning. 5. User friendly (SC) | 1. Actions viewed. 2. Plain English. 3. No cryptic codes. 4. Self-explanatory. 5. Easy to understand | | | |
| TS.7.13.3-04 | FS.7.13.3-04 | User Attribution | 1. Check each entry. 2. Full name shown. 3. Initials shown. 4. Company for external. 5. Clear attribution (SC) | 1. Entries checked. 2. Names visible. 3. Initials present. 4. External company shown. 5. Users identified | | | |
| TS.7.13.3-05 | FS.7.13.3-05 | Stage Context | 1. View actions. 2. Stage shown. 3. At time of action. 4. Context provided. 5. Stage tracking (SC) | 1. Actions viewed. 2. Stage column present. 3. Historical stage. 4. Good context. 5. Stage recorded | | | |

### 7.14 Negative and Edge Case Tests

| TS ID | FS ID(s) | Test Name | Test Procedure | Expected Result | Actual Result as Expected (Yes / No / N/A) | Attachments | Pass/Fail |
|-------|----------|-----------|----------------|-----------------|---------------------------------------------|-------------|-----------|
| TS.7.14-01 | FS.7.1-08 | Large File Upload | 1. Try 200MB docx. 2. Upload rejected. 3. Size limit error. 4. Try 99MB file. 5. Upload succeeds (SC) | 1. Large file selected. 2. Upload blocked. 3. "Max 100MB" error. 4. Under limit file. 5. Uploads OK | | | |
| TS.7.14-02 | FS.7.4.1-06 | Rapid Participant Changes | 1. Add 10 users quickly. 2. Remove 5 rapidly. 3. Add 5 more. 4. Single save call. 5. All changes saved (SC) | 1. Rapid adds. 2. Quick removes. 3. More adds. 4. Debounced to one call. 5. Efficient save | | | |
| TS.7.14-03 | FS.7.6.1-03 | Concurrent Stage Change | 1. Two owners open doc. 2. Both try advance. 3. First succeeds. 4. Second gets error. 5. Conflict handled (SC) | 1. Both access. 2. Simultaneous attempt. 3. One advances. 4. "Stage changed" error. 5. Graceful handling | | | |
| TS.7.14-04 | FS.7.8.2-01 | Cell Content Overflow | 1. Enter 5000 chars in cell. 2. Cell expands. 3. All text visible. 4. No truncation. 5. Handles large content (SC) | 1. Massive text. 2. Cell grows. 3. Fully displayed. 4. Nothing cut. 5. Scales properly | | | |
| TS.7.14-05 | FS.7.8.9-01 | Correction Chain | 1. Make correction. 2. Correct the correction. 3. Correct again. 4. All preserved. 5. Full history maintained (SC) | 1. First correction. 2. Second correction. 3. Third correction. 4. Chain visible. 5. History intact | | | |
| TS.7.14-06 | FS.7.11.1-03 | PDF Generation Timeout | 1. Trigger long PDF generation. 2. Wait 5 minutes. 3. Timeout occurs. 4. Error shown. 5. Can retry (SC) | 1. Long process. 2. Extended wait. 3. Times out. 4. "Generation failed". 5. Retry available | | | |
| TS.7.14-07 | FS.7.8.7.1-01 | Duplicate Attachment Names | 1. Upload "test.pdf". 2. Upload another "test.pdf". 3. Both accepted. 4. Uniquely stored. 5. No conflicts (SC) | 1. First uploaded. 2. Second uploaded. 3. Both saved. 4. Different IDs. 5. Handled correctly | | | |
| TS.7.14-08 | FS.7.13.1-05 | Audit Trail Size | 1. Generate 1000 actions. 2. View audit trail. 3. All entries shown. 4. Performance OK. 5. Handles volume (SC) | 1. Many actions. 2. Audit viewed. 3. Complete list. 4. Loads quickly. 5. Scales well | | | |
| TS.7.14-09 | FS.7.3-07 | Locked Document Operations | 1. User A opens document. 2. User B tries to sign. 3. Gets lock error. 4. User A closes. 5. User B can sign (SC) | 1. First user locks. 2. Second blocked. 3. "Document locked". 4. Lock released. 5. Now accessible | | | |
| TS.7.14-10 | FS.7.8.11-02 | Future Date Prevention | 1. Try late entry tomorrow. 2. Date picker blocks. 3. Cannot select future. 4. Only past dates. 5. Logic enforced (SC) | 1. Future attempted. 2. Selection blocked. 3. Future disabled. 4. Past only. 5. Properly restricted | | | |
