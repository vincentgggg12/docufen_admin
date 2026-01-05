# Debug Mode Implementation

## Overview

This project uses a clever approach for debug mode that shows translation keys in the UI while maintaining proper backend functionality.

## How It Works

Instead of using `cimode` (which caused backend issues), we use **Swahili language (`sw`)** as our debug mode:

- **UI Display**: Shows translation keys (e.g., `actions.save` instead of "Save")
- **Backend Processing**: Receives proper language code (`sw`) for correct formatting and processing
- **Date/Time Formatting**: Works correctly with Swahili locale rules
- **API Calls**: Send `Accept-Language: sw` header (not `cimode`)
- **Persistence**: Debug mode persists across navigation and login

## Implementation Details

### 1. Debug Swahili Translation File

The `public/locales/sw/translation.json` file contains all English keys but with **key paths as values**:

```json
{
  "actions": {
    "save": "actions.save",
    "cancel": "actions.cancel",
    "delete": "actions.delete"
  },
  "dateString": "dateString"
}
```

### 2. Automatic Generation Script

Run this command to regenerate the debug Swahili file from English translations:

```bash
npm run debug:generate
```

### 3. Debug Mode Toggle

- **UI Component**: `DebugToggle.tsx` provides a button to enable/disable debug mode
- **Persistence**: Uses `localStorage.setItem('i18nextDebugMode', 'true')`
- **URL Sync**: Automatically adds/removes `lng=sw` parameter

### 4. Language Detection Override

The `i18n.ts` configuration:
- Detects `lng=sw` URL parameter
- Stores debug state in localStorage
- Prevents company locale from overriding debug mode
- Maintains `lng=sw` parameter across navigation

## Usage

### For Manual Testing

1. **Enable Debug Mode**: Click "Debug i18n Keys" button
2. **Disable Debug Mode**: Click "Exit Debug Mode" button
3. **Direct URL**: Add `?lng=sw` to any URL

### For Playwright Codegen

Use this command to record tests with translation keys:

```bash
npx playwright codegen --viewport-size=1920,1080 "https://localhost:3030/?lng=sw" --ignore-https-errors
```

### For Playwright Tests

Update test URLs to include `lng=sw`:

```typescript
await page.goto('https://localhost:3030/login?lng=sw');
```

## Benefits

✅ **Backend Compatibility**: Sends proper language code (`sw`) to backend  
✅ **Date Formatting**: Works with Swahili locale rules  
✅ **API Integration**: Proper `Accept-Language` headers  
✅ **Test Stability**: Consistent key-based selectors  
✅ **Multi-language Testing**: Same test works in any language  
✅ **Persistence**: Debug mode survives navigation and login  
✅ **No Breaking Changes**: Doesn't affect existing functionality  

## Troubleshooting

### Debug Mode Not Persisting After Login

This was fixed by updating:
1. `i18n.ts` - Language detection logic
2. `AccountData.ts` - Company locale override prevention
3. `DebugToggle.tsx` - Proper localStorage management

### Keys Not Showing

1. Ensure `lng=sw` is in the URL
2. Check that `localStorage.getItem('i18nextDebugMode')` returns `'true'`
3. Verify Swahili translation file exists and has key-value pairs

### Backend Errors

If you see backend errors, ensure:
1. Not using old `cimode` anywhere
2. Backend accepts `sw` as a valid language code
3. Date formatting works with Swahili locale 