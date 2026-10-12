# AIMS internal workspace — interactive prototype

A clickable prototype of a private workspace for AIMS (the AI & ML Society, DTU), built to validate requirements with society members before committing to a production architecture. See `../docs/AIMS_PROTOTYPE_IMPLEMENTATION.md` for the full specification.

**Prototype limits:** no backend, no real authentication, fictional sample data only. Roles are simulated in the browser and provide **no security**.

## Requirements

- Node.js 20.9 or newer (developed on 22)
- npm

Stack: Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS 4, Lucide icons, Vitest.

## Run it (from the repo root, or inside `frontend/`)

```bash
cd frontend
npm install
npm run dev          # http://localhost:3000
```

Other commands:

```bash
npm run lint         # ESLint
npm run typecheck    # tsc --noEmit
npm test             # Vitest unit tests
npm run build        # production build
npm start            # serve the production build
```

## Demo roles

Open the profile menu (bottom of the sidebar, or the ☰ menu on mobile) and choose a **Demo role**: Member, Junior (default), Senior lead or Administrator. Each role signs in as a different fictional person and sees different navigation and dashboards. "Back to the default role" returns to Junior.

## Reset sample data

Profile menu → **Reset demo data**. This restores the original sample records and the Junior role. Edits otherwise survive a page refresh (stored in `sessionStorage` for the tab only) and disappear when the tab closes.

## Main screens and journeys

| Route | What to try |
| --- | --- |
| `/` | Role-specific dashboard; every card links to its detail screen |
| `/resources`, `/resources/[id]` | Search + type/topic/"Assigned to me" filters; suggest a resource (validated); set your progress; leads assign resources, review pending suggestions |
| `/people`, `/people/[id]` | Search by name, skill or domain; filter by year and team; edit your own profile |
| `/profile` | Your profile plus your private progress and attendance |
| `/tasks` | Assigned/created/all tabs, status filter, detail sheet with comments; leads create and edit tasks |
| `/polls`, `/polls/[id]` | Vote once; results follow each poll's visibility setting; closed polls show a decision record |
| `/admin` | Senior/Admin only: entry points, plus simulated invitations for Admin |
| `/admin/attendance` | Per-session marking, live counts, "Mark all present" with undo |
| `/admin/progress` | Juniors' completion derived from their items; update statuses in the detail sheet |
| `/admin/polls` | Create, close (with outcome summary) and review polls |

Suggested walkthrough: as **Junior**, mark a resource "In progress" → switch to **Senior**, see the change in `/admin/progress` → create a task for the junior → switch back and find it on Home.

## Privacy boundaries shown in the UI

- Profiles and the directory never show attendance or progress.
- A member or junior sees only their own progress and attendance (on `/profile`).
- Per-person assignment status is visible to leads and the assignee only.
- Pending resource suggestions are visible to the submitter and leads only.
- Restricted routes show an "access restricted" screen even when opened directly.

## Code layout

```
src/app/          routes (thin wrappers)
src/features/     dashboard, resources, people, tasks, polls, admin, comments
src/components/   layout shell and shared UI (forms, dialogs, toasts, badges)
src/data/seed.ts  all fictional sample data
src/state/        reducer (pure, tested) and context store
src/lib/          permissions, selectors, validation, formatters
tests/            unit tests
```

## Known limitations

- Everything is client-side; the permission helpers only shape the demo and must be re-implemented on a server for production.
- Alumni use the member experience; their eventual restrictions are not modelled.
- Resource assignment targets individuals or "all juniors", not saved groups.
- Admin cannot change anyone's role (invitations are simulated only).
- No automated browser tests are committed; core journeys were smoke-tested manually with Playwright.
- `npm audit` reports advisories in the scaffold's dependencies; none affect this offline prototype but they were not addressed.
