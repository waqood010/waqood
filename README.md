# Fuel and Oil Management System

A comprehensive Next.js 16 application for managing fuel supplies, oil inventory, station tanks, consumption tracking, and user administration with role-based access control. Built for managing transportation fleets and logistics operations.

---

## Table of Contents

- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Key Features](#key-features)
- [Database Schema](#database-schema)
- [Project Structure](#project-structure)
- [Authentication & Authorization](#authentication--authorization)
- [Setup & Installation](#setup--installation)
- [Running Locally](#running-locally)
- [API Routes](#api-routes)
- [Component Library](#component-library)
- [Important Files](#important-files)
- [Known Limitations & TODO](#known-limitations--todo)

---

## Overview

The Fuel and Oil Management System is a full-stack application designed to manage:
- **Fuel Operations**: Track fuel supplies, distribution across stations, consumption, and tank measurements
- **Oil Inventory**: Manage oil supplies, consumer allocations, consumption rates, and dispensing transactions
- **Infrastructure**: Administer stations, tanks, fuel types, and oil products
- **Users & Security**: Role-based access control with admin and user roles
- **Audit Trail**: Complete logging of all system activities

This application is built with modern web technologies and best practices for scalability, security, and maintainability.

---

## Tech Stack

### Frontend
- **React 19** — Modern UI library with concurrent features
- **Next.js 16** — Full-stack React framework with App Router
- **TypeScript 5.7.3** — Type-safe JavaScript development
- **Tailwind CSS 4.2** — Utility-first CSS framework
- **shadcn/ui** — High-quality component library
- **Lucide React** — Icon library (1.16.0)
- **Sonner** — Toast notifications (2.0.7)
- **next-themes** — Dark mode support

### Backend & Database
- **Drizzle ORM 0.45.2** — Type-safe SQL query builder
- **PostgreSQL** — Relational database via `pg` (8.21.0)
- **Better Auth 1.6.19** — Authentication and session management

### Development
- **pnpm** — Fast package manager with workspace support
- **ESLint** — Code linting
- **PostCSS 8.5** — CSS transformation
- **Tailwind PostCSS 4.2** — Tailwind CSS processing

---

## Key Features

### 🔐 Authentication & Authorization
- Username/password authentication (no social login)
- Role-based access control:
  - **superadmin** — Full system access
  - **admin** — Management and operational access
  - **user** — Limited operational access
- Session management with IP tracking and user agent logging
- Account status tracking (active/inactive)
- Default bootstrap admin setup for initial deployment

### ⛽ Fuel Management
- **Fuel Types Management** — Configure fuel types (diesel, gasoline 80, gasoline 92, etc.) with conversion rates (ton to liter)
- **Stations & Tanks** — Hierarchical management of stations with multiple tanks per station
- **Tank Specifications** — Track capacity (in tons/liters), current balance, and alert thresholds
- **Fuel Supplies (Inbound)** — Record fuel shipments with:
  - Document and invoice tracking
  - Supplier information
  - Price tracking (unit and total)
  - Distribution across multiple stations and tanks
  - Import numbering per station
- **Fuel Consumption** — Log daily fuel consumption per tank with notes and user tracking
- **Tank Measurements** — Record physical tank measurements vs. theoretical balance with variance analysis
- **Daily Balance Sheets** — Automated reconciliation of opening balance, supplies, consumption, and closing balance with variance detection

### 🛢️ Oil Management
- **Oil Products Catalog** — Comprehensive oil inventory with:
  - Multiple unit types (bottle, liter, kilo, carton, barrel)
  - Pricing per unit
  - Aggregate units (barrels, jerrycans, etc.) with quantity mapping
  - Alert levels and current balance tracking
- **Oil Supplies (Inbound)** — Track incoming oil shipments:
  - Supplier and contract tracking
  - Invoice and date management
  - Cost tracking and notes
- **Consumers** — Manage recipient entities (maintenance workshops, service centers, technical units)
- **Oil Consumption Rates** — Define periodic consumption rates per consumer:
  - Rate configuration per consumer per oil type
  - Weekly or monthly period tracking
  - Automatic refill date scheduling
- **Oil Transactions (Outbound)** — Track oil dispensing with:
  - Serial number generation
  - Recipient information (name and rank)
  - Dispenser tracking
  - Transaction notes and audit trail

### 📊 Reporting & Analytics
- **Dashboard Overview** — Display key metrics and alerts
- **Daily Balances View** — See reconciliation data across stations and fuel types
- **Alerts System** — Critical notifications for:
  - Low fuel/oil levels
  - Tank measurement discrepancies
  - Consumption anomalies
  - Multi-level severity (low, medium, high, critical)
- **Audit Log** — Track all system operations with user attribution

### 👥 User Management
- Create and manage system users with role assignments
- Track user activity in audit logs
- Account activation/deactivation
- Profile information (name, email, phone, display username)

### ⚙️ System Administration
- **Settings Management** — Key-value system configuration
- **Audit Trail** — Comprehensive logging of:
  - User actions (create, update, delete, login, logout)
  - Before/after data snapshots
  - Timestamp and user attribution
- **Attachment Support** — File uploads linked to various records

---

## Database Schema

### Authentication & User Management
- **user** — System users with roles, contact info, and status
- **session** — Active sessions with IP and user agent tracking
- **account** — OAuth/credential provider accounts
- **verification** — Email verification tokens

### Fuel Domain
- **fuelTypes** — Fuel type definitions with ton-to-liter conversion
- **stations** — Fuel station locations
- **tanks** — Individual storage tanks with capacity and alert levels
- **fuelSupplies** — Incoming fuel shipments and distribution
- **fuelSupplyDistributions** — Distribution of supplies to specific tanks
- **fuelConsumption** — Daily fuel consumption records
- **tankMeasurements** — Physical measurements vs. theoretical balance
- **dailyBalances** — Automated daily reconciliation per station/fuel type

### Oil Domain
- **oils** — Oil product definitions with pricing and units
- **oilSupplies** — Incoming oil shipments
- **consumers** — Recipient entities for oil
- **oilConsumptionRates** — Periodic consumption rate definitions
- **oilTransactions** — Outbound oil dispensing records

### System
- **alerts** — System notifications and warnings
- **systemSettings** — Key-value configuration storage
- **auditLog** — Comprehensive activity logging
- **attachments** — File attachments linked to records

---

## Project Structure

```
fuel-and-oil-management/
├── app/                          # Next.js App Router pages and API routes
│   ├── api/                      # Backend API endpoints
│   │   ├── auth/                 # Better Auth endpoints
│   │   ├── fuel-supplies/        # Fuel supply operations
│   │   ├── oil-supplies/         # Oil supply operations
│   │   ├── setup/                # Admin bootstrap endpoint
│   │   └── migrate/              # Database migration utilities
│   │
│   ├── dashboard/                # Main dashboard and admin interface
│   │   ├── page.tsx              # Dashboard home
│   │   ├── layout.tsx            # Dashboard layout with sidebar
│   │   ├── alerts/               # Alert monitoring page
│   │   ├── audit-log/            # Audit trail viewing (admin)
│   │   ├── consumers/            # Consumer management
│   │   ├── daily-balances/       # Daily balance reconciliation
│   │   ├── fuel-consumption/     # Fuel consumption records
│   │   ├── fuel-supplies/        # Fuel supply management
│   │   ├── oil-rates/            # Oil consumption rates management
│   │   ├── oil-supplies/         # Oil supply management
│   │   ├── oil-transactions/     # Oil dispensing transactions
│   │   ├── oils/                 # Oil product management
│   │   ├── settings/             # System settings (admin)
│   │   └── stations/             # Station and tank management
│   │
│   ├── sign-in/                  # Authentication page
│   ├── layout.tsx                # Root layout
│   ├── page.tsx                  # Home/landing page
│   └── globals.css               # Global styles
│
├── components/                   # React components
│   ├── auth-form.tsx             # Login form component
│   ├── consumers/                # Consumer management components
│   ├── daily-balances/           # Daily balance view components
│   ├── dashboard/                # Dashboard layout components
│   ├── fuel-consumption/         # Fuel consumption UI components
│   ├── fuel-supplies/            # Fuel supply UI components
│   ├── oil-rates/                # Oil rate management components
│   ├── oil-supplies/             # Oil supply UI components
│   ├── oil-transactions/         # Oil transaction UI components
│   ├── oils/                     # Oil product components
│   ├── settings/                 # Settings & admin components
│   ├── stations/                 # Station management components
│   ├── shared/                   # Shared UI components
│   │   └── station-tank-selector.tsx
│   └── ui/                       # Base UI component library (shadcn/ui)
│       ├── avatar.tsx, badge.tsx, button.tsx, card.tsx
│       ├── checkbox.tsx, confirm.tsx, dialog.tsx
│       ├── dropdown-menu.tsx, input.tsx, label.tsx
│       ├── separator.tsx, sheet.tsx, sidebar.tsx
│       ├── skeleton.tsx, sonner.tsx, textarea.tsx
│       └── tooltip.tsx
│
├── hooks/                        # React custom hooks
│   └── use-mobile.ts             # Mobile device detection
│
├── lib/                          # Utility functions and helpers
│   ├── auth.ts                   # Better Auth configuration
│   ├── auth-client.ts            # Client-side auth utilities
│   ├── session.ts                # Server-side session management
│   ├── navigation.ts             # App navigation configuration
│   ├── utils.ts                  # General utilities
│   └── db/
│       ├── index.ts              # Drizzle ORM setup and connection
│       ├── schema.ts             # Database schema definitions
│       └── audit.ts              # Audit logging utilities
│
├── public/                       # Static assets
├── scratch/                      # Temporary scripts (migrate.js, etc.)
│
├── Configuration Files
│   ├── package.json              # Project dependencies and scripts
│   ├── pnpm-workspace.yaml       # Monorepo configuration
│   ├── tsconfig.json             # TypeScript configuration
│   ├── next.config.mjs           # Next.js configuration
│   ├── tailwind.config.js        # Tailwind CSS configuration
│   ├── postcss.config.mjs        # PostCSS configuration
│   ├── components.json           # shadcn/ui configuration
│   └── README.md                 # This file

└── Environment Files
    ├── .env.example              # Example environment variables (should exist)
    └── .env.local                # Local environment (gitignored)
```

---

## Authentication & Authorization

### Overview
The application uses **Better Auth** for secure authentication and session management combined with PostgreSQL-backed storage.

### Authentication Method
- **Username/Password only** — No social login or OAuth providers
- Credentials stored securely via Better Auth's password hashing
- Session tokens stored in `session` table with expiration

### Authorization Roles
```
┌─────────────┬──────────────────────────────────────────────┐
│ Role        │ Permissions                                   │
├─────────────┼──────────────────────────────────────────────┤
│ superadmin  │ Full system access (implied, for future use)  │
│ admin       │ Management of all operations, users, settings │
│ user        │ Limited operational access                    │
└─────────────┴──────────────────────────────────────────────┘
```

### Default Admin Account
On first deployment, initialize the admin user:

**Endpoint:** `GET /api/setup`
- Runs only when database is empty
- Creates default admin user

**Default Credentials:**
- Username: `admin`
- Password: `adminadmin123`
- Email: `admin@transport.gov.eg`

**Override Bootstrap Password:**
Set environment variable `SETUP_ADMIN_PASSWORD` in `.env.local`

### Session Management
- Sessions include IP address and user agent for security
- Automatic expiration via `expiresAt` timestamp
- User-specific session isolation

---

## Setup & Installation

### Prerequisites
- Node.js 18+ and pnpm
- PostgreSQL 12+ database
- `.env.local` file configured (see below)

### Environment Configuration

Create `.env.local` file in root directory:

```bash
# Database
DATABASE_URL=postgres://username:password@localhost:5432/fuel_management

# Authentication
BETTER_AUTH_URL=http://localhost:3000
BETTER_AUTH_SECRET=your-secret-key-here

# Optional: Override admin bootstrap password
SETUP_ADMIN_PASSWORD=your-custom-admin-password

# Node Environment
NODE_ENV=development
```

**Database URL Format:**
```
postgres://[user[:password]@][netloc][:port][/dbname]
```

### Database Setup

1. **Create PostgreSQL database:**
   ```bash
   createdb fuel_management
   ```

2. **Run migrations** (if using Drizzle migrations):
   ```bash
   # Migrations should be in db/migrations/ or similar
   # Follow Drizzle ORM migration guide
   ```

3. **Initialize schema:**
   - Schema is defined in `lib/db/schema.ts`
   - Use Drizzle's `db push` for development
   - Or create tables manually using the schema definitions

---

## Running Locally

### 1. Install Dependencies
```bash
pnpm install
```

### 2. Configure Environment
```bash
cp .env.example .env.local
# Edit .env.local with your database URL and auth settings
```

### 3. Set Up Database
```bash
# Create database tables (Drizzle development mode)
pnpm drizzle-kit push:pg
```

### 4. Start Development Server
```bash
pnpm dev
```

The application will be available at `http://localhost:3000`

### 5. Initialize Admin User
Open `http://localhost:3000/api/setup` in your browser (run once)

### 6. Log In
Navigate to `http://localhost:3000/sign-in` and use default admin credentials

---

## Building for Production

### Build
```bash
pnpm build
```

### Start Production Server
```bash
pnpm start
```

---

## API Routes

### Authentication
- `POST /api/auth/sign-in` — User login
- `POST /api/auth/sign-out` — User logout
- `GET /api/auth/session` — Get current session
- `POST /api/auth/sign-up` — User registration (if enabled)

### Setup
- `GET /api/setup` — Initialize admin user (runs once on empty database)

### Fuel Operations
- `POST /api/fuel-supplies` — Create fuel supply record
- `GET /api/fuel-supplies` — List fuel supplies
- `POST /api/fuel-supplies/[id]` — Update fuel supply
- `DELETE /api/fuel-supplies/[id]` — Delete fuel supply
- `GET /api/fuel-supplies/next-import-number` — Get next import number

### Oil Operations
- `POST /api/oil-supplies` — Create oil supply record
- `GET /api/oil-supplies` — List oil supplies

### Migrations
- `POST /api/migrate` — Run database migrations or data imports

---

## Component Library

### UI Components (shadcn/ui)
Located in `components/ui/`:
- **Forms:** `input.tsx`, `textarea.tsx`, `label.tsx`, `checkbox.tsx`
- **Display:** `avatar.tsx`, `badge.tsx`, `card.tsx`, `skeleton.tsx`
- **Navigation:** `dropdown-menu.tsx`, `sidebar.tsx`, `sheet.tsx`
- **Dialogs:** `dialog.tsx`, `confirm.tsx`, `tooltip.tsx`
- **Notifications:** `sonner.tsx` (toast notifications)
- **Layout:** `separator.tsx`
- **Actions:** `button.tsx`

### Domain Components
Each feature area has dedicated components:

**Fuel Supply Components** (`components/fuel-supplies/`)
- `fuel-supplies-table.tsx` — Display fuel supplies
- `fuel-supply-form.tsx` — Create/edit fuel supplies
- `supply-details-modal.tsx` — View supply details

**Oil Management Components** (`components/oils/`)
- `oils-table.tsx` — Display oil inventory
- `oil-form.tsx` — Create/edit oil products

**Station Management** (`components/stations/`)
- `stations-table.tsx` — List stations
- `station-form.tsx` — Create/edit stations
- `tanks-section.tsx` — Manage tanks per station
- `tank-form.tsx` — Create/edit tanks

**Dashboard Components** (`components/dashboard/`)
- `app-sidebar.tsx` — Main navigation sidebar
- `top-bar.tsx` — Header/top bar
- `stat-card.tsx` — Dashboard metric cards

### Shared Components
- `station-tank-selector.tsx` — Reusable selector for station/tank pairs

---

## Important Files

| File | Purpose |
|------|---------|
| [lib/auth.ts](lib/auth.ts) | Better Auth configuration and setup |
| [lib/session.ts](lib/session.ts) | Server-side session helpers and auth checks |
| [lib/db/index.ts](lib/db/index.ts) | Drizzle ORM database connection and client |
| [lib/db/schema.ts](lib/db/schema.ts) | Complete database schema definitions |
| [lib/db/audit.ts](lib/db/audit.ts) | Audit logging helper functions |
| [app/layout.tsx](app/layout.tsx) | Root layout and global providers |
| [app/sign-in/page.tsx](app/sign-in/page.tsx) | Authentication page |
| [app/dashboard/page.tsx](app/dashboard/page.tsx) | Main dashboard home |
| [app/dashboard/layout.tsx](app/dashboard/layout.tsx) | Dashboard layout with navigation |
| [app/api/setup/route.ts](app/api/setup/route.ts) | Admin bootstrap endpoint |
| [tsconfig.json](tsconfig.json) | TypeScript configuration |
| [next.config.mjs](next.config.mjs) | Next.js build configuration |
| [tailwind.config.js](tailwind.config.js) | Tailwind CSS theme and plugins |

---

## Known Limitations & TODO

### Current Limitations
- ⚠️ **Dashboard Static Values** — Dashboard metric cards display placeholder values; most are not connected to live database queries
- ⚠️ **Missing Pages** — Navigation references pages (`audit-log`, `settings`) that are not fully implemented in the workspace
- ⚠️ **No Sign-Up UI** — User creation is only available via:
  - Admin setup endpoint (`/api/setup`)
  - Direct database insertion
  - Better Auth CLI/admin tools
- ⚠️ **Basic Validation** — Input validation and error handling in forms need improvement
- ⚠️ **No Environment Template** — `.env.example` should be added to repository
- ⚠️ **Missing Migration Guide** — Database migration workflow not documented

### Planned Improvements
- [ ] Connect dashboard cards to real database metrics
- [ ] Implement complete audit log and settings pages
- [ ] Add user creation/management UI in admin dashboard
- [ ] Enhance form validation and error handling
- [ ] Add `.env.example` to repository
- [ ] Document database migration strategy
- [ ] Add comprehensive API documentation
- [ ] Implement multi-language support (English/Arabic)
- [ ] Add date range filtering to reports
- [ ] Implement data export (CSV/PDF)
- [ ] Add email notifications for critical alerts
- [ ] Performance optimization and caching
- [ ] Mobile app or responsive improvements
- [ ] Rate limiting and security hardening

---

## Scripts

```bash
# Development
pnpm dev              # Start development server (localhost:3000)
pnpm build           # Build for production
pnpm start           # Start production server
pnpm lint            # Run ESLint

# Database (with Drizzle Kit)
pnpm drizzle-kit push:pg     # Push schema to database
pnpm drizzle-kit generate:pg # Generate migrations
pnpm drizzle-kit studio     # Open Drizzle Studio UI
```

---

## Troubleshooting

### Database Connection Issues
- Verify `DATABASE_URL` in `.env.local`
- Ensure PostgreSQL is running
- Check database credentials
- Verify firewall allows connections

### Admin Setup Not Working
- Database must be empty (no `user` table entries)
- Check database connection first
- Verify `BETTER_AUTH_SECRET` is set
- Check server logs for detailed error messages

### Build Errors
- Clear `.next` directory: `rm -rf .next`
- Reinstall dependencies: `rm -rf node_modules pnpm-lock.yaml && pnpm install`
- Verify TypeScript errors: `pnpm tsc --noEmit`

---

## Support & Documentation

- **Next.js Documentation:** https://nextjs.org/docs
- **Drizzle ORM:** https://orm.drizzle.team
- **Better Auth:** https://betterauth.dev
- **Tailwind CSS:** https://tailwindcss.com/docs
- **shadcn/ui:** https://ui.shadcn.com

---

## License

[Add your license information here]

---

**Last Updated:** 2024-01-13  
**Version:** 0.1.0  
**Status:** Active Development
- Production-ready auth cookie configuration and app security should be reviewed before deployment.

## Notes

- The middleware protects `/dashboard` and redirects unauthenticated users to `/sign-in`.
- `sign-up` is blocked in middleware, so self-registration is intentionally disabled.
- Admin actions are protected by role checks in server action handlers.
