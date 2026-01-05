# Test Metadata Configuration

This directory contains configuration files that drive the test reporter and test organization.

## Structure

```
test-metadata/
├── schema/                     # JSON schemas for validation
│   ├── test-config.schema.json    # Schema for test configurations
│   └── hierarchy.schema.json      # Schema for test hierarchy
├── test-hierarchy.json         # Main hierarchy configuration
├── 1-login-authentication/     # Login & auth test configs
├── 2-setup-wizard/            # Setup wizard test configs
├── 3-account/                 # Account test configs
├── 4-users/                   # Users test configs
├── 5-documents/               # Documents test configs
└── 6-document-completion/     # Document completion test configs
    ├── 6.1-create-new-document.json
    ├── 6.2-create-practice-document.json
    └── ...
```

## Adding a New Test

1. **Find the appropriate section directory** (e.g., `6-document-completion/`)

2. **Create or update the configuration file** for your subsection

3. **Add your test configuration** following this structure:

```json
{
  "testId": "TS.6.1-03",
  "testName": "File Upload Validation",
  "description": "Verify file upload functionality in Create Document dialog",
  "prerequisites": {
    "role": "User Manager",
    "state": ["Create Document dialog open"]
  },
  "steps": [
    {
      "stepNumber": "01",
      "procedure": "Click on file upload area",
      "expectedResult": "File browser opens",
      "requiresScreenshot": false,
      "extractionPatterns": [
        "Click on file upload",
        "Click.*file upload.*area"
      ]
    },
    {
      "stepNumber": "02",
      "procedure": "Select a valid Word document",
      "expectedResult": "File is uploaded and displayed",
      "requiresScreenshot": true,
      "extractionPatterns": [
        "Select a valid Word document",
        "Select.*Word.*document"
      ]
    }
  ]
}
```

## Key Concepts

### Test ID Format
- Format: `TS.X.Y-ZZ`
- Example: `TS.6.1-01`
- X = Major section (e.g., 6 for Document Completion)
- Y = Subsection (e.g., 1 for Create New Document)
- ZZ = Test number (01, 02, 03...)

### Extraction Patterns
- Used to match test steps in Playwright output
- Can be exact strings or regex patterns
- First pattern should be the most specific
- Add variations to handle different phrasings

### Screenshot Requirements
- Set `requiresScreenshot: true` for steps that need screenshots
- Screenshots are matched by pattern: `TS.X.Y-ZZ.SC.timestamp.png`
- Only take screenshots where validation evidence is needed

## Validation

Run validation to check all configurations:

```bash
npx ts-node playwright/tests/utils/validate-configs.ts
```

## Benefits

1. **No Code Changes**: Add new tests without modifying reporter code
2. **Version Control**: Easy to track changes to test definitions
3. **Validation**: JSON schemas ensure configurations are correct
4. **Maintainability**: Clear separation of test data from implementation
5. **Scalability**: Supports hundreds of tests without performance impact

## Migration from V1

If migrating from the hardcoded reporter:

```bash
npx ts-node playwright/tests/utils/migrate-to-v2.ts
```

## Tips

1. **Use descriptive test names** that clearly indicate what is being tested
2. **Keep extraction patterns specific** to avoid false matches
3. **Document prerequisites clearly** to ensure tests run in correct state
4. **Group related tests** in the same configuration file
5. **Validate after changes** to catch errors early