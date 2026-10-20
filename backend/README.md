# Backend & Data Architecture

The agreed technology stack for AIMS EMS adopts a **unified full-stack Next.js application** hosted on Vercel with **Neon PostgreSQL** and **Drizzle ORM** (see [ADR-01 in docs/08-decisions-and-roadmap.md](file:///d:/Main_Files/Projects/aims-erp/docs/08-decisions-and-roadmap.md)).

Rather than maintaining a separate Express or FastAPI service in this directory, backend capabilities (API endpoints, Server Actions, authorization guards, and Drizzle database queries) will reside directly within the Next.js project.

## Architecture Specifications

For the authoritative backend and database specifications, refer to:
- **Architecture & Technology Stack:** [docs/02-architecture-and-stack.md](file:///d:/Main_Files/Projects/aims-erp/docs/02-architecture-and-stack.md)
- **Database Schema & Drizzle Queries:** [docs/05-database-and-api-design.md](file:///d:/Main_Files/Projects/aims-erp/docs/05-database-and-api-design.md)
- **Permissions & Authorization Matrix:** [docs/03-requirements-and-permissions.md](file:///d:/Main_Files/Projects/aims-erp/docs/03-requirements-and-permissions.md)

## Integration Boundary: Statistical Competency Engine
If a separate Python/FastAPI ML scoring or statistical competency engine is developed by society members in the future, it must remain an external service communicating with Next.js via authenticated HTTP/JSON webhooks. See [docs/02-architecture-and-stack.md](file:///d:/Main_Files/Projects/aims-erp/docs/02-architecture-and-stack.md#32-external-boundary-statistical-competency-engine-confirmed).

