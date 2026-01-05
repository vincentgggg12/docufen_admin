# Billing Test Scripts

This directory contains all Playwright test scripts for the Billing/Analytics sections from the OQ document.

## Test Files Created

### Section 4.1 - Page Metrics (8 tests)
- `TS.4.1-01-ViewPageCountTotals.spec.ts` - View Page Count Totals
- `TS.4.1-02-CategoryBreakdown.spec.ts` - Category Breakdown
- `TS.4.1-03-FilterLast7Days.spec.ts` - Filter Last 7 Days
- `TS.4.1-04-FilterLast30Days.spec.ts` - Filter Last 30 Days
- `TS.4.1-05-FilterLast90Days.spec.ts` - Filter Last 90 Days
- `TS.4.1-06-StackedAreaChart.spec.ts` - Stacked Area Chart
- `TS.4.1-07-MonthSelector.spec.ts` - Month Selector
- `TS.4.1-08-AllTimeView.spec.ts` - All Time View
- `TS.4.1-10-AttachmentTypeCounts.spec.ts` - Attachment Type Counts

### Section 4.2 - Billing Transactions (10 tests)
- `TS.4.2-01-TransactionLogDisplay.spec.ts` - Transaction Log Display
- `TS.4.2-02-UTCTimestampFormat.spec.ts` - UTC Timestamp Format
- `TS.4.2-03-DocumentNameSearch.spec.ts` - Document Name Search
- `TS.4.2-04-SearchClear.spec.ts` - Search Clear
- `TS.4.2-05-DateRangeFilter.spec.ts` - Date Range Filter
- `TS.4.2-06-FilterPersistence.spec.ts` - Filter Persistence
- `TS.4.2-07-CSVExportAll.spec.ts` - CSV Export All
- `TS.4.2-08-CSVExportFiltered.spec.ts` - CSV Export Filtered
- `TS.4.2-09-UserAttribution.spec.ts` - User Attribution
- `TS.4.2-10-PaginationControls.spec.ts` - Pagination Controls

### Section 4.3 - ROI Analytics (10 tests)
- `TS.4.3-01-ConfigurePaperCost.spec.ts` - Configure Paper Cost
- `TS.4.3-02-ValidatePositiveNumbers.spec.ts` - Validate Positive Numbers
- `TS.4.3-03-TieredPricingDisplay.spec.ts` - Tiered Pricing Display
- `TS.4.3-04-SavingsCalculation.spec.ts` - Savings Calculation
- `TS.4.3-05-ROIPercentage.spec.ts` - ROI Percentage
- `TS.4.3-06-InvestmentInput.spec.ts` - Investment Input
- `TS.4.3-07-BreakEvenChart.spec.ts` - Break-Even Chart
- `TS.4.3-08-ThreeYearProjection.spec.ts` - 3-Year Projection
- `TS.4.3-09-MonthSelectionRequired.spec.ts` - Month Selection Required
- `TS.4.3-10-TierTransition.spec.ts` - Tier Transition

### Section 4.4 - Negative and Edge Case Tests (6 tests)
- `TS.4.4-01-NoDataEmptyState.spec.ts` - No Data Empty State
- `TS.4.4-02-SQLInjectionInSearch.spec.ts` - SQL Injection in Search
- `TS.4.4-03-NegativeCostValidation.spec.ts` - Negative Cost Validation
- `TS.4.4-04-EmptyCSVExport.spec.ts` - Empty CSV Export
- `TS.4.4-05-DivisionByZeroROI.spec.ts` - Division by Zero ROI
- `TS.4.4-06-NonAdminAccessDenied.spec.ts` - Non-Admin Access Denied

## Total Tests Created: 34

Note: Test TS.4.1-09 was not in the OQ document provided.

## Running the Tests

To run all Billing tests:
```bash
npx playwright test 4.Billing/
```

To run a specific test:
```bash
npx playwright test 4.Billing/TS.4.1-01-ViewPageCountTotals.spec.ts
```

## Test Patterns

All tests follow the OQ_to_Playwright_automation guide patterns:
- Use appropriate timeouts (120s default, 180s for complex tests)
- Take screenshots where OQ shows (SC)
- Use test.step() for each procedure step
- Include expected results as comments
- Use environment variables for user credentials
- Handle ERSD dialog after login