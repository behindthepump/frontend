# Fitness Tracker — Frontend

React + TypeScript + Vite SPA for a 12-week fitness program. Firebase Auth
handles sign-in only; **all data flows through the backend API** (see the
backend repo) — the browser never talks to Firestore directly.

## Configuration

Copy `.env.example` to `.env.local` and fill in:

- `VITE_FIREBASE_*` — the Firebase **web app** config (Project settings → Your
  apps). Used for authentication only.
- `VITE_API_URL` — the backend API base URL (e.g. `http://localhost:4100`).

`.env.local` is gitignored.

## Develop

```sh
npm install
npm run dev      # http://localhost:3000
```

The backend API must be running (see the backend repo) for anything beyond the
login screen.

## Build & lint

```sh
npm run build    # → dist/
npm run lint     # tsc --noEmit
```
