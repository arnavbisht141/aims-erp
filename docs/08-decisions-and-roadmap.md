# 08. Technical Decisions, Roadmap & Open Questions

**Status:** ADRs Documented (`[Confirmed]`); Roadmap Phased (`[Confirmed]`); Open Questions Flagged for Leads (`[Open Question]`)

---

## 1. Architecture Decision Records (ADRs) `[Confirmed]`

### ADR-01: Unified Full-Stack Next.js Monolith over Distributed Microservices
- **Context:** The team evaluated whether to maintain a separate Express or FastAPI backend in `backend/` or build a unified full-stack Next.js application.
- **Decision:** Consolidate frontend and application backend into a single Next.js application.
- **Rationale:** AIMS EMS serves 200–300 users. A distributed microservices setup (separate Express API + Next.js frontend + Redis) introduces double deployments, CORS issues, duplicate TypeScript interfaces, and excessive maintenance for two student developers. Next.js App Router Server Actions and Route Handlers provide first-class backend execution.

### ADR-02: Drizzle ORM + Neon PostgreSQL over Prisma or Supabase
- **Context:** Selecting the primary database and ORM toolkit.
- **Decision:** Neon Serverless PostgreSQL with Drizzle ORM.
- **Rationale:** Prisma relies on a heavy Rust binary engine and suffers from cold starts on serverless edge runtimes. Drizzle is a lightweight TypeScript SQL query builder with zero binary overhead. Neon provides instant database copy-on-write branching, enabling isolated database testing for every GitHub Pull Request.

### ADR-03: Application-Level Membership Tables over Clerk Organizations
- **Context:** Deciding where to store user roles, society cohorts, and permissions.
- **Decision:** Use Clerk solely for personal authentication and session tokens (`userId`). Store all member profiles, society roles (`admin`, `senior`, `junior`, `member`), and team memberships in Neon PostgreSQL.
- **Rationale:** Verified platform inspection revealed that Clerk's free Hobby plan limits B2B **Organizations** to **20 members per organization**. AIMS has 200–300 members. Attempting to use Clerk Organizations would immediately force an unwanted $100+/month paid upgrade.

### ADR-04: Strict Server-Side Authorization for Attendance & Junior Progress
- **Context:** In Google Sheets, junior progress and member attendance were visible to everyone, creating peer comparison and privacy violations.
- **Decision:** Restrict individual attendance and junior evaluation items at the server query layer.
- **Rationale:** Individual attendance records and junior milestones are only queryable by the member themselves and authorized leads. The general member directory never displays attendance rates or learning ratings.

### ADR-05: Isolation of Future Statistical Competency / ML Services
- **Context:** AIMS members frequently experiment with Python ML models and data science scripts.
- **Decision:** If a statistical competency scoring engine is built in Python/FastAPI in the future, it must remain an external service communicating via secure HTTP/JSON webhooks.
- **Rationale:** Prevents coupling experimental Python ML dependencies into the Next.js production build pipeline.

### ADR-06: Dual-Mode Embedded PostgreSQL (PGlite) & Neon Cloud Parity `[Implemented]`
- **Context:** Developers needed a local database that operates completely offline without requiring local PostgreSQL service installation, Docker daemons, or internet connectivity, while guaranteeing seamless compatibility with cloud Neon DB.
- **Decision:** Use `@electric-sql/pglite` (embedded WebAssembly PostgreSQL) for local development persisting to `.data/aims-pglite`, and switch automatically to `@neondatabase/serverless` when `DATABASE_URL` is set in production.
- **Rationale:** PGlite runs a real, full-featured PostgreSQL 16 engine in-process compiled to WASM. It executes the identical Drizzle PostgreSQL schema, constraints, enums, and queries as Neon PostgreSQL, with zero Docker or local database service setup required.

### ADR-07: Session Authentication & Dedicated Sign-In Flow `[Implemented]`
- **Context:** Moving beyond UI-only role mocking to persistent, secure authentication.
- **Decision:** Implement database-backed sessions in the `sessions` table with HTTP-only cookies (`aims_session_token`), a dedicated `/sign-in` screen with credential validation (email + bcrypt/crypto hash), and 1-click persona switching for development.
- **Rationale:** Keeps local development 100% self-contained without requiring internet connectivity to Clerk during initial building, while establishing the exact same `getCurrentMember()` session guard interface for seamless Clerk migration in cloud production.

### ADR-08: Dedicated Attendance Manager Role (`attendance_manager`) `[Implemented]`
- **Context:** Event coordinators and 2nd/3rd year leads need to take roll-call attendance at workshops without gaining access to confidential junior learning milestone evaluations.
- **Decision:** Add `attendance_manager` to the `user_role` enum and enforce least-privilege access across the UI and server action layers.
- **Rationale:** Restricts attendance managers to `/admin/attendance` roll-call and aggregate counts, strictly hiding and barring access to junior progress reviews, poll creation, and member invitation management.

---

## 2. Phased Implementation Roadmap `[Confirmed]`

```
┌────────────────────────────────────────────────────────────────────────┐
│  Phase 1: In-Memory Interactive Prototype              [Implemented]  │
│  • Client-side Next.js 16 App Router UI                                │
│  • Pure reducer state management with fictional seed data              │
│  • 17 Vitest unit tests verifying selectors, permissions, and reducer  │
│  • Role-switching demo controls                                        │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│  Phase 2: Database Layer, Auth & v1 Production Base     [Implemented]  │
│  • Full Drizzle PostgreSQL schema (16 tables, enums, relations)        │
│  • Dual-mode DB: Embedded local PGlite (.data) + Neon Serverless Cloud │
│  • Database-backed Session Auth with HTTP-only cookies & Next.js proxy │
│  • Dedicated Sign-In Page (/sign-in) + Quick-Access Role Personas      │
│  • Dedicated Attendance Manager role (`attendance_manager`)            │
│  • Server Actions & Server-Side RBAC for attendance, polls, resources  │
│  • 24 Vitest tests passing; zero TypeScript errors; zero build errors  │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│  Phase 3: Administrative Workflows Persistence & Cloud [Proposed/Next] │
│  • Connect Neon PostgreSQL cloud project via DATABASE_URL              │
│  • Connect Clerk production identity provider                          │
│  • Expand client page components to consume server actions directly    │
│  • Implement Audit Logging table UI for administrative actions         │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│  Phase 4: Collaboration, Files & External Notifications [Proposed]     │
│  • Community Tasks & Comment threads on resources                      │
│  • Cloudflare R2 file storage for workshop PDFs / slide decks          │
│  • Resend transactional emails for official meeting summons            │
│  • Sentry error monitoring integration                                 │
└────────────────────────────────────────────────────────────────────────┘
```
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│  Phase 4: Collaboration, Files & External Notifications [Proposed]     │
│  • Community Tasks & Comment threads on resources                      │
│  • Cloudflare R2 file storage for workshop PDFs / slide decks          │
│  • Resend transactional emails for official meeting summons            │
│  • Sentry error monitoring integration                                 │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Explicit Decisions & Open Questions for Society Leads (Arnav & Vaatsalya)

### Question 1: Repository Directory Structure Consolidation `[Resolved]`
- **Status:** Resolved. The project retains the current `frontend/` directory structure with root script forwarding (`npm run dev`, `test`, `build`, etc.) to minimize diff churn and keep root workspace clean.

### Question 2: Dedicated Attendance Manager Role `[Resolved & Implemented]`
- **Status:** Implemented. Dedicated `attendance_manager` role added to schema enum and enforced across server actions and UI. Attendance managers can mark roll call and view aggregate counts, but cannot view junior learning progress evaluations or administer polls.

### Question 3: DTU Domain Authentication Restriction
- **Context:** Clerk supports Google OAuth and email signups.
- **Options:**
  - *Option A:* Restrict signups strictly to `@dtu.ac.in` Google Workspace accounts.
  - *Option B (Recommended):* Allow any email address, but enforce an invitation whitelist in the database.
- **Recommendation:** Option B. Many DTU students use personal Gmail accounts for development, GitHub, and LeetCode, and DTU institutional emails occasionally experience delivery quirks.

### Question 4: Resource Moderation Workflow
- **Context:** Members can suggest learning resources.
- **Options:**
  - *Option A:* Suggestions immediately publish to the library with a "Community Contributed" tag.
  - *Option B (Recommended):* Suggestions enter a `pending_review` state until approved by a lead.
- **Recommendation:** Option B to keep the knowledge repository curated and high-signal.

### Question 5: Poll Vote Mutability
- **Context:** Members cast votes in society polls.
- **Options:**
  - *Option A (Current Prototype Baseline):* Votes are strictly immutable once cast (one vote per member per poll).
  - *Option B:* Allow members to change their selected option until the poll is closed.
- **Recommendation:** Option A. Single-choice immutable voting prevents strategic vote-flipping and simplifies database concurrency.
