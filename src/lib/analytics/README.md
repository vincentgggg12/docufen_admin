# Amplitude Analytics Implementation Guide

## Overview

This guide documents the Amplitude analytics implementation in the Docufen application. The implementation follows a privacy-first approach with comprehensive event tracking across all user interactions.

## Architecture

### Core Components

1. **AnalyticsProvider** (`amplitude.tsx`)
   - Initializes Amplitude SDK
   - Provides React context for analytics
   - Handles event queuing before initialization
   - Manages user identification

2. **Event Definitions** (`events.ts`)
   - Single source of truth for all event names
   - Type-safe event property interfaces
   - Follows naming convention: `{object}_{action}_{context}`

3. **Helper Functions** (`utils.ts`)
   - `stageToDocumentStage`: Converts Stage enum to analytics-friendly format
   - `getPageNameFromPath`: Extracts page names from URLs

## Privacy Compliance

### Key Principles

1. **No PII in Events**: 
   - User emails are truncated to domain only
   - No personal names or identifying information
   - Document content is never tracked

2. **User Consent**:
   - Analytics only initialize after user login
   - Users can opt-out via account settings

3. **Data Minimization**:
   - Only track necessary information
   - Use aggregate metrics where possible

## Event Categories

### Authentication & Access Control
- User login/logout flows
- Session management
- Access denied scenarios
- Digital signature verification

### Document Lifecycle
- Document creation, editing, deletion
- Stage transitions and approvals
- Signature workflows
- Content modifications

### User Management
- User invitations and role changes
- Permission updates
- User deactivation/reactivation

### Navigation & UI
- Page views and tab switches
- Search and filter actions
- Modal and form interactions
- Button clicks

### Billing & Analytics
- Subscription management
- Report generation
- ROI calculations

### Errors & Performance
- API errors
- Validation failures
- Slow operations
- Timeout scenarios

## Implementation Guide

### Adding New Events

1. **Define Event Name** in `events.ts`:
```typescript
export const AMPLITUDE_EVENTS = {
  // ... existing events
  YOUR_NEW_EVENT: 'your_new_event',
} as const;
```

2. **Add Type Definition**:
```typescript
export interface AmplitudeEventProperties {
  // ... existing definitions
  [AMPLITUDE_EVENTS.YOUR_NEW_EVENT]: {
    property1: string;
    property2: number;
    optional_property?: boolean;
  } & CommonEventProperties;
}
```

3. **Track Event** in component:
```typescript
import { trackAmplitudeEvent } from '@/lib/analytics/amplitude';
import { AMPLITUDE_EVENTS } from '@/lib/analytics/events';

// In your component
trackAmplitudeEvent(AMPLITUDE_EVENTS.YOUR_NEW_EVENT, {
  property1: 'value',
  property2: 123,
});
```

### Best Practices

1. **Event Naming**:
   - Use snake_case
   - Follow pattern: `{object}_{action}_{context}`
   - Be descriptive but concise

2. **Property Names**:
   - Use snake_case for consistency
   - Be descriptive (e.g., `document_id` not `id`)
   - Include units in names (e.g., `duration_ms`)

3. **Property Values**:
   - Use enums for fixed values
   - Include timestamps for time-based events
   - Add counters for repeated actions

4. **Error Tracking**:
   - Always include error_type and error_code
   - Add error_source for debugging
   - Include action_attempted for context

## Common Patterns

### Page View Tracking
```typescript
trackAmplitudeEvent(AMPLITUDE_EVENTS.PAGE_VIEWED, {
  page_name: 'Documents',
  page_path: '/documents',
  referrer: document.referrer,
  previous_page: previousLocation
});
```

### Action Tracking
```typescript
trackAmplitudeEvent(AMPLITUDE_EVENTS.BUTTON_CLICKED, {
  button_name: 'create_document',
  button_location: 'header',
  page_name: 'Documents'
});
```

### Error Tracking
```typescript
trackAmplitudeEvent(AMPLITUDE_EVENTS.ERROR_OCCURRED, {
  error_type: 'validation_error',
  error_code: 'INVALID_INPUT',
  error_message: error.message,
  error_source: 'CreateDocumentForm',
  page_name: 'Documents',
  action_attempted: 'create_document'
});
```

### Timing Events
```typescript
const startTime = Date.now();
// ... perform operation
trackAmplitudeEvent(AMPLITUDE_EVENTS.OPERATION_COMPLETED, {
  operation_name: 'document_upload',
  duration_ms: Date.now() - startTime,
  success: true
});
```

## Testing

See `TESTING_CHECKLIST.md` for comprehensive testing guide.

### Quick Validation
1. Open browser console
2. Look for "Amplitude initialized successfully"
3. Check Network tab for amplitude.com requests
4. Use Amplitude Chrome extension for real-time monitoring

## Troubleshooting

### Events Not Firing
- Check if Amplitude is initialized (console message)
- Verify user is logged in
- Check for JavaScript errors
- Ensure event name exists in AMPLITUDE_EVENTS

### Missing Properties
- Check TypeScript compilation errors
- Verify property names match type definition
- Ensure required properties are provided

### Performance Issues
- Use debouncing for frequent events (e.g., search)
- Batch events where appropriate
- Avoid tracking in tight loops

## Configuration

### Environment Variables
- `VITE_AMPLITUDE_API_KEY`: Your Amplitude project API key
- Set in `.env.local` for development
- Configure in deployment environment

### SDK Options
```typescript
amplitude.init(apiKey, {
  defaultTracking: {
    pageViews: false, // We track manually
    sessions: true,
    attribution: true,
    formInteractions: false,
    fileDownloads: false
  },
  // ... other options
});
```

## Maintenance

### Regular Tasks
1. Review unused events quarterly
2. Update type definitions when adding properties
3. Monitor event volume for anomalies
4. Check for deprecated event usage

### Migration Guide
When updating events:
1. Add new event alongside old one
2. Update all references
3. Monitor both events for transition period
4. Remove old event after verification

## Support

For questions or issues:
1. Check TypeScript errors first
2. Review browser console for warnings
3. Consult TESTING_CHECKLIST.md
4. Contact the development team

## Appendix

### Event Naming Examples
- ✅ `document_created`
- ✅ `user_login_success`
- ✅ `filter_applied_documents`
- ❌ `documentCreated` (use snake_case)
- ❌ `created` (too vague)
- ❌ `user_clicked_button` (too generic)