# Pune Travel Agency — Developer Handoff Guide

## 1. Repository & Baseline Information

- **Repository URL:** `https://github.com/mahesh01-creator/PuneTravelAgency`
- **Active Publication Branch:** `main`
- **Baseline Commit (Phase 2C):** `b93198a` (`chore: remove unused MySQL migration artifacts in preparation for PostgreSQL`)
- **Published Commit (Phase 4B):** *(Refer to latest commit on `main`)*
- **Source Isolation Rule:** The original source workspace (`travel`), original remote (`puntetravellanding.git`), live production website (`https://punetravelagency.in/`), local SQLite database, and external database backups are strictly isolated and must remain completely untouched.

---

## 2. Technology Stack & Architecture

- **Frontend:**
  - React 19 (`^19.2.8`) + Vite 8 (`^8.2.2`)
  - React Router DOM 7 (`^7.18.3`)
  - Tailwind CSS 4 (`@tailwindcss/vite ^4.3.3`)
  - GSAP (`^3.15.0`) animations, Lucide React (`^1.42.0`) icons, Axios (`^1.20.0`)
- **Backend:**
  - Node.js + Express 4 (`^4.18.0`) REST API
  - Prisma ORM 5.22 (`^5.22.0`)
  - JWT (`jsonwebtoken ^9.0.0`) + `bcryptjs` authentication
  - Security middlewares: `helmet`, `cors`, `express-rate-limit`
- **Target Deployment Architecture:**
  - **Frontend:** Vercel
  - **Database:** Supabase PostgreSQL (Development project first, production later)
  - **Backend API:** Node.js Express service / serverless deployment target to be evaluated

---

## 3. What Has Been Completed So Far

1. **Publication Sanitization (Phase 2B/2C):**
   - Clean, sanitized publication repository established at `mahesh01-creator/PuneTravelAgency`.
   - Legacy unused MySQL migration artifacts removed.
2. **PostgreSQL Schema Conversion (Phase 3):**
   - Prisma schema updated to `provider = "postgresql"` with dual-connection configuration (`DATABASE_URL` and `DIRECT_URL`).
   - Case-insensitive search enabled via `mode: 'insensitive'` across all location and vehicle search endpoints to support PostgreSQL semantics.
   - User model updated to include optional `name` and `phone` attributes.
3. **Data Reconciliation (Phase 3C):**
   - SQLite backup (`sqlite_export_20261012_190110.json`) and live `dev.db` audited and verified to match 100% across all 15 models (182 total records).
4. **Monetary Rounding & Runtime Fixes (Phase 3C / 3E / 3F):**
   - Consistent 2-decimal rounding policy implemented across fare quote calculations, local rentals, administrative fare previews, and booking creation.
   - Resolved undeclared `notes` variable runtime error in `bookingController.js` with safe string normalization.
   - 13/13 real production function tests passing.
5. **Migration Planning (Phase 4A):**
   - Full topological dependency graph (DAG) and data import sequence established for all 15 models.
   - Connection architecture documented (Transaction Pooler vs. Direct vs. Session Pooler).

---

## 4. Current Database & Schema State

- **Provider:** PostgreSQL is configured in `backend/prisma/schema.prisma`.
- **Migration Status:** **No migration has been applied yet.** The `backend/prisma/migrations` directory does not exist.
- **Models (15 total):** `Location`, `Route`, `Vehicle`, `LocalVehicle`, `VehicleAvailability`, `Fare`, `FareToll`, `FareParking`, `FareWaiting`, `Toll`, `ParkingCharge`, `WaitingCharge`, `User`, `Booking`, `AuditLog`.
- **Field Types:** Monetary fields (`baseFare`, `fareTotal`, tolls, parking, waiting) use `Float` (`DOUBLE PRECISION`), preserving 1:1 SQLite data compatibility for the upcoming migration.
- **SQLite Retirement Rule:** The local SQLite database and backups must **NOT** be deleted or retired until the Supabase PostgreSQL migration and verification have been completed, tested end-to-end, and explicitly approved.

---

## 5. Required Environment Variables

To run the project, developers must create their own local `.env` files based on the tracked templates. **Never commit real `.env` files or credentials to Git.**

### Backend (`backend/.env`):
| Variable | Description / Purpose | Example / Placeholder |
| :--- | :--- | :--- |
| `PORT` | Local Express server port | `3001` |
| `NODE_ENV` | Environment mode | `development` |
| `DATABASE_URL` | Supabase Transaction Pooler (Port 6543) with `?pgbouncer=true` | `postgresql://postgres.[REF]:[PASS]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true` |
| `DIRECT_URL` | Supabase Direct (Port 5432) or Session Pooler (Port 5432) | `postgresql://postgres:[PASS]@db.[REF].supabase.co:5432/postgres` |
| `JWT_SECRET` | Secret key for signing admin and customer JWT tokens | `min-32-character-random-secret-key` |
| `ADMIN_DEFAULT_EMAIL` | Default administrator email used by seed script | `admin@example.com` |
| `ADMIN_DEFAULT_PASSWORD` | Default administrator password used by seed script | `development-admin-password` |
| `FRONTEND_URL` | Allowed CORS origin for frontend client requests | `http://localhost:5173` |

### Frontend (`travel-agency/.env`):
| Variable | Description / Purpose | Example / Placeholder |
| :--- | :--- | :--- |
| `VITE_API_URL` | Base URL of the backend API service | `http://localhost:3001` |

---

## 6. How to Install and Run Locally

Developers should clone the repository into their own clean local workspace:

```bash
git clone https://github.com/mahesh01-creator/PuneTravelAgency.git
cd PuneTravelAgency
```

### Backend Setup:
```bash
cd backend
npm install

# Create backend/.env from template and fill in local development credentials
cp .env.example .env

# Validate the Prisma schema
npx prisma validate

# Run syntax check across backend
node -c src/server.js

# Start backend development server
npm run dev
```

### Frontend Setup:
```bash
cd ../travel-agency
npm install

# Create travel-agency/.env from template
cp .env.example .env

# Run linter
npm run lint

# Build production bundle
npm run build

# Start frontend development server
npm run dev
```

---

## 7. Known Blockers, Risks & Technical Notes

1. **Supabase Development Project Provisioning:**
   - A dedicated `pune-travel-agency-dev` project on Supabase must be provisioned before running any database migrations.
   - For IPv4-only networks, use the **Session Pooler** (port 5432) for `DIRECT_URL` to avoid IPv6 resolution errors (`ENETUNREACH`).
2. **Customer PII Protection:**
   - The 12 `Booking` records in the source SQLite export contain customer personal information.
   - When importing data into the cloud development database, customer names, phone numbers, and addresses must be anonymized or sanitized.
3. **Frontend Linter Warnings:**
   - Running `npm run lint` (`oxlint`) in `travel-agency` reports 102 warnings (unused imports, React Compiler hook dependency suggestions), but 0 errors. The production build (`vite build`) completes cleanly.
4. **Deferred AJ Travels Branding / SEO:**
   - All branding, business name changes, content rewrites, and SEO enhancements are strictly **postponed** until the database migration and deployment readiness phases are completed.

---

## 8. Immediate Next Planned Steps

1. **Next Task (Phase 5):** Vercel Deployment-Readiness Audit and minimal frontend/backend deployment preparation.
2. **Subsequent Task (Phase 6):** Supabase development database provisioning, migration SQL generation and review, executing migration on the development database, importing sanitized data, and count reconciliation.
