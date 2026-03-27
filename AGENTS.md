# AGENTS.md

## Cursor Cloud specific instructions

### Project overview

FIFA Fan Zone — a React 18 + TypeScript + Vite single-page app. See `CLAUDE.md` for full architecture, coding conventions, and FDS design system rules.

### Key commands

| Task | Command |
|---|---|
| Install deps | `npm install` |
| Type-check (lint) | `npx tsc --noEmit` |
| Build | `npm run build` (runs `tsc && vite build`) |
| Dev server | `npm run dev` (Vite on port 5173, base path `/fifa-fan-zone/`) |

### Firebase environment variables

The app requires four `VITE_FIREBASE_*` env vars (`VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_PROJECT_ID`, `VITE_FIREBASE_APP_ID`). Without them, Firebase Auth (`ensureAuth()`) and Firestore (`saveFanCardStub()`) calls will fail at bootstrap. The landing page (`/`) still renders because it doesn't require auth, but authenticated routes will show a "Session unavailable" screen.

The `QAApp` bridge (`src/lib/qaapp.ts`) has a browser fallback that returns `stub-token-dev`, so the auth context resolves to `authenticated` even without the native Qatar Airways WebView.

### Dev server notes

- Vite dev server uses base path `/fifa-fan-zone/` — access at `http://localhost:5173/fifa-fan-zone/`.
- No dedicated test framework is configured; validation is `tsc && vite build` (zero errors/warnings).
- There is no ESLint config in the repo; TypeScript strict mode is the primary code quality gate.
- The `pipeline/` directory contains CI/CD automation tooling (Linear + Cyrus agent) — not needed for local development.
