# Feature Flags Frontend (Next.js + TypeScript)

Minimal, user-friendly dashboard for managing feature flags and configurations.

## Setup

1. Create `.env.local` from `.env.example` with:
   - `NEXT_PUBLIC_API_URL`: Backend URL (e.g., `http://localhost:4000`)
   - `NEXT_PUBLIC_GOOGLE_CLIENT_ID`: Google OAuth Client ID (optional, for Google Sign-In)
2. Install deps and start dev server.

## Pages

- `/` — Home; links to login and flags.
- `/login` — Email/password login or Google Sign-In.
- `/flags` — List all flags; requires `viewer+` role.
- `/flags/new` — Create flag; requires `editor+` role.
- `/flags/[id]` — Edit/rollback flag; requires `editor+` role.

## Run

```powershell
cd frontend
npm install
npm run dev
```

Open `http://localhost:3000` and log in with email/password or Google.

## Google Sign-In

1. Get a Google OAuth 2.0 Client ID from Google Cloud Console.
2. Add `NEXT_PUBLIC_GOOGLE_CLIENT_ID` to `.env.local`.
3. In the backend, set `GOOGLE_CLIENT_ID` in `.env`.
4. Verify `google-auth-library` is installed in backend (`npm install google-auth-library`).

