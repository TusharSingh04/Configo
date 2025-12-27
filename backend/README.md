# Feature Flags Backend (Express + TypeScript)

Minimal, stateless backend providing evaluation and management APIs.

## Setup

1. Create `.env` from `.env.example`.
2. Install deps and start dev server.

## APIs

- Evaluation: `/api/eval` (POST) and `/api/eval/batch` (POST)
- Management: `/api/manage/flags` CRUD, `/api/manage/flags/:id/rollback` (POST)

## Security
- Service token required for evaluation APIs via `Authorization: Bearer <token>`.
- Role-based access control (RBAC) for management APIs using JWT claims.
	- Roles: `admin`, `editor`, `viewer`
	- Permissions:
		- `flag:read` → list/get flags (viewer+)
		- `flag:write` → create/update/rollback (editor+)
		- `user:manage` → list users (admin)
	- Middleware: `requirePermission('<perm>')`

### Authentication
- Email/password: `POST /api/auth/login`
- Optional signup (guarded by `AUTH_ALLOW_SIGNUP=true`): `POST /api/auth/signup`
- Google sign-in: `POST /api/auth/google` with `idToken` and `GOOGLE_CLIENT_ID` in env
- Current user: `GET /api/auth/me`

## Run

```powershell
cd backend
npm install
npm run dev
```

Required envs for auth:

```env
JWT_SECRET=your-strong-secret
AUTH_ALLOW_SIGNUP=false
GOOGLE_CLIENT_ID=your-google-oauth-client-id
```
