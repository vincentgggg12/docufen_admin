# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Overview

**Docufen Client** - React/TypeScript SPA for a document management and compliance system. The client interfaces with a Node.js/Express server (`../docufen_server`).

The system manages document lifecycles through stages: Draft → Pre-approval → Execution → Post-approval → Completed, with digital signatures, audit trails, and compliance features for regulated industries.

## Development Commands

```bash
npm run dev          # Start dev server on https://localhost:3030
npm run build        # Production build (runs tsc then vite build)
npm run lint         # Run ESLint
npm run test         # Run Playwright E2E tests (default: beta.docufen.com)
npm run test:local   # Run tests with UI against localhost:3030
npm run test:stage   # Run tests with UI against stage.docufen.com

# Run specific test file
npx playwright test <test-name>

# Run specific test suite
npx playwright test 7_DocumentCompletion/7.1.CreateNewDocument/TS.7.1-01-CreateDocumentDialogDisplay.spec.ts

# Generate test code interactively
npm run codegen:local   # Against localhost
npm run codegen:beta    # Against beta environment
```

## Architecture

### Tech Stack
- **React 19** with TypeScript
- **Vite** for build tooling (HTTPS dev server on port 3030)
- **Shadcn/ui** + Tailwind CSS v4 for components and styling
- **Zustand** for global state management
- **React Hook Form** + Zod for form validation
- **Syncfusion Document Editor** for Word/PDF document editing
- **i18next** for internationalization

### Key Source Structure
```
src/
├── App.tsx                    # Main routing and layout
├── components/
│   ├── editor/               # Document editor components
│   │   ├── SFEditor.tsx     # Main Syncfusion editor wrapper (~72KB)
│   │   ├── lib/             # Editor utilities
│   │   │   ├── addinUtils.ts    # Document manipulation (~83KB)
│   │   │   ├── cellUtils.ts     # Table cell handling
│   │   │   ├── editUtils.ts     # Edit operations
│   │   │   └── lifecycle.ts     # Stage enum and workflow helpers
│   │   └── PopupComponents/  # Editor dialogs/modals
│   ├── ui/                  # Shadcn components
│   └── left-sidebar/        # Navigation sidebar
├── lib/
│   ├── stateManagement.ts   # Zustand stores (DocumentStore, etc.)
│   ├── apiUtils.ts          # API client functions (~63KB)
│   ├── workflowUtils.ts     # Workflow/participant helpers
│   └── server.ts            # Server URL configuration
├── pages/                   # Route pages by feature
│   ├── DocumentCompletion/  # Document editing flow
│   ├── Documents/           # Document list/management
│   ├── AccountPage/         # Account settings
│   ├── Billing/             # Subscription management
│   └── Login/               # Authentication
├── hooks/                   # Custom React hooks
├── contexts/                # React contexts (AnalyticsContext)
└── types/                   # TypeScript type definitions
```

### State Management Pattern
The app uses Zustand stores defined in `src/lib/stateManagement.ts`:
- `DocumentStore` - Current document state, attachments, verifications
- `UIStore` - UI state (panels, modals, selection)
- `UserStore` - Authentication and user data

### Document Lifecycle (Stage enum)
```typescript
enum Stage {
  Draft = 0,
  External = 1,
  Uploaded = 2,
  PreApprove = 3,      // Pre-Approval signatures
  PreExecute = 4,
  Execute = 5,         // Execution signatures
  PostApprove = 6,     // Post-Approval signatures
  Closed = 7,
  Finalised = 8,
  Voided = 9
}
```

## Testing

### Playwright E2E Tests
Tests are in `playwright/tests/` organized by feature:
- `1.Login/` - Authentication tests
- `3.Account/` - Account settings
- `4.Analytics/` - Analytics dashboard
- `5.Users/` - User management
- `6.Documents/` - Document CRUD
- `7.DocumentCompletion/` - Document workflow tests (most comprehensive)

### Test Configuration
- Config: `playwright.config.ts`
- Environment: `.playwright.env` for credentials
- Results: `playwright/playwright-results/`
- Reports: `playwright/report/`

### Test Utilities
- `playwright/tests/utils/msLogin.ts` - Microsoft authentication helper
- `playwright/tests/utils/setup-helpers.ts` - Common setup functions
- `playwright/tests/utils/ersd-handler.ts` - Error screenshot/recording handler

### Running Tests
```bash
# Set BASE_URL to target environment
BASE_URL=https://localhost:3030 npx playwright test
BASE_URL=https://stage.docufen.com npx playwright test

# Debug with UI
npm run test:local
```

## Important Patterns

### Data Attributes for Testing
Custom `data-*` attributes are used for E2E test selectors. When adding new interactive elements, include appropriate data attributes.

### Cell Assignment System
Assignments for document signatures are stored in `participantGroups` in the server model. Key utilities:
- `src/lib/workflowUtils.ts` - `checkUserInWorkflow()`, `addParticipantToGroup()`, `removeParticipantFromGroup()`
- Handles both table cells and body text assignments

### API Communication
All API calls go through `src/lib/apiUtils.ts`. The server URL is configured in `src/lib/server.ts`.

### Internationalization
- Uses i18next with browser language detection
- Translation files in `public/locales/`
- Configuration in `src/i18n.ts`

## Environment Setup

### HTTPS Certificates
Dev server requires SSL certificates. Set `D_CERTS` environment variable to certificate directory containing:
- `localhost.key`
- `localhost.crt`

### Key Environment Variables
- `D_CERTS` - Path to SSL certificates directory
- `BASE_URL` - Target URL for Playwright tests
- `LOCAL` - Enable local preview server HTTPS

## Server Integration

The client communicates with `docufen_server` via:
- REST API endpoints (`/api/*`)
- Session-based authentication (Azure AD)
- Socket.io for real-time features

See `../docufen_server/` for backend code and `../CLAUDE.md` for full repository context.
