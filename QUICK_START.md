# Quick Start Reference

A fast reference guide for common tasks in the Feature Flags project.

## 🚀 Quick Local Setup (5 minutes)

```powershell
# Backend
cd backend
npm install
npm run build  # TypeScript compilation check
npm run dev    # Start dev server on port 4000

# Frontend (in new terminal)
cd frontend
npm install
npm run dev    # Start on port 3000
```

Visit: `http://localhost:3000`

## 🔐 Test Accounts (After Seeding)

Run once: `npm run seed` in backend

```
Admin Account:
  Email:    admin@featureflags.local
  Password: admin123
  Role:     admin (approved)

Test Gmail:
  Email:    tusharsingh00769@gmail.com
  Status:   pending (needs admin approval)
```

## 📍 Important URLs

| Service | URL | Purpose |
|---------|-----|---------|
| Frontend | `http://localhost:3000` | User dashboard |
| Backend | `http://localhost:4000` | API server |
| API Docs | `http://localhost:4000/api-docs` | Swagger UI |
| Health | `http://localhost:4000/health` | Health check |

## 🧪 Testing

```powershell
# Run all tests
npm run test

# Run tests in watch mode (re-run on file change)
npm run test:watch

# Generate coverage report
npm run test:coverage

# Open coverage in browser
Start-Process coverage/lcov-report/index.html
```

## 🔨 Common Development Tasks

### Add a New Permission

1. Edit `backend/src/auth/userAuth.ts`:
```typescript
export const ROLE_PERMISSIONS: Record<Role, string[]> = {
  admin: [..., 'new:permission'],
  editor: [...],
  viewer: [...],
};
```

2. Use in routes:
```typescript
router.post('/endpoint', requirePermission('new:permission'), ...);
```

### Add Audit Logging

```typescript
import { createAuditLog } from '../services/auditService.js';

await createAuditLog({
  actor: userEmail,
  entityType: 'flag',
  entityId: flagKey,
  action: 'create',  // or 'update', 'rollback'
  data: { /* metadata */ },
});
```

### Send Email Notification

```typescript
import { sendEmail, emailTemplates } from '../services/emailService.js';

const emailTemplate = emailTemplates.userApproved(email, 'editor');
await sendEmail({
  to: email,
  subject: emailTemplate.subject,
  html: emailTemplate.html,
  text: emailTemplate.text,
});
```

### Check Logs

```powershell
# View error logs
Get-Content backend/logs/error.log -Tail 50

# View combined logs
Get-Content backend/logs/combined.log -Tail 100

# Watch logs in real-time
Get-Content -Path backend/logs/combined.log -Wait -Tail 20
```

## 📦 Build & Deploy

```powershell
# Build backend
cd backend
npm run build  # Creates dist/ folder

# Build frontend
cd frontend
npm run build   # Creates .next/ folder
npm run start   # Start production server

# Docker build
docker build -t feature-flags-backend:latest ./backend
docker build -t feature-flags-frontend:latest ./frontend
```

## 🔍 Debugging

### Backend TypeScript Errors
```powershell
cd backend
npm run build  # Shows compilation errors
```

### Frontend Type Errors
```powershell
cd frontend
npm run build  # Shows TypeScript errors
```

### Test Failures
```powershell
npm run test -- --verbose
npx jest --testNamePattern="specific test name"
```

## 🔐 Security Checklist

- [ ] Change `JWT_SECRET` to a random 32+ character string
- [ ] Change `SERVICE_TOKEN` to a random value
- [ ] Set `AUTH_ALLOW_SIGNUP=false` in production
- [ ] Configure HTTPS/SSL
- [ ] Set up database backups
- [ ] Configure email SMTP credentials
- [ ] Update CORS allowed origins
- [ ] Enable audit logging
- [ ] Set up log aggregation
- [ ] Configure monitoring alerts

## 📝 Environment Variables

### Minimal .env (Backend)
```env
PORT=4000
MONGO_URI=mongodb://localhost:27017/featureflags
REDIS_URL=redis://localhost:6379
JWT_SECRET=generate-32-char-random-string-here
SERVICE_TOKEN=generate-random-token-here
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
```

### Minimal .env.local (Frontend)
```env
NEXT_PUBLIC_API_URL=http://localhost:4000
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-google-client-id
```

## 🆘 Troubleshooting

### Backend won't start
```powershell
# Check MongoDB connection
mongo "mongodb://localhost:27017/featureflags"

# Check Redis connection
redis-cli ping

# Check logs
Get-Content backend/logs/error.log -Tail 20
```

### Frontend can't reach backend
```powershell
# Verify backend is running
curl http://localhost:4000/health

# Check NEXT_PUBLIC_API_URL in .env.local
```

### Tests failing
```powershell
# Clean install
rm -r node_modules package-lock.json
npm install

# Run tests
npm run test
```

### Port already in use
```powershell
# Find process using port 4000
Get-NetTCPConnection -LocalPort 4000 | select ProcessName, OwningProcess

# Kill process (replace PID with actual process ID)
Stop-Process -Id <PID> -Force
```

## 📚 Documentation

- **[DEPLOYMENT.md](DEPLOYMENT.md)** - Production deployment guide
- **[TESTING.md](TESTING.md)** - Testing strategies and examples
- **[PRODUCTION_FEATURES.md](PRODUCTION_FEATURES.md)** - Complete feature list
- **API Docs** - `/api-docs` (Swagger UI)

## 🆕 Creating a New Feature

### 1. Backend Endpoint

```typescript
// backend/src/routes/myfeature.ts
import { Router } from 'express';
import { requirePermission, wrap } from '../utils/...';

const router = Router();

router.get('/data', requirePermission('feature:read'), wrap(async (req, res) => {
  // Your logic here
  res.json({ data: [] });
}));

export default router;
```

### 2. Wire to Server

```typescript
// backend/src/server.ts
import myFeatureRoutes from './routes/myfeature.js';
app.use('/api/myfeature', myFeatureRoutes);
```

### 3. Frontend Component

```typescript
// frontend/src/pages/myfeature.tsx
import { manage } from '@/lib/api';
import { useEffect, useState } from 'react';

export default function MyFeature() {
  const [data, setData] = useState([]);

  useEffect(() => {
    manage.getFlags().then(setData);
  }, []);

  return <div>{/* Your UI here */}</div>;
}
```

### 4. Add Tests

```typescript
// backend/src/tests/myfeature.test.ts
describe('My Feature', () => {
  it('should do something', () => {
    expect(true).toBe(true);
  });
});
```

## 🚢 Deployment Checklist

- [ ] All tests passing
- [ ] Build succeeds without errors
- [ ] Environment variables set
- [ ] Database migrations run
- [ ] Backups configured
- [ ] Monitoring set up
- [ ] SSL certificate installed
- [ ] Logs configured
- [ ] Email SMTP working
- [ ] Rate limiting tested
- [ ] Load test passed
- [ ] Security scan completed

## 💡 Tips & Tricks

### Hot Reload Development
```powershell
# Backend: auto-restarts on file change
npm run dev

# Frontend: auto-rebuilds on file change
npm run dev
```

### Database Inspection
```powershell
# Connect to MongoDB
mongosh "mongodb://localhost:27017/featureflags"

# View users
db.users.find()

# View flags
db.flags.find()

# View audit logs
db.auditLogs.find().limit(5)
```

### View API Requests
```powershell
# Tail logs showing all requests
Get-Content backend/logs/combined.log -Wait -Tail 0 | Select-String "POST|GET|PUT|DELETE"
```

### Clear Data (Development Only)
```powershell
# ⚠️  WARNING: This deletes all data!
# In MongoDB shell:
db.dropDatabase()
npm run seed  # Re-seed with test data
```

---

**Need help?** Check the detailed guides:
- Setup issues → [DEPLOYMENT.md](DEPLOYMENT.md#troubleshooting)
- Testing questions → [TESTING.md](TESTING.md)
- Feature details → [PRODUCTION_FEATURES.md](PRODUCTION_FEATURES.md)
