# Deployment Guide

## Pre-Deployment Checklist

- [ ] All tests passing (`npm run test:coverage`)
- [ ] Environment variables configured
- [ ] Database migrations completed
- [ ] SSL certificates installed (production)
- [ ] Backups scheduled
- [ ] Monitoring set up

## Local Development Setup

### Prerequisites
- Node.js 18+
- MongoDB (local or Atlas cloud)
- Redis (local or cloud)

### Backend Setup

1. **Install dependencies:**
   ```powershell
   cd backend
   npm install
   ```

2. **Create `.env` file:**
   ```env
   # Server
   PORT=4000
   NODE_ENV=development

   # Database
   MONGO_URI=mongodb://localhost:27017/featureflags
   REDIS_URL=redis://localhost:6379

   # Security
   JWT_SECRET=your-super-secret-jwt-key-here-min-32-chars
   SERVICE_TOKEN=your-service-token-here

   # Google OAuth (optional)
   GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com

   # Email (optional)
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_SECURE=false
   SMTP_USER=your-email@gmail.com
   SMTP_PASSWORD=your-app-password
   EMAIL_FROM=noreply@featureflags.local

   # Features
   AUTH_ALLOW_SIGNUP=true
   CACHE_TTL_SECONDS=60
   LOG_LEVEL=info
   FRONTEND_URL=http://localhost:3000
   ```

3. **Seed test data:**
   ```powershell
   npm run seed
   ```
   Creates:
   - Admin user: `admin@featureflags.local` / `admin123` (approved)
   - Test user: `tusharsingh00769@gmail.com` (pending approval)

4. **Start development server:**
   ```powershell
   npm run dev
   ```
   Backend running at `http://localhost:4000`
   API docs at `http://localhost:4000/api-docs`

5. **Run tests:**
   ```powershell
   npm run test              # Run all tests once
   npm run test:watch       # Run tests in watch mode
   npm run test:coverage    # Generate coverage report
   ```

### Frontend Setup

1. **Install dependencies:**
   ```powershell
   cd frontend
   npm install
   ```

2. **Create `.env.local` file:**
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:4000
   NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
   ```

3. **Start development server:**
   ```powershell
   npm run dev
   ```
   Frontend running at `http://localhost:3000`

4. **Build for production:**
   ```powershell
   npm run build
   npm run start
   ```

## Production Deployment

### Environment Variables (Production)

```env
# Server
PORT=4000
NODE_ENV=production

# Database (use cloud services)
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/featureflags
REDIS_URL=rediss://username:password@redis.cloud:port

# Security (generate strong secrets)
JWT_SECRET=<generate-with-openssl-rand-hex-32>
SERVICE_TOKEN=<generate-with-openssl-rand-hex-32>

# Google OAuth (production app)
GOOGLE_CLIENT_ID=your-production-google-client-id.apps.googleusercontent.com

# Email (use SendGrid or similar)
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASSWORD=<sendgrid-api-key>
EMAIL_FROM=noreply@yourdomain.com

# Features
AUTH_ALLOW_SIGNUP=false
CACHE_TTL_SECONDS=300
LOG_LEVEL=warn
FRONTEND_URL=https://yourdomain.com
```

### Generate Secure Secrets

```powershell
# Generate JWT secret (Unix/PowerShell)
[System.Convert]::ToHexString([System.Security.Cryptography.RandomNumberGenerator]::GetBytes(32))

# Or use Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Docker Deployment

1. **Build Docker images:**
   ```powershell
   # Backend
   docker build -t feature-flags-backend:latest ./backend

   # Frontend
   docker build -t feature-flags-frontend:latest ./frontend
   ```

2. **Run with Docker Compose:**
   Create `docker-compose.prod.yml`:
   ```yaml
   version: '3.8'
   services:
     backend:
       image: feature-flags-backend:latest
       ports:
         - "4000:4000"
       environment:
         - PORT=4000
         - NODE_ENV=production
         - MONGO_URI=${MONGO_URI}
         - REDIS_URL=${REDIS_URL}
         - JWT_SECRET=${JWT_SECRET}
       depends_on:
         - mongo
         - redis

     frontend:
       image: feature-flags-frontend:latest
       ports:
         - "3000:3000"
       environment:
         - NEXT_PUBLIC_API_URL=http://backend:4000
       depends_on:
         - backend

     mongo:
       image: mongo:7.0
       volumes:
         - mongo-data:/data/db

     redis:
       image: redis:7.0-alpine
       volumes:
         - redis-data:/data

   volumes:
     mongo-data:
     redis-data:
   ```

   ```powershell
   docker-compose -f docker-compose.prod.yml up -d
   ```

### Kubernetes Deployment

See `k8s/` directory for Kubernetes manifests (not included in this MVP).

### Database Migrations

```powershell
# Create indexes for production
mongo featureflags --eval "db.flags.createIndex({key: 1}, {unique: true})"
mongo featureflags --eval "db.users.createIndex({email: 1}, {unique: true})"
mongo featureflags --eval "db.auditLogs.createIndex({ts: -1})"
```

### Monitoring & Logging

1. **Logs directory structure:**
   ```
   logs/
   ├── error.log      # Errors only
   ├── combined.log   # All logs
   └── (rotated files with .1, .2, etc.)
   ```

2. **Log aggregation (recommended):**
   - Set up CloudWatch, DataDog, or ELK stack
   - Ship logs from `logs/` directory
   - Set up alerts for error rates

3. **Metrics to monitor:**
   - Request latency (p50, p95, p99)
   - Error rates by endpoint
   - Database query performance
   - Cache hit ratio
   - User authentication failures

### Backup Strategy

```powershell
# MongoDB Atlas automated backups (built-in)
# Enable point-in-time recovery

# Manual backup
mongodump --uri "mongodb+srv://user:pass@cluster.mongodb.net/featureflags" --archive=backup.archive

# Restore
mongorestore --uri "mongodb+srv://user:pass@cluster.mongodb.net/featureflags" --archive=backup.archive
```

### SSL/TLS Certificate

Use Let's Encrypt with Certbot:

```bash
sudo certbot certonly --standalone -d yourdomain.com
sudo certbot renew --quiet  # Add to cron for auto-renewal
```

Configure in reverse proxy (Nginx):
```nginx
listen 443 ssl http2;
ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
```

## Reverse Proxy Configuration (Nginx)

```nginx
upstream backend {
    server localhost:4000;
}

upstream frontend {
    server localhost:3000;
}

server {
    listen 80;
    server_name yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;

    # Rate limiting
    limit_req_zone $binary_remote_addr zone=general:10m rate=100r/m;
    limit_req_zone $binary_remote_addr zone=login:10m rate=5r/m;

    location /api/auth/login {
        limit_req zone=login burst=10 nodelay;
        proxy_pass http://backend;
    }

    location /api {
        limit_req zone=general burst=100 nodelay;
        proxy_pass http://backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location / {
        proxy_pass http://frontend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

## Health Checks

```powershell
# Backend health
curl http://localhost:4000/health

# Frontend
curl http://localhost:3000
```

## Troubleshooting

### Backend won't start
- Check `MONGO_URI` and `REDIS_URL` are accessible
- Verify `JWT_SECRET` is set
- Check logs: `tail -f logs/error.log`

### Authentication failing
- Verify `JWT_SECRET` is consistent
- Check user status in MongoDB: `db.users.findOne({email: "test@example.com"})`
- Verify token hasn't expired (7-day expiry)

### Frontend can't reach backend
- Check `NEXT_PUBLIC_API_URL` in `.env.local`
- Verify backend is running: `curl http://localhost:4000/health`
- Check CORS configuration in `server.ts`

### Email notifications not sending
- Check SMTP credentials in `.env`
- Verify Gmail app password (not regular password)
- Check logs for email errors: `grep "email" logs/error.log`

## Performance Tuning

1. **Redis caching:** Increase `CACHE_TTL_SECONDS` for stable flags
2. **Database indexes:** Ensure all indexes are created
3. **Connection pooling:** MongoDB driver manages this automatically
4. **Compression:** Enable gzip in reverse proxy
5. **CDN:** Serve frontend assets via CloudFlare or similar

## Security Checklist

- [ ] JWT secret is 32+ characters and cryptographically random
- [ ] Service token is 32+ characters and stored securely
- [ ] HTTPS/SSL enabled in production
- [ ] Rate limiting configured on all auth endpoints
- [ ] CORS only allows expected origins
- [ ] Database credentials stored in environment variables
- [ ] Audit logs preserved for compliance
- [ ] Regular security updates for dependencies
- [ ] API documentation updated with new endpoints
- [ ] Sensitive data (passwords, tokens) never logged

## Rollback Procedure

If deployment fails:

1. **Revert code:**
   ```powershell
   git revert HEAD
   npm run build
   npm run start
   ```

2. **Restore database:**
   ```powershell
   mongorestore --uri "..." --archive=backup.archive
   ```

3. **Clear cache:**
   ```powershell
   redis-cli FLUSHALL  # WARNING: Use with caution in production
   ```

4. **Monitor logs:**
   ```powershell
   tail -f logs/combined.log
   ```
