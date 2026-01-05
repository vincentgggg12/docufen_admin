# Docufen Billing System - Technical Implementation Guide

## Overview

This guide provides a comprehensive overview of the Docufen billing system implementation, including Stripe integration, page counting mechanisms, testing procedures, and ongoing maintenance requirements.

## Architecture Overview

### 1. Core Components

- **Billing Service** (`docufen_server/src/services/billingService.ts`): Central service handling all billing operations
- **Cosmos DB Container** (`billing_transactions`): Global container storing all billing records, partitioned by tenant
- **Stripe Integration**: Payment processing, invoice generation, and customer management
- **Frontend Dashboard** (`docufen_client/src/pages/Billing`): User interface for viewing and managing billing

### 2. Page Counting System

The system tracks 10 distinct transaction types:

```typescript
export enum TransactionType {
  DOCUMENT_PAGES = 'document_pages',         // Base document pages
  PRE_APPROVAL_SIGNATURE = 'pre_approval_signature',
  EXECUTION_PAGES = 'execution_pages',       // Execution stage pages
  POST_APPROVAL_SIGNATURE = 'post_approval_signature',
  ATTACHMENT_PAGES = 'attachment_pages',     // Images=1, PDFs=actual, Videos=5
  AUDIT_TRAIL_PAGES = 'audit_trail_pages',  // ~2 pages per document
  FINAL_PDF_DOWNLOAD = 'final_pdf_download', // Total document pages
  CONTROLLED_COPY = 'controlled_copy',       // Copy of parent document
  CONTROLLED_COPY_DOWNLOAD = 'controlled_copy_download',
  DELETED_DOCUMENT = 'deleted_document'      // Voided documents
}
```

### 3. Pricing Tiers

Current tiered pricing structure (USD):
- 0-1,000 pages: $0.79/page (price_1RYhES4F9bHfzspxAfxtENmz)
- 1,001-5,000 pages: $0.59/page (price_1RYhEX4F9bHfzspxGluSxiwy)
- 5,001-10,000 pages: $0.45/page (price_1RYhEb4F9bHfzspx731sh8IV)
- 10,001-20,000 pages: $0.35/page (price_1RYhEg4F9bHfzspxYmFfQO7a)
- Over 20,000 pages: $0.29/page (price_1RYhEl4F9bHfzspxiwNJRAwb)

**Stripe Product ID**: prod_SSgz2W7jEKR9ss

## Stripe Integration Details

### 1. Configuration

**Environment Variables Required:**
```bash
STRIPE_SECRET_KEY=sk_test_...           # Test key for development
STRIPE_PUBLISHABLE_KEY=pk_test_...      # Public key for frontend
STRIPE_WEBHOOK_SECRET=whsec_...         # Webhook endpoint secret
STRIPE_SUCCESS_URL=https://app.docufen.com/account?stripe_success=true
STRIPE_CANCEL_URL=https://app.docufen.com/account
```

### 2. Customer Onboarding Flow

1. **Trial Activation**: Users click "Activate with Credit Card" on Account page
2. **Checkout Session**: Created in setup mode (no immediate charge)
3. **Customer Creation**: Stripe creates customer with metadata:
   ```json
   {
     "tenantName": "company-name",
     "companyName": "Company Name Inc.",
     "email": "admin@company.com"
   }
   ```
4. **Success Callback**: Updates account status from "trial" to "active"

### 3. Monthly Billing Process

**Automated via Cron Job** (`docufen_server/src/services/monthlyBillingJob.ts`):
- Runs: 1st of each month at 00:00 UTC
- Process:
  1. Queries previous month's transactions
  2. Calculates total pages per tenant
  3. Creates Stripe invoices with line items
  4. Sends invoices (auto-charge enabled)

## Testing Guide

### 1. Stripe Test Environment

**Test Card Numbers:**
- Success: `4242 4242 4242 4242`
- Decline: `4000 0000 0000 0002`
- 3D Secure: `4000 0027 6000 3184`

**Test Commands:**
```bash
# Test invoice generation (dry run)
cd docufen_server
npm run test:generate-invoices

# Test specific tenant invoice
npm run test:invoice -- --tenant="test-company"

# Sync customers from Stripe
npm run sync:stripe-customers
```

### 2. Local Development Setup

1. **Install Stripe CLI**:
   ```bash
   brew install stripe/stripe-cli/stripe
   ```

2. **Forward webhooks locally**:
   ```bash
   stripe listen --forward-to localhost:3000/api/stripe/webhook
   ```

3. **Trigger test events**:
   ```bash
   # Test checkout completion
   stripe trigger checkout.session.completed
   
   # Test invoice payment
   stripe trigger invoice.payment_succeeded
   ```

### 3. Testing Billing Flow End-to-End

1. **Create test account** with trial status
2. **Upload document** and process through stages
3. **Check billing transactions**:
   ```sql
   -- Query test transactions
   SELECT * FROM c 
   WHERE c.tenantName = 'test-company' 
   AND c.year = 2025 
   AND c.month = 1
   ```
4. **Generate test invoice**
5. **Verify Stripe dashboard**

## API Endpoints

### 1. Billing Transactions
```
GET /api/billing/tenants/:tenantName/transactions
  Query params: year, month, startDate, endDate, search
  
GET /api/billing/tenants/:tenantName/transactions/export
  Returns CSV with all transaction details
```

### 2. Stripe Operations
```
POST /api/stripe-admin/create-checkout
  Body: { tenantName, email, companyName }
  
POST /api/stripe-admin/generate-invoice
  Body: { tenantName, totalPages, year, month }
  
POST /api/stripe/webhook
  Handles all Stripe events
```

## Database Schema

### Billing Transaction Document:
```json
{
  "id": "unique-guid",
  "tenantName": "company-name",
  "documentId": "doc-123",
  "documentName": "Protocol XYZ",
  "transactionType": "execution_pages",
  "pageCount": 15,
  "previousCount": 10,
  "totalCount": 25,
  "timestamp": "2025-01-15T10:30:00Z",
  "year": 2025,
  "month": 1,
  "userId": "user-123",
  "userName": "John Doe",
  "metadata": {
    "attachmentName": "results.pdf",
    "attachmentType": "pdf"
  }
}
```

## Monitoring & Maintenance

### 1. Regular Tasks

- **Monthly**: Verify invoice generation completed
- **Weekly**: Check for failed webhook events in Stripe
- **Daily**: Monitor billing transaction volumes

### 2. Common Issues & Solutions

**Issue**: Duplicate transactions
- **Solution**: Check document metadata for `billingMetadata` field

**Issue**: Missing invoices
- **Solution**: Run manual invoice generation script

**Issue**: Webhook failures
- **Solution**: Use Stripe CLI to replay failed events

### 3. Debugging Commands

```bash
# Check billing service logs
docker logs docufen-server | grep "Billing:"

# Query transaction counts
curl http://localhost:3000/api/billing/tenants/test-company/summary

# Verify Stripe customer
stripe customers list --email admin@company.com
```

## Security Considerations

1. **Webhook Verification**: All incoming webhooks verified using signature
2. **Tenant Isolation**: Cosmos DB partitioning ensures data separation
3. **API Authentication**: All billing endpoints require authenticated users
4. **PCI Compliance**: No card details stored; handled entirely by Stripe

## Future Enhancements

1. **Usage Alerts**: Notify when approaching billing thresholds
2. **Prepaid Credits**: Allow bulk purchase at discounted rates
3. **Detailed Analytics**: Enhanced reporting and forecasting
4. **API Rate Limiting**: Prevent abuse of billing endpoints

## Support & Troubleshooting

For billing-related issues:
1. Check Stripe dashboard for payment/invoice status
2. Query Cosmos DB for transaction records
3. Review server logs for billing service errors
4. Contact: billing-support@docufen.com

---

**Last Updated**: January 2025
**Maintained By**: Billing Team
**Version**: 1.0.0