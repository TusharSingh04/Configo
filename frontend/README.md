# Feature Flags Frontend (Next.js + TypeScript)

Minimal, user-friendly dashboard for managing feature flags and configurations.

## Setup

1. Create `.env.local` from `.env.example`.
2. Point `NEXT_PUBLIC_API_URL` to the backend (e.g., `http://localhost:4000`).
3. Install deps and start dev server.

## Pages

- `/` — Token login; paste JWT with `{ sub: string; role: 'admin'|'viewer' }`.
- `/flags` — List all flags; requires `viewer` or `admin` role.
- `/flags/new` — Create flag; requires `admin` role.
- `/flags/[id]` — Edit/rollback flag; requires `admin` role.

## Run

```powershell
cd frontend
npm install
npm run dev
```

Open `http://localhost:3000` and paste a JWT to get started.
