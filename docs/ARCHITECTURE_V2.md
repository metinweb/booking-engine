# Booking Engine - Modular Architecture Overview

The project has been refactored into a Monorepo using Turborepo with a modular structure for both the Backend (API) and Frontend (Admin).

## Monorepo Structure
Root
├── apps
│   ├── admin (Frontend - Vue.js)
│   └── api (Backend - Express.js)
├── packages (Shared libraries - Future use)
└── ...

## Backend (apps/api)
The API has been decomposed from a monolithic PMS module into domain-specific modules.

**Location:** `apps/api/src/modules/`

- **pms-guest**: Guest profiles, history, statistics.
- **pms-reservation**: Bookings, availability, payments.
- **pms-frontdesk**: Check-in/out, room assignment, stay management.
- **pms-housekeeping**: Room status, cleaning schedules.
- **pms-billing**: Cashier, invoicing, night audit.
- **pms-settings**: Configuration, users, roles.

**Key Changes:**
- Dedicated `*.routes.js` for each module.
- `apps/api/src/modules/pms/pms.routes.js` aggregates these routes.
- Imports updated to reflect new paths.

## Frontend (apps/admin)
The Admin panel has been refactored from a flat `views/pms` structure to a Feature-Oriented Architecture.

**Location:** `apps/admin/src/modules/`

Each module contains its own `views`, `components`, and potentially `stores` or `services` (feature-specific).

- **guests**: `GuestsView.vue`, `KBSView.vue`, Guest modals.
- **reservations**: `ReservationsView.vue`, Booking wizards.
- **frontdesk**: `FrontDeskView.vue`, `RoomPlanView.vue`.
- **housekeeping**: `HousekeepingView.vue`, `HousekeepingMobileView.vue`.
- **billing**: `BillingView.vue`, `CashierView.vue`, `NightAuditView.vue`.
- **settings**: `SettingsView.vue`, `UsersView.vue`.
- **dashboard**: `DashboardView.vue`.
- **reports**: `ReportsView.vue`.
- **auth**: `LoginView.vue`, `HotelSelectView.vue`.
- **shared**: Common PMS components (`PmsProvider`, `PMSHeader`, etc.).

**Benefits:**
- **Scalability**: Easier to add new features without cluttering global folders.
- **Maintainability**: Related code is co-located.
- **Separation of Concerns**: Clear boundaries between domains.

## Next Steps
- Verify application functionality by running `npm run dev` in both `apps/admin` and `apps/api`.
- Continue developing new features within the established modular patterns.
