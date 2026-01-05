# Amplitude Events Reference

This document provides a complete reference of all Amplitude events implemented in the Docufen application.

## Table of Contents
- [Authentication Events](#authentication-events)
- [Access Control Events](#access-control-events)
- [Compliance Events](#compliance-events)
- [Navigation Events](#navigation-events)
- [Document Lifecycle Events](#document-lifecycle-events)
- [Document Workflow Events](#document-workflow-events)
- [Document Content Events](#document-content-events)
- [User Management Events](#user-management-events)
- [Chat/Collaboration Events](#chatcollaboration-events)
- [Setup Wizard Events](#setup-wizard-events)
- [Organization/Account Events](#organizationaccount-events)
- [Analytics/Billing Events](#analyticsbilling-events)
- [Error Events](#error-events)
- [UI Interaction Events](#ui-interaction-events)
- [Performance Events](#performance-events)
- [Feature Discovery Events](#feature-discovery-events)

## Authentication Events

### USER_LOGIN_INITIATED
Fired when user clicks the login button
```typescript
{
  login_method: 'microsoft',
  page: string
}
```

### USER_LOGIN_SUCCESS
Fired when login completes successfully
```typescript
{
  login_method: 'microsoft',
  user_id: string,
  is_new_user: boolean,
  login_duration_ms?: number,
  user_email?: string, // domain only
  organization_name?: string
}
```

### USER_LOGIN_FAILED
Fired when login fails
```typescript
{
  login_method: 'microsoft',
  error_code: string,
  error_message: string,
  retry_attempt: number
}
```

### USER_LOGOUT
Fired when user logs out
```typescript
{
  logout_reason: 'manual' | 'session_expired' | 'forced',
  session_duration_ms?: number
}
```

### USER_SESSION_REDIRECTED
Fired when user is redirected due to authentication
```typescript
{
  redirect_reason: string,
  from_page: string,
  to_page: string
}
```

## Access Control Events

### USER_ACCESS_DENIED
Fired when user tries to access restricted content
```typescript
{
  denial_reason: 'not_invited' | 'deactivated' | 'no_permission' | 'trial_expired',
  attempted_page: string
}
```

### DIGITAL_SIGNATURE_UNVERIFIED
Fired when user lacks verified digital signature
```typescript
{
  user_id: string,
  verification_required: boolean
}
```

### TRIAL_EXPIRED_ACCESS
Fired when trial user tries to access after expiration
```typescript
{
  days_expired: number,
  trial_duration_days: number
}
```

## Compliance Events

### ERSD_AGREEMENT_VIEWED
Fired when ERSD agreement is displayed
```typescript
{
  language: string,
  is_custom_text: boolean
}
```

### ERSD_AGREEMENT_ACCEPTED
Fired when user accepts ERSD
```typescript
{
  language: string,
  agreement_version: string
}
```

### ERSD_AGREEMENT_DECLINED
Fired when user declines ERSD
```typescript
{
  language: string
}
```

## Navigation Events

### PAGE_VIEWED
Fired on every page navigation
```typescript
{
  page_name: string,
  page_path: string,
  referrer?: string,
  query_params?: Record<string, string>,
  previous_page?: string
}
```

### TAB_SWITCHED
Fired when switching tabs within a page
```typescript
{
  from_tab: string,
  to_tab: string,
  tab_group: string,
  page_name: string
}
```

### SIDEBAR_TOGGLED
Fired when sidebar is opened/closed
```typescript
{
  action: 'opened' | 'closed',
  sidebar_type: 'left' | 'right',
  trigger_source: string,
  page_name: string
}
```

### SEARCH_PERFORMED
Fired when search is executed (debounced)
```typescript
{
  search_query: string,
  search_type: 'documents' | 'users' | 'in_document',
  results_count: number,
  page_name: string
}
```

### FILTER_APPLIED
Fired when filters are changed
```typescript
{
  filter_type: string,
  filter_value: string,
  page_name: string
}
```

## Document Lifecycle Events

### DOCUMENT_CREATED
Fired when new document is created
```typescript
{
  document_id: string,
  document_name: string,
  document_type: string,
  document_category: string,
  creation_method: 'upload' | 'template' | 'blank' | 'practice',
  file_size_mb?: number,
  file_extension?: string
}
```

### DOCUMENT_OPENED
Fired when document is opened
```typescript
{
  document_id: string,
  document_name: string,
  document_stage: 'pre_approval' | 'execution' | 'post_approval' | 'completed' | 'closed',
  open_source: string,
  is_favorite: boolean
}
```

### DOCUMENT_EDITED
Fired when document metadata is edited
```typescript
{
  document_id: string,
  document_name: string,
  updated_fields: string,
  edit_source: string,
  page_name: string
}
```

### DOCUMENT_DELETED
Fired when document is deleted
```typescript
{
  document_id: string,
  document_name: string,
  document_stage: DocumentStage,
  deletion_source: string,
  page_name: string
}
```

### DOCUMENT_SIGNED
Fired when document is signed
```typescript
{
  document_id: string,
  document_name: string,
  signature_role: string,
  signature_type: 'prepared_by' | 'reviewed_by' | 'approved_by' | 'custom',
  custom_reason?: string,
  document_stage: DocumentStage
}
```

### DOCUMENT_FINALIZED
Fired when document is finalized
```typescript
{
  document_id: string,
  document_name: string,
  finalization_source: string,
  from_stage: DocumentStage
}
```

## Document Workflow Events

### DOCUMENT_STAGE_CHANGED
Fired when document moves between stages
```typescript
{
  document_id: string,
  document_name: string,
  from_stage: DocumentStage,
  to_stage: DocumentStage,
  change_reason?: string,
  signatures_complete: boolean
}
```

### DOCUMENT_STAGE_ADVANCED
Fired when document stage is advanced
```typescript
{
  document_id: string,
  document_name: string,
  from_stage: DocumentStage,
  to_stage: DocumentStage,
  trigger_source: string
}
```

### DOCUMENT_STAGE_REVERTED
Fired when document stage is reverted
```typescript
{
  document_id: string,
  document_name: string,
  from_stage: number,
  to_stage: number,
  reason: string,
  reason_length: number
}
```

### DOCUMENT_PARTICIPANTS_UPDATED
Fired when participants are added/removed
```typescript
{
  document_id: string,
  document_name: string,
  participant_group: string,
  participants_added: number,
  participants_removed: number,
  total_participants: number
}
```

### DOCUMENT_REFRESHED
Fired when document is refreshed
```typescript
{
  document_id: string,
  document_name: string,
  refresh_source: string,
  document_status: string,
  is_locked?: boolean
}
```

## Document Content Events

### TEXT_INSERTED
Fired when text is inserted into document
```typescript
{
  document_id: string,
  document_name: string,
  text_content: string,
  text_length: number,
  insertion_method: 'typed' | 'quick_button' | 'paste',
  document_stage: DocumentStage,
  cell_location?: string
}
```

### QUICK_TEXT_INSERTED
Fired when quick buttons (Yes/No/N/A etc) are clicked
```typescript
{
  document_id: string,
  document_name: string,
  button_text: string,
  button_category: 'yes_no' | 'pass_fail' | 'na' | 'initials' | 'date_time' | 'custom',
  document_stage: DocumentStage,
  bulk_mode?: boolean
}
```

### NOTE_ADDED
Fired when note is added
```typescript
{
  document_id: string,
  document_name: string,
  note_id: string,
  note_length: number,
  note_type: 'comment' | 'quick_note',
  has_mention: boolean,
  mentioned_users?: string[],
  document_stage: DocumentStage
}
```

### ATTACHMENT_UPLOADED
Fired when attachment is uploaded
```typescript
{
  document_id: string,
  document_name: string,
  attachment_id: string,
  attachment_name: string,
  file_type: string,
  file_size_mb: number,
  upload_duration_ms?: number,
  document_stage: DocumentStage
}
```

### ATTACHMENT_LINKED
Fired when existing document is linked as attachment
```typescript
{
  document_id: string,
  document_name: string,
  linked_document_id: string,
  linked_document_name: string,
  document_stage: DocumentStage
}
```

### ATTACHMENT_DELETED
Fired when attachment is removed
```typescript
{
  document_id: string,
  document_name: string,
  attachment_id: string,
  attachment_name: string,
  deletion_reason?: string,
  document_stage: DocumentStage
}
```

### ATTACHMENT_DRAWER_OPENED
Fired when attachment drawer is opened
```typescript
{
  document_id: string,
  attachment_id: string,
  attachment_name: string,
  open_source: string
}
```

### ATTACHMENT_DRAWER_CLOSED
Fired when attachment drawer is closed
```typescript
{
  document_id: string,
  attachment_id: string,
  time_open_ms: number
}
```

### ATTACHMENT_VIEWED
Fired when attachment is viewed
```typescript
{
  document_id: string,
  attachment_id: string,
  attachment_name: string,
  attachment_type: string,
  view_source: string
}
```

### ATTACHMENT_VERIFIED
Fired when attachment is verified
```typescript
{
  document_id: string,
  attachment_id: string,
  attachment_name: string,
  verification_number: number
}
```

### CHECKBOX_TOGGLED
Fired when checkbox state changes
```typescript
{
  document_id: string,
  document_name: string,
  checkbox_id: string,
  new_state: boolean,
  document_stage: DocumentStage,
  cell_location?: string
}
```

### CORRECTION_MADE
Fired when text correction is made
```typescript
{
  document_id: string,
  document_name: string,
  original_text: string,
  corrected_text: string,
  correction_reason: string,
  is_late_entry: boolean,
  late_entry_date?: string,
  document_stage: DocumentStage
}
```

### LATE_ENTRY_TOGGLED
Fired when late entry mode is toggled
```typescript
{
  document_id: string,
  document_name: string,
  enabled: boolean,
  document_stage: DocumentStage
}
```

### MASTER_POPUP_OPENED
Fired when master editor popup is opened
```typescript
{
  document_id: string,
  document_name: string,
  document_stage: DocumentStage,
  open_trigger: 'selection' | 'button' | 'keyboard_shortcut',
  initial_tab?: string
}
```

### MASTER_POPUP_CLOSED
Fired when master editor popup is closed
```typescript
{
  document_id: string,
  document_name: string,
  document_stage: DocumentStage,
  time_open_ms: number,
  close_method: 'button' | 'escape' | 'click_outside'
}
```

### MASTER_POPUP_TAB_SWITCHED
Fired when tab is switched in master popup
```typescript
{
  document_id: string,
  document_name: string,
  from_tab: string,
  to_tab: string,
  document_stage: DocumentStage
}
```

### BULK_NA_MODE_TOGGLED
Fired when bulk N/A mode is toggled
```typescript
{
  document_id: string,
  document_name: string,
  enabled: boolean,
  document_stage: DocumentStage
}
```

## User Management Events

### USER_CREATED
Fired when new user is created
```typescript
{
  created_user_id: string,
  created_user_role: string,
  created_user_type: 'internal' | 'external',
  invitation_sent: boolean,
  created_by_user_id: string
}
```

### USER_INVITED
Fired when user is invited
```typescript
{
  invitee_email_domain: string,
  invitee_role: string,
  invitee_type?: string,
  invitation_method: string,
  has_view_all_access?: boolean,
  page_name: string
}
```

### USER_DETAILS_VIEWED
Fired when user details are viewed
```typescript
{
  viewed_user_role: string,
  viewed_user_type: string,
  view_source: string,
  page_name: string
}
```

### USER_DEACTIVATED
Fired when user is deactivated
```typescript
{
  deactivated_user_id: string,
  deactivated_by_user_id: string,
  reason?: string
}
```

### USER_SIGNATURE_VERIFIED
Fired when digital signature is verified
```typescript
{
  verified_user_id: string,
  verification_method: 'image' | 'notation' | 'microsoft',
  verified_by_user_id: string
}
```

## Chat/Collaboration Events

### CHAT_MESSAGE_SENT
Fired when chat message is sent
```typescript
{
  document_id: string,
  message_length: number,
  has_attachment: boolean,
  has_mention: boolean,
  recipient_count: number
}
```

### USER_MENTIONED
Fired when user is mentioned
```typescript
{
  document_id: string,
  mentioned_user_id: string,
  mention_context: string,
  mentioner_user_id: string
}
```

## Setup Wizard Events

### SETUP_WIZARD_STARTED
Fired when setup wizard begins
```typescript
{
  entry_point: string
}
```

### SETUP_WIZARD_STEP_COMPLETED
Fired for each completed step
```typescript
{
  step_number: number,
  step_name: string,
  time_on_step_ms: number
}
```

### SETUP_WIZARD_COMPLETED
Fired when wizard is completed
```typescript
{
  total_duration_ms: number,
  company_locale: string,
  user_managers_count: number
}
```

### TRIAL_ACTIVATION_SUCCEEDED
Fired when trial is activated
```typescript
{
  trial_duration_days: number
}
```

## Organization/Account Events

### COMPANY_INFO_UPDATED
Fired when company information changes
```typescript
{
  updated_fields: string[],
  has_logo_update: boolean,
  has_locale_update: boolean
}
```

### COMPANY_LOGO_UPLOADED
Fired when logo is uploaded
```typescript
{
  file_size_kb: number,
  file_type: string
}
```

### SETTING_CHANGED
Fired when settings are modified
```typescript
{
  setting_name: string,
  old_value: any,
  new_value: any,
  setting_category: string
}
```

### DIGITAL_SIGNATURES_ENFORCEMENT_TOGGLED
Fired when signature requirement changes
```typescript
{
  enabled: boolean
}
```

## Analytics/Billing Events

### BILLING_TAB_VIEWED
Fired when billing tabs are viewed
```typescript
{
  tab_name: 'page_metrics' | 'billing_transactions' | 'roi_analytics'
}
```

### REPORT_EXPORTED
Fired when reports are exported
```typescript
{
  report_type: string,
  export_format: string,
  date_range: string,
  filters_applied?: Record<string, any>
}
```

### BILLING_ACTION_INITIATED
Fired when billing action starts
```typescript
{
  action_type: string,
  page_name: string
}
```

### BILLING_ACTION_COMPLETED
Fired when billing action completes
```typescript
{
  action_type: string,
  success: boolean,
  page_name: string
}
```

## Error Events

### ERROR_OCCURRED
General error tracking
```typescript
{
  error_type: string,
  error_code: string,
  error_message: string,
  error_source: string,
  page_name: string,
  action_attempted: string,
  stack_trace?: string
}
```

### API_ERROR
API-specific errors
```typescript
{
  endpoint: string,
  method: string,
  status_code: number,
  error_message: string,
  request_duration_ms: number
}
```

### VALIDATION_ERROR
Form validation errors
```typescript
{
  form_name: string,
  field_name: string,
  validation_type: string,
  error_message: string
}
```

## UI Interaction Events

### BUTTON_CLICKED
Fired for button interactions
```typescript
{
  button_name: string,
  button_location: string,
  page_name: string
}
```

### MODAL_OPENED
Fired when modals open
```typescript
{
  modal_name: string,
  trigger_source: string,
  page_name: string
}
```

### MODAL_CLOSED
Fired when modals close
```typescript
{
  modal_name: string,
  close_method: 'button' | 'escape' | 'backdrop' | 'save' | 'cancel',
  time_open_ms: number
}
```

### FORM_SUBMITTED
Fired on form submission
```typescript
{
  form_name: string,
  fields_count: number,
  validation_duration_ms?: number,
  page_name: string
}
```

## Performance Events

### SLOW_OPERATION
Fired for operations exceeding threshold
```typescript
{
  operation_name: string,
  duration_ms: number,
  threshold_ms: number
}
```

### OPERATION_TIMED_OUT
Fired when operations timeout
```typescript
{
  operation_name: string,
  timeout_duration_ms: number,
  retry_count: number
}
```

## Feature Discovery Events

### DEMO_DOCUMENT_CREATED
Fired when demo document is created
```typescript
{
  demo_type: string,
  document_name: string
}
```

### FEATURE_DISCOVERED
Fired when user discovers features
```typescript
{
  feature_name: string,
  discovery_method: string,
  time_to_discovery_ms?: number
}
```

### TOOLTIP_VIEWED
Fired when tooltips are viewed
```typescript
{
  tooltip_id: string,
  tooltip_content: string,
  page_name: string
}
```