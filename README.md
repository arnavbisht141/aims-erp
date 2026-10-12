# AIMS internal platform

Private workspace for AIMS (the AI & ML Society, DTU).

```
frontend/   Next.js prototype (runs on fictional in-memory data) — see frontend/README.md
backend/    Reserved for the API (not started) — see backend/README.md
docs/       Specification and future architecture notes
.claude/    Claude Code skills and settings
```

## Quick start

```bash
npm run install:all   # installs frontend dependencies
npm run dev           # http://localhost:3000
```

Root scripts `build`, `start`, `lint`, `typecheck` and `test` forward to `frontend/`. Everything about the prototype (demo roles, reset, screens, limitations) is in [frontend/README.md](frontend/README.md).
