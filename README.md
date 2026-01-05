# Docufen Admin

Internal admin dashboard for managing Docufen customers and viewing metrics.

## Overview

Docufen Admin is a simplified version of docufen_client specifically built for Integrity Codes Pty Ltd administrators to:
- View all customer tenants
- Monitor subscription status and billing
- Track usage metrics (pages, users, documents)
- Manage validation packages and connectors
- View customer health and activity

## Access Control

Access to Docufen Admin is restricted to users from the "integritycodesptyltd" tenant (Integrity Codes Pty Ltd).

## Architecture

- **Frontend**: React + Vite + Shadcn UI + Tailwind CSS
- **Backend**: Uses existing docufen_server (port 3000)
- **Authentication**: Azure AD via Passport.js (same as docufen_server)
- **Session Management**: Shared sessions with docufen_server via Redis

## Prerequisites

1. **Node.js** (v18 or higher)
2. **docufen_server running** on port 3000
3. **Redis server running** on port 6379 (for session sharing)

## Getting Started

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

The `.env.local` file contains:
- Amplitude API keys (analytics)
- Stripe keys (not currently used in admin)

Backend server URL is automatically configured in `src/lib/server.ts`:
- **Local development**: `https://localhost:3000` (docufen_server)
- **Production**: Same hostname as frontend

### 3. Start the Development Server

```bash
npm run dev
```

The app will run on **https://localhost:3030** (or the next available port).

### 4. Login

Navigate to `https://localhost:3030` and login with your Integrity Codes account.

## Available Scripts

```bash
# Development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
npm run preview:local  # With LOCAL=true

# Linting
npm run lint
```

## Project Structure

```
docufen_admin/
├── src/
│   ├── pages/
│   │   ├── InternalAdmin/       # Main admin dashboard
│   │   ├── Login/               # Login pages
│   │   ├── TrialExpired/        # Error pages
│   │   ├── DeactivatedAccount/
│   │   └── MaintenanceWindow/
│   ├── components/
│   │   ├── left-sidebar/        # Simplified navigation
│   │   └── ui/                  # Shadcn UI components
│   ├── lib/
│   │   ├── server.ts           # Backend URL configuration
│   │   ├── stateManagement.ts  # Zustand stores
│   │   └── apiUtils.ts         # API utilities
│   └── App.tsx                  # Main app with routes
├── public/                      # Static assets
└── package.json
```

## Key Features

### InternalAdmin Page (`/admin`)

The main dashboard displays all customer tenants with:

**Table Columns:**
- Company Name
- Tenant ID
- Status (Active, Trial, Expired, Deactivated)
- Billing Email
- Locale
- Payment Method (Stripe or Azure Marketplace)

**Expandable Details:**
- Company information
- Billing details (Stripe Customer ID, Price ID, Currency)
- Cost tracking (Paper Cost per Page, Investment Cost, Estimated Monthly Pages)
- Feature controls (Validation Package, Connectors)

**Actions:**
- Extend Trial (adds 14 days)
- Activate License (convert trial to active)
- Update Validation Package version
- Toggle Connectors
- Reset Test Tenants

### Enhanced Metrics (Coming Soon)

Additional metrics per tenant:
- Active user count
- Documents created per month
- Pages consumed per month
- Total documents (all time)

## API Endpoints Used

```typescript
// Tenant management
GET /api/admin/tenants                              // Get all tenants
PATCH /api/admin/tenants/:id/validation-package    // Update validation package
PATCH /api/admin/tenants/:id/connectors           // Toggle connectors
PUT /api/admin/tenants/:id/extend-trial           // Extend trial
PUT /api/admin/tenants/:id/activate-tenant        // Activate license
DELETE /api/admin/account/:id                     // Reset test tenant

// Future metrics endpoints
GET /api/admin/tenant-metrics/:tenantName         // Get usage metrics
```

## Deployment

The app can be deployed to:
- **Azure Static Web Apps** (preferred)
- **Azure Container Apps**
- **Any static hosting** (Netlify, Vercel, etc.)

Build for production:
```bash
npm run build
```

The `dist/` folder contains the production build.

## Environment-Specific Configuration

Backend URLs are automatically determined:
- **Local**: `https://localhost:3000`
- **Beta**: `https://beta.docufen.com`
- **Stage**: `https://stage.docufen.com`
- **Production**: `https://app.docufen.com`

## Differences from docufen_client

Docufen Admin is a **stripped-down version** of docufen_client with:

**Removed:**
- Document editor and signing workflows
- User management pages
- Account settings pages
- Compliance pages
- Connector management pages
- Template pages
- Setup wizard

**Kept:**
- Login/logout
- InternalAdmin page (customer management)
- Error pages (trial expired, deactivated, maintenance)
- Authentication and session management
- UI components (Shadcn UI)

**Simplified:**
- Sidebar navigation (only "Admin Dashboard")
- Routing (only essential routes)
- State management (minimal stores)

## Contributing

This is an internal tool for Integrity Codes Pty Ltd. Contact the development team for access.

## License

Private - Integrity Codes Pty Ltd
