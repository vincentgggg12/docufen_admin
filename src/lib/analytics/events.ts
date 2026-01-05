/**
 * Amplitude Analytics Event Constants and Types
 * 
 * This file defines all analytics events used throughout the application.
 * Follow the naming convention: {object}_{action}_{context} in snake_case
 */

// Event name constants - single source of truth
export const AMPLITUDE_EVENTS = {
  // Authentication Events
  USER_LOGIN_INITIATED: 'user_login_initiated',
  USER_LOGIN_SUCCESS: 'user_login_success',
  USER_LOGIN_FAILED: 'user_login_failed',
  USER_LOGOUT: 'user_logout',
  USER_SESSION_EXPIRED: 'user_session_expired',
  USER_SESSION_EXTENDED: 'user_session_extended',
  USER_SESSION_REDIRECTED: 'user_session_redirected',
  
  // Access Control & Status Events
  USER_ACCESS_DENIED: 'user_access_denied',
  USER_DEACTIVATED_ACCESS: 'user_deactivated_access',
  USER_NOT_INVITED_ACCESS: 'user_not_invited_access',
  DIGITAL_SIGNATURE_UNVERIFIED: 'digital_signature_unverified',
  TRIAL_EXPIRED_ACCESS: 'trial_expired_access',
  
  // Compliance Events
  ERSD_AGREEMENT_VIEWED: 'ersd_agreement_viewed',
  ERSD_AGREEMENT_ACCEPTED: 'ersd_agreement_accepted',
  ERSD_AGREEMENT_DECLINED: 'ersd_agreement_declined',
  ERSD_RESET_TRIGGERED: 'ersd_reset_triggered',
  
  // Navigation Events
  PAGE_VIEWED: 'page_viewed',
  TAB_SWITCHED: 'tab_switched',
  SIDEBAR_TOGGLED: 'sidebar_toggled',
  SEARCH_PERFORMED: 'search_performed',
  FILTER_APPLIED: 'filter_applied',
  
  // Document Lifecycle Events
  DOCUMENT_CREATED: 'document_created',
  DOCUMENT_OPENED: 'document_opened',
  DOCUMENT_EDITED: 'document_edited',
  DOCUMENT_SAVED: 'document_saved',
  DOCUMENT_DELETED: 'document_deleted',
  DOCUMENT_EXPORTED: 'document_exported',
  DOCUMENT_DOWNLOADED: 'document_downloaded',
  DOCUMENT_SHARED: 'document_shared',
  DOCUMENT_FAVORITED: 'document_favorited',
  DOCUMENT_UNFAVORITED: 'document_unfavorited',
  
  // Document Workflow Events
  DOCUMENT_STAGE_CHANGED: 'document_stage_changed',
  DOCUMENT_STAGE_REVERTED: 'document_stage_reverted',
  DOCUMENT_SIGNED: 'document_signed',
  DOCUMENT_VOIDED: 'document_voided',
  DOCUMENT_COMPLETED: 'document_completed',
  DOCUMENT_REOPENED: 'document_reopened',
  DOCUMENT_LOCKED: 'document_locked',
  DOCUMENT_UNLOCKED: 'document_unlocked',
  
  // Document Content Events
  TEXT_INSERTED: 'text_inserted',
  QUICK_TEXT_INSERTED: 'quick_text_inserted',
  NOTE_ADDED: 'note_added',
  ATTACHMENT_UPLOADED: 'attachment_uploaded',
  ATTACHMENT_LINKED: 'attachment_linked',
  ATTACHMENT_DELETED: 'attachment_deleted',
  ATTACHMENT_DRAWER_OPENED: 'attachment_drawer_opened',
  ATTACHMENT_DRAWER_CLOSED: 'attachment_drawer_closed',
  CORRECTION_MADE: 'correction_made',
  CHECKBOX_TOGGLED: 'checkbox_toggled',
  LATE_ENTRY_TOGGLED: 'late_entry_toggled',
  MASTER_POPUP_OPENED: 'master_popup_opened',
  MASTER_POPUP_CLOSED: 'master_popup_closed',
  MASTER_POPUP_TAB_SWITCHED: 'master_popup_tab_switched',
  BULK_NA_MODE_TOGGLED: 'bulk_na_mode_toggled',
  CURSOR_POSITION_INVALID: 'cursor_position_invalid',

  // User Management Events
  USER_CREATED: 'user_created',
  USER_UPDATED: 'user_updated',
  USER_DEACTIVATED: 'user_deactivated',
  USER_REACTIVATED: 'user_reactivated',
  USER_ROLE_CHANGED: 'user_role_changed',
  USER_PERMISSIONS_UPDATED: 'user_permissions_updated',
  USER_SIGNATURE_VERIFIED: 'user_signature_verified',
  USER_SIGNATURE_REVOKED: 'user_signature_revoked',
  
  // Chat/Collaboration Events
  CHAT_MESSAGE_SENT: 'chat_message_sent',
  CHAT_MESSAGE_DELETED: 'chat_message_deleted',
  USER_MENTIONED: 'user_mentioned',
  
  // Setup Wizard Events
  SETUP_WIZARD_STARTED: 'setup_wizard_started',
  SETUP_WIZARD_STEP_COMPLETED: 'setup_wizard_step_completed',
  SETUP_WIZARD_COMPLETED: 'setup_wizard_completed',
  SETUP_WIZARD_ABANDONED: 'setup_wizard_abandoned',
  TRIAL_ACTIVATION_INITIATED: 'trial_activation_initiated',
  TRIAL_ACTIVATION_SUCCEEDED: 'trial_activation_succeeded',
  TRIAL_ACTIVATION_FAILED: 'trial_activation_failed',
  TENANT_PROVISIONING_STARTED: 'tenant_provisioning_started',
  TENANT_PROVISIONING_COMPLETED: 'tenant_provisioning_completed',
  USER_MANAGER_ADDED: 'user_manager_added',
  USER_MANAGER_REMOVED: 'user_manager_removed',
  
  // Organization/Account Events
  ORGANIZATION_CREATED: 'organization_created',
  ORGANIZATION_UPDATED: 'organization_updated',
  ORGANIZATION_SWITCHED: 'organization_switched',
  TRIAL_STARTED: 'trial_started',
  TRIAL_EXPIRED: 'trial_expired',
  LICENSE_ACTIVATED: 'license_activated',
  SUBSCRIPTION_UPDATED: 'subscription_updated',
  COMPANY_LOGO_UPLOADED: 'company_logo_uploaded',
  COMPANY_LOGO_REMOVED: 'company_logo_removed',
  DIGITAL_SIGNATURES_ENFORCEMENT_TOGGLED: 'digital_signatures_enforcement_toggled',
  ERSD_TEXT_UPDATED: 'ersd_text_updated',
  LICENSE_ACTIVATION_ATTEMPTED: 'license_activation_attempted',
  LICENSE_ACTIVATION_REDIRECT: 'license_activation_redirect',
  
  // Analytics/Billing Events
  BILLING_TAB_VIEWED: 'billing_tab_viewed',
  BILLING_METRICS_VIEWED: 'billing_metrics_viewed',
  BILLING_TRANSACTIONS_VIEWED: 'billing_transactions_viewed',
  BILLING_ROI_VIEWED: 'billing_roi_viewed',
  BILLING_EXPORT_INITIATED: 'billing_export_initiated',
  BILLING_EXPORT_COMPLETED: 'billing_export_completed',
  BILLING_TIME_RANGE_CHANGED: 'billing_time_range_changed',
  BILLING_MONTH_SELECTED: 'billing_month_selected',
  BILLING_FILTER_APPLIED: 'billing_filter_applied',
  ROI_COST_CONFIGURED: 'roi_cost_configured',
  ROI_PAPER_COST_UPDATED: 'roi_paper_cost_updated',
  ROI_INVESTMENT_COST_UPDATED: 'roi_investment_cost_updated',
  ROI_ESTIMATED_PAGES_UPDATED: 'roi_estimated_pages_updated',
  ROI_MODAL_OPENED: 'roi_modal_opened',
  ROI_MODAL_CLOSED: 'roi_modal_closed',
  ROI_CALCULATION_VIEWED: 'roi_calculation_viewed',
  ROI_EXTERNAL_CALCULATOR_CLICKED: 'roi_external_calculator_clicked',
  
  // Document Workflow Events (Extended)
  DOCUMENT_PARTICIPANT_ADDED: 'document_participant_added',
  DOCUMENT_PARTICIPANT_REMOVED: 'document_participant_removed',
  DOCUMENT_OWNER_CHANGED: 'document_owner_changed',
  DOCUMENT_VIEWER_ADDED: 'document_viewer_added',
  DOCUMENT_VIEWER_REMOVED: 'document_viewer_removed',
  DOCUMENT_SIGNING_ORDER_SET: 'document_signing_order_set',
  DOCUMENT_EMAIL_INVITE_SENT: 'document_email_invite_sent',
  DOCUMENT_CONTROLLED_COPY_CREATED: 'document_controlled_copy_created',
  DOCUMENT_PRACTICE_CREATED: 'document_practice_created',
  DOCUMENT_TRUE_COPY_VERIFIED: 'document_true_copy_verified',
  DOCUMENT_LATE_ENTRY_MADE: 'document_late_entry_made',
  DOCUMENT_BULK_NA_APPLIED: 'document_bulk_na_applied',
  DOCUMENT_PDF_GENERATED: 'document_pdf_generated',
  DOCUMENT_AUDIT_LOG_VIEWED: 'document_audit_log_viewed',
  DOCUMENT_AUDIT_LOG_EXPORTED: 'document_audit_log_exported',
  
  // Compliance Events
  NONCONFORMANCE_CREATED: 'nonconformance_created',
  NONCONFORMANCE_RESOLVED: 'nonconformance_resolved',
  DEVIATION_CREATED: 'deviation_created',
  TEMPLATE_CREATED: 'template_created',
  TEMPLATE_USED: 'template_used',
  
  // Additional Document Events
  DOCUMENT_PARTICIPANTS_UPDATED: 'document_participants_updated',
  DOCUMENT_STAGE_ADVANCED: 'document_stage_advanced',
  DOCUMENT_REFRESHED: 'document_refreshed',
  DOCUMENT_FINALIZED: 'document_finalized',
  ATTACHMENT_VIEWED: 'attachment_viewed',
  ATTACHMENT_VERIFIED: 'attachment_verified',
  AUDIT_LOG_VIEWED: 'audit_log_viewed',
  
  // Account & Settings Events
  COMPANY_INFO_UPDATED: 'company_info_updated',
  SETTING_CHANGED: 'setting_changed',
  
  // Billing Events
  BILLING_ACTION_INITIATED: 'billing_action_initiated',
  BILLING_ACTION_COMPLETED: 'billing_action_completed',
  REPORT_EXPORTED: 'report_exported',
  
  // User Management Events
  USER_INVITED: 'user_invited',
  USER_DETAILS_VIEWED: 'user_details_viewed',
  
  // Error Events
  ERROR_OCCURRED: 'error_occurred',
  API_ERROR: 'api_error',
  VALIDATION_ERROR: 'validation_error',
  ERROR_RECOVERY_ATTEMPTED: 'error_recovery_attempted',
  
  // Support Events
  SUPPORT_CONTACTED: 'support_contacted',
  
  // Feature Discovery Events
  FEATURE_DISCOVERED: 'feature_discovered',
  TOOLTIP_VIEWED: 'tooltip_viewed',
  HELP_ACCESSED: 'help_accessed',
  DEMO_DOCUMENT_CREATED: 'demo_document_created',
  
  // UI Interaction Events
  BUTTON_CLICKED: 'button_clicked',
  DROPDOWN_SELECTED: 'dropdown_selected',
  MODAL_OPENED: 'modal_opened',
  MODAL_CLOSED: 'modal_closed',
  DIALOG_CONFIRMED: 'dialog_confirmed',
  DIALOG_CANCELLED: 'dialog_cancelled',
  FORM_SUBMITTED: 'form_submitted',
  FORM_VALIDATION_FAILED: 'form_validation_failed',
  
  // Performance Events
  SLOW_OPERATION: 'slow_operation',
  OPERATION_TIMED_OUT: 'operation_timed_out',
} as const;

// Type for all event names
export type AmplitudeEventName = typeof AMPLITUDE_EVENTS[keyof typeof AMPLITUDE_EVENTS];

// Common property types used across multiple events
export interface CommonEventProperties {
  environment?: string;
  app_version?: string;
  timestamp?: string;
  session_id?: string;
  user_role?: string;
  organization_id?: string;
  tenant_id?: string;
}

// Document stages enum
export type DocumentStage = 'pre_approval' | 'execution' | 'post_approval' | 'completed' | 'closed';

// Type-safe event property interfaces
export interface AmplitudeEventProperties {
  // Authentication Events
  [AMPLITUDE_EVENTS.USER_LOGIN_INITIATED]: {
    login_method: 'microsoft';
    page: string;
  } & CommonEventProperties;
  
  [AMPLITUDE_EVENTS.USER_LOGIN_SUCCESS]: {
    login_method: 'microsoft';
    user_id: string;
    is_new_user: boolean;
    login_duration_ms?: number;
    user_email?: string; // hashed
    organization_name?: string;
  } & CommonEventProperties;
  
  [AMPLITUDE_EVENTS.USER_LOGIN_FAILED]: {
    login_method: 'microsoft';
    error_code: string;
    error_message: string;
    retry_attempt: number;
  } & CommonEventProperties;
  
  [AMPLITUDE_EVENTS.USER_LOGOUT]: {
    logout_reason: 'manual' | 'session_expired' | 'forced';
    session_duration_ms?: number;
  } & CommonEventProperties;
  
  [AMPLITUDE_EVENTS.USER_SESSION_REDIRECTED]: {
    redirect_reason: string;
    from_page: string;
    to_page: string;
  } & CommonEventProperties;
  
  // Access Control Events
  [AMPLITUDE_EVENTS.USER_ACCESS_DENIED]: {
    denial_reason: 'not_invited' | 'deactivated' | 'no_permission' | 'trial_expired';
    attempted_page: string;
  } & CommonEventProperties;
  
  [AMPLITUDE_EVENTS.USER_DEACTIVATED_ACCESS]: {
    user_id: string;
    redirect_page: string;
  } & CommonEventProperties;
  
  [AMPLITUDE_EVENTS.USER_NOT_INVITED_ACCESS]: {
    email_domain: string;
    redirect_page: string;
  } & CommonEventProperties;
  
  [AMPLITUDE_EVENTS.DIGITAL_SIGNATURE_UNVERIFIED]: {
    user_id: string;
    verification_required: boolean;
  } & CommonEventProperties;
  
  [AMPLITUDE_EVENTS.TRIAL_EXPIRED_ACCESS]: {
    days_expired: number;
    trial_duration_days: number;
  } & CommonEventProperties;
  
  // Compliance Events
  [AMPLITUDE_EVENTS.ERSD_AGREEMENT_VIEWED]: {
    language: string;
    is_custom_text: boolean;
  } & CommonEventProperties;
  
  [AMPLITUDE_EVENTS.ERSD_AGREEMENT_ACCEPTED]: {
    language: string;
    agreement_version: string;
  } & CommonEventProperties;
  
  [AMPLITUDE_EVENTS.ERSD_AGREEMENT_DECLINED]: {
    language: string;
  } & CommonEventProperties;
  
  [AMPLITUDE_EVENTS.ERSD_RESET_TRIGGERED]: {
    user_id: string;
    reset_by_user_id: string;
  } & CommonEventProperties;
  
  // Navigation Events
  [AMPLITUDE_EVENTS.PAGE_VIEWED]: {
    page_name: string;
    page_path: string;
    referrer?: string;
    query_params?: Record<string, string>;
    previous_page?: string;
  } & CommonEventProperties;
  
  [AMPLITUDE_EVENTS.TAB_SWITCHED]: {
    from_tab: string;
    to_tab: string;
    tab_group: string;
    page_name: string;
  } & CommonEventProperties;
  
  [AMPLITUDE_EVENTS.SIDEBAR_TOGGLED]: {
    action: 'opened' | 'closed';
    sidebar_type: 'left' | 'right';
    trigger_source: string;
    page_name: string;
  } & CommonEventProperties;
  
  [AMPLITUDE_EVENTS.SEARCH_PERFORMED]: {
    search_query: string;
    search_type: 'documents' | 'users' | 'in_document' | 'connector_queue';
    results_count: number;
    page_name: string;
  } & CommonEventProperties;
  
  // Document Events
  [AMPLITUDE_EVENTS.DOCUMENT_CREATED]: {
    document_id: string;
    document_name: string;
    document_type: string;
    document_category: string;
    creation_method: 'upload' | 'template' | 'blank' | 'practice';
    file_size_mb?: number;
    file_extension?: string;
  } & CommonEventProperties;
  
  [AMPLITUDE_EVENTS.DOCUMENT_OPENED]: {
    document_id: string;
    document_name: string;
    document_stage: DocumentStage;
    open_source: string; // where user clicked to open
    is_favorite: boolean;
  } & CommonEventProperties;
  
  [AMPLITUDE_EVENTS.DOCUMENT_STAGE_CHANGED]: {
    document_id: string;
    document_name: string;
    from_stage: DocumentStage;
    to_stage: DocumentStage;
    change_reason?: string;
    signatures_complete: boolean;
  } & CommonEventProperties;
  
  [AMPLITUDE_EVENTS.DOCUMENT_SIGNED]: {
    document_id: string;
    document_name: string;
    signature_role: string;
    signature_type: 'prepared_by' | 'reviewed_by' | 'approved_by' | 'custom';
    custom_reason?: string;
    document_stage: DocumentStage;
  } & CommonEventProperties;
  
  // Document Content Events
  [AMPLITUDE_EVENTS.TEXT_INSERTED]: {
    document_id: string;
    document_name: string;
    text_content: string;
    text_length: number;
    insertion_method: 'typed' | 'quick_button' | 'paste';
    document_stage: DocumentStage;
    cell_location?: string;
  } & CommonEventProperties;
  
  [AMPLITUDE_EVENTS.QUICK_TEXT_INSERTED]: {
    document_id: string;
    document_name: string;
    button_text: string;
    button_category: 'yes_no' | 'pass_fail' | 'na' | 'initials' | 'date_time' | 'custom';
    document_stage: DocumentStage;
    bulk_mode?: boolean;
  } & CommonEventProperties;
  
  [AMPLITUDE_EVENTS.NOTE_ADDED]: {
    document_id: string;
    document_name: string;
    note_id: string;
    note_length: number;
    note_type: 'comment' | 'quick_note';
    has_mention: boolean;
    mentioned_users?: string[];
    document_stage: DocumentStage;
  } & CommonEventProperties;
  
  [AMPLITUDE_EVENTS.ATTACHMENT_UPLOADED]: {
    document_id: string;
    document_name: string;
    attachment_id: string;
    attachment_name: string;
    file_type: string;
    file_size_mb: number;
    upload_duration_ms?: number;
    document_stage: DocumentStage;
  } & CommonEventProperties;
  
  [AMPLITUDE_EVENTS.ATTACHMENT_LINKED]: {
    document_id: string;
    document_name: string;
    linked_document_id: string;
    linked_document_name: string;
    document_stage: DocumentStage;
  } & CommonEventProperties;
  
  [AMPLITUDE_EVENTS.ATTACHMENT_DELETED]: {
    document_id: string;
    document_name: string;
    attachment_id: string;
    attachment_name: string;
    deletion_reason?: string;
    document_stage: DocumentStage;
  } & CommonEventProperties;
  
  [AMPLITUDE_EVENTS.ATTACHMENT_DRAWER_OPENED]: {
    document_id: string;
    attachment_id: string;
    attachment_name: string;
    open_source: string;
  } & CommonEventProperties;
  
  [AMPLITUDE_EVENTS.ATTACHMENT_DRAWER_CLOSED]: {
    document_id: string;
    attachment_id: string;
    time_open_ms: number;
  } & CommonEventProperties;
  
  [AMPLITUDE_EVENTS.CORRECTION_MADE]: {
    document_id: string;
    document_name: string;
    original_text: string;
    corrected_text: string;
    correction_reason: string;
    is_late_entry: boolean;
    late_entry_date?: string;
    document_stage: DocumentStage;
  } & CommonEventProperties;
  
  [AMPLITUDE_EVENTS.CHECKBOX_TOGGLED]: {
    document_id: string;
    document_name: string;
    checkbox_id: string;
    new_state: boolean;
    document_stage: DocumentStage;
    cell_location?: string;
  } & CommonEventProperties;
  
  [AMPLITUDE_EVENTS.LATE_ENTRY_TOGGLED]: {
    document_id: string;
    document_name: string;
    enabled: boolean;
    document_stage: DocumentStage;
  } & CommonEventProperties;
  
  [AMPLITUDE_EVENTS.MASTER_POPUP_OPENED]: {
    document_id: string;
    document_name: string;
    document_stage: DocumentStage;
    open_trigger: 'selection' | 'button' | 'keyboard_shortcut';
    initial_tab?: string;
  } & CommonEventProperties;
  
  [AMPLITUDE_EVENTS.MASTER_POPUP_CLOSED]: {
    document_id: string;
    document_name: string;
    document_stage: DocumentStage;
    time_open_ms: number;
    close_method: 'button' | 'escape' | 'click_outside';
  } & CommonEventProperties;
  
  [AMPLITUDE_EVENTS.MASTER_POPUP_TAB_SWITCHED]: {
    document_id: string;
    document_name: string;
    from_tab: string;
    to_tab: string;
    document_stage: DocumentStage;
  } & CommonEventProperties;
  
  [AMPLITUDE_EVENTS.BULK_NA_MODE_TOGGLED]: {
    document_id: string;
    document_name: string;
    enabled: boolean;
    document_stage: DocumentStage;
  } & CommonEventProperties;

  [AMPLITUDE_EVENTS.CURSOR_POSITION_INVALID]: {
    document_id: string;
    document_name: string;
    document_stage: DocumentStage;
    error_type: 'in_user_content' | 'in_system_content' | 'invalid_position';
    component: 'sign' | 'insert' | 'master_popup' | 'attach';
    action_attempted: 'signature' | 'text' | 'attachment' | 'document_link';
  } & CommonEventProperties;

  // User Management Events
  [AMPLITUDE_EVENTS.USER_CREATED]: {
    created_user_id: string;
    created_user_role: string;
    created_user_type: 'internal' | 'external';
    invitation_sent: boolean;
    created_by_user_id: string;
  } & CommonEventProperties;
  
  [AMPLITUDE_EVENTS.USER_SIGNATURE_VERIFIED]: {
    verified_user_id: string;
    verification_method: 'image' | 'notation' | 'microsoft';
    verified_by_user_id: string;
  } & CommonEventProperties;
  
  // Error Events
  [AMPLITUDE_EVENTS.ERROR_OCCURRED]: {
    error_type: string;
    error_code: string;
    error_message: string;
    error_source: string;
    page_name: string;
    action_attempted: string;
    stack_trace?: string;
    component_stack?: string;
  } & CommonEventProperties;
  
  [AMPLITUDE_EVENTS.API_ERROR]: {
    endpoint: string;
    method: string;
    status_code: number;
    error_message: string;
    request_duration_ms: number;
  } & CommonEventProperties;
  
  [AMPLITUDE_EVENTS.ERROR_RECOVERY_ATTEMPTED]: {
    error_type: string;
    recovery_action: string;
    page_name: string;
    success: boolean;
  } & CommonEventProperties;
  
  // Support Events
  [AMPLITUDE_EVENTS.SUPPORT_CONTACTED]: {
    contact_method: string;
    issue_type: string;
    page_name: string;
    with_screenshot: boolean;
  } & CommonEventProperties;
  
  // Setup Wizard Events
  [AMPLITUDE_EVENTS.SETUP_WIZARD_STARTED]: {
    entry_point: string;
  } & CommonEventProperties;
  
  [AMPLITUDE_EVENTS.SETUP_WIZARD_STEP_COMPLETED]: {
    step_number: number;
    step_name: string;
    time_on_step_ms: number;
  } & CommonEventProperties;
  
  [AMPLITUDE_EVENTS.SETUP_WIZARD_COMPLETED]: {
    total_duration_ms: number;
    company_locale: string;
    user_managers_count: number;
  } & CommonEventProperties;
  
  [AMPLITUDE_EVENTS.SETUP_WIZARD_ABANDONED]: {
    last_step_completed: number;
    abandon_reason?: string;
  } & CommonEventProperties;
  
  [AMPLITUDE_EVENTS.TRIAL_ACTIVATION_INITIATED]: {} & CommonEventProperties;
  
  [AMPLITUDE_EVENTS.TRIAL_ACTIVATION_SUCCEEDED]: {
    trial_duration_days: number;
  } & CommonEventProperties;
  
  [AMPLITUDE_EVENTS.TRIAL_ACTIVATION_FAILED]: {
    error_message: string;
  } & CommonEventProperties;
  
  [AMPLITUDE_EVENTS.TENANT_PROVISIONING_STARTED]: {} & CommonEventProperties;
  
  [AMPLITUDE_EVENTS.TENANT_PROVISIONING_COMPLETED]: {
    provisioning_duration_ms: number;
  } & CommonEventProperties;
  
  [AMPLITUDE_EVENTS.USER_MANAGER_ADDED]: {
    manager_email: string;
    manager_name: string;
  } & CommonEventProperties;
  
  [AMPLITUDE_EVENTS.USER_MANAGER_REMOVED]: {
    manager_email: string;
  } & CommonEventProperties;
  
  // Account Management Events
  [AMPLITUDE_EVENTS.COMPANY_LOGO_UPLOADED]: {
    file_size_kb: number;
    file_type: string;
  } & CommonEventProperties;
  
  [AMPLITUDE_EVENTS.COMPANY_LOGO_REMOVED]: {} & CommonEventProperties;
  
  [AMPLITUDE_EVENTS.DIGITAL_SIGNATURES_ENFORCEMENT_TOGGLED]: {
    enabled: boolean;
  } & CommonEventProperties;
  
  [AMPLITUDE_EVENTS.ERSD_TEXT_UPDATED]: {
    language: string;
    text_length: number;
  } & CommonEventProperties;
  
  [AMPLITUDE_EVENTS.LICENSE_ACTIVATION_ATTEMPTED]: {
    activation_method: 'azure_marketplace' | 'stripe';
  } & CommonEventProperties;
  
  [AMPLITUDE_EVENTS.LICENSE_ACTIVATION_REDIRECT]: {
    redirect_type: 'success' | 'cancel';
    activation_method: 'azure_marketplace' | 'stripe';
  } & CommonEventProperties;
  
  // Analytics/Billing Events
  [AMPLITUDE_EVENTS.BILLING_TAB_VIEWED]: {
    tab_name: 'page_metrics' | 'billing_transactions' | 'roi_analytics';
  } & CommonEventProperties;
  
  [AMPLITUDE_EVENTS.BILLING_METRICS_VIEWED]: {
    time_period: string;
    total_pages: number;
  } & CommonEventProperties;
  
  [AMPLITUDE_EVENTS.BILLING_TRANSACTIONS_VIEWED]: {
    month_selected: string;
    transaction_count: number;
  } & CommonEventProperties;
  
  [AMPLITUDE_EVENTS.BILLING_ROI_VIEWED]: {
    month_selected: string;
    roi_percentage: number;
    savings_amount: number;
  } & CommonEventProperties;
  
  [AMPLITUDE_EVENTS.BILLING_EXPORT_INITIATED]: {
    export_type: 'csv';
    tab_name: string;
  } & CommonEventProperties;
  
  [AMPLITUDE_EVENTS.BILLING_EXPORT_COMPLETED]: {
    export_type: 'csv';
    row_count: number;
  } & CommonEventProperties;
  
  [AMPLITUDE_EVENTS.BILLING_TIME_RANGE_CHANGED]: {
    from_range: string;
    to_range: string;
    tab_name: string;
  } & CommonEventProperties;
  
  [AMPLITUDE_EVENTS.BILLING_MONTH_SELECTED]: {
    month: string;
    tab_name: string;
  } & CommonEventProperties;
  
  [AMPLITUDE_EVENTS.BILLING_FILTER_APPLIED]: {
    filter_type: string;
    filter_value: string;
  } & CommonEventProperties;
  
  [AMPLITUDE_EVENTS.ROI_COST_CONFIGURED]: {
    old_cost_per_page: number;
  } & CommonEventProperties;
  
  [AMPLITUDE_EVENTS.ROI_PAPER_COST_UPDATED]: {
    paper_cost_per_page: number;
    currency: 'USD' | 'EUR';
  } & CommonEventProperties;
  
  [AMPLITUDE_EVENTS.ROI_INVESTMENT_COST_UPDATED]: {
    investment_cost: number;
    currency: 'USD' | 'EUR';
  } & CommonEventProperties;
  
  [AMPLITUDE_EVENTS.ROI_ESTIMATED_PAGES_UPDATED]: {
    estimated_monthly_pages: number;
    previous_value?: number;
  } & CommonEventProperties;
  
  [AMPLITUDE_EVENTS.ROI_MODAL_OPENED]: {
    modal_type: 'paper_cost' | 'investment_cost' | 'estimated_pages';
    trigger_source: string;
  } & CommonEventProperties;
  
  [AMPLITUDE_EVENTS.ROI_MODAL_CLOSED]: {
    modal_type: 'paper_cost' | 'investment_cost' | 'estimated_pages';
    close_method: 'save' | 'cancel' | 'backdrop';
    value_changed: boolean;
  } & CommonEventProperties;
  
  [AMPLITUDE_EVENTS.ROI_CALCULATION_VIEWED]: {
    paper_cost_per_page: number;
    investment_cost: number;
    estimated_monthly_pages: number;
    monthly_savings: number;
    break_even_months: number;
    three_year_roi: number;
    currency: 'USD' | 'EUR';
  } & CommonEventProperties;
  
  [AMPLITUDE_EVENTS.ROI_EXTERNAL_CALCULATOR_CLICKED]: {
    source: 'paper_cost_modal';
    destination_url: string;
  } & CommonEventProperties;
  
  // Extended Document Workflow Events
  [AMPLITUDE_EVENTS.DOCUMENT_PARTICIPANT_ADDED]: {
    document_id: string;
    participant_id: string;
    participant_role: string;
    stage: DocumentStage;
  } & CommonEventProperties;
  
  [AMPLITUDE_EVENTS.DOCUMENT_PARTICIPANT_REMOVED]: {
    document_id: string;
    participant_id: string;
    participant_role: string;
    stage: DocumentStage;
  } & CommonEventProperties;
  
  [AMPLITUDE_EVENTS.DOCUMENT_OWNER_CHANGED]: {
    document_id: string;
    new_owner_id: string;
    previous_owner_id: string;
  } & CommonEventProperties;
  
  [AMPLITUDE_EVENTS.DOCUMENT_VIEWER_ADDED]: {
    document_id: string;
    viewer_id: string;
  } & CommonEventProperties;
  
  [AMPLITUDE_EVENTS.DOCUMENT_VIEWER_REMOVED]: {
    document_id: string;
    viewer_id: string;
  } & CommonEventProperties;
  
  [AMPLITUDE_EVENTS.DOCUMENT_SIGNING_ORDER_SET]: {
    document_id: string;
    stage: DocumentStage;
    signers_count: number;
  } & CommonEventProperties;
  
  [AMPLITUDE_EVENTS.DOCUMENT_EMAIL_INVITE_SENT]: {
    document_id: string;
    recipient_email_domain: string;
    invite_type: string;
  } & CommonEventProperties;
  
  [AMPLITUDE_EVENTS.DOCUMENT_CONTROLLED_COPY_CREATED]: {
    source_document_id: string;
    new_document_id: string;
  } & CommonEventProperties;
  
  [AMPLITUDE_EVENTS.DOCUMENT_PRACTICE_CREATED]: {
    document_name: string;
    document_type: string;
  } & CommonEventProperties;
  
  [AMPLITUDE_EVENTS.DOCUMENT_TRUE_COPY_VERIFIED]: {
    document_id: string;
    verification_method: string;
  } & CommonEventProperties;
  
  [AMPLITUDE_EVENTS.DOCUMENT_LATE_ENTRY_MADE]: {
    document_id: string;
    entry_type: string;
    stage: DocumentStage;
  } & CommonEventProperties;
  
  [AMPLITUDE_EVENTS.DOCUMENT_BULK_NA_APPLIED]: {
    document_id: string;
    fields_count: number;
  } & CommonEventProperties;
  
  [AMPLITUDE_EVENTS.DOCUMENT_PDF_GENERATED]: {
    document_id: string;
    page_count: number;
    generation_time_ms: number;
  } & CommonEventProperties;
  
  [AMPLITUDE_EVENTS.DOCUMENT_AUDIT_LOG_VIEWED]: {
    document_id: string;
    entries_count: number;
  } & CommonEventProperties;
  
  [AMPLITUDE_EVENTS.DOCUMENT_AUDIT_LOG_EXPORTED]: {
    document_id: string;
    export_format: string;
  } & CommonEventProperties;
  
  // UI Interaction Events
  [AMPLITUDE_EVENTS.BUTTON_CLICKED]: {
    button_name: string;
    button_location: string;
    page_name: string;
    destination_url?: string;
  } & CommonEventProperties;
  
  [AMPLITUDE_EVENTS.DROPDOWN_SELECTED]: {
    dropdown_name: string;
    selected_value: string;
    page_name: string;
  } & CommonEventProperties;
  
  [AMPLITUDE_EVENTS.MODAL_OPENED]: {
    modal_name: string;
    trigger_source: string;
    page_name: string;
  } & CommonEventProperties;
  
  [AMPLITUDE_EVENTS.MODAL_CLOSED]: {
    modal_name: string;
    close_method: 'button' | 'escape' | 'backdrop' | 'save' | 'cancel';
    time_open_ms: number;
  } & CommonEventProperties;
  
  [AMPLITUDE_EVENTS.DIALOG_CONFIRMED]: {
    dialog_type: string;
    action_confirmed: string;
    page_name: string;
  } & CommonEventProperties;
  
  [AMPLITUDE_EVENTS.DIALOG_CANCELLED]: {
    dialog_type: string;
    action_cancelled: string;
    page_name: string;
  } & CommonEventProperties;
  
  [AMPLITUDE_EVENTS.FORM_SUBMITTED]: {
    form_name: string;
    fields_count: number;
    validation_duration_ms?: number;
    page_name: string;
  } & CommonEventProperties;
  
  [AMPLITUDE_EVENTS.FORM_VALIDATION_FAILED]: {
    form_name: string;
    error_fields: string[];
    error_count: number;
    page_name: string;
  } & CommonEventProperties;
  
  [AMPLITUDE_EVENTS.DEMO_DOCUMENT_CREATED]: {
    demo_type: string;
    document_name: string;
  } & CommonEventProperties;
  
  // Additional Document Events
  [AMPLITUDE_EVENTS.DOCUMENT_PARTICIPANTS_UPDATED]: {
    document_id: string;
    document_name: string;
    participant_group: string;
    participants_added: number;
    participants_removed: number;
    total_participants: number;
  } & CommonEventProperties;
  
  [AMPLITUDE_EVENTS.DOCUMENT_STAGE_ADVANCED]: {
    document_id: string;
    document_name: string;
    from_stage: DocumentStage;
    to_stage: DocumentStage;
    trigger_source: string;
  } & CommonEventProperties;
  
  [AMPLITUDE_EVENTS.DOCUMENT_REFRESHED]: {
    document_id: string;
    document_name: string;
    refresh_source: string;
    document_status: string;
    is_locked?: boolean;
  } & CommonEventProperties;
  
  [AMPLITUDE_EVENTS.DOCUMENT_FINALIZED]: {
    document_id: string;
    document_name: string;
    finalization_source: string;
    from_stage: DocumentStage;
  } & CommonEventProperties;
  
  [AMPLITUDE_EVENTS.ATTACHMENT_VIEWED]: {
    document_id: string;
    attachment_id: string;
    attachment_name: string;
    attachment_type: string;
    view_source: string;
  } & CommonEventProperties;
  
  [AMPLITUDE_EVENTS.ATTACHMENT_VERIFIED]: {
    document_id: string;
    attachment_id: string;
    attachment_name: string;
    verification_number: number;
  } & CommonEventProperties;
  
  [AMPLITUDE_EVENTS.AUDIT_LOG_VIEWED]: {
    document_id: string;
    document_name: string;
    log_entries_count: number;
    view_source: string;
  } & CommonEventProperties;
  
  // Account & Settings Events
  [AMPLITUDE_EVENTS.COMPANY_INFO_UPDATED]: {
    updated_fields: string[];
    has_logo_update: boolean;
    has_locale_update: boolean;
  } & CommonEventProperties;
  
  [AMPLITUDE_EVENTS.SETTING_CHANGED]: {
    setting_name: string;
    old_value: any;
    new_value: any;
    setting_category: string;
  } & CommonEventProperties;
  
  // Billing Events
  [AMPLITUDE_EVENTS.BILLING_ACTION_INITIATED]: {
    action_type: string;
    page_name: string;
  } & CommonEventProperties;
  
  [AMPLITUDE_EVENTS.BILLING_ACTION_COMPLETED]: {
    action_type: string;
    success: boolean;
    page_name: string;
  } & CommonEventProperties;
  
  [AMPLITUDE_EVENTS.REPORT_EXPORTED]: {
    report_type: string;
    export_format: string;
    date_range: string;
    filters_applied?: Record<string, any>;
  } & CommonEventProperties;
  
  // User Management Events
  [AMPLITUDE_EVENTS.USER_INVITED]: {
    invitee_email_domain: string;
    invitee_role: string;
    invitee_type?: string;
    invitation_method: string;
    has_view_all_access?: boolean;
    page_name: string;
  } & CommonEventProperties;
  
  [AMPLITUDE_EVENTS.USER_DETAILS_VIEWED]: {
    viewed_user_role: string;
    viewed_user_type: string;
    view_source: string;
    page_name: string;
  } & CommonEventProperties;
}

// Helper type to get properties for a specific event
export type EventProperties<T extends AmplitudeEventName> = 
  T extends keyof AmplitudeEventProperties 
    ? AmplitudeEventProperties[T] 
    : Record<string, any> & CommonEventProperties;

// Page name mapping for consistent naming
export const PAGE_NAMES = {
  '/login': 'Login',
  '/home': 'Home',
  '/documents': 'Documents',
  '/users': 'Users',
  '/account': 'Account',
  '/billing': 'Billing',
  '/compliance': 'Compliance',
  '/setup': 'Setup Wizard',
  '/ERSD': 'ERSD Agreement',
  '/trial-expired': 'Trial Expired',
  '/account-deactivated': 'Account Deactivated',
  '/notinvited': 'Not Invited',
  '/document': 'Document Editor',
  '/admin': 'Internal Admin',
} as const;

// Helper function to get page name from path
export function getPageNameFromPath(path: string): string {
  // Remove document ID from document paths
  const normalizedPath = path.replace(/\/document\/[^/]+/, '/document');
  
  // Find matching page name
  for (const [pathPattern, pageName] of Object.entries(PAGE_NAMES)) {
    if (normalizedPath.startsWith(pathPattern)) {
      return pageName;
    }
  }
  
  return 'Unknown Page';
}

// Event validation helper (for development)
export function validateEventProperties<T extends AmplitudeEventName>(
  eventName: T,
  _properties: EventProperties<T>
): boolean {
  // Check if the eventName is one of the valid event values
  const validEvents = Object.values(AMPLITUDE_EVENTS);
  if (!validEvents.includes(eventName)) {
    console.error(`Invalid event name: ${eventName}`);
    return false;
  }
  
  // Add more validation logic as needed
  return true;
}