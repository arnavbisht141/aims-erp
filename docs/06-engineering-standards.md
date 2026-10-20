# 06. Engineering Standards & Development Workflow

**Status:** Standards & Conventions Active (`[Confirmed]`); Vitest Suite Passing (`[Implemented]`); CI Checks Active (`[Confirmed]`)

---

## 1. Engineering Philosophy: Production-Ready, Not Overengineered

AIMS EMS is built by two student developers learning to build, ship, and maintain a real application. High engineering standards do not mean enterprise bloat. They mean:
- **Predictability:** The codebase is easy to read, debug, and reason about after a two-week exam break.
- **Resilience:** Bad inputs, network drops, and unauthorized attempts fail cleanly without crashing the server or leaking data.
- **Maintainability:** Code is strictly typed, modular, and tested at critical boundaries.

---

## 2. Core Coding Standards `[Confirmed]`

### 2.1 Strict TypeScript & Type Safety
- `strict: true` is enforced in `tsconfig.json`.
- **Zero `any` Policy:** Explicitly forbidden unless interacting with an un-typed third-party package. When unavoidable, it must be documented with an explanatory comment.
- Prefer explicit return types on server functions, selectors, and permission helpers.
- Run `npm run typecheck` (`next typegen && tsc --noEmit`) to verify zero compile-time errors.

### 2.2 Layered Architecture & Separation of Concerns

```
frontend/src/
├── app/             # Thin route wrappers, App Router layouts, and page entry points
├── components/      # Reusable presentation primitives (UI, Layout, Navigation)
├── features/        # Domain-specific UI screens (Resources, People, Admin, Tasks)
├── lib/             # Pure helper functions:
│   ├── permissions.ts # Authoritative role & permission logic
│   ├── validation.ts  # Zod validation schemas
│   ├── selectors.ts   # Pure data aggregation & count derivation
│   └── formatters.ts  # Date, status, and display string formatters
├── db/              # Drizzle ORM schema, migrations, and database client
└── state/           # Client-side state reducers and Context store (for prototype)
```

**Golden Rules:**
1. Components must **never** execute direct SQL queries or database mutations inline.
2. Business logic (progress calculation, attendance summing) must live in pure functions in `src/lib/selectors.ts`, not embedded in JSX.
3. Permission rules must be imported from `src/lib/permissions.ts`. Never write inline boolean checks like `role === "admin" || role === "senior"` across multiple UI files.

### 2.3 Input Validation at Boundaries (Zod)
- Every external input (form submissions, URL route params, API bodies) must be parsed through a Zod schema before consumption.
- Whitespace-only strings must be rejected for required text fields.
- External URLs must be validated (`protocol === "http:" || protocol === "https:"`).
- See [05-database-and-api-design.md](file:///d:/Main_Files/Projects/aims-erp/docs/05-database-and-api-design.md) for input schema definitions.

### 2.4 Error Handling & Information Hiding
- **Sanitized Client Errors:** Database error strings, internal stack traces, and environment variables must never be returned to the client.
- Always catch database errors on the server, log the technical detail to server stdout/Sentry, and return a clean, actionable message to the client (e.g. *"Unable to record attendance. Please try again."*).
- Define both successful and denied-access UI states. Unauthorized visits must render a polite `<AccessRestricted />` component, not a white screen or generic error.

---

## 3. Seed & Sample Data Policy `[Confirmed]`

- **Local Development & Demos Only:** The realistic dataset in `src/data/seed.ts` is strictly for local feature development, interactive demonstrations, and unit tests.
- **Pure Fictional Records:** Seed data must contain only fictional names, `@example.com` emails, and generic public technical links. No real DTU student phone numbers, roll numbers, or personal emails may ever exist in seed data.
- **Production Isolation:** The production database must **never** run sample seed scripts. Production onboarding must use empty, clean database tables populated solely through legitimate invitation signups.

---

## 4. Automated Testing Strategy `[Implemented]`

Testing focuses on high-leverage business logic, authorization invariants, and data integrity—not trivial UI snapshot testing.

The test suite runs on **Vitest** (`npm test`):

```bash
npm test
```

### 4.1 Required Test Coverage Areas
1. **Permission Helpers (`lib/permissions.ts`):** Assert that unauthorized roles are rejected for every restricted action. Test edge cases (e.g., can a member view another member's attendance? Can an alumni edit a junior's milestone?).
2. **Selector Calculations (`lib/selectors.ts`):** Verify that completion percentages and attendance totals are accurately derived from raw records (including empty states and 100% completion).
3. **Form & Zod Validation (`lib/validation.ts`):** Assert that invalid URLs, duplicate poll options, and whitespace-only strings are rejected.
4. **State Reducer Invariants (`state/reducer.ts`):** Test that duplicate poll votes are rejected, closed polls reject votes, and profile edits only mutate the actor's own record.

---

## 5. Development & Git Workflow `[Confirmed]`

### 5.1 Branching Strategy
- `main`: Production-ready code. Protected branch. Direct pushes are disabled.
- `feature/<name>` or `fix/<name>`: Short-lived feature branches created off `main`.
- Pull Requests must be small, focused, and reviewable (ideally under 400 lines of diff).

### 5.2 Pre-Commit & PR Verification Checklist
Before submitting a PR or merging into `main`, developers must verify:

```bash
# 1. Run unit test suite
npm test

# 2. Run TypeScript typecheck
npm run typecheck

# 3. Run ESLint verification
npm run lint

# 4. Verify Next.js production build succeeds locally
npm run build
```

### 5.3 Code Review Focus
1. Does this PR introduce unnecessary dependencies?
2. Are all inputs validated at server boundaries?
3. Is server authorization enforced for sensitive operations?
4. Are database queries properly indexed and parameterized?
5. Does the UI remain fully usable on a 390px mobile viewport?
