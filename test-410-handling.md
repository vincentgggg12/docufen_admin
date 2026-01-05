# Test Plan for 410 Status Code Handling

## Overview
This test plan verifies that the client properly handles 410 (Gone) status codes when attempting to access deleted documents.

## Test Scenarios

### 1. Direct Document Access
**Steps:**
1. Navigate to a document URL that returns 410 status
2. Observe the behavior

**Expected Result:**
- Error toast appears with message: "This document has been deleted and is no longer available"
- After 2 seconds, user is redirected to /home

### 2. Controlled Copies Access
**Steps:**
1. Open a document that has controlled copies
2. Server returns 410 for the parent document
3. Observe the behavior in the controlled copies tab

**Expected Result:**
- Error toast appears with message: "This document has been deleted and is no longer available"
- Controlled copies list shows as empty or loading state ends

## Code Changes Summary

### 1. `src/lib/apiUtils.ts`
- Added handling for 410 status code in `getDocumentState` function
- Returns `{ code: 410, ... }` when server responds with 410

### 2. `src/components/editor/SFEditor.tsx`
- Added case for `documentState.code === 410`
- Shows error toast notification
- Redirects to /home after 2 seconds

### 3. `src/pages/Execution/Right-sidebar/sidebar-right_tab7_controlled_copies.tsx`
- Added handling for 410 status when fetching controlled copies
- Shows error toast notification

### 4. Translation Files
- Added `notifications.documentDeletedError` key in English and Spanish
- Message: "This document has been deleted and is no longer available"

## Manual Testing Steps

1. **Setup**: Ensure a document exists in the system that can be deleted
2. **Delete the document** using the server API
3. **Try to access the document** via the UI
4. **Verify** the error message appears and redirect occurs

## Notes
- The 410 status code is specifically for resources that have been intentionally deleted
- This is different from 404 (Not Found) which could mean the document never existed
- The toast notification gives users immediate feedback before the redirect