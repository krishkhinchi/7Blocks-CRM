# 🏢 7BLOCKS CRM — Production Platform

A complete, enterprise-grade, full-stack CRM engineered specifically for **7BLOCKS** to replace Excel-based client and lead management workflows (`7Blocks Core.xlsx`).

---

## 🌟 Executive Summary & Capabilities

7BLOCKS CRM is built from the ground up to support high-velocity B2B digital agency sales, cold outreach, website design client acquisition, and dual-track outreach (Email Campaigns & High-Volume Cold Calling).

* **Dual-Track Outreach Engine**: Native support for 7BLOCKS' dual-track prospecting workflow:
  * **Email Outreach**: Tracks email status, website audit state (`NO_WEBSITE`, `UPDATE_WEBSITE`, `CUSTOM_BUILD`), and response tracking.
  * **Cold Calling Pipeline**: Dedicated Call Logger modal capturing outcomes (`CONNECTED`, `VOICEMAIL`, `CALL_BACK`, `INTERESTED`, `NOT_INTERESTED`, `BLOCKED`, `DEMO_REQUESTED`, etc.), call duration, notes, and auto-scheduling callback tasks.
* **Modern Tech Stack**:
  * **Frontend**: React 18 + Vite + TypeScript + Tailwind CSS + Lucide Icons + `@dnd-kit` (Kanban).
  * **Backend**: Node.js + Express + TypeScript + Prisma ORM + Zod Validation.
  * **Database**: PostgreSQL 16 with normalized relational schema, indexes, and cascades.
  * **API Docs**: Interactive Swagger / OpenAPI UI at `/api/docs`.
* **Security & Access Control**:
  * JWT access tokens (15m expiry) + Secure Refresh Tokens (7d).
  * Password hashing via `bcrypt` (10 rounds).
  * Role-Based Access Control (RBAC): `ADMIN`, `MANAGER`, `SALES_REP`.
  * Rate-limiting (`express-rate-limit`), Helmet security headers, CORS origin controls.
* **Deal Pipeline & Kanban**:
  * Drag-and-drop deal progression across 6 stages: *Lead In -> Qualification -> Proposal Sent -> Negotiation -> Closed Won -> Closed Lost*.
  * Real-time stage count and deal value metrics in Indian Rupees (`₹`).
* **Omnichannel Productivity**:
  * Global Command Palette (`Ctrl+K`) for instantaneous entity search.
  * Append-only Activity Timeline across Calls, Emails, Meetings, Notes, and Tasks.
  * Bulk CSV/Excel Importer with semantic column matching and batch error rollbacks.
  * Comprehensive Audit Trail logging actor, action, entity, IP, and timestamp.

---

## 🧱 Architecture & Project Structure

The project is structured as an npm workspaces monorepo:

```
CRM/
├── apps/
│   ├── api/                          # Express REST API Server
│   │   ├── src/
│   │   │   ├── config/               # Prisma client, app config, env
│   │   │   ├── docs/                 # Swagger OpenAPI 3.0 specs
│   │   │   ├── middleware/           # Auth, RBAC, Rate-Limiting, Validator, Errors
│   │   │   ├── modules/
│   │   │   │   ├── auth/             # Login, refresh, register, profile
│   │   │   │   ├── users/            # User management & team assignment
│   │   │   │   ├── contacts/         # Full CRUD, filters, pagination, bulk ops
│   │   │   │   ├── companies/        # B2B account tracking & contact links
│   │   │   │   ├── deals/            # Deal progression, stages, probability
│   │   │   │   ├── activities/       # Call logging, notes, timeline events
│   │   │   │   ├── tasks/            # Task lists, priority, status, reminders
│   │   │   │   ├── meetings/         # Meeting scheduling & agenda
│   │   │   │   ├── dashboard/        # Real SQL aggregation metrics & pipeline health
│   │   │   │   ├── search/           # Global search across contacts, companies, deals
│   │   │   │   ├── imports/          # Excel (.xlsx) & CSV parser & semantic mapper
│   │   │   │   ├── exports/          # CSV streaming exporter
│   │   │   │   ├── emails/           # Email logging & webhook simulator
│   │   │   │   ├── audit/            # Read-only tamper-proof audit trail
│   │   │   │   ├── notifications/    # User notification dispatch & read tracking
│   │   │   │   └── tags/             # Taxonomy tagging engine
│   │   │   ├── tests/                # Automated API test suite (Jest + Supertest)
│   │   │   └── server.ts             # Server entrypoint & middleware mounting
│   │   ├── tsconfig.json
│   │   └── package.json
│   │
│   └── web/                          # React + Vite Frontend SPA
│       ├── src/
│       │   ├── components/           # UI primitives (Badge, Modal, EmptyState, Sidebar, Header, etc.)
│       │   ├── context/              # AuthContext (JWT lifecycle, user state, logout)
│       │   ├── forms/                # CreateContactModal, CreateDealModal, LogCallModal, CreateTaskModal, SendEmailModal
│       │   ├── pages/                # Dashboard, Contacts, Companies, Pipeline, Tasks, Calendar, Reports, Imports, etc.
│       │   ├── services/             # Axios API client with automatic token refresh
│       │   ├── App.tsx               # Client routes & protected route guards
│       │   └── index.css             # Tailwind design system tokens
│       └── vite.config.ts
│
├── packages/
│   └── shared/                       # Shared TypeScript enums, models, and contracts
│       ├── src/index.ts
│       └── package.json
│
├── prisma/
│   ├── schema.prisma                 # Relational PostgreSQL database schema
│   └── seed.ts                       # Production seed dataset (Users, Companies, Contacts, Deals, Activities)
│
├── docker/
│   ├── Dockerfile.api                # Production multi-stage API container
│   ├── Dockerfile.web                # Production Nginx SPA container
│   └── nginx.conf                    # Nginx reverse proxy configuration
│
├── docker-compose.yml                # Docker orchestrator for DB, API, and Web
├── .dockerignore
├── .env.example
├── package.json
└── README.md
```

---

## 🔑 Default Credentials (Seeded)

The system is seeded with 4 pre-configured users covering all RBAC tiers.

| Role | Email | Password | Permissions |
| :--- | :--- | :--- | :--- |
| **ADMIN** | `admin@7blocks.com` | `7Blocks@2026!` | Full administrative access, user creation, role editing, full audit logs |
| **MANAGER** | `manager@7blocks.com` | `7Blocks@2026!` | Team oversight, all contacts & deals, reports, pipeline analytics |
| **SALES_REP** | `aarav@7blocks.com` | `7Blocks@2026!` | Assigned leads & deals, call logging, task creation |
| **SALES_REP** | `priya@7blocks.com` | `7Blocks@2026!` | Assigned leads & deals, call logging, task creation |

---

## ⚡ Getting Started (Local Development)

### Prerequisites
* **Node.js**: v18+ (tested on Node v20 & v24)
* **PostgreSQL**: v14+ running on port 5432
* **npm**: v9+

### 1. Environment Configuration
Copy the example environment configuration:
```bash
cp .env.example .env
```
Ensure your `.env` contains your PostgreSQL connection string:
```env
PORT=5000
DATABASE_URL="postgresql://postgres:your_password@localhost:5432/sevenblocks_crm?schema=public"
JWT_SECRET="sevenblocks_production_jwt_secret_key_2026_x99!secure"
JWT_REFRESH_SECRET="sevenblocks_production_jwt_refresh_secret_key_2026_x99!secure"
FRONTEND_URL="http://localhost:3000"
DEFAULT_CURRENCY="INR"
TIMEZONE="Asia/Kolkata"
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Build Shared Enums & Types
```bash
npm run build --workspace=@7blocks/shared
```

### 4. Database Migration & Seed
Run Prisma database sync and the data seeder:
```bash
# Push schema changes to PostgreSQL
npx prisma db push

# Populate initial users, clients, deals, and 7Blocks sample data
npx ts-node prisma/seed.ts
```

### 5. Start Development Servers
You can run both API and Frontend in parallel:
```bash
# Terminal 1: Backend API (runs on port 5000)
npm run dev --workspace=@7blocks/api

# Terminal 2: Web Client (runs on port 3000)
npm run dev --workspace=@7blocks/web
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🐳 Docker Production Deployment

To run the entire system including PostgreSQL, the API, and the Web UI in isolated containers:

```bash
docker-compose up --build -d
```

* **Web UI**: [http://localhost:3000](http://localhost:3000)
* **API Endpoints**: [http://localhost:5000/api](http://localhost:5000/api)
* **Interactive API Documentation (Swagger)**: [http://localhost:5000/api/docs](http://localhost:5000/api/docs)
* **PostgreSQL**: `localhost:5432`

---

## 🧪 Automated Testing & QA

Automated tests cover authentication flows, JWT token issuance, contact validation, role guard rejection, and deal pipeline integrity:

```bash
npm run test --workspace=@7blocks/api
```

**Test Coverage Results:**
* `PASS` `apps/api/src/tests/api.test.ts`
  * ✅ POST `/api/auth/login` (Rejects invalid credentials)
  * ✅ POST `/api/auth/login` (Successfully authenticates ADMIN)
  * ✅ GET `/api/auth/me` (Returns authenticated user profile)
  * ✅ GET `/api/contacts` (Lists paginated contacts)
  * ✅ POST `/api/contacts` (Creates new contact with validation)
  * ✅ GET `/api/deals/pipeline/summary` (Aggregates pipeline value)
  * ✅ POST `/api/activities/call` (Logs call & auto-schedules follow-up)
  * ✅ GET `/api/dashboard/summary` (Computes real SQL metrics)
  * ✅ GET `/api/search` (Performs global indexed search)
  * ✅ Role Guards (Denies unauthorized actions for SALES_REP)

---

## 📊 7BLOCKS Core Excel Import Guide

The system includes a dedicated parser tailored for `7Blocks Core.xlsx`:

1. Navigate to **Imports** in the left navigation sidebar (`/imports`).
2. Upload `7Blocks Core.xlsx` or any standard client CSV/Excel file.
3. The semantic mapper automatically parses:
   * **Company & Website**: Extracts business names and clean URLs.
   * **Website Need**: Maps to `NO_WEBSITE`, `UPDATE_WEBSITE`, or `CUSTOM_BUILD`.
   * **Email Track**: `SEND(Y/N)` -> Maps to Contact Outreach Status (`NEW`, `CONTACTED`).
   * **Phone Track**: Maps `Name`, `Phone number`, and `Calling(Y/N)`.
   * **Call Response**: Parses raw remarks (`"CALLING AT 5:30 (BOSS)"`, `"meeting left"`, `"SEND DEMO"`, `"BLOCKED"`) into standardized `Activity` records with the appropriate outcome codes and sets automated reminders.
4. Review the Import Summary table and click **Complete Import**.

---

## 🛡️ Security & Compliance

* **Tamper-Evident Audit Trail**: Every entity change (`CREATE`, `UPDATE`, `DELETE`, `STAGE_CHANGE`) is logged with the user ID, timestamp, entity type, and previous/new values in JSON format.
* **Rate Limiting**: Critical endpoints like `/api/auth/login` and `/api/imports` have strict rate limiters to prevent brute-force attacks.
* **CORS & Environment Isolation**: Strict origin checks ensure browser clients cannot be spoofed across domains.

---

## 👥 Support & Maintenance

Developed for **7BLOCKS Agency**. For technical questions or customizations, refer to the Swagger docs at `/api/docs` or inspect the database models in `prisma/schema.prisma`.
