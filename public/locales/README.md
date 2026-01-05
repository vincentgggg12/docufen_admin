# Translation Files Documentation

## Important: Swahili (sw) is used for Debug Mode

⚠️ **WARNING: The Swahili (sw) translation file is NOT for actual Swahili translations!** ⚠️

The `sw/translation.json` file is used as a **debug language** to help identify hardcoded text in the application.

### Debug Mode Convention

In the Swahili file (`sw/translation.json`), all values must follow this format:
- **Format**: `"key": "full.key.path*"`
- **Example**: `"title": "billing.title*"`
- **Example**: `"billing": "nav.billing*"`

The asterisk (*) at the end is mandatory and helps distinguish debug keys from actual text.

### How Debug Mode Works

When running the application with `?lng=sw` parameter:
- All properly internationalized text will show as `key.path*`
- Any hardcoded text will appear as normal text (without asterisk)
- This makes it easy to spot missing i18n keys

### Adding New Translations

When adding new translations:

1. **English (en)**: Add the actual English text
2. **Spanish (es)**: Add Spanish translations
3. **Polish (pl)**: Add Polish translations
4. **Chinese (zh)**: Add Chinese translations
5. **Swahili (sw)**: Add the key path with asterisk, NOT actual Swahili translations

### Example

```json
// English (en)
"billing": {
  "title": "Billing",
  "exportCSV": "Export CSV"
}

// Spanish (es)
"billing": {
  "title": "Facturación",
  "exportCSV": "Exportar CSV"
}

// Swahili (sw) - DEBUG MODE
"billing": {
  "title": "billing.title*",
  "exportCSV": "billing.exportCSV*"
}
```

### Running in Debug Mode

To run the application in debug mode:
1. Add `?lng=sw` to the URL
2. Or use the Debug Toggle component (if available)
3. Look for any text that doesn't end with `*` - this is hardcoded text that needs i18n

### Important Notes

- Never add actual Swahili translations to `sw/translation.json`
- Always include the asterisk (*) at the end of debug values
- The debug language helps maintain 100% internationalization coverage