# Amplitude Analytics Quick Reference

## Environment Setup

| Environment | Hostname Pattern | API Key Variable | Amplitude Project |
|------------|------------------|------------------|-------------------|
| Local | `localhost`, `127.0.0.1` | `VITE_AMPLITUDE_API_KEY_LOC` | Docufen App - Local |
| Beta | Contains `beta` | `VITE_AMPLITUDE_API_KEY_DEV` | Docufen App - Beta |
| Staging | Contains `staging`, `stg`, or `nice-pond` | `VITE_AMPLITUDE_API_KEY_STG` | Docufen App - Staging |
| Production | All others | `VITE_AMPLITUDE_API_KEY_PROD` | Docufen App - Production |

## Quick Setup

1. Copy `.env.local.example` to `.env.local`
2. Add your Amplitude API keys
3. Start the app - analytics will auto-initialize
4. Check console for initialization confirmation

## Tracking Events

```typescript
import { trackAmplitudeEvent, AMPLITUDE_EVENTS } from '@/lib/analytics';

// Track a page view
trackAmplitudeEvent(AMPLITUDE_EVENTS.PAGE_VIEWED, {
  page_name: 'Documents',
  page_path: '/documents'
});

// Track document creation
trackAmplitudeEvent(AMPLITUDE_EVENTS.DOCUMENT_CREATED, {
  document_id: '123',
  document_name: 'My Document',
  document_type: 'SOP',
  document_category: 'Quality',
  creation_method: 'upload'
});
```

## Using Analytics Context

```typescript
import { useAnalytics } from '@/contexts/AnalyticsContext';

const MyComponent = () => {
  const { trackEvent } = useAnalytics();
  
  const handleClick = () => {
    trackEvent(AMPLITUDE_EVENTS.BUTTON_CLICKED, {
      button_name: 'Save',
      button_location: 'header',
      page_name: 'Documents'
    });
  };
};
```

## Common Events

### Authentication
- `USER_LOGIN_INITIATED` - Login button clicked
- `USER_LOGIN_SUCCESS` - Login completed
- `USER_LOGIN_FAILED` - Login error
- `USER_LOGOUT` - User logged out

### Navigation
- `PAGE_VIEWED` - Page navigation (automatic)
- `TAB_SWITCHED` - Tab changes
- `SIDEBAR_TOGGLED` - Sidebar open/close

### Documents
- `DOCUMENT_CREATED` - New document
- `DOCUMENT_OPENED` - Document viewed
- `DOCUMENT_EDITED` - Document modified
- `DOCUMENT_SIGNED` - Document signed
- `DOCUMENT_DELETED` - Document removed
- `DOCUMENT_STAGE_CHANGED` - Stage progression
- `DOCUMENT_REFRESHED` - Document refreshed
- `DOCUMENT_FINALIZED` - Document completed

### Document Content
- `TEXT_INSERTED` - Text added to document
- `QUICK_TEXT_INSERTED` - Quick button clicked
- `NOTE_ADDED` - Note/comment added
- `CORRECTION_MADE` - Text corrected
- `CHECKBOX_TOGGLED` - Checkbox checked
- `LATE_ENTRY_TOGGLED` - Late entry mode
- `ATTACHMENT_UPLOADED` - File uploaded
- `ATTACHMENT_LINKED` - Document linked

### Editor Interactions
- `MASTER_POPUP_OPENED` - Editor popup opened
- `MASTER_POPUP_CLOSED` - Editor popup closed
- `MASTER_POPUP_TAB_SWITCHED` - Tab changed
- `BULK_NA_MODE_TOGGLED` - Bulk N/A mode

### User Actions
- `BUTTON_CLICKED` - Button interactions
- `FORM_SUBMITTED` - Form submissions
- `SEARCH_PERFORMED` - Search executed
- `FILTER_APPLIED` - Filters changed

## Event Properties

All events automatically include:
- `environment`: Current environment (LOCAL/BETA/STAGING/PRODUCTION)
- `app_version`: Application version
- `timestamp`: Event time
- `session_id`: Current session
- `user_role`: User's role (if logged in)

## Privacy Compliance

✅ **DO Track:**
- Email domains (not full emails)
- User IDs
- Document IDs
- Aggregate counts
- User roles/types

❌ **DON'T Track:**
- Full email addresses
- Names or personal info
- Document contents
- Passwords or secrets
- IP addresses (disabled)

## Debugging

### Check Initialization
```javascript
// In browser console
console.log(window.amplitude);
```

### View Environment
```javascript
// After page load
console.log(getCurrentEnvironment());
```

### Enable Debug Logging
All events are logged in console for Local and Beta environments.

### Common Issues

**Events not appearing?**
1. Check API key is set correctly
2. Verify initialization in console
3. Check network tab for amplitude requests
4. Ensure event names match AMPLITUDE_EVENTS constants

**Wrong environment?**
1. Check `window.location.hostname`
2. Verify hostname matches expected pattern
3. Check getCurrentEnvironment() output

## Testing Checklist

- [ ] Events appear in correct Amplitude project
- [ ] Environment property shows correct value
- [ ] User properties set on login
- [ ] Page views tracked automatically
- [ ] No PII in event properties
- [ ] Events have all required properties

## Resources

- [Full Events Reference](./EVENTS_REFERENCE.md)
- [Environment Setup Guide](./AMPLITUDE_ENVIRONMENT_SETUP.md)
- [Events TypeScript Definitions](./events.ts)
- [Testing Checklist](./AMPLITUDE_TESTING_CHECKLIST.md)