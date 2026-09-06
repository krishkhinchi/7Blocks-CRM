# 🏢 7BLOCKS CRM — Production Platform

A complete, enterprise-grade, full-stack CRM engineered specifically for **7BLOCKS** to replace Excel-based client and lead management workflows.

---

## 🌟 Executive Summary & Capabilities

7BLOCKS CRM is built from the ground up to support high-velocity B2B digital agency sales, cold outreach, website design client acquisition, and dual-track outreach (Email Campaigns & High-Volume Cold Calling).

* **Dual-Track Outreach Engine**: Native support for 7BLOCKS' dual-track prospecting workflow:
  * **Email Outreach**: Tracks email status, website audit state (`NO_WEBSITE`, `UPDATE_WEBSITE`, `CUSTOM_BUILD`), and response tracking.
  * **Cold Calling Pipeline**: Dedicated Call Logger modal capturing outcomes (`CONNECTED`, `VOICEMAIL`, `CALL_BACK`, `INTERESTED`, `NOT_INTERESTED`, `DEMO_REQUESTED`, etc.), call duration, notes, and auto-scheduling callback tasks.
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
