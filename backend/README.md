# Backend (not started)

Reserved for the AIMS API. The prototype in `../frontend` runs entirely on in-memory sample data, so nothing here is required to run it.

## When you start

- **Domain model:** `../frontend/src/types/index.ts` defines the entities the UI expects (members, resources, assignments, attendance, progress items, polls, votes, tasks, comments, invitations). Treat it as the first draft of the API contract and adjust deliberately.
- **Permission rules:** `../frontend/src/lib/permissions.ts` lists the intended rules. They are browser-only in the prototype, so re-implement and enforce them server-side.
- **State changes:** the action list in `../frontend/src/state/reducer.ts` maps roughly to the endpoints you will need.
- **Sample data:** `../frontend/src/data/seed.ts` can seed a development database. It is entirely fictional.
- **Privacy:** individual attendance and progress must be restricted to the person and authorised leads at the API and data layer, not only in the UI.

Record the stack and API-style decisions as short notes in `../docs/` as you make them.
