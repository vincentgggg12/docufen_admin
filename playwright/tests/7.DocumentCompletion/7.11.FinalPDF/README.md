# Section 7.11 - Final PDF Stage Tests

This directory contains all Playwright test scripts for Section 7.11 Final PDF Stage from the OQ document.

## Test Files Created

### Section 7.11.1 - PDF Generation (3 tests)
- `TS.7.11.1-01-PDFCreationTrigger.spec.ts` - PDF Creation Trigger
- `TS.7.11.1-02-LoadingStateDisplay.spec.ts` - Loading State Display
- `TS.7.11.1-03-ErrorHandling.spec.ts` - Error Handling

### Section 7.11.2 - PDF Content (5 tests)
- `TS.7.11.2-01-ExecutedDocument.spec.ts` - Executed Document
- `TS.7.11.2-02-AttachmentPackage.spec.ts` - Attachment Package
- `TS.7.11.2-03-AuditTrailInclusion.spec.ts` - Audit Trail Inclusion
- `TS.7.11.2-04-VisualFormatting.spec.ts` - Visual Formatting
- `TS.7.11.2-05-QMSCompatibility.spec.ts` - QMS Compatibility

### Section 7.11.3 - Finalized State (4 tests)
- `TS.7.11.3-01-StageAssignment.spec.ts` - Stage Assignment
- `TS.7.11.3-02-PDFURLStorage.spec.ts` - PDF URL Storage
- `TS.7.11.3-03-FinalizationAudit.spec.ts` - Finalization Audit
- `TS.7.11.3-04-ViewPDFButton.spec.ts` - View PDF Button

## Total Tests Created: 12

## Running the Tests

To run all Final PDF tests:
```bash
npx playwright test 7.DocumentCompletion/7.11.FinalPDF/
```

To run a specific subsection:
```bash
npx playwright test 7.DocumentCompletion/7.11.FinalPDF/7.11.1.PDFGeneration/
npx playwright test 7.DocumentCompletion/7.11.FinalPDF/7.11.2.PDFContent/
npx playwright test 7.DocumentCompletion/7.11.FinalPDF/7.11.3.FinalizedState/
```

To run a specific test:
```bash
npx playwright test 7.DocumentCompletion/7.11.FinalPDF/7.11.1.PDFGeneration/TS.7.11.1-01-PDFCreationTrigger.spec.ts
```

## Test Patterns

All tests follow the OQ_to_Playwright_automation guide patterns:
- Use appropriate timeouts (120s default, 180s for PDF generation/viewing tests)
- Take screenshots where OQ shows (SC)
- Use test.step() for each procedure step
- Include expected results as comments
- Use environment variables for user credentials
- Handle ERSD dialog after login

## Special Considerations

1. **PDF Generation Tests**: Use longer timeouts (180s) as PDF generation can take time
2. **PDF Viewing**: Tests rely on PDF viewer elements which may vary by browser
3. **File Downloads**: Test TS.7.11.2-05 includes file download verification
4. **Network Monitoring**: Some tests monitor network requests for API calls
5. **Audit Verification**: Tests check audit logs for proper recording of PDF operations

## Prerequisites

- Documents must exist in various stages (Closed, Finalised) for tests to run
- User accounts with appropriate permissions (Owner role)
- Environment variables properly configured in `.playwright.env`