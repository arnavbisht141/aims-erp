# AIMS EMS (Internal Operations Platform)

Private internal workspace for the **AI & ML Society (AIMS)** at **Delhi Technological University (DTU)**.

AIMS EMS replaces fragmented WhatsApp chats, Google Sheets (attendance & junior tracking), and Google Forms (polls & decisions) with a unified, privacy-first, responsive platform.

```
frontend/   Next.js 16 interactive prototype (runs on in-memory fictional data)
backend/    Backend architecture notes (services integrated into full-stack Next.js)
docs/       Authoritative project documentation and architectural specifications
.claude/    Skills and engineering guidelines
```

---

## 📖 Authoritative Documentation Hub

The complete engineering, product, and architecture specifications are maintained in the [`docs/`](docs/README.md) folder:

- **[01. Project Overview & Scope](docs/01-project-overview.md):** Mission, stakeholders, user cohorts, problems solved, and non-goals.
- **[02. Architecture & Technology Stack](docs/02-architecture-and-stack.md):** Agreed stack (Next.js + Neon + Clerk + Drizzle + Zod + Tailwind), system diagrams, and integration boundaries.
- **[03. Product Requirements & Access Control](docs/03-requirements-and-permissions.md):** Role taxonomy, comprehensive permissions matrix, and strict privacy boundaries.
- **[04. UI Design System & UX Principles](docs/04-ui-design-system.md):** "Quietly sharp" design philosophy, Calm Editorial + Modern Builder workspace, tokens, and responsive ergonomics.
- **[05. Database Schema & API Architecture](docs/05-database-and-api-design.md):** Relational Drizzle ORM PostgreSQL schema, table definitions, foreign keys, cascades, indexes, and mutation pipeline.
- **[06. Engineering Standards & Workflow](docs/06-engineering-standards.md):** Strict TypeScript rules, input validation (Zod), error sanitization, Vitest testing, and PR review checklist.
- **[07. Deployment, Operations & Cloud Quotas](docs/07-deployment-and-operations.md):** Verified limits for Neon, Clerk, and Vercel; database migration routine; step-by-step developer onboarding.
- **[08. Technical Decisions, Roadmap & Open Questions](docs/08-decisions-and-roadmap.md):** Architecture Decision Records (ADRs), phased roadmap, and open questions for maintainers.

---

## 🚀 Quick Start (Local Development)

### Prerequisites
- Node.js 20.9+ (developed on Node 22 LTS)
- npm

### Setup & Run
```bash
# 1. Install dependencies across the workspace
npm run install:all

# 2. Configure local environment variables
cp .env.example .env.local

# 3. Start local development server (http://localhost:3000)
npm run dev
```

### Verification Commands
```bash
npm test            # Run Vitest unit tests (17 tests passing)
npm run typecheck   # TypeScript type-checking & route typegen
npm run lint        # ESLint code standards check
npm run build       # Next.js production bundle build
```

*For prototype demo walkthroughs (switching between Junior, Senior, and Admin roles), see [frontend/README.md](frontend/README.md).*

