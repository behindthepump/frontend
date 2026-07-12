# Fitness Tracker — Frontend

React + TypeScript + Vite SPA for the 12-week fitness tracker. Firebase Auth
handles sign-in only (Google for clients, email/password for the coach); all
data flows through the backend API — the browser never talks to Firestore.

## Quickstart

```sh
npm install
npm run dev        # http://localhost:3000 - the backend must be running
```

Copy `.env.example` to `.env.local` and fill in the Firebase **web app**
config (used for auth only) and `VITE_API_URL` (the backend, e.g.
`http://localhost:4100`).

## Build & lint

```sh
npm run build      # → dist/  (deploy: npx firebase deploy --only hosting)
npm run lint       # tsc --noEmit
```

## Documentation

The full docs (product, flows, architecture, auth, operations) live in the
**backend repo** under `docs/`.
