# AIMS EMS Documentation Hub

Welcome to the definitive documentation and architectural specification for **AIMS EMS** (Engineering Management System / Internal Operations Platform) for the **AI & ML Society (AIMS) at Delhi Technological University (DTU)**.

This folder serves as the single source of truth for society leads, student developers, and AI coding agents designing, implementing, testing, deploying, and maintaining the platform.

---

## 1. Documentation Index

The documentation is organized into modular, purpose-driven specifications. Each document maintains explicit status markers on technical decisions.

| Document | Topic & Focus | Primary Audience | Baseline Status |
|---|---|---|---|
| [01-project-overview.md](file:///d:/Main_Files/Projects/aims-erp/docs/01-project-overview.md) | Mission, user profiles, core problems solved, prototype vs. production scope | All stakeholders | Confirmed / Implemented |
| [02-architecture-and-stack.md](file:///d:/Main_Files/Projects/aims-erp/docs/02-architecture-and-stack.md) | Agreed tech stack, Next.js + Neon + Clerk architecture, integration boundaries | Developers, Architects | Confirmed / Proposed |
| [03-requirements-and-permissions.md](file:///d:/Main_Files/Projects/aims-erp/docs/03-requirements-and-permissions.md) | Detailed functional requirements, role model, permission matrix, privacy boundaries | Product, Security, Devs | Confirmed / Proposed |
| [04-ui-design-system.md](file:///d:/Main_Files/Projects/aims-erp/docs/04-ui-design-system.md) | "Quietly Sharp" aesthetic, Calm Editorial + Modern Builder workspace, design tokens, responsive layouts | Frontend, Designers | Confirmed / Implemented |
| [05-database-and-api-design.md](file:///d:/Main_Files/Projects/aims-erp/docs/05-database-and-api-design.md) | Drizzle ORM PostgreSQL schema, relational entities, constraints, indexes, API flow | Backend, Database Devs | Proposed |
| [06-engineering-standards.md](file:///d:/Main_Files/Projects/aims-erp/docs/06-engineering-standards.md) | Strict TypeScript, boundary validation (Zod), testing (Vitest), error handling, Git conventions | Developers, Reviewers | Confirmed / Implemented |
| [07-deployment-and-operations.md](file:///d:/Main_Files/Projects/aims-erp/docs/07-deployment-and-operations.md) | Vercel & Neon branching, Clerk config, quotas & limitations, onboarding guide | DevOps, Lead Maintainers | Confirmed / Proposed |
| [08-decisions-and-roadmap.md](file:///d:/Main_Files/Projects/aims-erp/docs/08-decisions-and-roadmap.md) | Architecture Decision Records (ADRs), phased roadmap, open questions for society leads | Leads, Architects | Confirmed / Open Questions |
| [SEEDED_CREDENTIALS.md](file:///d:/Main_Files/Projects/aims-erp/docs/SEEDED_CREDENTIALS.md) | Comprehensive test credentials, roles, Google SSO flow, default password (`aims2026`) | All Developers, Testers | Implemented |
| [AIMS_PROTOTYPE_IMPLEMENTATION.md](file:///d:/Main_Files/Projects/aims-erp/docs/AIMS_PROTOTYPE_IMPLEMENTATION.md) | *Historical Reference:* Original specification v0.1 for the in-memory prototype | Historical Context | Implemented (v0.1) |

---

## 2. Verification Taxonomy & Status Conventions

To prevent confusion between what has actually been built, what is agreed upon, and what is merely suggested, all documentation strictly adheres to five verification statuses:

- `[Implemented]`: Code is present, functioning, and verified in the current repository (e.g., prototype UI components, seed data, in-memory state reducer).
- `[Confirmed]`: Formally agreed upon by project leads and backed by architectural consensus or repository configuration (e.g., Next.js + Clerk + Neon stack, "Quietly sharp" design direction).
- `[Proposed]`: A pragmatic recommendation engineered for this project, pending implementation or formal sign-off (e.g., exact Drizzle relational schema tables, dedicated attendance manager role).
- `[Open Question]`: A known fork or requirement ambiguity requiring a human decision from society leads (Arnav and Vaatsalya).
- `[Unverified]`: External claims, vendor benefits, or third-party features that require confirmation before reliance (e.g., specific student pack sponsor benefits).

---

## 3. Quick Reading Pathways

### For a New Student Developer Onboarding
1. Read [01-project-overview.md](file:///d:/Main_Files/Projects/aims-erp/docs/01-project-overview.md) to understand why AIMS EMS exists and who uses it.
2. Read [02-architecture-and-stack.md](file:///d:/Main_Files/Projects/aims-erp/docs/02-architecture-and-stack.md) to see how Next.js, Clerk, Drizzle, and Neon fit together.
3. Follow the Step-by-Step Local Setup Guide in [07-deployment-and-operations.md](file:///d:/Main_Files/Projects/aims-erp/docs/07-deployment-and-operations.md).
4. Review [06-engineering-standards.md](file:///d:/Main_Files/Projects/aims-erp/docs/06-engineering-standards.md) before writing any code or opening a Pull Request.

### For an AI Coding Assistant / Pair Programmer
1. Check [02-architecture-and-stack.md](file:///d:/Main_Files/Projects/aims-erp/docs/02-architecture-and-stack.md) for architectural boundaries (strict no-microservices rule, single Next.js service).
2. Check [03-requirements-and-permissions.md](file:///d:/Main_Files/Projects/aims-erp/docs/03-requirements-and-permissions.md) for authorization and privacy constraints (e.g., never expose individual attendance or progress publicly).
3. Check [05-database-and-api-design.md](file:///d:/Main_Files/Projects/aims-erp/docs/05-database-and-api-design.md) for Drizzle schema definitions and Zod validation patterns.
4. Adhere strictly to the design tokens and layout rules in [04-ui-design-system.md](file:///d:/Main_Files/Projects/aims-erp/docs/04-ui-design-system.md).

### For Society Leads (Arnav & Vaatsalya)
1. Review the Current Status & Scope in [01-project-overview.md](file:///d:/Main_Files/Projects/aims-erp/docs/01-project-overview.md).
2. Review the Role & Access Matrix in [03-requirements-and-permissions.md](file:///d:/Main_Files/Projects/aims-erp/docs/03-requirements-and-permissions.md).
3. Address the pending decisions listed in [08-decisions-and-roadmap.md](file:///d:/Main_Files/Projects/aims-erp/docs/08-decisions-and-roadmap.md).

---

## 4. Current Repository State Summary

- **Frontend Prototype (`frontend/`)**: Fully functional interactive client-side prototype built on Next.js 16 (App Router), React 19, TypeScript, and Tailwind CSS 4. Operates on pure in-memory state with realistic fictional seed data.
- **Backend Service Layer (`backend/`)**: Currently contains a roadmap marker. In the agreed architecture, backend API routes, Server Actions, and Drizzle queries will reside directly within the Next.js application (`frontend/` or consolidated root), avoiding a separate backend service.
- **Documentation (`docs/`)**: This consolidated suite of 8 structured documents replacing outdated scratchpads and establishing the production blueprint.
