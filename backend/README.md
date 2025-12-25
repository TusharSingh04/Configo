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
- JWT with role claims for management APIs (`role: admin|viewer`).

## Run

```powershell
cd backend
npm install
npm run dev
```
