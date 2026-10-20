# 02. Architecture & Technology Stack

**Status:** Confirmed Architecture (`[Confirmed]`); Production Implementation Pending (`[Proposed]`)  
**Primary Pattern:** Monolithic Full-Stack Next.js Application on Vercel with Managed Serverless Database (Neon PostgreSQL) and Hosted Authentication (Clerk).

---

## 1. Agreed Technology Stack `[Confirmed]`

To maintain high velocity and low operational overhead for two student developers, the stack is intentionally streamlined. It relies on battle-tested, managed cloud primitives with zero local infrastructure maintenance.

| Architectural Layer | Technology | Primary Responsibility | Justification & Fit |
|---|---|---|---|
| **Full-Stack Application** | **Next.js 16 + React 19 + TypeScript** | Client UI, App Router layouts, Server Components, Route Handlers, Server Actions | Unified TypeScript codebase across frontend and backend; zero build-tool mismatch; built-in server execution. |
| **Relational Database** | **Neon PostgreSQL** | Persistent relational storage, transactions, foreign key integrity, migrations | Serverless Postgres with automatic scaling, instant database branching for PRs, and generous free tier. |
| **Authentication & Identity** | **Clerk** | User registration, login, multi-factor auth, session lifecycle, passwordless / Google OAuth | Completely offloads secure credential handling, session cookies, and identity verification. |
| **Database Toolkit & ORM** | **Drizzle ORM + Drizzle Kit** | Type-safe schema definitions, SQL queries, migration generation | Lightweight, zero-overhead SQL-like syntax; fully type-safe with TypeScript; no heavy native binary engines. |
| **Input Validation** | **Zod** | Runtime validation of untrusted API inputs and form submissions | TypeScript-first schema declaration; guarantees data shape before hitting business logic or database. |
| **CSS & Design Tokens** | **Tailwind CSS (v4)** | Utility-first responsive styling, semantic design tokens, color modes | Rapid styling without CSS context-switching; clean responsive design primitives. |
| **UI Component Library** | **shadcn/ui** (evolutionary target) | Accessible, unstyled, composable UI components (Radix primitives) | High accessibility (WCAG), copy-paste architecture that gives total ownership over styling and logic. |
| **Version Control & CI** | **Git + GitHub** | Feature branches, Pull Requests, code review, automated CI workflows | Industry-standard collaboration; automated test verification on pull requests. |
| **Hosting & Edge Delivery** | **Vercel** | Next.js serverless execution, Edge CDN, preview deployments | First-class Next.js deployment; zero-config previews for every GitHub PR; native Neon marketplace integration. |

### Optional / Auxiliary Services (On-Demand Only) `[Proposed]`

These services must NOT be added until concrete product requirements demand them:

- **File / Media Storage:** **Cloudflare R2** or **Cloudinary** (`[Proposed]`). Deferred until members need to upload PDF resumes, workshop slide decks, or session recordings directly to the platform (external URLs are used currently).
- **Transactional Email:** **Resend** (`[Proposed]`). Deferred until automated email invites or notification digests are needed beyond in-platform notices.
- **Error Monitoring:** **Sentry** (`[Proposed]`). Deferred until public production rollout to track unhandled server and client exceptions.

---

## 2. System Architecture & Request Flow

The entire application runs as a cohesive, single-service deployment.

```
                              ┌────────────────────────────────────────┐
                              │           Client Web Browser           │
                              │   (Laptop Dashboard / Mobile View)     │
                              └──────────────────┬─────────────────────┘
                                                 │
                                        HTTPS Request (Cookies)
                                                 │
                                                 ▼
┌───────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                       Vercel Serverless Platform                                      │
│                                                                                                       │
│   ┌───────────────────────────────────────────────────────────────────────────────────────────────┐   │
│   │                                  Next.js Application Layer                                    │   │
│   │                                                                                               │   │
│   │  1. Ingress & Routing (Next.js App Router)                                                    │   │
│   │  2. Identity Verification                                                                     │   │
│   │     • Extract session token from HTTP-only cookie                                             │   │
│   │     • Verify cryptographic signature via Clerk SDK (Clerk Auth API)                           │   │
│   │  3. Input Validation Boundary                                                                 │   │
│   │     • Validate untrusted payload against strict Zod Schema                                    │   │
│   │  4. Authorization Guard (Server-Side)                                                         │   │
│   │     • Fetch Member record & Role from Neon DB                                                 │   │
│   │     • Enforce domain permissions (e.g. canManageAttendance)                                   │   │
│   │  5. Data Layer (Drizzle ORM)                                                                  │   │
│   │     • Execute type-safe queries / transactions                                                │   │
│   │     • Return typed JSON response or handled error                                             │   │
│   └──────────────────────────────┬──────────────────────────────┬─────────────────────────────────┘   │
└──────────────────────────────────┼──────────────────────────────┼─────────────────────────────────────┘
                                   │                              │
                     Session Auth Verification             Connection Pooled
                                   │                              │
                                   ▼                              ▼
                    ┌────────────────────────────┐  ┌───────────────────────────┐
                    │       Clerk Auth API       │  │      Neon PostgreSQL      │
                    │  (Identity & Credentials)  │  │   (Application Database)  │
                    └────────────────────────────┘  └───────────────────────────┘
```

### Detailed Request Execution Steps

1. **Client Request:** The browser dispatches a request (fetch or Server Action) with user-supplied parameters and credentials (HTTP-only session cookie).
2. **Runtime Input Validation:** The server endpoint parses and validates incoming arguments with a strict Zod schema. If validation fails, execution halts immediately with a structured `400 Bad Request` error.
3. **Identity Verification:** The Clerk SDK validates the active session cookie. If unauthenticated, the request halts with `401 Unauthorized`.
4. **Server-Side Authorization:** The server queries the application database for the member's assigned role. It asserts whether that specific role is authorized to perform the action. If unauthorized, it halts with `403 Forbidden`.
5. **Database Execution:** Drizzle ORM executes parameterized SQL queries against Neon PostgreSQL over a pooled connection, utilizing database transactions for multi-record operations.
6. **Predictable Response:** The server formats and returns a typed payload or safe, sanitized error message.

---

## 3. Core Architectural Boundaries & Prohibitions `[Confirmed]`

### 3.1 Strict Prohibition on Premature Infrastructure
To prevent accidental project collapse caused by overengineering, the following are **strictly forbidden** in the baseline architecture:
- **No Separate Express or Nest.js API:** Next.js Route Handlers and Server Actions provide complete server-side capabilities.
- **No Redis / In-Memory Caches:** The platform serves 200–300 users. PostgreSQL easily handles this traffic with proper indexing. Adding Redis introduces cache invalidation bugs and extra hosting costs.
- **No Message Queues (RabbitMQ, Kafka, BullMQ):** Asynchronous background workers are unnecessary for the current scale.
- **No Microservices:** The application is a monolithic full-stack Next.js project.

### 3.2 External Boundary: Statistical Competency Engine `[Confirmed]`
- **Current Repository Inspection:** There is currently **no** Python/FastAPI code or competency engine present in the codebase.
- **Integration Boundary Rule:** If a specialized statistical competency evaluation engine or ML model scoring service is introduced in the future by AIMS members, it **must remain a completely independent external service**.
- **Architectural Rules for External Engines:**
  1. It must run on its own infrastructure (e.g. FastAPI / modal / fly.io).
  2. Next.js must communicate with it solely over secure, authenticated HTTP/JSON webhooks or REST endpoints.
  3. It must NEVER be coupled into the Next.js runtime, nor should it directly access the primary Neon database tables without going through dedicated APIs.

---

## 4. Security & Access Control Primitives `[Confirmed]`

### 4.1 Authentication is NOT Authorization
- **Clerk** verifies **who the user is** (`clerkUserId`).
- **AIMS EMS Database** determines **what the user is permitted to do** (`role`, `permissions`, `teamMemberships`).
- A valid Clerk session token proves identity, but NEVER grants administrative capabilities on its own.
- Application permissions must be retrieved and verified on the server from the database for every protected operation.

### 4.2 Academic Cohort vs. Application Role
- **Academic Year (1Y–4Y, Alumni):** An informational member profile attribute indicating student progression at DTU.
- **Application Role (`member`, `junior`, `senior`, `admin`):** An authorization role granting specific system privileges.
- **Critical Rule:** A senior student (3Y/4Y) is **NOT** automatically an administrator. Privileged roles are granted explicitly by administrators.

### 4.3 Client Data Zero-Trust
- Never trust `role`, `isAdmin`, or `userId` supplied in the request body from the client.
- The authenticated user's ID must be derived exclusively from the verified server-side session.
- Client role simulation (as demonstrated in the prototype) is strictly a UI prototyping tool and has zero authority in production.

### 4.4 Secrets & Environment Variable Handling
- Database connection strings (`DATABASE_URL`) and Clerk secret keys (`CLERK_SECRET_KEY`) must never be prefixed with `NEXT_PUBLIC_`.
- All production secrets must reside in Vercel Environment Variables.
- No secrets or credentials may ever be committed to Git.
- An annotated `.env.example` file must be maintained with safe placeholder values.
