# 01. Project Overview & Scope

**Project Name:** AIMS EMS (Engineering Management System / Internal Operations Platform)  
**Organization:** Artificial Intelligence & Machine Learning Society (AIMS), Delhi Technological University (DTU)  
**Maintainers:** Arnav Bisht & Vaatsalya Sharma (Student Lead Developers)  
**Status:** In-Memory Prototype Implemented (`[Implemented]`); Production Architecture Planned (`[Confirmed]`)  
**Target User Base:** 200–300 active society members (1st Year through 4th Year) and Alumni  

---

## 1. Mission & Problem Statement

### 1.1 The Problem `[Confirmed]`
Prior to this project, internal society operations at AIMS DTU relied on a fragmented collection of ad-hoc tools:
- **WhatsApp Groups:** Rapid discussions cause critical announcements, tasks, and learning materials to be lost in endless chat streams.
- **Google Sheets:** Used for tracking member attendance and junior progress. Sheets suffer from accidental overwrites, zero privacy between juniors (everyone can see everyone else's performance or absence), no audit history, and frustrating mobile UX.
- **Google Forms:** Deployed for every small decision, poll, or internal survey, creating orphaned response spreadsheets without historical context.
- **Scattered Bookmarks & Notion Pages:** High-quality research papers, ML roadmaps, and tutorials shared by seniors get lost across different platforms.

### 1.2 The Solution `[Confirmed]`
AIMS EMS is a unified, private, web-based workspace tailored specifically to student society operations. It provides a structured, distraction-free environment that:
1. Replaces scattered Google Sheets with dedicated, privacy-preserving **Attendance** and **Junior Progress** workflows.
2. Replaces disposable Google Forms with in-platform **Polls and Decision Records**.
3. Consolidates member profiles, technical competencies, and coding handles in a searchable **People Directory**.
4. Curates internal technical knowledge into an organized **Resources Library** with direct task assignments.
5. Keeps everyday actions fast and accessible on phones, while providing efficient data-dense dashboards on laptops for administrative leads.

---

## 2. Target Users & Cohorts `[Confirmed]`

The system caters to approximately 200–300 members across different stages of their academic and society lifecycle:

| Cohort | Academic Stage | Primary Needs & Workflows |
|---|---|---|
| **Juniors / Recruits** | 1st & 2nd Year | View assigned learning resources; track personal study milestones; view own attendance; submit resource suggestions; vote on society polls. |
| **Active Members** | 2nd & 3rd Year | Discover peers by skills/domains; share resources; collaborate on society tasks; participate in discussions and votes. |
| **Seniors & Leads** | 3rd & 4th Year | Coordinate sub-teams; assign learning materials; mark attendance for workshops; review junior progress; conduct internal polls; create tasks. |
| **Administrators** | Core Council (Leads/President) | Manage society membership invitations; configure roles; audit society health and attendance analytics. |
| **Alumni** | Graduated Members | Maintain connection to society; share career opportunities, referrals, and advanced resources; advise active projects. |

---

## 3. Core Capabilities & Scope

### 3.1 Initial Administrative Priority (MVP Baseline) `[Implemented]`
The prototype prioritizes the three most urgent administrative workflows that suffer from Google Sheets friction:
1. **Attendance Management:** Fast session-based roll call, bulk "Mark all present" with undo affordances, real-time headcounts, and private student history.
2. **Junior Progress Tracking:** Objective milestone completion derived from assigned resources and tasks, eliminating subjective evaluations and keeping junior progress private to leads and the junior.
3. **Polls & Decision Records:** Single-choice voting with customizable visibility rules (e.g. results visible only after voting or after poll closure) and permanent archived outcomes.

### 3.2 Full Platform Capabilities `[Confirmed]`

```
┌────────────────────────────────────────────────────────────────────────┐
│                               AIMS EMS                                 │
├───────────────────┬───────────────────┬────────────────────────────────┤
│ Knowledge & Growth│ Operations & Collab│ Administration & Governance   │
├───────────────────┼───────────────────┼────────────────────────────────┤
│ • Resource Library│ • Task Management │ • Session Attendance Roll-call │
│ • Topic Filtering │ • Context Comments│ • Junior Learning Tracking     │
│ • Resource Assign │ • Team Directories│ • Official Polls & Decisions   │
│ • Personal Status │ • Announcements   │ • Invite-Only Member Onboarding│
│ • Coding Profiles │ • People Search   │ • Audit Logging & Analytics    │
└───────────────────┴───────────────────┴────────────────────────────────┘
```

- **Member Profiles & Directory:** Searchable by name, cohort, department, domain, and skills. Links to external coding profiles (GitHub, LeetCode, Codeforces).
- **Resource Repository:** Curated technical papers, roadmaps, tutorials, courses, and opportunities. Tagged by domain, with moderation workflows for peer submissions.
- **Tasks & Comments:** Lightweight coordination tied directly to resources, polls, or internal deliverables.
- **Privacy Enforcement:** Member profiles and directories NEVER expose individual attendance percentages or learning progress to other members.

---

## 4. Current State vs. Production Target

### 4.1 Prototype Status (`frontend/`) `[Implemented]`
- Built with **Next.js 16 (App Router), React 19, TypeScript, and Tailwind CSS 4**.
- Complete client-side prototype operating on in-memory state with structured seed data (`seed.ts`) and a pure state reducer (`reducer.ts`).
- Role simulation switcher in the user profile menu to evaluate Member, Junior, Senior Lead, and Administrator perspectives.
- 17 automated unit tests in **Vitest** verifying selectors, permissions, and reducer mutations.

### 4.2 Production Target (`[Confirmed]`)
- Transition the client-side state to a persistent **Neon PostgreSQL** database managed via **Drizzle ORM**.
- Replace simulated role switching with real authentication via **Clerk** and server-side authorization checks.
- Deploy to **Vercel** with automated preview branches and CI checks.

---

## 5. Architectural Principles

1. **Production-Ready, Not Overengineered:** Built by two student developers. The architecture must be simple to maintain, easy to debug, and free of unnecessary moving parts.
2. **Single Application Service:** All UI, server logic, API endpoints, and database interactions live inside a single Next.js project. No separate Express, microservices, or queue workers by default.
3. **Strict Boundary Validation:** Never trust client-supplied input or roles. All mutations pass through strict Zod schemas and server-side permission checks.
4. **Data Privacy First:** Attendance records and junior learning progress are strictly confidential between the member and authorized leadership.
5. **Quiet, Ergonomic UX:** Clean, distraction-free interface ("Quietly sharp") optimized for mobile attendance checks and dense laptop administration.

---

## 6. Explicit Non-Goals `[Confirmed]`

To prevent scope creep and maintain development momentum, the following are explicitly out of scope for the current milestones:
- **Instant Chat / Direct Messaging:** AIMS EMS does not replace WhatsApp for real-time social chatting. It replaces WhatsApp for structured organizational data, decisions, and resources.
- **Automated Web Scraping:** No automated bots scraping arXiv, LeetCode contest rankings, or YouTube feeds. All content is community-curated.
- **AI Recommendation Engines:** No vector databases, semantic search embeddings, or automated LLM advisors in the initial MVP.
- **Complex Multi-Tenancy:** AIMS EMS is built specifically for AIMS DTU. It is not an open SaaS platform for arbitrary external organizations.
- **Complex Enterprise RBAC:** Access control uses a straightforward, explicit role and permission model tailored to society workflows.
