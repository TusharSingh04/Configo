# Git Commit & Deployment Guide

## Pre-Commit Checklist

### Code Quality
- [ ] `npm run build` succeeds in backend
- [ ] `npm run test` passes in backend
- [ ] No TypeScript compilation errors
- [ ] No console.log statements (use logger instead)
- [ ] All imports have .js extensions (ESM)

### Documentation
- [ ] README.md updated with new features
- [ ] Complex functions have JSDoc comments
- [ ] API endpoints documented in Swagger
- [ ] Environment variables documented

### Security
- [ ] No credentials committed (.env added to .gitignore)
- [ ] No API keys in code
- [ ] Passwords properly hashed
- [ ] Rate limiting on sensitive endpoints

### Testing
- [ ] New features have test coverage
- [ ] Existing tests still pass
- [ ] Error handling tested
- [ ] Edge cases covered

## Making Your First Commit

```powershell
# 1. Check what changed
git status

# 2. Add all changes
git add .

# 3. Create comprehensive commit message
git commit -m "feat: implement production-ready features

Features:
- Add RBAC with admin/editor/viewer roles
- Implement rate limiting for auth endpoints
- Add structured logging with Winston
- Persist audit logs to MongoDB
- Email notifications for approvals
- Swagger/OpenAPI documentation
- Jest testing infrastructure
- Comprehensive deployment guide

Security:
- PBKDF2 password hashing with per-user salt
- JWT authentication with 7-day expiry
- User approval workflow
- Rate limiting on login (5/5min)
- Audit trail for all actions
- Role-based permission system

Documentation:
- DEPLOYMENT.md with production setup
- TESTING.md with testing strategies
- PRODUCTION_FEATURES.md with feature list
- QUICK_START.md for developers
- Updated README.md

Testing:
- Auth & RBAC unit tests
- Password hashing tests
- Flag evaluator tests
- Coverage targets: 70%+

Both frontend and backend build successfully.
All TypeScript types validated."

# 4. Review before pushing
git log --oneline -1

# 5. Push to repository
git push origin main
```

## Commit Message Format

Follow Conventional Commits format:

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Type
- `feat` - New feature
- `fix` - Bug fix
- `docs` - Documentation only
- `style` - Code style (formatting, missing semicolons, etc.)
- `refactor` - Code refactoring
- `perf` - Performance improvement
- `test` - Adding or updating tests
- `chore` - Build process, dependencies, etc.

### Scope
- `auth` - Authentication/Authorization
- `api` - API routes
- `db` - Database related
- `ui` - Frontend/UI changes
- `docs` - Documentation
- `infra` - Infrastructure, docker, deployment

### Examples

```
feat(auth): implement RBAC with three-tier permission system
fix(rate-limit): correct login attempt counter reset logic
docs(deployment): add production setup guide
refactor(logger): consolidate logging calls
test(auth): add comprehensive permission middleware tests
```

## Branching Strategy

### For This Project

```
main
└── develop (or feature branches for features)
    ├── feature/authentication
    ├── feature/rbac
    ├── feature/logging
    └── bugfix/rate-limiting
```

### Branch Naming
- `feature/<feature-name>` - New feature
- `bugfix/<bug-name>` - Bug fix
- `hotfix/<issue-name>` - Critical production fix
- `docs/<doc-name>` - Documentation
- `chore/<task-name>` - Maintenance tasks

### Workflow

```powershell
# 1. Create feature branch from main/develop
git checkout -b feature/new-feature

# 2. Make commits
git add .
git commit -m "feat: ..."

# 3. Push branch
git push origin feature/new-feature

# 4. Create Pull Request on GitHub
# (Set base to: develop, compare: feature/new-feature)

# 5. After approval, merge to main
git checkout main
git pull origin main
git merge --no-ff feature/new-feature
git push origin main

# 6. Delete feature branch
git branch -d feature/new-feature
git push origin --delete feature/new-feature
```

## Code Review Checklist

Before merging, verify:

- [ ] All tests pass
- [ ] Code builds without errors
- [ ] Changes align with commit message
- [ ] No unnecessary console.logs
- [ ] Proper error handling
- [ ] Documentation updated
- [ ] No breaking changes noted
- [ ] Performance impact minimal
- [ ] Security implications reviewed

## Deployment Process

### Staging Deployment

```powershell
# 1. Check current git status
git status

# 2. Tag the commit
git tag -a v1.0.0-rc1 -m "Release candidate 1"
git push origin v1.0.0-rc1

# 3. Build for staging
npm run build

# 4. Deploy to staging server
# (Use your deployment tool: Render, Vercel, etc.)

# 5. Run smoke tests
curl https://staging.yourdomain.com/health
# Verify login works
# Verify flag evaluation works
```

### Production Deployment

```powershell
# 1. Verify staging works
# (Run all smoke tests)

# 2. Tag release
git tag -a v1.0.0 -m "Production release"
git push origin v1.0.0

# 3. Build for production
npm run build

# 4. Deploy to production
# (Your deployment process)

# 5. Post-deployment verification
curl https://yourdomain.com/health
curl https://yourdomain.com/api-docs

# 6. Monitor logs
tail -f logs/combined.log
tail -f logs/error.log
```

## Version Management

### Semantic Versioning (MAJOR.MINOR.PATCH)

- **MAJOR** (v2.0.0) - Breaking changes
- **MINOR** (v1.1.0) - New features, backward compatible
- **PATCH** (v1.0.1) - Bug fixes only

### Current Version: v1.0.0

Next versions:
- v1.0.1 - Bug fixes only
- v1.1.0 - New features (approval notifications, enhanced logging)
- v1.2.0 - More features (password reset, 2FA)
- v2.0.0 - Major refactor or breaking changes

### Updating Version

```powershell
# Update in backend/package.json
"version": "1.0.0"

# Update in frontend/package.json  
"version": "1.0.0"

# Commit version bump
git add .
git commit -m "chore(release): bump version to 1.0.0"

# Tag the release
git tag -a v1.0.0 -m "Production release v1.0.0"

# Push tag
git push origin v1.0.0
```

## Rollback Procedure

If deployment fails:

```powershell
# 1. Identify last stable version
git log --oneline | head -5

# 2. Revert to previous version
git revert HEAD
# or for immediate rollback
git reset --hard HEAD~1

# 3. Deploy previous version
npm run build
# Deploy to production

# 4. Notify team
# Post in Slack/Teams with what was reverted

# 5. Create issue for investigation
# (Don't repeat the mistake)
```

## Continuous Integration (CI/CD)

### GitHub Actions Example

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy

on:
  push:
    branches: [main]
    tags: ['v*']

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - run: npm install
      - run: npm run build
      - run: npm run test
      
  deploy:
    needs: build
    runs-on: ubuntu-latest
    if: startsWith(github.ref, 'refs/tags/')
    steps:
      - uses: actions/checkout@v3
      - run: npm run build
      - run: npm run deploy  # Your deployment script
```

## Commit History Rules

### Good Commit Messages
```
✅ feat(auth): implement Google OAuth integration
✅ fix(rate-limit): reset counter on time window boundary
✅ docs: add DEPLOYMENT.md with setup instructions
✅ refactor(logger): extract Winston config to separate file
```

### Bad Commit Messages
```
❌ fixed stuff
❌ updated code
❌ WIP
❌ typo
❌ changes
```

### Writing Good Messages
1. Use imperative mood ("add feature" not "added feature")
2. First line: 50 chars max
3. Blank line before body
4. Wrap body at 72 chars
5. Explain what and why, not how

Example:
```
feat(email): add approval notification emails

Automatically send emails when:
- Admin approves a pending user
- Admin rejects a user request

Uses NodeMailer with SMTP configuration.
Supports Gmail, SendGrid, and custom SMTP servers.

Fixes #42
```

## Final Checklist Before Pushing

```powershell
# 1. Build check
npm run build

# 2. Test check
npm run test

# 3. Lint check (if applicable)
npm run lint

# 4. Git status
git status

# 5. Review changes
git diff HEAD~1

# 6. Verify .gitignore
git status  # Should not show .env or node_modules

# 7. Commit
git commit -m "your message"

# 8. Push
git push origin <branch>
```

## Emergency Procedures

### Critical Bug in Production

```powershell
# 1. Create hotfix branch
git checkout -b hotfix/critical-bug

# 2. Fix the bug
# (Make minimal changes)

# 3. Test fix
npm run test

# 4. Commit
git commit -m "fix(critical): description of fix"

# 5. Merge to main immediately
git checkout main
git merge --no-ff hotfix/critical-bug
git push origin main

# 6. Deploy hotfix
git tag -a v1.0.1 -m "Hotfix: critical bug"

# 7. Deploy to production
# (Expedited deployment process)

# 8. Post-mortem
# (Discuss what went wrong)
```

---

**Ready to commit?** Follow the checklists above and use the examples as templates.

For questions, see:
- [DEPLOYMENT.md](DEPLOYMENT.md) - Production deployment
- [TESTING.md](TESTING.md) - Testing before commit
- [QUICK_START.md](QUICK_START.md) - Local development
