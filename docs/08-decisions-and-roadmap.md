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
│  Phase 2: Production Foundation & Auth Integration     [Proposed/Next] │
│  • Elevate repository structure to unified Next.js project             │
│  • Provision Neon PostgreSQL database and apply Drizzle migrations     │
│  • Configure Clerk project and Next.js middleware                      │
│  • Implement user webhook sync from Clerk to Neon `members` table      │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│  Phase 3: Administrative Workflows Persistence         [Proposed]      │
│  • Migrate Attendance roll-call to Neon (session creation & bulk mark) │
│  • Migrate Junior Progress milestone tracking & resource assignments   │
│  • Migrate Poll creation, single-choice voting & DB unique constraints │
│  • Implement Audit Logging table for administrative actions            │
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

---

## 3. Explicit Open Questions for Society Leads (Arnav & Vaatsalya) `[Open Question]`

The following decisions require explicit human confirmation from the lead maintainers before code implementation in Phase 2:

### Question 1: Repository Directory Structure Consolidation
- **Context:** Currently, the repo contains root `package.json`, `frontend/`, and an empty `backend/README.md`.
- **Options:**
  - *Option A (Recommended):* Elevate `frontend/` to the repository root. Eliminate the nested `frontend/` folder. Root `package.json` runs Next.js directly. This simplifies Vercel deployments, Dockerfiles, and linting.
  - *Option B:* Retain `frontend/` and `backend/` monorepo folders, treating the root as an npm workspace.
- **Recommendation:** Option A. Since Next.js is the confirmed full-stack application, an empty `backend/` folder adds cognitive overhead.

### Question 2: Dedicated Attendance Manager Role
- **Context:** In the prototype, attendance marking is permitted for `senior` leads and `admin`.
- **Options:**
  - *Option A (Recommended):* Introduce an `attendance_manager` role/permission. Allows 2nd/3rd year event coordinators to record attendance at workshops without granting access to junior learning progress evaluations.
  - *Option B:* Keep attendance marking coupled to the general `senior` role.
- **Recommendation:** Option A for principle of least privilege.

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
