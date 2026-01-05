# Docufen Billing Implementation Guide

## Overview

Docufen's billing system is a comprehensive usage-based billing implementation that tracks page counts across different document stages and transaction types. The system integrates with Stripe for payment processing and provides detailed billing analytics.

## Architecture

### 1. Core Components

#### Backend (docufen_server)
- **Billing Service** (`src/lib/billingService.ts`): Core service managing all billing transactions
- **Billing Types** (`src/lib/billingTypes.ts`): Type definitions and interfaces
- **Stripe Integration** (`src/lib/stripe/`): Stripe client, invoice generation, and webhook handlers
- **API Routes** (`src/routes/billing.ts`, `src/routes/stripeAdmin.ts`): REST endpoints for billing operations

#### Frontend (docufen_client)
- **Billing Page** (`src/pages/Billing/BillingPage.tsx`): Main billing dashboard
- **Billing Table** (`src/pages/Billing/BillingTable.tsx`): Transaction display component
- **Account Page** (`src/pages/AccountPage/AccountPage.tsx`): Stripe checkout integration

#### Database
- **Cosmos DB Container**: `billing_transactions` in the global `docufen` database
- **Partition Key**: `tenantName` for efficient tenant-based queries

### 2. Page Count Types

The system tracks 10 different types of page counts:

```typescript
enum PageCountType {
  PRE_APPROVAL = "PreApproval",      // First signature added
  EXECUTION = "Execution",            // Stage transition to Execute
  POST_APPROVAL = "PostApproval",    // Stage transition to PostApprove
  CLOSED = "Closed",                  // Document closed
  FINAL_PDF = "FinalPDF",            // Final PDF generation
  AUDIT_TRAIL = "AuditTrail",        // Audit trail pages in PDF
  ATTACHMENT_IMAGE = "AttachmentImage",     // 1 page per image
  ATTACHMENT_PDF = "AttachmentPDF",         // Actual PDF pages
  ATTACHMENT_VIDEO = "AttachmentVideo",     // 5 pages per video
  CONTROLLED_COPY = "ControlledCopy"        // Controlled copy generation
}
```

## Billing Flow

### 1. Page Count Tracking

#### Document Stage Transitions
When a document moves through workflow stages, the system records incremental page counts:

```typescript
// In api.ts - stage transition
const billingMetadata = await billingService.recordStageTransition(
  documentId,
  documentDescription,
  newStage,
  currentPageCount,
  userId,
  userEmail,
  userInitials
);
```

#### Attachment Billing
Attachments are billed based on type:
- **Images**: 1 page per image
- **PDFs**: Actual page count
- **Videos**: 5 pages per video

```typescript
// In upload.ts - attachment upload
const billingMetadata = await billingService.recordAttachmentBilling(
  documentId,
  documentDescription,
  filename,
  mimeType,
  pageCountType,
  pageCount,
  userId,
  userEmail
);
```

### 2. Pricing Tiers

The system uses tiered pricing with volume discounts:

```typescript
const tiers = [
  { min: 0, max: 1000, priceInCents: 51 },         // $0.51/page
  { min: 1001, max: 5000, priceInCents: 38 },      // $0.38/page
  { min: 5001, max: 10000, priceInCents: 29 },     // $0.29/page
  { min: 10001, max: 20000, priceInCents: 23 },    // $0.23/page
  { min: 20001, max: Infinity, priceInCents: 19 }  // $0.19/page
];
```

### 3. Monthly Invoice Generation

#### Automated Process (Cron Job)
```typescript
// src/scripts/monthlyBilling.ts
executeMonthlyBilling()
```

This script:
1. Runs on the 1st of each month
2. Queries all active licenses with Stripe customer IDs
3. Generates invoices for the previous month's usage
4. Skips Azure Marketplace customers

#### Manual Invoice Generation
Administrators can generate invoices manually via the API:
```
POST /api/stripe-admin/generate-invoice/:tenantName
```

## Stripe Integration

### 1. Customer Setup Flow

#### Checkout Session Creation
```typescript
// User clicks "Activate with Credit Card"
POST /api/stripe-admin/create-checkout-session
```

This creates a Stripe checkout session in "setup" mode to collect payment method without charging.

#### Success Handling
```typescript
// After successful checkout
POST /api/stripe-admin/checkout-success
```

Updates the license status from "trial" to "active" and stores the payment method.

### 2. Webhook Handlers

The system handles these Stripe webhooks:
- `invoice.payment_succeeded`: Updates payment records
- `invoice.payment_failed`: Handles failed payments
- `invoice.created`: Logs invoice creation
- `invoice.finalized`: Triggers notifications
- `customer.updated`: Syncs customer data

### 3. Invoice Management

#### Preview Invoice
```
GET /api/stripe-admin/preview-invoice/:tenantName?year=2024&month=1
```

#### List Invoices
```
GET /api/stripe-admin/invoices/:tenantName
```

#### Finalize & Send Invoice
```
POST /api/stripe-admin/invoices/:invoiceId/finalize
POST /api/stripe-admin/invoices/:invoiceId/send
```

## User Interface

### 1. Billing Dashboard

The billing page (`/billing`) provides:
- **Summary Cards**: Total pages, document pages, attachments, audit trail
- **Filters**: Date range, search, month selection
- **Transaction Table**: Detailed view with pagination
- **Export**: CSV download functionality

### 2. Key Features

#### Month Selector
- Automatically populated with months that have billing data
- Defaults to "All Time" view

#### Search & Filtering
- Search by document name, ID, or user email
- Date range filtering with date pickers

#### Export
- CSV export with running totals
- Includes all transaction details

## API Endpoints

### Billing Data
```
GET /api/billing
  ?page=1
  &limit=50
  &search=keyword
  &startDate=2024-01-01T00:00:00.000Z
  &endDate=2024-01-31T23:59:59.999Z
```

### Available Months
```
GET /api/billing/available-months
```

### Export
```
GET /api/billing/export?format=csv
```

### Document Billing
```
GET /api/billing/document/:documentId
```

## Testing

### 1. Test Environment Setup

#### Stripe Test Mode
Use Stripe test API keys:
```bash
export STRIPE_SECRET_KEY=sk_test_...
export STRIPE_WEBHOOK_SECRET=whsec_test_...
```

#### Test Credit Cards
- Success: `4242 4242 4242 4242`
- Decline: `4000 0000 0000 0002`
- Authentication: `4000 0025 0000 3155`

### 2. Manual Testing Scripts

#### Check Stripe Data
```bash
npm run script:check-stripe-data
```

#### Test Invoice Generation
```bash
npm run script:test-stripe-invoice
```

#### Sync Customers Demo
```bash
npm run script:sync-customers-demo
```

### 3. Testing Workflow

1. **Create Test Tenant**: Register new company in trial mode
2. **Generate Usage**: Create documents, add attachments, move through stages
3. **Activate Stripe**: Go to Account page, click "Activate with Credit Card"
4. **Generate Invoice**: Run monthly billing script or use admin API
5. **Verify Billing**: Check billing dashboard for transactions

## Deployment

### 1. Environment Variables

Required for production:
```bash
# Stripe Configuration
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PUBLISHABLE_KEY=pk_live_...

# Cosmos DB
COSMOS_ENDPOINT=https://your-cosmos.documents.azure.com:443/
KEY_VAULT_NAME=your-key-vault

# Client URL (for checkout redirect)
CLIENT_URL=https://your-app.azurestaticapps.net
```

### 2. Cron Job Setup

Add to crontab or Azure Function:
```bash
# Run on 1st of each month at 2 AM
0 2 1 * * /usr/bin/node /path/to/monthlyBilling.js
```

### 3. Webhook Configuration

In Stripe Dashboard:
1. Add webhook endpoint: `https://your-api.com/api/stripe/webhook`
2. Select events to listen for
3. Copy webhook secret to environment

## Monitoring & Troubleshooting

### 1. Logging

All billing operations are logged with Pino:
```typescript
logger.info({
  tenantName,
  documentId,
  pageCountType,
  incrementalPages
}, 'Billing transaction recorded');
```

### 2. Common Issues

#### Missing Transactions
- Check billing metadata on document
- Verify stage transitions are triggering billing
- Check for errors in billing service logs

#### Invoice Generation Failures
- Verify Stripe customer ID exists
- Check for valid billing period with usage
- Ensure license status is active/trial

#### Webhook Failures
- Verify webhook secret is correct
- Check webhook logs in Stripe Dashboard
- Ensure webhook endpoint is accessible

### 3. Database Queries

#### Get Monthly Summary
```sql
SELECT 
  c.pageCountType,
  SUM(c.incrementalPageCount) as totalPages,
  COUNT(1) as transactionCount
FROM c
WHERE c.partitionKey = 'tenant-name'
  AND c.timestamp >= startTime
  AND c.timestamp <= endTime
GROUP BY c.pageCountType
```

#### Find Missing Billing
```sql
SELECT * FROM documents d
WHERE NOT EXISTS (
  SELECT 1 FROM billing_transactions b
  WHERE b.documentId = d.id
  AND b.pageCountType = 'PreApproval'
)
AND d.stage >= 'PreApprove'
```

## Security Considerations

1. **Authentication**: All billing endpoints require authentication
2. **Authorization**: Users can only view their tenant's billing data
3. **Admin Access**: Special endpoints restricted to administrators
4. **Webhook Validation**: Stripe webhook signatures are verified
5. **Data Isolation**: Cosmos DB partition key ensures tenant isolation

## Future Enhancements

1. **Usage Alerts**: Notify customers approaching tier thresholds
2. **Prepaid Credits**: Allow purchasing page credits in advance
3. **Custom Pricing**: Per-tenant pricing overrides
4. **Analytics Dashboard**: Advanced usage analytics and forecasting
5. **Multi-currency**: Support for currencies beyond USD
6. **API Rate Limiting**: Implement billing-based API limits