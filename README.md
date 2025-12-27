# Feature Flag & Configuration Management Platform

A production-ready feature flag service enabling dynamic feature control and configuration without redeployment. Low-latency reads via Redis caching, append-only audit logs, deterministic rollouts, and role-based access control.

## Quick Start

### Prerequisites
- Node.js 18+
- MongoDB (local or cloud)
- Redis (local or cloud)

### Backend Setup

```powershell
cd backend
npm install
```

Create `.env` file:
```env
PORT=4000
MONGO_URI=mongodb://localhost:27017/featureflags
REDIS_URL=redis://localhost:6379
SERVICE_TOKEN=your-secret-service-token-here
JWT_SECRET=your-jwt-secret-here
CACHE_TTL_SECONDS=60
```

Start the backend:
```powershell
npm run dev
```

Backend runs on `http://localhost:4000`.

### Frontend Setup

```powershell
cd frontend
npm install
```

Create `.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:4000
```

Start the frontend:
```powershell
npm run dev
```

Frontend runs on `http://localhost:3000`.

---

## Production-Ready Features

### ✓ Authentication & RBAC

- **Role-Based Access Control (RBAC):** Admin, Editor, Viewer roles with granular permission system
- **Google OAuth 2.0:** Single sign-on integration
- **Email/Password Auth:** Password hashing using PBKDF2 (100k iterations)
- **JWT Tokens:** 7-day expiry with refresh capability
- **User Approval Workflow:** New users pending admin approval before access

**Permissions:**
- `admin`: All operations (flag:read, flag:write, user:manage, audit:read)
- `editor`: Create and manage flags (flag:read, flag:write)
- `viewer`: Read-only access to flags (flag:read)

### ✓ Security & Monitoring

- **Rate Limiting:**
  - Login/Signup: 5 requests per 5 minutes
  - General API: 100 requests per 15 minutes
- **Structured Logging:** Winston logger with file rotation, error tracking
- **Audit Logs:** Complete history of all user actions and flag changes
- **Encrypted Passwords:** PBKDF2 with per-user salt

### ✓ Email Notifications

- User approval/rejection emails
- Flag change notifications (optional)
- Configurable SMTP or SendGrid integration

### ✓ API Documentation

- **Swagger/OpenAPI:** Full API docs at `/api-docs`
- **Interactive Testing:** Try requests directly from Swagger UI
- **Complete Coverage:** All endpoints documented with examples

### ✓ Testing Infrastructure

- **Unit Tests:** Auth, RBAC, password hashing with Jest
- **Coverage Reporting:** Target 70%+ coverage
- **Test Commands:**
  ```powershell
  npm run test              # Run all tests
  npm run test:watch       # Run in watch mode
  npm run test:coverage    # Generate coverage report
  ```

---

## Documentation

- **[DEPLOYMENT.md](DEPLOYMENT.md)** — Complete deployment guide with Docker, Kubernetes, and SSL setup
- **[TESTING.md](TESTING.md)** — Testing strategies, mocking external services, CI/CD setup

---

## Core Concepts

### Feature Flag Types

1. **Boolean** — Simple on/off flags.
2. **Multivariate** — Multiple variants with weights and per-environment selection.
3. **JSON** — Complex configuration objects with deterministic selection.

### Environment-Specific Configuration

Each flag has per-environment (dev/staging/prod) values with:
- Mandatory fallback value
- Optional attribute-based targeting rules
- Optional percentage-based rollout

### Deterministic Evaluation

Flag evaluation uses cryptographic hashing (`SHA256`) to ensure:
- Same user ID → same variant across requests
- Consistent rollout distribution
- No coordination needed between services

### Audit & Rollback

Every change is append-only:
- Create, update, rollback tracked with actor, timestamp, and snapshot
- Rollback to any previous version instantly
- Full audit trail in MongoDB

---

## API Reference

### Evaluation APIs (Read-Heavy)

**Requires:** `Authorization: Bearer <SERVICE_TOKEN>`

#### Single Flag Evaluation

```http
POST /api/eval/eval
Content-Type: application/json

{
  "key": "new-ui",
  "env": "prod",
  "context": { "userId": "user-123", "role": "beta" }
}
```

Response:
```json
{
  "key": "new-ui",
  "value": true,
  "variant": null,
  "reason": "rollout-percentage-fallback"
}
```

#### Batch Flag Evaluation

```http
POST /api/eval/eval/batch
Content-Type: application/json

{
  "keys": ["new-ui", "dark-mode"],
  "env": "prod",
  "context": { "userId": "user-123" }
}
```

Response:
```json
{
  "results": [
    { "key": "new-ui", "value": true, "reason": "rollout-percentage-fallback" },
    { "key": "dark-mode", "value": false, "reason": "default" }
  ]
}
```

### Management APIs

**Requires:** `Authorization: Bearer <JWT_WITH_ROLE_CLAIM>`

JWT claims format:
```json
{
  "sub": "user-id",
  "role": "admin"  // or "viewer"
}
```

#### List Flags

```http
GET /api/manage/flags
Authorization: Bearer <JWT>
```

Requires: `viewer` or `admin` role.

#### Get Flag

```http
GET /api/manage/flags/:key
Authorization: Bearer <JWT>
```

#### Create Flag

```http
POST /api/manage/flags
Authorization: Bearer <JWT>
Content-Type: application/json

{
  "key": "new-ui",
  "type": "boolean",
  "description": "Enable new UI for selected users",
  "envs": [
    {
      "env": "dev",
      "defaultValue": true,
      "rollout": { "percentage": 100 }
    },
    {
      "env": "prod",
      "defaultValue": false,
      "rollout": { "percentage": 50 },
      "rules": [
        { "attribute": "role", "op": "eq", "value": "admin" }
      ]
    }
  ]
}
```

Requires: `admin` role.

#### Update Flag

```http
PUT /api/manage/flags/:key
Authorization: Bearer <JWT>
Content-Type: application/json
```

Same body as create. Requires: `admin` role.

#### Rollback Flag

```http
POST /api/manage/flags/:key/rollback
Authorization: Bearer <JWT>
Content-Type: application/json

{
  "toVersion": 2
}
```

Requires: `admin` role. Rolls back to a previous version and increments version counter.

---

## Configuration Reference

### Flag Model

```typescript
interface FlagDoc {
  key: string;                    // unique identifier
  type: 'boolean' | 'multivariate' | 'json';
  description?: string;
  version: number;                // monotonically increasing
  envs: EnvConfig[];              // per-environment config
  createdBy: string;              // username/id
  updatedBy: string;
  updatedAt: number;              // epoch ms
}

interface EnvConfig {
  env: 'dev' | 'staging' | 'prod';
  defaultValue: unknown;          // mandatory fallback
  rules?: TargetRule[];           // optional targeting
  rollout?: PercentageRollout;    // optional rollout
  variants?: VariantOption[];     // multivariate/json
}

interface TargetRule {
  attribute: string;              // e.g., "userId", "role"
  op: 'eq' | 'neq' | 'in' | 'nin';
  value: string | number | (string | number)[];
}

interface PercentageRollout {
  percentage: number;             // 0..100
  salt?: string;                  // optional custom salt
}

interface VariantOption {
  key: string;
  weight?: number;                // weight for weighted selection
  value?: unknown;
}
```

### Evaluation Logic Flow

```
1. Fetch flag from cache (Redis) or database (MongoDB)
2. Find environment config
   - If missing: return first env's defaultValue
3. Check attribute-based rules
   - If rules exist and no match: return defaultValue
4. Check percentage rollout
   - If enabled and user not in percentage: return defaultValue
5. Determine variant/value
   - Multivariate: pick variant by deterministic weight
   - JSON: pick variant by deterministic weight
   - Boolean: return defaultValue
6. Return value with reason code (for audit/debug)
```

---

## Targeting Examples

### Admin-Only Feature

```json
{
  "env": "prod",
  "defaultValue": false,
  "rules": [
    { "attribute": "role", "op": "eq", "value": "admin" }
  ]
}
```

### Beta Testing Percentage

```json
{
  "env": "prod",
  "defaultValue": false,
  "rollout": { "percentage": 25 }
}
```

Combined (admin always true, 25% of others):

```json
{
  "env": "prod",
  "defaultValue": false,
  "rules": [
    { "attribute": "role", "op": "eq", "value": "admin" }
  ]
}
// Plus a second rule set with rollout for general users
```

### Multivariate (A/B Test)

```json
{
  "env": "prod",
  "type": "multivariate",
  "defaultValue": "control",
  "variants": [
    { "key": "control", "weight": 50, "value": "control" },
    { "key": "variant-a", "weight": 30, "value": "variant-a" },
    { "key": "variant-b", "weight": 20, "value": "variant-b" }
  ]
}
```

---

## Dashboard Usage

### Login

1. Navigate to `http://localhost:3000`
2. Paste a JWT with role claim (`admin` or `viewer`)
3. Token saved to localStorage; persists across sessions

### Viewing Flags

- Click **Flags** to list all flags
- Click a flag name to view/edit
- Shows flag key, type, version, environment configs

### Creating a Flag

1. Click **Create New Flag**
2. Fill in:
   - **Key**: unique identifier (e.g., `new-ui`, `dark-mode`)
   - **Type**: boolean, multivariate, or json
   - **Description**: optional
   - **Environments**: dev, staging, prod with default values and rollout %
3. Click **Save**

### Editing a Flag

1. Click flag on `/flags` list
2. Modify environment configs, rules, variants
3. Click **Save**
4. New version created automatically

### Rollback

1. Click flag to edit
2. Scroll to **Rollback** section
3. Enter target version number
4. Click **Rollback**
5. Creates new version with previous snapshot

---

## Performance & Reliability

### Caching Strategy

- Redis caches all flags per environment with TTL (default 60s)
- Cache key: `flags:{env}`
- Cache miss → fetch from MongoDB + write cache
- Cache write failures are silent (no user-facing impact)

### Safe Fallback

Evaluation gracefully handles failures:
1. Try Redis cache
2. Fall back to MongoDB direct query
3. Return flag data and reason code
4. No exception thrown; safe default returned

### Stateless Services

- Backend has no in-memory state
- All services can scale horizontally
- MongoDB handles consistency
- Redis handles performance

---

## Development

### Build Backend

```powershell
cd backend
npm run build
```

Output in `dist/`.

### Test Evaluator Logic

```powershell
cd backend
npm run test
```

Basic test exercises rollout behavior and variant selection.

### Build Frontend

```powershell
cd frontend
npm run build
```

Output in `.next/`.

### TypeScript Strict Mode

Both projects use `strict: true` in `tsconfig.json`. All code is type-safe.

---

## Example: Minting a Test JWT

Use a JWT library (e.g., `jsonwebtoken` in Node):

```javascript
const jwt = require('jsonwebtoken');
const secret = 'your-jwt-secret-here';
const token = jwt.sign({ sub: 'user-1', role: 'admin' }, secret, { expiresIn: '1h' });
console.log(token);
```

Paste token into dashboard at `http://localhost:3000`.

---

## Deployment Checklist

- [ ] Set `SERVICE_TOKEN` to a strong, random value
- [ ] Set `JWT_SECRET` to a strong, random value
- [ ] Configure `MONGO_URI` to production database
- [ ] Configure `REDIS_URL` to production Redis (with TLS if needed)
- [ ] Set `CACHE_TTL_SECONDS` based on acceptable eventual-consistency window
- [ ] Enable HTTPS/TLS on backend
- [ ] Configure CORS origin in frontend
- [ ] Run `npm run build` for production builds
- [ ] Use `npm start` to run compiled backend
- [ ] Use `npm start` to run compiled frontend
- [ ] Monitor MongoDB indexes on `flags` and `audit_logs`
- [ ] Set up log aggregation/monitoring

---

## Troubleshooting

### Backend won't start: MongoDB connection error
- Verify MongoDB is running: `mongosh` or check service status
- Check `MONGO_URI` in `.env`

### Backend won't start: Redis connection error
- Verify Redis is running: `redis-cli ping`
- Check `REDIS_URL` in `.env`

### Frontend can't reach backend
- Check `NEXT_PUBLIC_API_URL` in `.env.local`
- Verify backend is running on the configured port
- Check browser console for CORS errors

### JWT validation fails on dashboard
- Verify JWT signed with correct `JWT_SECRET`
- Check JWT payload includes `{ sub, role }`
- Ensure role is `'admin'` or `'viewer'` (lowercase, quoted)

### Evaluation returns flag-not-found
- Verify flag exists: check `/api/manage/flags` endpoint
- Confirm flag key matches exactly (case-sensitive)

---

## Architecture Diagram

```
┌──────────────────┐
│   Next.js App    │  (Port 3000)
│   Dashboard      │
└────────┬─────────┘
         │
         │ JWT auth
         │
┌────────▼──────────────────────┐
│   Express Backend              │  (Port 4000)
├────────────────────────────────┤
│ /api/eval         (read-heavy) │
│   - Single flag               │
│   - Batch eval                │
│                                │
│ /api/manage       (CRUD)       │
│   - List/Get/Create/Update    │
│   - Rollback                   │
│                                │
│ Auth                           │
│   - Service token (eval)       │
│   - JWT role-based (manage)    │
└────────┬───────────┬───────────┘
         │           │
    Redis cache   MongoDB
    (Per-env)     (Canonical)
    (60s TTL)     (Audit logs)
```

---

## Support & Docs

- **Evaluation Logic**: See `src/services/evaluator.ts` for deterministic hashing and variant selection
- **Flag Service**: See `src/services/flagService.ts` for CRUD and rollback
- **Routes**: See `src/routes/eval.ts` and `src/routes/manage.ts`
- **Models**: See `src/models/Flag.ts` and `src/models/AuditLog.ts`

---

## License

MIT
